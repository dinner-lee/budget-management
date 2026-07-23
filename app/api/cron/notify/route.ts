import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPushToUsers } from '@/lib/push'
import { PURPOSE_LABELS } from '@/lib/evidence-config'

// 카드 대여가 필요한 목적 (캘린더의 카드 사용 건)
const CARD_PURPOSES = ['MEETING_FEE', 'PURCHASE_FEE', 'SOFTWARE_FEE', 'OTHER']
// 이 시각(KST) 이후 첫 실행 때 당일 건을 발송 (새벽 발송 방지)
const NOTIFY_FROM_HOUR_KST = 8

export const dynamic = 'force-dynamic'

// 당일(KST) 카드 사용 예정 계획서를 찾아 해당 팀원(+관리자)에게 웹 푸시 발송.
// 주기 실행(cron)으로 호출: Vercel Cron 또는 외부 스케줄러에서
// GET /api/cron/notify (Authorization: Bearer <CRON_SECRET>)
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 401 })
  }

  // 테스트 모드: 구독된 모든 사용자에게 테스트 알림 발송 (?test=1)
  if (req.nextUrl.searchParams.get('test') === '1') {
    const allSubs = await prisma.pushSubscription.findMany({ select: { userId: true } })
    const userIds = Array.from(new Set(allSubs.map((s) => s.userId)))
    const sent = await sendPushToUsers(userIds, {
      title: '테스트 알림',
      body: '웹 푸시 알림이 정상적으로 작동합니다. 카드 사용 당일 아침에 이렇게 알림이 도착합니다.',
      url: '/dashboard',
      tag: 'push-test',
    })
    return NextResponse.json({ test: true, subscriptions: allSubs.length, sent })
  }

  const now = new Date()
  const kstNow = new Date(now.getTime() + 9 * 3600 * 1000)
  const todayKst = kstNow.toISOString().slice(0, 10) // KST 기준 오늘 날짜
  if (kstNow.getUTCHours() < NOTIFY_FROM_HOUR_KST) {
    return NextResponse.json({ checked: 0, notified: 0, skipped: 'before-notify-hour' })
  }

  // 오늘 날짜 주변 범위의 후보만 조회 (달력 날짜 비교는 아래에서)
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
    // 당일(KST) 건만 발송
    const dateStr = plan.plannedDate.toISOString().slice(0, 10)
    if (dateStr !== todayKst) continue

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
      title: `오늘 카드 사용 예정: ${purposeLabel}`,
      body: `${plan.team ? `${plan.team.teamNumber}팀 · ` : ''}오늘${timeLabel} · ${plan.amount.toLocaleString()}원`,
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
