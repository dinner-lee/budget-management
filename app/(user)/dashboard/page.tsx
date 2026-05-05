import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PURPOSE_LABELS } from '@/lib/evidence-config'
import { PlanStatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role === 'ADMIN') redirect('/admin/dashboard')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true }
  })

  const [plans, budgetLimits, milestones] = await Promise.all([
    user?.teamId 
      ? prisma.budgetPlan.findMany({
          where: { teamId: user.teamId },
          include: {
            evidences: true,
          },
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
    })
  ])

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

  const budgetStatus = {
    totalBudget: TOTAL_BUDGET,
    totalUsed,
    totalBalance: TOTAL_BUDGET - totalUsed,
    categoryLimits,
    categoryUsage,
  }

  const activePlans = plans.filter(
    (p) =>
      p.status === 'PENDING_EVIDENCE' ||
      p.status === 'UNDER_REVIEW' ||
      p.status === 'RESUBMIT_REQUIRED',
  )
  const activePlanCount = activePlans.length
  const resubmitPlans = activePlans.filter((p) => p.status === 'RESUBMIT_REQUIRED')

  return (
    <div className="space-y-6">
      {/* Active plan alert */}
      {resubmitPlans.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm font-bold text-red-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            재제출이 필요한 항목이 {resubmitPlans.length}건 있습니다.
          </p>
          <p className="text-sm text-red-600 mt-1 ml-6">
            아래 목록에서 계획서를 확인하고 증빙을 다시 제출해주세요.
          </p>
        </div>
      )}

      {/* Dashboard Client Component (Charts, Milestones, and Plans List) */}
      <DashboardClient 
        budgetStatus={budgetStatus} 
        milestones={milestones} 
        plans={plans} 
        activePlanCount={activePlanCount}
      />
    </div>
  )
}
