import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getMilestones } from '@/lib/milestones'
import { redirect } from 'next/navigation'
import AdminAppShell from '@/components/AdminAppShell'
import { AmbientBackground } from '@/components/LiquidGlass'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  // Fetch all admin data
  const [allPlans, userCount, teams, milestones, users] = await Promise.all([
    prisma.budgetPlan.findMany({
      include: {
        user: { select: { name: true, email: true, teamId: true } },
        evidences: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.team.findMany({
      include: {
        users: { select: { id: true, name: true, email: true, teamId: true } },
        budgetLimits: true,
        editLogs: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    }),
    getMilestones(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { plans: true } } },
    })
  ])

  // 서명 이미지(base64)는 목록 화면에 불필요하고 payload만 키우므로 제외
  const plansWithoutSignature = allPlans.map(({ signature, ...p }) => p)

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/60">
      <AmbientBackground />
      <AdminAppShell
        dashboardData={{ allPlans: plansWithoutSignature, userCount, teams, milestones }}
        teamsData={{ teams, users }}
        usersData={users}
        settingsData={milestones}
      >
        {children}
      </AdminAppShell>
    </div>
  )
}
