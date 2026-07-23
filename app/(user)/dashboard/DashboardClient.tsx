'use client'

import { useState } from 'react'
import { PURPOSE_LABELS } from '@/lib/evidence-config'
import { PlanStatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'
import { differenceInDays, isAfter, isToday } from 'date-fns'
import EvidenceSubmissionModal from '@/components/EvidenceSubmissionModal'

// 항목별 카드 블록 색상 테마
const CATEGORY_STYLES: Record<string, { bg: string; border: string; fill: string; text: string; percent: string }> = {
  MEETING_FEE:     { bg: 'bg-blue-50/60',    border: 'border-blue-100',    fill: 'bg-blue-500/25',    text: 'text-blue-800',    percent: 'text-blue-600' },
  EXPERT_FEE:      { bg: 'bg-indigo-50/60',  border: 'border-indigo-100',  fill: 'bg-indigo-500/25',  text: 'text-indigo-800',  percent: 'text-indigo-600' },
  PARTICIPANT_FEE: { bg: 'bg-violet-50/60',  border: 'border-violet-100',  fill: 'bg-violet-500/25',  text: 'text-violet-800',  percent: 'text-violet-600' },
  PURCHASE_FEE:    { bg: 'bg-emerald-50/60', border: 'border-emerald-100', fill: 'bg-emerald-500/25', text: 'text-emerald-800', percent: 'text-emerald-600' },
  SOFTWARE_FEE:    { bg: 'bg-cyan-50/60',    border: 'border-cyan-100',    fill: 'bg-cyan-500/25',    text: 'text-cyan-800',    percent: 'text-cyan-600' },
  OTHER:           { bg: 'bg-amber-50/60',   border: 'border-amber-100',   fill: 'bg-amber-500/25',   text: 'text-amber-800',   percent: 'text-amber-600' },
}

export default function DashboardClient({
  budgetStatus,
  milestones,
  plans,
  activePlanCount
}: {
  budgetStatus: any
  milestones: any[]
  plans: any[]
  activePlanCount: number
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const openSubmissionModal = (planId: string) => {
    setSelectedPlanId(planId)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <BudgetSummarySection budgetStatus={budgetStatus} milestones={milestones} />
      <PlanListSection plans={plans} activePlanCount={activePlanCount} onOpenSubmission={openSubmissionModal} />

      <EvidenceSubmissionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planId={selectedPlanId}
      />

      {/* Floating Action Button (FAB) for New Plan - Permanently Expanded */}
      <div className="fixed bottom-8 right-8 z-40">
        {activePlanCount < 3 ? (
          <Link
            href="/plans/new"
            className="flex items-center text-white rounded-full shadow-2xl transition-all duration-300 ease-in-out h-14 px-6 overflow-hidden border border-white/10 hover:-translate-y-0.5 hover:brightness-110"
            style={{ backgroundColor: '#15378F' }}
          >
            <svg className="w-6 h-6 shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="whitespace-nowrap ml-3 font-bold text-sm">
              새로운 예산 사용 계획서 작성
            </span>
          </Link>
        ) : (
          <div 
            className="flex items-center bg-gray-400 text-white rounded-full shadow-xl h-14 px-6 cursor-not-allowed opacity-80"
            title="증빙 미완료 3건 초과로 작성이 제한됩니다"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="whitespace-nowrap ml-3 font-bold text-sm">
              예산 사용 계획서 작성 제한
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function BudgetSummarySection({ budgetStatus, milestones }: { budgetStatus: any, milestones: any[] }) {
  const { totalBudget, totalUsed, totalBalance, categoryLimits, categoryUsage } = budgetStatus

  const usedPercent = totalBudget > 0 ? Math.min(100, Math.round((totalUsed / totalBudget) * 100)) : 0

  const upcomingMilestones = milestones
    .filter(m => isAfter(new Date(m.date), new Date()) || isToday(new Date(m.date)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="space-y-6">
      {/* 잔액 카드 + 주요 일정 카드 (같은 줄) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 사용 가능 잔액 */}
        <div className="relative rounded-2xl p-6 text-white overflow-hidden bg-gradient-to-br from-[#1c46ac] via-[#15378F] to-[#0a1d52] shadow-lg flex flex-col justify-between min-h-[13rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.15),transparent_55%)]" aria-hidden="true" />
          <div className="absolute -bottom-20 -right-16 w-52 h-52 rounded-full bg-white/5" aria-hidden="true" />

          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-100/70">사용 가능 잔액</p>
            <p className="mt-1.5 text-[2rem] leading-tight font-black tracking-tight tabular-nums">
              {totalBalance.toLocaleString()}
              <span className="text-base font-semibold text-blue-100/70 ml-1">원</span>
            </p>
          </div>

          <div className="relative mt-6">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700 ease-out"
                style={{ width: `${usedPercent}%` }}
              />
            </div>
            <div className="mt-2.5 flex justify-between text-xs text-blue-100/80 tabular-nums">
              <span>사용 {totalUsed.toLocaleString()}원 ({usedPercent}%)</span>
              <span>총 {totalBudget.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 주요 일정 카드 */}
        {upcomingMilestones.map(m => {
          const dDay = differenceInDays(new Date(m.date), new Date())
          const urgent = dDay <= 3
          return (
            <div
              key={m.id}
              className="relative rounded-2xl bg-white border border-gray-200 shadow-sm p-6 flex flex-col justify-between overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div
                className={`absolute -top-14 -right-14 w-36 h-36 rounded-full ${urgent ? 'bg-red-50' : 'bg-indigo-50'}`}
                aria-hidden="true"
              />
              <div className="relative">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">주요 일정</p>
                <p className="mt-1.5 text-lg font-bold text-gray-900 break-keep leading-snug">{m.name}</p>
                <p className="mt-1 text-xs text-gray-500 tabular-nums">{new Date(m.date).toLocaleDateString('ko-KR')}</p>
              </div>
              <div className="relative mt-5">
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold tabular-nums shadow-sm text-white ${urgent ? 'bg-red-500' : 'bg-indigo-600'}`}>
                  {dDay === 0 ? 'D-Day' : `D-${dDay}`}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 항목별 예산 사용 현황: 색상 카드 블록 */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">항목별 예산 사용 현황</h2>
        {(() => {
          const visible = Object.keys(PURPOSE_LABELS).filter(
            (key) => (categoryLimits[key] || 0) > 0 || (categoryUsage[key] || 0) > 0,
          )
          if (visible.length === 0) {
            return (
              <div className="py-10 text-center text-gray-400 text-sm">
                설정된 항목별 예산이 없습니다. 예산 계획 설정에서 항목별 한도를 입력해 주세요.
              </div>
            )
          }
          return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {visible.map((key) => {
                const label = PURPOSE_LABELS[key as keyof typeof PURPOSE_LABELS]
                const st = CATEGORY_STYLES[key] ?? CATEGORY_STYLES.OTHER
                const limit = categoryLimits[key] || 0
                const used = categoryUsage[key] || 0
                const percent = limit > 0 ? Math.round((used / limit) * 100) : used > 0 ? 100 : 0
                const over = limit > 0 && used > limit
                return (
                  <div
                    key={key}
                    className={`relative rounded-2xl border overflow-hidden p-4 min-h-[9.5rem] flex flex-col justify-between ${st.bg} ${st.border} hover:shadow-md transition-shadow`}
                    title={`${label}: ${used.toLocaleString()}원 / ${limit.toLocaleString()}원`}
                  >
                    {/* 사용률만큼 아래에서부터 차오르는 채움 */}
                    <div
                      className={`absolute inset-x-0 bottom-0 transition-all duration-700 ease-out ${over ? 'bg-red-500/25' : st.fill}`}
                      style={{ height: `${Math.min(100, percent)}%` }}
                      aria-hidden="true"
                    />
                    <p className={`relative text-xs font-bold break-keep leading-snug ${st.text}`}>{label}</p>
                    <div className="relative">
                      <p className={`text-2xl font-black tracking-tight tabular-nums ${over ? 'text-red-600' : st.percent}`}>
                        {percent}
                        <span className="text-sm font-bold">%</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-600 tabular-nums leading-tight">
                        {used.toLocaleString()}원
                        <span className="text-gray-400"> / {limit.toLocaleString()}원</span>
                      </p>
                      {over && <p className="text-[10px] font-bold text-red-600 mt-0.5">한도 초과</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// 계획서 목록의 표 컬럼 (헤더/행 공유)
const USER_PLAN_GRID = 'md:grid-cols-[minmax(0,1fr)_6rem_6rem_5.5rem_4rem_12rem]'

function PlanListSection({ plans, activePlanCount, onOpenSubmission }: {
  plans: any[],
  activePlanCount: number,
  onOpenSubmission: (id: string) => void
}) {
  const [purposeFilter, setPurposeFilter] = useState<string>('ALL')

  const filteredPlans = purposeFilter === 'ALL'
    ? plans
    : plans.filter(p => p.purpose === purposeFilter)

  // 증빙 제출이 필요한 건을 맨 위로
  const NEEDS_ACTION = ['PENDING_EVIDENCE', 'RESUBMIT_REQUIRED']
  const sortedPlans = [...filteredPlans].sort(
    (a, b) => Number(NEEDS_ACTION.includes(b.status)) - Number(NEEDS_ACTION.includes(a.status)),
  )

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-gray-700">
            예산 사용 계획서 내역
            <span className="ml-1 text-xs text-gray-400 font-normal tabular-nums">({filteredPlans.length}건)</span>
          </h2>
          {activePlanCount >= 3 && (
            <span className="font-nexon inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-normal bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 whitespace-nowrap">
              작성 제한 · 증빙 미완료 3건
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-1.5">
        {[['ALL', '전체'], ...Object.entries(PURPOSE_LABELS)].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPurposeFilter(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all whitespace-nowrap ${
              purposeFilter === value
                ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                : 'bg-white border-gray-200 text-gray-600 hover:border-primary-100 hover:bg-primary-50/60 hover:text-primary-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`hidden md:grid ${USER_PLAN_GRID} gap-3 px-5 py-2 border-b border-gray-100 bg-gray-50/40 text-[11px] font-semibold text-gray-400`}>
        <span>계획서</span>
        <span className="text-right">계획 금액</span>
        <span className="text-right">실제 금액</span>
        <span>사용일</span>
        <span>증빙</span>
        <span className="text-right">상태 / 작업</span>
      </div>

      {sortedPlans.length === 0 ? (
        <div className="px-5 py-12 text-center text-gray-400 text-sm">
          {purposeFilter === 'ALL' ? '작성한 계획서가 없습니다.' : '해당 목적의 계획서가 없습니다.'}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {sortedPlans.map((plan) => {
            const submitted = plan.evidences.filter((e: any) => e.status !== 'PENDING').length
            const total = plan.evidences.length
            const needsAction = NEEDS_ACTION.includes(plan.status)
            const isResubmit = plan.status === 'RESUBMIT_REQUIRED'
            const isWaitingForDate = plan.isRecurring && plan.nextRepeatDate && new Date() < new Date(plan.nextRepeatDate)
            const canSubmit = needsAction && !isWaitingForDate
            const actual = plan.actualAmount ?? plan.lastSubmittedAmount ?? null
            const isConfirmed = plan.actualAmount !== null && plan.actualAmount !== undefined

            return (
              <div
                key={plan.id}
                className={`relative px-5 py-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 md:grid ${USER_PLAN_GRID} md:gap-3 text-sm transition-colors ${
                  isResubmit ? 'bg-red-50/30 hover:bg-red-50/50' : needsAction ? 'bg-amber-50/30 hover:bg-amber-50/50' : 'hover:bg-gray-50'
                }`}
              >
                {needsAction && (
                  <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${isResubmit ? 'bg-red-400' : 'bg-amber-400'}`} aria-hidden="true" />
                )}
                <div className="min-w-0 w-full md:w-auto">
                  {canSubmit ? (
                    <button
                      onClick={() => onOpenSubmission(plan.id)}
                      className="block max-w-full font-medium text-gray-900 hover:text-primary-500 truncate text-left transition-colors"
                    >
                      {plan.title}
                    </button>
                  ) : (
                    <Link
                      href={`/plans/${plan.id}`}
                      className="block max-w-full font-medium text-gray-900 hover:text-primary-500 truncate transition-colors"
                    >
                      {plan.title}
                    </Link>
                  )}
                </div>
                <div className="md:text-right tabular-nums text-gray-700">{plan.amount.toLocaleString()}원</div>
                <div className={`md:text-right tabular-nums ${actual !== null ? (isConfirmed ? 'text-blue-600 font-medium' : 'text-amber-600 font-medium') : 'text-gray-300'}`}>
                  {actual !== null ? `${actual.toLocaleString()}원` : '–'}
                </div>
                <div className="text-xs text-gray-500 tabular-nums">{new Date(plan.plannedDate).toLocaleDateString('ko-KR')}</div>
                <div className="text-xs text-gray-500 tabular-nums">{total > 0 ? `${submitted}/${total}` : '–'}</div>
                <div className="flex items-center gap-1.5 md:justify-end w-full md:w-auto">
                  <PlanStatusBadge status={plan.status} />
                  {isWaitingForDate ? (
                    <span
                      title={`${new Date(plan.nextRepeatDate).toLocaleDateString('ko-KR')} 활성화`}
                      className="inline-flex items-center whitespace-nowrap shrink-0 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 cursor-not-allowed"
                    >
                      결제일 대기
                    </span>
                  ) : canSubmit ? (
                    <button
                      onClick={() => onOpenSubmission(plan.id)}
                      className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 text-xs font-medium text-white rounded-lg px-2.5 py-1.5 shadow-sm transition-all active:scale-95 hover:brightness-110 hover:shadow-md"
                      style={{ backgroundColor: '#15378F' }}
                    >
                      증빙 제출
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ) : (
                    <Link
                      href={`/plans/${plan.id}`}
                      className="inline-flex items-center gap-1 whitespace-nowrap shrink-0 text-xs font-medium text-gray-500 border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 hover:bg-gray-50 hover:text-gray-700 hover:shadow-sm transition-all"
                    >
                      상세
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
