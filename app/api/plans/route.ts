import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { EVIDENCE_REQUIREMENTS, PURPOSE_LABELS, type Purpose } from '@/lib/evidence-config'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const plans = await prisma.budgetPlan.findMany({
    where: { userId: session.user.id },
    include: { evidences: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(plans)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  // 미완료 계획서 수 확인
  const activePlanCount = await prisma.budgetPlan.count({
    where: {
      userId: session.user.id,
      status: { in: ['PENDING_EVIDENCE', 'UNDER_REVIEW', 'RESUBMIT_REQUIRED'] },
    },
  })
  if (activePlanCount >= 3) {
    return NextResponse.json(
      { error: '증빙이 완료되지 않은 계획서가 3건 있습니다. 기존 계획서의 증빙을 먼저 완료해주세요.' },
      { status: 400 },
    )
  }

  const body = await req.json()
  const { purpose, amount, plannedDate, plannedTime, expenditureOverview } = body

  if (!purpose || !amount || !plannedDate || !expenditureOverview) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 })
  }

  const purposeKey = purpose as Purpose
  const evidenceItems = EVIDENCE_REQUIREMENTS[purposeKey]
  if (!evidenceItems) {
    return NextResponse.json({ error: '올바르지 않은 예산 목적입니다.' }, { status: 400 })
  }

  const autoTitle = `${PURPOSE_LABELS[purposeKey]} (${new Date(plannedDate).toLocaleDateString('ko-KR')})`

  const plan = await prisma.budgetPlan.create({
    data: {
      userId: session.user.id,
      title: autoTitle,
      purpose: purposeKey,
      amount: Number(amount),
      plannedDate: new Date(plannedDate),
      plannedTime: plannedTime || null,
      expenditureOverview,
      status: 'PENDING_EVIDENCE',
      evidences: {
        create: evidenceItems.map((item) => ({
          itemKey: item.key,
          label: item.label,
          hint: item.hint ?? null,
          required: item.required !== false, // undefined → true
          status: 'PENDING',
        })),
      },
    },
  })

  return NextResponse.json(plan, { status: 201 })
}
