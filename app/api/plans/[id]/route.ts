import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true }
  })

  const plan = await prisma.budgetPlan.findFirst({
    where: { 
      id: params.id, 
      OR: [
        { userId: session.user.id },
        { teamId: user?.teamId || 'NONE' }
      ]
    },
    include: { evidences: true },
  })

  if (!plan) return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })

  return NextResponse.json(plan)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true }
  })

  const plan = await prisma.budgetPlan.findFirst({
    where: { 
      id: params.id, 
      OR: [
        { userId: session.user.id },
        { teamId: user?.teamId || 'NONE' }
      ]
    },
  })

  if (!plan) return NextResponse.json({ error: '찾을 수 없거나 권한이 없습니다.' }, { status: 404 })

  // '증빙 대기' 상태이고, 계획된 사용일 이전인 경우에만 삭제 가능
  const now = new Date()
  const plannedDate = new Date(plan.plannedDate)
  
  // 날짜 비교 (시간 제외하고 날짜만 비교할지, 아니면 현재 시각 기준으로 할지)
  // "사용하기로 한 날짜 이전" 이므로 오늘 날짜 00:00:00 이전까지만 가능하게 하거나,
  // 아니면 단순히 plannedDate가 오늘보다 미래여야 함.
  // 여기서는 단순히 현재 시각이 plannedDate보다 이전인지 체크함.
  if (plan.status !== 'PENDING_EVIDENCE') {
    return NextResponse.json({ error: '증빙 대기 상태에서만 계획서를 삭제할 수 없습니다.' }, { status: 400 })
  }

  if (now >= plannedDate) {
    return NextResponse.json({ error: '사용 예정일이 지났거나 사용일 당일 이후에는 계획서를 삭제할 수 없습니다.' }, { status: 400 })
  }

  await prisma.budgetPlan.delete({
    where: { id: params.id }
  })

  return NextResponse.json({ success: true })
}
