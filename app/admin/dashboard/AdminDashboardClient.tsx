'use client'

import { useState } from 'react'
import { PURPOSE_LABELS } from '@/lib/evidence-config'
import { PlanStatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, parseISO
} from 'date-fns'

interface Evidence {
  id: string
  status: string
}

interface Plan {
  id: string
  title: string
  amount: number
  actualAmount: number | null
  purpose: string
  status: string
  plannedDate: string | Date
  user: {
    name: string | null
    email: string
    teamId: string | null
  }
  evidences: Evidence[]
  teamId?: string | null
}

interface BudgetLimit {
  purpose: string
  amount: number
}

interface Team {
  id: string
  teamNumber: string
  leaderName: string
  leaderAffiliation: string
  researchTopic: string
  users: { id: string; name: string | null; email: string }[]
  budgetLimits: BudgetLimit[]
}

// 전체 계획서 목록의 표 컬럼 (헤더/행 공유)
const PLAN_GRID = 'md:grid-cols-[6.5rem_minmax(0,1fr)_minmax(0,1fr)_6rem_6rem_5.5rem_5.5rem_12.5rem]'

type SortState = { key: string; dir: 'asc' | 'desc' } | null

function SortHeader({ label, sortKey, sort, onToggle, align }: {
  label: string
  sortKey: string
  sort: SortState
  onToggle: (key: string) => void
  align?: 'right'
}) {
  const active = sort?.key === sortKey
  return (
    <button
      type="button"
      onClick={() => onToggle(sortKey)}
      title="클릭하여 정렬 (오름차순 → 내림차순 → 해제)"
      className={`flex items-center gap-0.5 transition-colors hover:text-gray-600 ${align === 'right' ? 'justify-end' : ''} ${active ? 'text-primary-500' : ''}`}
    >
      {label}
      <svg className={`w-3 h-3 shrink-0 ${active ? '' : 'opacity-30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        {!active && <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />}
        {active && sort!.dir === 'asc' && <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />}
        {active && sort!.dir === 'desc' && <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />}
      </svg>
    </button>
  )
}

function sortByTeamNumber<T extends { teamNumber: string }>(teams: T[]): T[] {
  return [...teams].sort((a, b) => {
    const na = parseInt(a.teamNumber, 10)
    const nb = parseInt(b.teamNumber, 10)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return String(a.teamNumber).localeCompare(String(b.teamNumber), 'ko')
  })
}

interface Milestone {
  id: string
  name: string
  date: string | Date
}

export default function AdminDashboardClient({
  allPlans, userCount, teams, milestones
}: {
  allPlans: Plan[]
  userCount: number
  teams: Team[]
  milestones: Milestone[]
}) {
  const [view, setView] = useState<'DASHBOARD' | 'CALENDAR' | 'BUDGET'>('DASHBOARD')
  const [filter, setFilter] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const pending = allPlans.filter((p) => p.status === 'UNDER_REVIEW')
  const resubmit = allPlans.filter((p) => p.status === 'RESUBMIT_REQUIRED')
  const approved = allPlans.filter((p) => p.status === 'APPROVED')
  const inProgress = allPlans.filter((p) => p.status === 'PENDING_EVIDENCE')

  return (
    <div className="space-y-6">
      <div className="inline-flex items-center gap-1 glass-track rounded-xl p-1">
        {([
          { key: 'DASHBOARD', label: '팀별', title: '대시보드', icon: 'M4 6h16M4 12h16M4 18h16' },
          { key: 'BUDGET', label: '전체', title: '예산 현황', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
          { key: 'CALENDAR', label: '캘린더', title: '캘린더 보기', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              view === tab.key
                ? 'bg-white text-primary-500 shadow-sm ring-1 ring-black/5'
                : 'text-gray-500 hover:text-gray-800'
            }`}
            onClick={() => setView(tab.key)}
            title={tab.title}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {view === 'DASHBOARD' && (
        <CombinedDashboardView
          pending={pending}
          resubmit={resubmit}
          allPlans={allPlans}
          userCount={userCount}
          inProgress={inProgress}
          approved={approved}
          teams={teams}
          filter={filter}
          setFilter={setFilter}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
        />
      )}

      {view === 'BUDGET' && (
        <BudgetView teams={teams} allPlans={allPlans} />
      )}

      {view === 'CALENDAR' && (
        <CalendarView allPlans={allPlans} teams={teams} milestones={milestones} />
      )}
    </div>
  )
}

function CombinedDashboardView({
  pending, resubmit, allPlans, userCount, inProgress, approved, teams,
  filter, setFilter, selectedTeamId, setSelectedTeamId
}: {
  pending: Plan[]
  resubmit: Plan[]
  allPlans: Plan[]
  userCount: number
  inProgress: Plan[]
  approved: Plan[]
  teams: Team[]
  filter: string | null
  setFilter: (f: string | null) => void
  selectedTeamId: string | null
  setSelectedTeamId: (id: string | null) => void
}) {
  const stats = [
    { label: '검토 대기', value: pending.length, color: 'text-primary-500', dot: 'bg-primary-500', ring: 'ring-primary-500', bg: 'bg-primary-50', border: 'border-primary-100', status: 'UNDER_REVIEW' },
    { label: '재제출 대기', value: resubmit.length, color: 'text-red-600', dot: 'bg-red-600', ring: 'ring-red-600', bg: 'bg-red-50', border: 'border-red-200', status: 'RESUBMIT_REQUIRED' },
    { label: '증빙 작성 중', value: inProgress.length, color: 'text-yellow-600', dot: 'bg-yellow-600', ring: 'ring-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', status: 'PENDING_EVIDENCE' },
    { label: '승인 완료', value: approved.length, color: 'text-green-600', dot: 'bg-green-600', ring: 'ring-green-600', bg: 'bg-green-50', border: 'border-green-200', status: 'APPROVED' },
  ]

  const selectedTeam = teams.find((t: any) => t.id === selectedTeamId)

  const filteredPlans = allPlans.filter((plan: any) => {
    const matchesStatus = !filter || plan.status === filter
    const matchesTeam = !selectedTeamId || (plan.teamId || plan.user?.teamId) === selectedTeamId
    return matchesStatus && matchesTeam
  })

  const [sort, setSort] = useState<SortState>(null)

  const sortValue = (p: any, key: string): number | string => {
    switch (key) {
      case 'team': {
        const t = teams.find((tm: any) => tm.id === (p.teamId || p.user?.teamId))
        const n = parseInt(t?.teamNumber ?? '', 10)
        return isNaN(n) ? Number.MAX_SAFE_INTEGER : n
      }
      case 'purpose': return PURPOSE_LABELS[p.purpose as keyof typeof PURPOSE_LABELS] ?? ''
      case 'uploader': return p.user?.name ?? ''
      case 'planned': return p.amount ?? 0
      case 'actual': return p.actualAmount ?? p.lastSubmittedAmount ?? -1
      case 'usedAt': return new Date(p.plannedDate).getTime()
      case 'processedAt': return new Date(p.updatedAt).getTime()
      default: return 0
    }
  }

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null
    })
  }

  // 정렬 미지정 시: 검토가 필요한 건(검토 대기·재제출)을 리스트 맨 위로
  const NEEDS_REVIEW = ['UNDER_REVIEW', 'RESUBMIT_REQUIRED']
  const sortedPlans = [...filteredPlans].sort((a, b) => {
    if (!sort) return Number(NEEDS_REVIEW.includes(b.status)) - Number(NEEDS_REVIEW.includes(a.status))
    const va = sortValue(a, sort.key)
    const vb = sortValue(b, sort.key)
    const cmp = typeof va === 'string' ? va.localeCompare(String(vb), 'ko') : (va as number) - (vb as number)
    return sort.dir === 'asc' ? cmp : -cmp
  })
  const needsReviewCount = filteredPlans.filter((p) => NEEDS_REVIEW.includes(p.status)).length

  const currentFilterLabel = stats.find(s => s.status === filter)?.label

  const teamPlans = selectedTeamId ? allPlans.filter((p: Plan) => (p.teamId || p.user?.teamId) === selectedTeamId) : []
  const teamTotalUsed = teamPlans.reduce((acc: number, p: Plan) => acc + (p.status === 'APPROVED' ? (p.actualAmount ?? p.amount) : p.amount), 0)

  return (
    <div className="space-y-4">
      {/* 상태 필터 칩 */}
      <div className="flex flex-wrap gap-2">
        {stats.map((s) => {
          const active = filter === s.status
          return (
            <button
              key={s.status}
              type="button"
              onClick={() => setFilter(active ? null : s.status)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all ${
                active
                  ? `${s.bg} ${s.border} ${s.color} ring-1 ${s.ring} shadow-sm`
                  : 'bg-white/70 backdrop-blur-md border-white/70 text-gray-600 shadow-sm hover:border-gray-300 hover:-translate-y-px'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              {s.label}
              <span className={`text-base font-black tabular-nums ${s.color}`}>{s.value}</span>
            </button>
          )
        })}
      </div>

      {/* 팀 필터 칩 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSelectedTeamId(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
            !selectedTeamId
              ? 'bg-primary-500 border-primary-500 text-white shadow-md'
              : 'bg-white/70 backdrop-blur-md border-white/70 text-gray-600 shadow-sm hover:border-primary-100 hover:text-primary-500'
          }`}
        >
          전체 팀
        </button>
        {sortByTeamNumber(teams).map((team: Team) => {
          const tPlans = allPlans.filter((p: Plan) => (p.teamId || p.user?.teamId) === team.id)
          const hasPending = tPlans.some((p: Plan) => NEEDS_REVIEW.includes(p.status))
          const isSelected = selectedTeamId === team.id
          return (
            <button
              key={team.id}
              type="button"
              onClick={() => setSelectedTeamId(isSelected ? null : team.id)}
              title={`${team.leaderName} (${team.leaderAffiliation}) - ${team.researchTopic}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                isSelected
                  ? 'bg-primary-500 border-primary-500 text-white shadow-md'
                  : 'bg-white/70 backdrop-blur-md border-white/70 text-gray-700 shadow-sm hover:border-primary-100 hover:bg-primary-50/60'
              }`}
            >
              <span className={`font-black ${isSelected ? 'text-white/70' : 'text-primary-500'}`}>{team.teamNumber}</span>
              {team.leaderName}
              {hasPending && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            </button>
          )
        })}
      </div>

      {/* 선택된 팀 요약 + 예산 현황 */}
      {selectedTeam && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-lg font-black text-primary-500 shrink-0">{selectedTeam.teamNumber}</span>
              <span className="text-sm font-bold text-gray-900 shrink-0">{selectedTeam.leaderName}</span>
              <span className="text-xs text-gray-400 truncate">{selectedTeam.leaderAffiliation}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-primary-500 tabular-nums">
                {teamTotalUsed.toLocaleString()} / 2,000,000원
              </span>
              <span className="px-2 py-0.5 bg-primary-100 text-primary-500 rounded-full text-[10px] font-black tabular-nums">
                {Math.round((teamTotalUsed / 2000000) * 100)}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 p-5">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">구성원</p>
                <p className="text-xs text-gray-900 font-bold mt-0.5">
                  {selectedTeam.leaderName} (대표)
                  {selectedTeam.users?.length > 1 && (
                    <span className="text-gray-500 font-normal ml-1">외 {selectedTeam.users.length - 1}명</span>
                  )}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {selectedTeam.users?.filter((u: any) => u.name !== selectedTeam.leaderName).map((u: any) => u.name).join(', ')}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">연구 주제</p>
                <p className="text-xs text-gray-800 font-medium leading-snug mt-0.5" title={selectedTeam.researchTopic}>
                  {selectedTeam.researchTopic}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">항목별 예산 집행</p>
              {Object.keys(PURPOSE_LABELS).map(key => {
                const label = PURPOSE_LABELS[key as keyof typeof PURPOSE_LABELS]
                const used = teamPlans.filter((p: Plan) => p.purpose === key && p.status === 'APPROVED').reduce((acc: number, p: Plan) => acc + (p.actualAmount ?? p.amount), 0)
                const limit = selectedTeam.budgetLimits?.find((l: BudgetLimit) => l.purpose === key)?.amount || 0
                const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
                if (limit === 0 && used === 0) return null
                return (
                  <div key={key} className="flex items-center gap-3 py-0.5">
                    <span className="text-[11px] font-bold text-gray-700 w-24 shrink-0 truncate" title={label}>{label}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative shadow-inner">
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-out rounded-full ${percent >= 100 ? 'bg-red-500' : percent >= 80 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 w-28 text-right shrink-0 tabular-nums">
                      <span className="text-primary-500 font-bold">{used.toLocaleString()}</span> / {limit.toLocaleString()}
                    </span>
                  </div>
                )
              })}
              {Object.keys(PURPOSE_LABELS).every(key => {
                const used = teamPlans.filter((p: Plan) => p.purpose === key && p.status === 'APPROVED').reduce((acc: number, p: Plan) => acc + (p.actualAmount ?? p.amount), 0)
                const limit = selectedTeam.budgetLimits?.find((l: BudgetLimit) => l.purpose === key)?.amount || 0
                return limit === 0 && used === 0
              }) && (
                <p className="py-3 text-xs text-gray-400">설정된 예산 한도가 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 통합 계획서 리스트: 검토 필요 건이 맨 위 */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-700">
            {selectedTeam ? `${selectedTeam.teamNumber} 계획서` : '전체 계획서'}
            {filter ? ` (${currentFilterLabel})` : ''}
            <span className="ml-2 text-xs text-gray-400 font-normal tabular-nums">({filteredPlans.length}건)</span>
          </h2>
          {!filter && needsReviewCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              검토 필요 {needsReviewCount}건
            </span>
          )}
        </div>
        <div className={`hidden md:grid ${PLAN_GRID} gap-3 px-5 py-2 border-b border-gray-100 bg-gray-50/40 text-[11px] font-semibold text-gray-400`}>
          <SortHeader label="팀 / 대표자" sortKey="team" sort={sort} onToggle={toggleSort} />
          <SortHeader label="사용 항목" sortKey="purpose" sort={sort} onToggle={toggleSort} />
          <SortHeader label="제출자" sortKey="uploader" sort={sort} onToggle={toggleSort} />
          <SortHeader label="계획 금액" sortKey="planned" sort={sort} onToggle={toggleSort} align="right" />
          <SortHeader label="실제 금액" sortKey="actual" sort={sort} onToggle={toggleSort} align="right" />
          <SortHeader label="사용일" sortKey="usedAt" sort={sort} onToggle={toggleSort} />
          <SortHeader label="처리일" sortKey="processedAt" sort={sort} onToggle={toggleSort} />
          <span className="text-right">상태 / 작업</span>
        </div>
        <div className="divide-y divide-gray-100">
          {sortedPlans.length === 0 ? (
            <p className="px-5 py-12 text-center text-gray-400 text-sm">해당하는 계획서가 없습니다.</p>
          ) : (
            sortedPlans.map((plan: Plan) => <PlanRow key={plan.id} plan={plan} teams={teams} />)
          )}
        </div>
      </div>
    </div>
  )
}

function BudgetView({ teams, allPlans }: any) {
  const TEAM_BUDGET = 2000000 // 팀당 총 예산 200만 원
  const purposes = Object.keys(PURPOSE_LABELS) as Array<keyof typeof PURPOSE_LABELS>

  // Build per-team data
  const teamData = teams.map((team: Team) => {
    const teamPlans = allPlans.filter((p: Plan) => (p.teamId || p.user?.teamId) === team.id)

    const byPurpose: Record<string, { planned: number; actual: number; hasPlan: boolean }> = {}
    purposes.forEach(p => {
      const limit = team.budgetLimits?.find((l: BudgetLimit) => l.purpose === p)
      byPurpose[p] = { planned: limit ? limit.amount : 0, actual: 0, hasPlan: false }
    })

    teamPlans.forEach((plan: any) => {
      const p = plan.purpose as string
      if (byPurpose[p]) {
        byPurpose[p].hasPlan = true
        if (plan.status === 'APPROVED') {
          byPurpose[p].actual += (plan.actualAmount ?? plan.amount)
        }
      }
    })

    const totalPlanned = Object.values(byPurpose).reduce((s: number, v) => s + v.planned, 0)
    const totalActual = Object.values(byPurpose).reduce((s: number, v) => s + v.actual, 0)

    return { team, byPurpose, totalPlanned, totalActual }
  })

  // Grand totals
  const grandPlanned = teamData.reduce((s: number, t: any) => s + t.totalPlanned, 0)
  const grandActual = teamData.reduce((s: number, t: any) => s + t.totalActual, 0)
  const grandTotalBudget = teams.length * TEAM_BUDGET

  const pctColor = (rate: number) => {
    if (rate >= 90) return 'text-green-700 bg-green-50'
    if (rate >= 50) return 'text-blue-700 bg-blue-50'
    if (rate > 0) return 'text-yellow-700 bg-yellow-50'
    return 'text-gray-400'
  }

  const pct = (actual: number, planned: number) => {
    if (planned === 0) return '-'
    return `${Math.round((actual / planned) * 100)}%`
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">팀별 예산 현황</h2>
        <p className="text-xs text-gray-500 mt-0.5">계획 금액 / 실제 사용 금액 (승인 완료 건 기준) / 집행률 (팀당 예산 {TEAM_BUDGET.toLocaleString()}원 기준)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-[80px]">팀</th>
              {purposes.map(p => (
                <th key={p} className="text-right px-3 py-3 font-semibold text-gray-700 whitespace-nowrap min-w-[100px]">
                  {PURPOSE_LABELS[p]}
                </th>
              ))}
              <th className="text-right px-4 py-3 font-bold text-gray-900 whitespace-nowrap min-w-[110px] border-l border-gray-200">합계</th>
              <th className="text-center px-4 py-3 font-bold text-gray-900 whitespace-nowrap min-w-[70px]">집행률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {teamData.map((td: any) => {
              const rate = Math.round((td.totalActual / TEAM_BUDGET) * 100)
              return (
                <tr key={td.team.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white z-10">
                    {td.team.teamNumber}
                  </td>
                  {purposes.map(p => (
                    <td key={p} className="text-right px-3 py-3">
                      <div className="text-gray-700">{td.byPurpose[p].planned > 0 ? td.byPurpose[p].planned.toLocaleString() : '-'}</div>
                      {(td.byPurpose[p].actual > 0 || td.byPurpose[p].planned > 0 || td.byPurpose[p].hasPlan) && (
                        <div className="text-green-600 font-medium">{td.byPurpose[p].actual.toLocaleString()}</div>
                      )}
                    </td>
                  ))}
                  <td className="text-right px-4 py-3 border-l border-gray-100">
                    <div className="font-semibold text-gray-900">{td.totalPlanned.toLocaleString()}</div>
                    {(td.totalActual > 0 || td.totalPlanned > 0) && (
                      <div className="font-semibold text-green-600">{td.totalActual.toLocaleString()}</div>
                    )}
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${pctColor(rate)}`}>
                      {pct(td.totalActual, TEAM_BUDGET)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2 border-gray-300 font-semibold">
              <td className="px-4 py-3 text-gray-900 sticky left-0 bg-gray-50 z-10">전체 합계</td>
              {purposes.map(p => {
                const pPlanned = teamData.reduce((s: number, t: any) => s + t.byPurpose[p].planned, 0)
                const pActual = teamData.reduce((s: number, t: any) => s + t.byPurpose[p].actual, 0)
                const pHasPlan = teamData.some((t: any) => t.byPurpose[p].hasPlan)
                return (
                  <td key={p} className="text-right px-3 py-3">
                    <div className="text-gray-900">{pPlanned > 0 ? pPlanned.toLocaleString() : '-'}</div>
                    {(pActual > 0 || pPlanned > 0 || pHasPlan) && (
                      <div className="text-green-600">{pActual.toLocaleString()}</div>
                    )}
                  </td>
                )
              })}
              <td className="text-right px-4 py-3 border-l border-gray-200">
                <div className="text-gray-900">{grandPlanned.toLocaleString()}</div>
                {(grandActual > 0 || grandPlanned > 0) && (
                  <div className="text-green-600">{grandActual.toLocaleString()}</div>
                )}
              </td>
              <td className="text-center px-4 py-3">
                <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${pctColor(grandTotalBudget > 0 ? Math.round((grandActual / grandTotalBudget) * 100) : 0)}`}>
                  {pct(grandActual, grandTotalBudget)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
        <span>상단: 계획 금액</span>
        <span className="text-green-600 font-medium">하단: 실제 사용 금액</span>
        <span>단위: 원</span>
      </div>
    </div>
  )
}

function CalendarView({ allPlans, teams, milestones }: any) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'PENDING_EVIDENCE':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      case 'RESUBMIT_REQUIRED':
        return 'bg-red-100 text-red-800 border border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200'
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return '✅'
      case 'UNDER_REVIEW': return '🔍'
      case 'PENDING_EVIDENCE': return '📎'
      case 'RESUBMIT_REQUIRED': return '🔄'
      default: return ''
    }
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 tabular-nums">{format(currentDate, 'yyyy년 MM월')}</h2>
        <div className="inline-flex items-center rounded-lg border border-gray-200 shadow-sm overflow-hidden divide-x divide-gray-200">
          <button onClick={prevMonth} className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors" title="이전 달">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            오늘
          </button>
          <button onClick={nextMonth} className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors" title="다음 달">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div key={day} className="bg-gray-50 py-2 text-center text-xs font-semibold text-gray-500">
            {day}
          </div>
        ))}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white min-h-[100px] p-2 opacity-50"></div>
        ))}
        {days.map(day => {
          const dayPlans = allPlans.filter((p: any) => {
            const pd = new Date(p.plannedDate)
            return pd.getFullYear() === day.getFullYear() && pd.getMonth() === day.getMonth() && pd.getDate() === day.getDate()
          })
          const dayMilestones = milestones.filter((m: any) => {
            const md = new Date(m.date)
            return md.getFullYear() === day.getFullYear() && md.getMonth() === day.getMonth() && md.getDate() === day.getDate()
          })

          return (
            <div key={day.toISOString()} className={`bg-white min-h-[100px] p-2 border-t border-gray-100 ${isToday(day) ? 'bg-primary-50/40' : ''}`}>
              <div className="mb-1">
                <span
                  className={`inline-flex items-center justify-center text-xs font-medium tabular-nums ${
                    isToday(day)
                      ? 'w-5 h-5 rounded-full bg-primary-500 text-white font-bold shadow-sm'
                      : day.getDay() === 0 ? 'text-red-500' : day.getDay() === 6 ? 'text-blue-500' : 'text-gray-700'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-1">
                {dayMilestones.map((m: any) => (
                  <div key={m.id} className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200 truncate">
                    🚩 {m.name}
                  </div>
                ))}
                {dayPlans.map((plan: any) => {
                  const teamNumber = teams.find((t: any) => t.id === (plan.teamId || plan.user?.teamId))?.teamNumber || plan.user.name
                  return (
                    <Link key={plan.id} href={`/admin/plans/${plan.id}`} className={`block text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${getStatusStyle(plan.status)}`}>
                      {statusIcon(plan.status)} {teamNumber}: {PURPOSE_LABELS[plan.purpose as keyof typeof PURPOSE_LABELS]}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <span className="font-semibold text-gray-700">범례:</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></span>
            증빙 미제출
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-blue-100 border border-blue-200"></span>
            검토 대기
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-200"></span>
            재제출 필요
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-200"></span>
            승인 완료
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-indigo-100 border border-indigo-200"></span>
            주요 일정(발표 및 예산 마감일 등)
          </span>
        </div>
      </div>
    </div>
  )
}

function PlanRow({ plan, teams }: { plan: any; teams: any[] }) {
  const team = teams.find(t => t.id === (plan.teamId || plan.user?.teamId))
  const needsReview = plan.status === 'UNDER_REVIEW' || plan.status === 'RESUBMIT_REQUIRED'
  // 승인 전에는 제출된 실제 금액(lastSubmittedAmount), 승인 후에는 확정 실제 금액(actualAmount)
  const actual = plan.actualAmount ?? plan.lastSubmittedAmount ?? null
  const isConfirmed = plan.actualAmount !== null && plan.actualAmount !== undefined

  return (
    <div className={`relative px-5 py-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 md:grid ${PLAN_GRID} md:gap-3 text-sm transition-colors ${needsReview ? 'bg-red-50/30 hover:bg-red-50/50' : 'hover:bg-gray-50'}`}>
      {needsReview && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-400" aria-hidden="true" />}
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-xs font-black text-primary-500 shrink-0">{team?.teamNumber || '-'}</span>
        <span className="font-medium text-gray-900 truncate">{team?.leaderName || '알 수 없음'}</span>
      </div>
      <div className="text-gray-700 truncate">
        {PURPOSE_LABELS[plan.purpose as keyof typeof PURPOSE_LABELS]}
      </div>
      <div className="text-xs text-gray-500 truncate" title="업로드한 사용자">{plan.user?.name ?? '-'}</div>
      <div className="md:text-right tabular-nums text-gray-700">{plan.amount.toLocaleString()}원</div>
      <div className={`md:text-right tabular-nums ${actual !== null ? (isConfirmed ? 'text-blue-600 font-medium' : 'text-amber-600 font-medium') : 'text-gray-300'}`}>
        {actual !== null ? `${actual.toLocaleString()}원` : '–'}
      </div>
      <div className="text-xs text-gray-500 tabular-nums">{new Date(plan.plannedDate).toLocaleDateString('ko-KR')}</div>
      <div className="text-xs text-gray-400 tabular-nums" title="마지막 처리(상태 변경) 일자">
        {new Date(plan.updatedAt).toLocaleDateString('ko-KR')}
      </div>
      <div className="flex items-center gap-1.5 md:justify-end w-full md:w-auto">
        <PlanStatusBadge status={plan.status} />
        <a
          href={`/print/plans/${plan.id}?autoprint=1`}
          target="_blank"
          rel="noopener noreferrer"
          title="계획서 PDF 다운로드"
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 border border-gray-200 bg-white rounded-lg px-2 py-1.5 hover:bg-gray-50 hover:text-gray-700 hover:shadow-sm transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          PDF
        </a>
        <Link
          href={`/admin/plans/${plan.id}`}
          className={`inline-flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1.5 border transition-all hover:shadow-sm ${
            needsReview
              ? 'text-primary-500 border-primary-100 bg-primary-50/50 hover:bg-primary-50 hover:border-primary-500/30'
              : 'text-gray-500 border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-700'
          }`}
        >
          {needsReview ? '검토' : '상세'}
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>
    </div>
  )
}
