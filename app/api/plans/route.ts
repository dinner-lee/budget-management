import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { EVIDENCE_REQUIREMENTS, PURPOSE_LABELS, type Purpose } from '@/lib/evidence-config'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true }
  })

  if (!user?.teamId) {
    return NextResponse.json([])
  }

  const plans = await prisma.budgetPlan.findMany({
    where: { teamId: user.teamId },
    include: { evidences: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(plans)
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

  // 미완료 계획서 수 확인 (팀 전체 기준)
  const activePlanCount = await prisma.budgetPlan.count({
    where: {
      teamId: user.teamId,
      status: { in: ['PENDING_EVIDENCE', 'UNDER_REVIEW', 'RESUBMIT_REQUIRED'] },
    },
  })
  if (activePlanCount >= 3) {
    return NextResponse.json(
      { error: '팀의 증빙이 완료되지 않은 계획서가 3건 있습니다. 기존 계획서의 증빙을 먼저 완료해주세요.' },
      { status: 400 },
    )
  }

  const body = await req.json()
  const { purpose, amount, plannedDate, plannedTime, expenditureOverview, repeatMonths } = body

  if (!purpose || !amount || !plannedDate || !expenditureOverview) {
    return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 })
  }

  const purposeKey = purpose as Purpose
  const evidenceItems = EVIDENCE_REQUIREMENTS[purposeKey]
  if (!evidenceItems) {
    return NextResponse.json({ error: '올바르지 않은 예산 목적입니다.' }, { status: 400 })
  }

  // 카드 대여 중복 체크 (회의비, 구매지출비, 소프트웨어, 기타)
  const cardPurposes = ['MEETING_FEE', 'PURCHASE_FEE', 'SOFTWARE_FEE', 'OTHER']
  if (cardPurposes.includes(purposeKey) && plannedTime) {
    // 해당 날짜의 카드 대여 관련 계획서들을 모두 가져옴
    const startOfDay = new Date(plannedDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(plannedDate)
    endOfDay.setHours(23, 59, 59, 999)

    const existingPlans = await prisma.budgetPlan.findMany({
      where: {
        plannedDate: { gte: startOfDay, lte: endOfDay },
        purpose: { in: cardPurposes },
        plannedTime: { not: null },
      },
      include: { team: true },
    })

    // 시간 겹침 체크 (30분 단위)
    const [newStart, newEnd] = plannedTime.split('~')
    const conflicts = existingPlans.filter(p => {
      if (!p.plannedTime) return false
      const [pStart, pEnd] = p.plannedTime.split('~')
      const pEndTime = pEnd || pStart // 종료 시간이 없으면 시작 시간과 동일하게 취급 (사실상 0분이지만 로직상 겹침 판단용)
      const newEndTime = newEnd || newStart

      // 겹침 조건: start1 < end2 && start2 < end1
      return newStart < pEndTime && pStart < newEndTime
    })

    // 겹치는 팀들의 팀 번호를 추출 (중복 제거)
    const conflictTeams = Array.from(new Set(conflicts.map(c => c.team?.teamNumber).filter(Boolean)))
    
    if (conflictTeams.length >= 2) {
      // 겹치는 팀들의 구체적인 시간 정보 구성
      const conflictDetails = conflicts.map(c => ({
        teamNumber: c.team?.teamNumber,
        purpose: c.purpose,
        time: c.plannedTime
      })).slice(0, 2)

      return NextResponse.json({
        error: '카드 대여 예약 중복',
        conflicts: conflictDetails
      }, { status: 409 })
    }
  }

  const autoTitle = `${PURPOSE_LABELS[purposeKey]} (${new Date(plannedDate).toLocaleDateString('ko-KR')})`

  const plan = await prisma.budgetPlan.create({
    data: {
      userId: session.user.id,
      teamId: user.teamId,
      title: autoTitle,
      purpose: purposeKey,
      amount: Number(amount),
      plannedDate: new Date(plannedDate),
      plannedTime: plannedTime || null,
      expenditureOverview,
      status: 'PENDING_EVIDENCE',
      isRecurring: purposeKey === 'SOFTWARE_FEE' && Number(repeatMonths) > 1,
      totalRepeats: purposeKey === 'SOFTWARE_FEE' ? Number(repeatMonths) : 1,
      completedRepeats: 0,
      evidences: {
        create: evidenceItems.map((item) => ({
          itemKey: item.key,
          label: item.label,
          hint: item.hint ?? null,
          required: item.required !== false,
          status: 'PENDING',
        })),
      },
    },
  })

  return NextResponse.json(plan, { status: 201 })
}
