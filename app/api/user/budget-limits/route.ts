import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true }
  })

  if (!user?.teamId) {
    return NextResponse.json({ limits: [] })
  }

  const limits = await prisma.teamBudgetLimit.findMany({
    where: { teamId: user.teamId }
  })

  return NextResponse.json({ limits })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true }
  })

  if (!user?.teamId) {
    return NextResponse.json({ error: '소속된 팀이 없습니다.' }, { status: 400 })
  }

  const body = await req.json()
  const { limits } = body // { [purpose]: amount }

  const TOTAL_BUDGET = 2000000
  const totalPlanned: number = Object.values(limits).reduce((acc: number, val: any) => acc + Number(val), 0)

  if (totalPlanned > TOTAL_BUDGET) {
    return NextResponse.json({ error: '총 예산 한도(2,000,000원)를 초과할 수 없습니다.' }, { status: 400 })
  }

  // Update or Create each limit
  const promises = Object.keys(limits).map(purpose => 
    prisma.teamBudgetLimit.upsert({
      where: {
        teamId_purpose: { teamId: user.teamId!, purpose }
      },
      update: { amount: Number(limits[purpose]) },
      create: { teamId: user.teamId!, purpose, amount: Number(limits[purpose]) }
    })
  )

  await prisma.$transaction(promises)

  return NextResponse.json({ success: true })
}
