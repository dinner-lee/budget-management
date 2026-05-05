import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PURPOSE_LABELS } from '@/lib/evidence-config'
import { PlanStatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role === 'ADMIN') redirect('/admin/dashboard')

  const [plans, budgetLimits, milestones] = await Promise.all([
    prisma.budgetPlan.findMany({
      where: { userId: session.user.id },
      include: {
        evidences: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.userBudgetLimit.findMany({
      where: { userId: session.user.id },
    }),
    prisma.milestone.findMany({
      orderBy: { date: 'asc' }
    })
  ])

  const TOTAL_BUDGET = 2000000

  const totalUsed = plans.reduce((acc, plan) => {
    return acc + (plan.status === 'APPROVED' ? (plan.actualAmount ?? plan.amount) : plan.amount)
  }, 0)

  const categoryUsage: Record<string, number> = {}
  plans.forEach(plan => {
    const amount = plan.status === 'APPROVED' ? (plan.actualAmount ?? plan.amount) : plan.amount
    categoryUsage[plan.purpose] = (categoryUsage[plan.purpose] || 0) + amount
  })

  const categoryLimits: Record<string, number> = {}
  budgetLimits.forEach(limit => {
    categoryLimits[limit.purpose] = limit.amount
  })

  const budgetStatus = {
    totalBudget: TOTAL_BUDGET,
    totalUsed,
    totalBalance: TOTAL_BUDGET - totalUsed,
    categoryLimits,
    categoryUsage,
  }

  const activePlans = plans.filter(
    (p) =>
      p.status === 'PENDING_EVIDENCE' ||
      p.status === 'UNDER_REVIEW' ||
      p.status === 'RESUBMIT_REQUIRED',
  )
  const activePlanCount = activePlans.length
  const resubmitPlans = activePlans.filter((p) => p.status === 'RESUBMIT_REQUIRED')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-500 mt-0.5">안녕하세요, {session.user.name} 선생님.</p>
        </div>
        {activePlanCount >= 3 ? (
          <div className="text-right">
            <p className="text-sm text-orange-600 font-medium">증빙 미완료 건수가 3건입니다.</p>
            <p className="text-xs text-gray-500">기존 계획서 증빙을 완료해 주세요.</p>
          </div>
        ) : (
          <Link href="/plans/new" className="btn-primary">
            새 예산 사용 계획서 작성
          </Link>
        )}
      </div>

      {/* Active plan alert */}
      {resubmitPlans.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">재제출이 필요한 항목이 {resubmitPlans.length}건 있습니다.</p>
          <p className="text-sm text-red-600 mt-0.5">
            아래 목록에서 계획서를 확인하고 증빙을 다시 제출해주세요.
          </p>
        </div>
      )}

      {/* Dashboard Client Component (Charts and Milestones) */}
      <DashboardClient budgetStatus={budgetStatus} milestones={milestones} />

      {/* Plans list */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">예산 사용 계획서 내역</h2>
        </div>

        {plans.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">
            작성한 계획서가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {plans.map((plan) => {
              const submitted = plan.evidences.filter((e) => e.status !== 'PENDING').length
              const total = plan.evidences.length
              return (
                <div key={plan.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/plans/${plan.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate"
                      >
                        {plan.title}
                      </Link>
                      <PlanStatusBadge status={plan.status} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {PURPOSE_LABELS[plan.purpose as keyof typeof PURPOSE_LABELS]} &middot;{' '}
                      {plan.amount.toLocaleString()}원 &middot;{' '}
                      {new Date(plan.plannedDate).toLocaleDateString('ko-KR')}
                    </p>
                    {plan.status !== 'APPROVED' && total > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        증빙 {submitted}/{total}개 제출
                      </p>
                    )}
                  </div>
                  {['PENDING_EVIDENCE', 'RESUBMIT_REQUIRED'].includes(plan.status) ? (
                    <Link
                      href={`/plans/${plan.id}`}
                      className="ml-4 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md px-3 py-1.5 shrink-0 transition"
                    >
                      증빙 서류 제출
                    </Link>
                  ) : (
                    <Link
                      href={`/plans/${plan.id}`}
                      className="ml-4 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-300 rounded-md px-3 py-1.5 shrink-0 transition"
                    >
                      상세보기
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
