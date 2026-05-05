import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PURPOSE_LABELS } from '@/lib/evidence-config'
import { PlanStatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  const [allPlans, userCount, teams, milestones] = await Promise.all([
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
        users: { select: { id: true, name: true, email: true } },
        budgetLimits: true,
      }
    }),
    prisma.milestone.findMany({
      orderBy: { date: 'asc' }
    })
  ])

  return (
    <div className="space-y-6">
      <AdminDashboardClient
        allPlans={allPlans}
        userCount={userCount}
        teams={teams}
        milestones={milestones}
      />
    </div>
  )
}

