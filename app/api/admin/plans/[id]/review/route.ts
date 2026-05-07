import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface ResubmitItem {
  evidenceId: string
  note: string
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const plan = await prisma.budgetPlan.findUnique({
    where: { id: params.id },
    include: { evidences: true },
  })
  if (!plan) return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })
  if (plan.status !== 'UNDER_REVIEW') {
    return NextResponse.json({ error: '검토 중인 계획서가 아닙니다.' }, { status: 400 })
  }

  const { action, note, resubmitItems } = await req.json()

  if (action === 'approve') {
    const isLastRepeat = !plan.isRecurring || (plan.completedRepeats + 1 >= plan.totalRepeats)
    const nextStatus = isLastRepeat ? 'APPROVED' : 'PENDING_EVIDENCE'
    
    // Calculate new cumulative actual amount
    const currentActual = plan.actualAmount || 0
    const submittedAmount = plan.lastSubmittedAmount || 0
    const newActualTotal = currentActual + submittedAmount

    await prisma.$transaction([
      prisma.budgetPlan.update({
        where: { id: params.id },
        data: { 
          status: nextStatus,
          actualAmount: newActualTotal,
          completedRepeats: plan.isRecurring ? plan.completedRepeats + 1 : plan.completedRepeats,
          // 다음 결제 예정일 계산 (간단히 1개월 뒤)
          nextRepeatDate: !isLastRepeat 
            ? new Date(new Date(plan.plannedDate).setMonth(new Date(plan.plannedDate).getMonth() + plan.completedRepeats + 1))
            : null,
          lastSubmittedAmount: null // 처리 완료 후 초기화
        },
      }),
      // 반복 건의 경우 '영수증' 항목을 다시 PENDING으로 초기화
      ...(plan.isRecurring && !isLastRepeat 
        ? [prisma.evidence.updateMany({
            where: { planId: params.id, label: '영수증' },
            data: { status: 'PENDING', fileName: null, nasPath: null }
          })]
        : []
      ),
      prisma.adminReview.create({
        data: {
          planId: params.id,
          adminId: session.user.id,
          note: note || null,
        },
      }),
    ])
  } else if (action === 'resubmit') {
    const items = resubmitItems as ResubmitItem[]
    if (!items || items.length === 0) {
      return NextResponse.json({ error: '재제출 항목을 지정해주세요.' }, { status: 400 })
    }

    // Validate that all specified evidence IDs belong to this plan
    const planEvidenceIds = new Set(plan.evidences.map((e) => e.id))
    for (const item of items) {
      if (!planEvidenceIds.has(item.evidenceId)) {
        return NextResponse.json({ error: '잘못된 증빙 항목입니다.' }, { status: 400 })
      }
    }

    await prisma.$transaction([
      // Mark specified items as resubmit_required
      ...items.map((item) =>
        prisma.evidence.update({
          where: { id: item.evidenceId },
          data: {
            status: 'RESUBMIT_REQUIRED',
            resubmitNote: item.note,
          },
        }),
      ),
      // Update plan status
      prisma.budgetPlan.update({
        where: { id: params.id },
        data: { status: 'RESUBMIT_REQUIRED' },
      }),
      prisma.adminReview.create({
        data: {
          planId: params.id,
          adminId: session.user.id,
          note: note || `재제출 요구: ${items.map((i) => i.note).join(', ')}`,
        },
      }),
    ])
  } else {
    return NextResponse.json({ error: '올바르지 않은 action입니다.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
