import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const limits = await prisma.userBudgetLimit.findMany({
    where: { userId: session.user.id }
  })

  return NextResponse.json({ limits })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json()
  const { limits } = body // { [purpose]: amount }

  const TOTAL_BUDGET = 2000000
  const totalPlanned: number = Object.values(limits).reduce((acc: number, val: any) => acc + Number(val), 0)

  if (totalPlanned > TOTAL_BUDGET) {
    return NextResponse.json({ error: '총 예산 한도(2,000,000원)를 초과할 수 없습니다.' }, { status: 400 })
  }

  // Update or Create each limit
  const promises = Object.keys(limits).map(purpose => 
    prisma.userBudgetLimit.upsert({
      where: {
        userId_purpose: { userId: session.user.id, purpose }
      },
      update: { amount: Number(limits[purpose]) },
      create: { userId: session.user.id, purpose, amount: Number(limits[purpose]) }
    })
  )

  await prisma.$transaction(promises)

  return NextResponse.json({ success: true })
}
