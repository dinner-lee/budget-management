import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// 목적 계획서의 수동 검토 요청
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { actualAmount } = body

  const plan = await prisma.budgetPlan.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { evidences: true },
  })

  if (!plan) return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })
  if (plan.status !== 'PENDING_EVIDENCE' && plan.status !== 'RESUBMIT_REQUIRED') {
    return NextResponse.json({ error: '검토 요청할 수 없는 상태입니다.' }, { status: 400 })
  }

  // 상태 업데이트 트랜잭션: 계획서를 검토 중으로 변경하고, 모든 대기/재제출 필요 상태의 증빙을 제출됨으로 변경
  await prisma.$transaction([
    prisma.budgetPlan.update({
      where: { id: params.id },
      data: { 
        status: 'UNDER_REVIEW',
        actualAmount: actualAmount !== undefined && actualAmount !== null ? actualAmount : plan.amount
      },
    }),
    prisma.evidence.updateMany({
      where: { 
        planId: params.id,
        status: { in: ['PENDING', 'RESUBMIT_REQUIRED'] }
      },
      data: { status: 'SUBMITTED', fileName: 'NAS 직접 업로드' },
    }),
  ])

  revalidatePath('/dashboard')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/plans/${params.id}`)
  
  return NextResponse.json({ success: true })
}

