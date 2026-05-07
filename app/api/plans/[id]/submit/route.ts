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
  if (plan.status !== 'PENDING_EVIDENCE' && plan.status !== 'RESUBMIT_REQUIRED') {
    return NextResponse.json({ error: '검토 요청할 수 없는 상태입니다.' }, { status: 400 })
  }

  // 상태 업데이트 트랜잭션
  await prisma.$transaction([
    prisma.budgetPlan.update({
      where: { id: params.id },
      data: { 
        status: 'UNDER_REVIEW',
        lastSubmittedAmount: actualAmount !== undefined && actualAmount !== null ? Number(actualAmount) : plan.amount
      },
    }),
    prisma.evidence.updateMany({
      where: { 
        planId: params.id,
        // 현재 제출 가능한 항목들만 'SUBMITTED'로 변경
        // 반복 건의 경우 프론트에서 필터링해서 보여준 항목(영수증)만 업데이트되어야 함?
        // 아니면 그냥 전부 업데이트해도 상관없음 (어차피 다른건 이미 승인상태거나 그대로일테니)
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

