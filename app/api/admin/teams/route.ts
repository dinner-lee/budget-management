import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const teams = await prisma.team.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      editLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ teams })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const body = await req.json()
  const { teamNumber, leaderName, leaderAffiliation, members, researchTopic, userId } = body

  // Create Team and optionally link to User
  const team = await prisma.team.create({
    data: {
      teamNumber,
      leaderName,
      leaderAffiliation,
      members: members || '',
      researchTopic,
    }
  })

  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { teamId: team.id }
    })
  }

  return NextResponse.json({ team }, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const body = await req.json()
  const { teamId, userId } = body

  if (!teamId || !userId) {
    return NextResponse.json({ error: '팀 ID와 사용자 ID가 필요합니다.' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: userId },
    data: { teamId }
  })

  return NextResponse.json({ success: true })
}

