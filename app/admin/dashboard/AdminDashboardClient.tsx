'use client'

import { useState } from 'react'
import { PURPOSE_LABELS } from '@/lib/evidence-config'
import { PlanStatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, parseISO
} from 'date-fns'

export default function AdminDashboardClient({
  allPlans, userCount, teams, milestones
}: {
  allPlans: any[]
  userCount: number
  teams: any[]
  milestones: any[]
}) {
  const [view, setView] = useState<'TEAM' | 'LIST' | 'CALENDAR' | 'BUDGET'>('LIST')

  const pending = allPlans.filter((p) => p.status === 'UNDER_REVIEW')
  const resubmit = allPlans.filter((p) => p.status === 'RESUBMIT_REQUIRED')
  const approved = allPlans.filter((p) => p.status === 'APPROVED')
  const inProgress = allPlans.filter((p) => p.status === 'PENDING_EVIDENCE')

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200">
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${view === 'LIST' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setView('LIST')}
          title="목록 보기"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          <span className="hidden sm:inline">목록 보기</span>
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${view === 'TEAM' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setView('TEAM')}
          title="팀별 보기"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <span className="hidden sm:inline">팀별 보기</span>
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${view === 'BUDGET' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setView('BUDGET')}
          title="예산 현황"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
          <span className="hidden sm:inline">예산 현황</span>
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${view === 'CALENDAR' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setView('CALENDAR')}
          title="캘린더 보기"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="hidden sm:inline">캘린더 보기</span>
        </button>
      </div>

      {view === 'LIST' && (
        <ListView pending={pending} resubmit={resubmit} allPlans={allPlans} userCount={userCount} inProgress={inProgress} approved={approved} />
      )}

      {view === 'TEAM' && (
        <TeamView teams={teams} allPlans={allPlans} />
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

function ListView({ pending, resubmit, allPlans, userCount, inProgress, approved }: any) {
  const stats = [
    { label: '검토 대기', value: pending.length, color: 'text-blue-600' },
    { label: '재제출 대기', value: resubmit.length, color: 'text-red-600' },
    { label: '증빙 작성 중', value: inProgress.length, color: 'text-yellow-600' },
    { label: '승인 완료', value: approved.length, color: 'text-green-600' },
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card px-4 py-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      {(pending.length > 0 || resubmit.length > 0) && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">검토 필요</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {[...pending, ...resubmit].map((plan) => (
              <PlanRow key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">전체 계획서 ({allPlans.length}건)</h2>
          <span className="text-xs text-gray-400">사용자 {userCount}명</span>
        </div>
        <div className="divide-y divide-gray-100">
          {allPlans.length === 0 ? (
            <p className="px-5 py-12 text-center text-gray-400 text-sm">계획서가 없습니다.</p>
          ) : (
            allPlans.map((plan: any) => <PlanRow key={plan.id} plan={plan} />)
          )}
        </div>
      </div>
    </div>
  )
}

function TeamView({ teams, allPlans }: any) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <div className="md:col-span-1 md:max-h-[calc(100vh-220px)] md:overflow-y-auto md:sticky md:top-6 space-y-3 pr-2 scrollbar-thin">
        {teams.map((team: any) => {
          const teamPlans = allPlans.filter((p: any) => p.user.teamId === team.id)
          const totalUsed = teamPlans.reduce((acc: number, p: any) => acc + (p.status === 'APPROVED' ? (p.actualAmount ?? p.amount) : p.amount), 0)
          const pendingCount = teamPlans.filter((p: any) => p.status === 'UNDER_REVIEW' || p.status === 'RESUBMIT_REQUIRED').length

          return (
            <div
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`card p-4 cursor-pointer hover:border-blue-300 transition-colors ${selectedTeamId === team.id ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-900">{team.teamNumber}</h3>
                {pendingCount > 0 && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">{pendingCount}건 검토 필요</span>}
              </div>
              <p className="text-sm text-gray-600 mt-1 truncate">{team.researchTopic}</p>
              <div className="mt-3 text-sm flex justify-between">
                <span className="text-gray-500">누적 사용액</span>
                <span className="font-semibold text-gray-900">{totalUsed.toLocaleString()}원</span>
              </div>
            </div>
          )
        })}
        {teams.length === 0 && <p className="text-sm text-gray-500 p-4">등록된 팀이 없습니다.</p>}
      </div>
      <div className="md:col-span-2">
        {selectedTeamId ? (
          <div className="card p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {teams.find((t: any) => t.id === selectedTeamId)?.teamNumber} 상세 계획서
            </h2>
            <div className="divide-y divide-gray-100 border-t border-gray-100">
              {allPlans.filter((p: any) => p.user.teamId === selectedTeamId).map((plan: any) => (
                <PlanRow key={plan.id} plan={plan} />
              ))}
              {allPlans.filter((p: any) => p.user.teamId === selectedTeamId).length === 0 && (
                <p className="py-8 text-center text-gray-500 text-sm">제출된 계획서가 없습니다.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="card p-8 flex items-center justify-center text-gray-400 text-sm h-full">
            왼쪽에서 팀을 선택하면 상세 정보가 표시됩니다.
          </div>
        )}
      </div>
    </div>
  )
}

function BudgetView({ teams, allPlans }: any) {
  const TEAM_BUDGET = 2000000 // 팀당 총 예산 200만 원
  const purposes = Object.keys(PURPOSE_LABELS) as Array<keyof typeof PURPOSE_LABELS>

  // Build per-team data
  const teamData = teams.map((team: any) => {
    const teamPlans = allPlans.filter((p: any) => p.user.teamId === team.id)

    const byPurpose: Record<string, { planned: number; actual: number }> = {}
    purposes.forEach(p => { byPurpose[p] = { planned: 0, actual: 0 } })

    teamPlans.forEach((plan: any) => {
      const p = plan.purpose as string
      if (byPurpose[p]) {
        byPurpose[p].planned += plan.amount
        if (plan.status === 'APPROVED') {
          byPurpose[p].actual += (plan.actualAmount ?? plan.amount)
        }
      }
    })

    const totalPlanned = Object.values(byPurpose).reduce((s: number, v: any) => s + v.planned, 0)
    const totalActual = Object.values(byPurpose).reduce((s: number, v: any) => s + v.actual, 0)

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
                  const teamNumber = teams.find((t: any) => t.id === plan.user.teamId)?.teamNumber || plan.user.name
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

function PlanRow({ plan }: { plan: any }) {
  const submitted = plan.evidences.filter((e: any) => e.status === 'SUBMITTED').length
  const total = plan.evidences.length

  return (
    <div className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900 truncate">{plan.title}</span>
          <PlanStatusBadge status={plan.status} />
        </div>
        <p className="text-xs text-gray-500">
          {plan.user.name} &middot;{' '}
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
      <Link href={`/admin/plans/${plan.id}`} className="ml-4 text-xs text-blue-600 hover:underline shrink-0">
        검토하기
      </Link>
    </div>
  )
}
