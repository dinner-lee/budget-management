'use client'

import { useState } from 'react'
import { PURPOSE_LABELS } from '@/lib/evidence-config'
import { PlanStatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
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
      <div className="flex border-b border-gray-200">
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${view === 'DASHBOARD' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setView('DASHBOARD')}
          title="대시보드"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          <span className="hidden sm:inline">팀별</span>
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${view === 'BUDGET' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setView('BUDGET')}
          title="예산 현황"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          <span className="hidden sm:inline">전체</span>
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${view === 'CALENDAR' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setView('CALENDAR')}
          title="캘린더 보기"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="hidden sm:inline">캘린더</span>
        </button>
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
    { label: '검토 대기', value: pending.length, color: 'text-primary-500', bg: 'bg-primary-50', border: 'border-primary-100', status: 'UNDER_REVIEW' },
    { label: '재제출 대기', value: resubmit.length, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', status: 'RESUBMIT_REQUIRED' },
    { label: '증빙 작성 중', value: inProgress.length, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', status: 'PENDING_EVIDENCE' },
    { label: '승인 완료', value: approved.length, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', status: 'APPROVED' },
  ]

  const selectedTeam = teams.find((t: any) => t.id === selectedTeamId)

  const filteredPlans = allPlans.filter((plan: any) => {
    const matchesStatus = !filter || plan.status === filter
    const matchesTeam = !selectedTeamId || (plan.teamId || plan.user?.teamId) === selectedTeamId
    return matchesStatus && matchesTeam
  })

  const currentFilterLabel = stats.find(s => s.status === filter)?.label

  // Calculate team summary data if team selected
  const teamPlans = selectedTeamId ? allPlans.filter((p: Plan) => (p.teamId || p.user?.teamId) === selectedTeamId) : []
  const teamTotalUsed = teamPlans.reduce((acc: number, p: Plan) => acc + (p.status === 'APPROVED' ? (p.actualAmount ?? p.amount) : p.amount), 0)

  return (
    <div className="space-y-6">
      {/* Status Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            onClick={() => setFilter(filter === s.status ? null : s.status)}
            className={`card px-4 py-4 text-center cursor-pointer transition-all hover:shadow-md ${filter === s.status ? `${s.bg} ${s.border} ring-1 ring-offset-0 ${s.color.replace('text', 'ring')}` : 'hover:border-gray-300'
              }`}
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Team Filter and Metadata */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-sm font-semibold text-gray-700">팀 필터</h2>
              {selectedTeamId && (
                <button
                  onClick={() => setSelectedTeamId(null)}
                  className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 text-gray-500 rounded hover:bg-gray-100 transition-colors shadow-sm"
                >
                  초기화
                </button>
              )}
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 mb-2">
                {teams.map((team: Team) => {
                  const teamPlans = allPlans.filter((p: Plan) => (p.teamId || p.user?.teamId) === team.id)
                  const hasPending = teamPlans.some((p: Plan) => p.status === 'UNDER_REVIEW' || p.status === 'RESUBMIT_REQUIRED')
                  const isSelected = selectedTeamId === team.id

                  return (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(isSelected ? null : team.id)}
                      className={`relative p-3 rounded-lg transition-all border text-left min-h-[52px] flex items-center ${isSelected
                        ? 'bg-primary-500 border-primary-500 text-white shadow-md z-10'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary-200 hover:bg-primary-50'
                        }`}
                      title={`${team.leaderName} (${team.leaderAffiliation}) - ${team.researchTopic}`}
                    >
                      <div className="flex items-baseline flex-wrap gap-x-1.5 w-full pr-4">
                        <span className={`text-sm font-black shrink-0 ${isSelected ? 'text-white/80' : 'text-primary-500'}`}>
                          {team.teamNumber}
                        </span>
                        <span className="text-sm font-bold truncate max-w-[80px]">
                          {team.leaderName}
                        </span>
                        <span className={`text-[11px] font-normal truncate max-w-[120px] ${isSelected ? 'text-blue-100/80' : 'text-gray-400'}`}>
                          {team.leaderAffiliation.split(' ').pop()}
                        </span>
                      </div>
                      {hasPending && !isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm animate-pulse"></span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedTeam && (
              <div className="p-4 border-t border-gray-100 bg-blue-50/20">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">구성원</p>
                      <p className="text-xs text-gray-900 font-bold">
                        {selectedTeam.leaderName} (대표)
                        {selectedTeam.users?.length > 1 && (
                          <span className="text-gray-500 font-normal ml-1">
                            외 {selectedTeam.users.length - 1}명
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {selectedTeam.users?.filter((u: any) => u.name !== selectedTeam.leaderName).map((u: any) => u.name).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">연구 주제</p>
                      <p className="text-xs text-gray-800 font-medium leading-snug line-clamp-2" title={selectedTeam.researchTopic}>
                        {selectedTeam.researchTopic}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-primary-100/50 flex justify-between items-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">지출액</p>
                    <p className="text-base font-black text-primary-500">{teamTotalUsed.toLocaleString()}원</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Charts and Plans List */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTeam && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-700">팀 예산 현황 ({selectedTeam.teamNumber})</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary-500">
                    {teamTotalUsed.toLocaleString()} / 2,000,000원
                  </span>
                  <span className="px-2 py-0.5 bg-primary-100 text-primary-500 rounded-full text-[10px] font-black">
                    {Math.round((teamTotalUsed / 2000000) * 100)}%
                  </span>
                </div>
              </div>
              <div className="p-4 pt-2 space-y-1">
                {Object.keys(PURPOSE_LABELS).map(key => {
                  const label = PURPOSE_LABELS[key as keyof typeof PURPOSE_LABELS]
                  const used = teamPlans.filter((p: Plan) => p.purpose === key && p.status === 'APPROVED').reduce((acc: number, p: Plan) => acc + (p.actualAmount ?? p.amount), 0)
                  const limit = selectedTeam.budgetLimits?.find((l: BudgetLimit) => l.purpose === key)?.amount || 0
                  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0

                  if (limit === 0 && used === 0) return null

                  return (
                    <div key={key} className="flex items-center gap-4 py-0.5 border-b border-gray-50/50 last:border-0">
                      <span className="text-[11px] font-bold text-gray-700 w-24 shrink-0 truncate" title={label}>{label}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative shadow-inner">
                        <div
                          className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-out rounded-full ${percent >= 100 ? 'bg-red-500' : percent >= 80 ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-gray-500 w-32 text-right shrink-0">
                        <span className="text-primary-500 font-bold">{used.toLocaleString()}</span> / {limit.toLocaleString()} <span className="text-[9px] text-gray-400">({percent}%)</span>
                      </span>
                    </div>
                  )
                })}
                {Object.keys(PURPOSE_LABELS).every(key => {
                  const used = teamPlans.filter((p: Plan) => p.purpose === key && p.status === 'APPROVED').reduce((acc: number, p: Plan) => acc + (p.actualAmount ?? p.amount), 0)
                  const limit = selectedTeam.budgetLimits?.find((l: BudgetLimit) => l.purpose === key)?.amount || 0
                  return limit === 0 && used === 0
                }) && (
                    <p className="text-center py-4 text-xs text-gray-400">설정된 예산 한도가 없습니다.</p>
                  )}
              </div>
            </div>
          )}

          {!filter && (pending.length > 0 || resubmit.length > 0) && !selectedTeamId && (
            <div className="card border-l-4 border-l-red-400 mb-6">
              <div className="px-5 py-3 border-b border-gray-100 bg-red-50/30">
                <h2 className="text-sm font-bold text-red-800">검토 필요 항목 ({pending.length + resubmit.length}건)</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {[...pending, ...resubmit].map((plan) => (
                  <PlanRow key={plan.id} plan={plan} teams={teams} />
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-sm font-semibold text-gray-700">
                {selectedTeam ? `${selectedTeam.teamNumber} 계획서` : '전체 계획서'}
                {filter ? ` (${currentFilterLabel})` : ''}
                <span className="ml-2 text-xs text-gray-400 font-normal">({filteredPlans.length}건)</span>
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredPlans.length === 0 ? (
                <p className="px-5 py-12 text-center text-gray-400 text-sm">해당하는 계획서가 없습니다.</p>
              ) : (
                filteredPlans.map((plan: Plan) => <PlanRow key={plan.id} plan={plan} teams={teams} />)
              )}
            </div>
          </div>
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

    const byPurpose: Record<string, { planned: number; actual: number }> = {}
    purposes.forEach(p => {
      const limit = team.budgetLimits?.find((l: BudgetLimit) => l.purpose === p)
      byPurpose[p] = { planned: limit ? limit.amount : 0, actual: 0 }
    })

    teamPlans.forEach((plan: any) => {
      const p = plan.purpose as string
      if (byPurpose[p]) {
        // 계획 금액(planned)은 이제 팀 설정 한도값을 사용하므로 여기서는 더하지 않음
        if (plan.status === 'APPROVED') {
          byPurpose[p].actual += (plan.actualAmount ?? plan.amount)
        }
      }
    })

    const totalPlanned = Object.values(byPurpose).reduce((s: number, v: { planned: number; actual: number }) => s + v.planned, 0)
    const totalActual = Object.values(byPurpose).reduce((s: number, v: { planned: number; actual: number }) => s + v.actual, 0)

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
        <table className="w-full text-xs">
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
                      {td.byPurpose[p].actual > 0 && (
                        <div className="text-green-600 font-medium">{td.byPurpose[p].actual.toLocaleString()}</div>
                      )}
                    </td>
                  ))}
                  <td className="text-right px-4 py-3 border-l border-gray-100">
                    <div className="font-semibold text-gray-900">{td.totalPlanned.toLocaleString()}</div>
                    {td.totalActual > 0 && (
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
                return (
                  <td key={p} className="text-right px-3 py-3">
                    <div className="text-gray-900">{pPlanned > 0 ? pPlanned.toLocaleString() : '-'}</div>
                    {pActual > 0 && (
                      <div className="text-green-600">{pActual.toLocaleString()}</div>
                    )}
                  </td>
                )
              })}
              <td className="text-right px-4 py-3 border-l border-gray-200">
                <div className="text-gray-900">{grandPlanned.toLocaleString()}</div>
                {grandActual > 0 && (
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
        <h2 className="text-xl font-bold text-gray-900">{format(currentDate, 'yyyy년 MM월')}</h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="btn-secondary px-3 py-1">&lt; 이전</button>
          <button onClick={() => setCurrentDate(new Date())} className="btn-secondary px-3 py-1">오늘</button>
          <button onClick={nextMonth} className="btn-secondary px-3 py-1">다음 &gt;</button>
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
            <div key={day.toISOString()} className={`bg-white min-h-[100px] p-2 border-t border-gray-100 ${isToday(day) ? 'bg-blue-50/30' : ''}`}>
              <div className={`text-xs font-medium mb-1 ${day.getDay() === 0 ? 'text-red-500' : day.getDay() === 6 ? 'text-blue-500' : 'text-gray-700'}`}>
                {format(day, 'd')}
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
  const submitted = plan.evidences.filter((e: any) => e.status === 'SUBMITTED').length
  const total = plan.evidences.length
  const team = teams.find(t => t.id === (plan.teamId || plan.user?.teamId))

  return (
    <div className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
            {team?.teamNumber || '알 수 없음'}
          </span>
          <span className="text-sm font-medium text-gray-900 truncate">{plan.title}</span>
          <PlanStatusBadge status={plan.status} />
        </div>
        <p className="text-xs text-gray-500">
          {plan.user.name} &middot;{' '}
          {PURPOSE_LABELS[plan.purpose as keyof typeof PURPOSE_LABELS]} &middot;{' '}
          {(plan.actualAmount ?? plan.amount).toLocaleString()}원 &middot;{' '}
          {new Date(plan.plannedDate).toLocaleDateString('ko-KR')}
        </p>
        {plan.status !== 'APPROVED' && total > 0 && (
          <p className="text-xs text-gray-400 mt-0.5">
            증빙 {submitted}/{total}개 제출
          </p>
        )}
      </div>
      <Link href={`/admin/plans/${plan.id}`} className="ml-4 text-xs text-primary-500 hover:underline shrink-0">
        검토하기
      </Link>
    </div>
  )
}
