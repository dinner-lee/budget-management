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
  const [view, setView] = useState<'TEAM' | 'LIST' | 'CALENDAR'>('LIST')

  const pending = allPlans.filter((p) => p.status === 'UNDER_REVIEW')
  const resubmit = allPlans.filter((p) => p.status === 'RESUBMIT_REQUIRED')
  const approved = allPlans.filter((p) => p.status === 'APPROVED')
  const inProgress = allPlans.filter((p) => p.status === 'PENDING_EVIDENCE')

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200">
        <button className={`px-4 py-2 text-sm font-medium border-b-2 ${view === 'LIST' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setView('LIST')}>
          리스트 View
        </button>
        <button className={`px-4 py-2 text-sm font-medium border-b-2 ${view === 'TEAM' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setView('TEAM')}>
          팀별 View
        </button>
        <button className={`px-4 py-2 text-sm font-medium border-b-2 ${view === 'CALENDAR' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setView('CALENDAR')}>
          캘린더 View
        </button>
      </div>

      {view === 'LIST' && (
        <ListView pending={pending} resubmit={resubmit} allPlans={allPlans} userCount={userCount} inProgress={inProgress} approved={approved} />
      )}
      
      {view === 'TEAM' && (
        <TeamView teams={teams} allPlans={allPlans} />
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
            allPlans.map((plan:any) => <PlanRow key={plan.id} plan={plan} />)
          )}
        </div>
      </div>
    </div>
  )
}

function TeamView({ teams, allPlans }: any) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        {teams.map((team:any) => {
          const teamPlans = allPlans.filter((p:any) => p.user.teamId === team.id)
          const totalUsed = teamPlans.reduce((acc:number, p:any) => acc + (p.status === 'APPROVED' ? (p.actualAmount ?? p.amount) : p.amount), 0)
          const pendingCount = teamPlans.filter((p:any) => p.status === 'UNDER_REVIEW' || p.status === 'RESUBMIT_REQUIRED').length
          
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
              {teams.find((t:any) => t.id === selectedTeamId)?.teamNumber} 상세 계획서
            </h2>
            <div className="divide-y divide-gray-100 border-t border-gray-100">
              {allPlans.filter((p:any) => p.user.teamId === selectedTeamId).map((plan:any) => (
                <PlanRow key={plan.id} plan={plan} />
              ))}
              {allPlans.filter((p:any) => p.user.teamId === selectedTeamId).length === 0 && (
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

function CalendarView({ allPlans, teams, milestones }: any) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))

  const isCardNeeded = (purpose: string) => {
    return ['MEETING_FEE', 'PURCHASE_FEE', 'SOFTWARE_FEE'].includes(purpose)
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
          const dayPlans = allPlans.filter((p:any) => {
            const pd = new Date(p.plannedDate)
            return pd.getFullYear() === day.getFullYear() && pd.getMonth() === day.getMonth() && pd.getDate() === day.getDate()
          })
          const dayMilestones = milestones.filter((m:any) => {
            const md = new Date(m.date)
            return md.getFullYear() === day.getFullYear() && md.getMonth() === day.getMonth() && md.getDate() === day.getDate()
          })

          return (
            <div key={day.toISOString()} className={`bg-white min-h-[100px] p-2 border-t border-gray-100 ${isToday(day) ? 'bg-blue-50/30' : ''}`}>
              <div className={`text-xs font-medium mb-1 ${day.getDay() === 0 ? 'text-red-500' : day.getDay() === 6 ? 'text-blue-500' : 'text-gray-700'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayMilestones.map((m:any) => (
                  <div key={m.id} className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200 truncate">
                    🚩 {m.name}
                  </div>
                ))}
                {dayPlans.map((plan:any) => {
                  const teamNumber = teams.find((t:any) => t.id === plan.user.teamId)?.teamNumber || plan.user.name
                  const cardNeeded = isCardNeeded(plan.purpose)
                  return (
                    <Link key={plan.id} href={`/admin/plans/${plan.id}`} className={`block text-[10px] px-1.5 py-0.5 rounded truncate ${cardNeeded ? 'bg-orange-100 text-orange-800 border border-orange-200 font-medium' : 'bg-gray-100 text-gray-700'}`}>
                      {cardNeeded && '💳'} {teamNumber}: {PURPOSE_LABELS[plan.purpose as keyof typeof PURPOSE_LABELS]}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PlanRow({ plan }: { plan: any }) {
  const submitted = plan.evidences.filter((e:any) => e.status === 'SUBMITTED').length
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
