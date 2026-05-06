import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import AdminAppShell from '@/components/AdminAppShell'

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
    prisma.milestone.findMany({
      orderBy: { date: 'asc' }
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { plans: true } } },
    })
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminAppShell
        dashboardData={{ allPlans, userCount, teams, milestones }}
        teamsData={{ teams, users }}
        usersData={users}
        settingsData={milestones}
      >
        {children}
      </AdminAppShell>
    </div>
  )
}
