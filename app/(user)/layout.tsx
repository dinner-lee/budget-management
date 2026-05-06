import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import UserAppShell from '@/components/UserAppShell'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role === 'ADMIN') redirect('/admin/dashboard')

  // 모든 사용자 데이터 패치
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true }
  })

  const [plans, budgetLimits, milestones, team] = await Promise.all([
    user?.teamId
      ? prisma.budgetPlan.findMany({
          where: { teamId: user.teamId },
          include: { evidences: true },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve([]),
    user?.teamId
      ? prisma.teamBudgetLimit.findMany({
          where: { teamId: user.teamId },
        })
      : Promise.resolve([]),
    prisma.milestone.findMany({
      orderBy: { date: 'asc' }
    }),
    user?.teamId
      ? prisma.team.findUnique({
          where: { id: user.teamId },
          include: {
            users: {
              select: { id: true, name: true, email: true }
            }
          }
        })
      : Promise.resolve(null),
  ])

  // 대시보드용 통계 계산
  const TOTAL_BUDGET = 2000000
  const totalUsed = plans.reduce((acc, plan) => {
    return acc + (plan.status === 'APPROVED' ? (plan.actualAmount ?? plan.amount) : plan.amount)
  }, 0)

  const categoryUsage: Record<string, number> = {}
  plans.forEach(plan => {
    const amount = plan.status === 'APPROVED' ? (plan.actualAmount ?? plan.amount) : plan.amount
    categoryUsage[plan.purpose] = (categoryUsage[plan.purpose] || 0) + amount
  })

  const categoryLimits: Record<string, number> = {}
  budgetLimits.forEach(limit => {
    categoryLimits[limit.purpose] = limit.amount
  })

  const activePlans = plans.filter(
    (p) =>
      p.status === 'PENDING_EVIDENCE' ||
      p.status === 'UNDER_REVIEW' ||
      p.status === 'RESUBMIT_REQUIRED',
  )
  const activePlanCount = activePlans.length
  const resubmitCount = activePlans.filter((p) => p.status === 'RESUBMIT_REQUIRED').length

  const dashboardData = {
    budgetStatus: {
      totalBudget: TOTAL_BUDGET,
      totalUsed,
      totalBalance: TOTAL_BUDGET - totalUsed,
      categoryLimits,
      categoryUsage,
    },
    milestones,
    plans,
    activePlanCount,
    resubmitCount
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserAppShell
        dashboardData={dashboardData}
        budgetLimitsData={budgetLimits}
        teamData={team}
      >
        {children}
      </UserAppShell>
    </div>
  )
}
