import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { team: true }
  })

  return NextResponse.json({ team: user?.team || null })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { team: true }
  })

  if (!user?.team) {
    return NextResponse.json({ error: '소속된 팀이 없습니다. 관리자에게 문의하세요.' }, { status: 400 })
  }

  const body = await req.json()
  const { leaderName, leaderAffiliation, members, researchTopic } = body

  // Create Edit Log
  const oldTeam = user.team
  const changes = JSON.stringify({
    leaderName: { old: oldTeam.leaderName, new: leaderName },
    leaderAffiliation: { old: oldTeam.leaderAffiliation, new: leaderAffiliation },
    members: { old: oldTeam.members, new: members },
    researchTopic: { old: oldTeam.researchTopic, new: researchTopic },
  })

  await prisma.$transaction([
    prisma.team.update({
      where: { id: oldTeam.id },
      data: { leaderName, leaderAffiliation, members, researchTopic }
    }),
    prisma.teamEditLog.create({
      data: {
        teamId: oldTeam.id,
        userId: user.id,
        changes
      }
    })
  ])

  return NextResponse.json({ success: true })
}
