import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import TeamClient from './TeamClient'

export default async function TeamPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role === 'ADMIN') redirect('/admin/dashboard')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true }
  })

  const team = user?.teamId
    ? await prisma.team.findUnique({
        where: { id: user.teamId },
        include: {
          users: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    : null

  return <TeamClient initialTeam={team} />
}
