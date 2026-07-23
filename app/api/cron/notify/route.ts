import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPushToUsers } from '@/lib/push'
import { PURPOSE_LABELS } from '@/lib/evidence-config'

// 카드 대여가 필요한 목적 (캘린더의 카드 사용 건)
const CARD_PURPOSES = ['MEETING_FEE', 'PURCHASE_FEE', 'SOFTWARE_FEE', 'OTHER']
// 시작 시각까지 남은 시간이 이 범위 안이면 알림 발송 (분)
const REMINDER_WINDOW_MIN = 65

export const dynamic = 'force-dynamic'

// 카드 사용 시각이 임박한 계획서를 찾아 해당 팀원(+관리자)에게 웹 푸시 발송.
// 주기 실행(cron)으로 호출: Vercel Cron 또는 외부 스케줄러에서
// GET /api/cron/notify (Authorization: Bearer <CRON_SECRET>)
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
  }

  const now = new Date()
  // 오늘~내일 날짜 범위의 후보만 조회 (KST 기준 계산은 아래에서)
  const from = new Date(now.getTime() - 24 * 3600 * 1000)
  const to = new Date(now.getTime() + 48 * 3600 * 1000)

  const candidates = await prisma.budgetPlan.findMany({
    where: {
      purpose: { in: CARD_PURPOSES },
      status: { not: 'APPROVED' },
      reminderSentAt: null,
      plannedDate: { gte: from, lte: to },
    },
    include: { team: { select: { id: true, teamNumber: true } } },
  })

  let notified = 0
  for (const plan of candidates) {
    // 시작 시각(KST): plannedDate의 달력 날짜 + plannedTime 시작 시각 (시간 미지정 시 09:00)
    const dateStr = plan.plannedDate.toISOString().slice(0, 10)
    const startTime = plan.plannedTime?.split('~')[0] || '09:00'
    const start = new Date(`${dateStr}T${startTime}:00+09:00`)

    const minutesLeft = (start.getTime() - now.getTime()) / 60000
    if (minutesLeft < 0 || minutesLeft > REMINDER_WINDOW_MIN) continue

    // 수신자: 해당 팀의 팀원 + 관리자
    const [teamUsers, admins] = await Promise.all([
      plan.teamId
        ? prisma.user.findMany({ where: { teamId: plan.teamId }, select: { id: true } })
        : Promise.resolve([{ id: plan.userId }]),
      prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } }),
    ])
    const userIds = Array.from(new Set([...teamUsers, ...admins].map((u) => u.id)))

    const purposeLabel = PURPOSE_LABELS[plan.purpose as keyof typeof PURPOSE_LABELS]
    const timeLabel = plan.plannedTime ? ` ${plan.plannedTime}` : ''
    const sent = await sendPushToUsers(userIds, {
      title: `곧 카드 사용 예정: ${purposeLabel}`,
      body: `${plan.team ? `${plan.team.teamNumber}팀 · ` : ''}${new Date(start).toLocaleDateString('ko-KR')}${timeLabel} · ${plan.amount.toLocaleString()}원`,
      url: '/dashboard',
      tag: `card-reminder-${plan.id}`,
    })

    await prisma.budgetPlan.update({
      where: { id: plan.id },
      data: { reminderSentAt: now },
    })
    if (sent > 0) notified++
  }

  return NextResponse.json({ checked: candidates.length, notified })
}
