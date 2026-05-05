import { NextResponse } from 'next/server'
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
    return NextResponse.json({
      totalBudget: 2000000,
      totalUsed: 0,
      totalBalance: 2000000,
      categoryLimits: {},
      categoryUsage: {},
    })
  }

  const [plans, budgetLimits] = await Promise.all([
    prisma.budgetPlan.findMany({
      where: { teamId: user.teamId },
    }),
    prisma.teamBudgetLimit.findMany({
      where: { teamId: user.teamId },
    }),
  ])

  // 총 예산은 2,000,000원 고정
  const TOTAL_BUDGET = 2000000

  // 승인된 건은 실제 사용액, 그 외는 계획된 사용액으로 계산
  const totalUsed = plans.reduce((acc, plan) => {
    return acc + (plan.status === 'APPROVED' ? (plan.actualAmount ?? plan.amount) : plan.amount)
  }, 0)

  // 항목별 사용 금액 계산
  const categoryUsage: Record<string, number> = {}
  plans.forEach(plan => {
    const amount = plan.status === 'APPROVED' ? (plan.actualAmount ?? plan.amount) : plan.amount
    categoryUsage[plan.purpose] = (categoryUsage[plan.purpose] || 0) + amount
  })

  // 항목별 한도 매핑
  const categoryLimits: Record<string, number> = {}
  budgetLimits.forEach(limit => {
    categoryLimits[limit.purpose] = limit.amount
  })

  return NextResponse.json({
    totalBudget: TOTAL_BUDGET,
    totalUsed,
    totalBalance: TOTAL_BUDGET - totalUsed,
    categoryLimits,
    categoryUsage,
  })
}
