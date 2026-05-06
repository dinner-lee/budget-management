import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import BudgetLimitsClient from './BudgetLimitsClient'

export default async function BudgetLimitsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role === 'ADMIN') redirect('/admin/dashboard')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true }
  })

  const limits = user?.teamId
    ? await prisma.teamBudgetLimit.findMany({
      where: { teamId: user.teamId }
    })
    : []

  return <BudgetLimitsClient initialLimits={limits} />
}
