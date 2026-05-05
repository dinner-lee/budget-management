'use client'

import { useState } from 'react'
import { PURPOSE_LABELS } from '@/lib/evidence-config'
import { PlanStatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList
} from 'recharts'
import { differenceInDays, isAfter, isToday } from 'date-fns'

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
  return (
    <div className="space-y-6">
      <BudgetSummarySection budgetStatus={budgetStatus} milestones={milestones} />
      <PlanListSection plans={plans} activePlanCount={activePlanCount} />

      {/* Floating Action Button (FAB) for New Plan */}
      <div className="fixed bottom-8 right-8 z-40">
        {activePlanCount < 3 ? (
          <Link
            href="/plans/new"
            className="group flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl transition-all duration-300 ease-in-out h-14 w-14 hover:w-64 overflow-hidden"
          >
            <div className="flex items-center justify-center min-w-[3.5rem]">
              {/* Document with Plus Icon */}
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="whitespace-nowrap pr-6 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              새로운 예산 사용 계획서 작성
            </span>
          </Link>
        ) : (
          <div 
            className="flex items-center justify-center bg-gray-400 text-white rounded-full shadow-xl h-14 w-14 cursor-not-allowed"
            title="증빙 미완료 3건 초과로 작성이 제한됩니다"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

function BudgetSummarySection({ budgetStatus, milestones }: { budgetStatus: any, milestones: any[] }) {
  const { totalBudget, totalUsed, totalBalance, categoryLimits, categoryUsage } = budgetStatus

  const categoryData = Object.keys(categoryLimits).map(key => ({
    name: PURPOSE_LABELS[key as keyof typeof PURPOSE_LABELS] || key,
    한도: categoryLimits[key],
    사용금액: categoryUsage[key] || 0,
    잔액: Math.max(0, categoryLimits[key] - (categoryUsage[key] || 0))
  }))

  const pieData = [
    { name: '사용 금액', value: totalUsed },
    { name: '잔액', value: totalBalance > 0 ? totalBalance : 0 }
  ]

  const upcomingMilestones = milestones
    .filter(m => isAfter(new Date(m.date), new Date()) || isToday(new Date(m.date)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div className="space-y-6">
      {/* 주요 일정 (Milestones) */}
      {upcomingMilestones.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4">주요 일정</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {upcomingMilestones.map(m => {
              const dDay = differenceInDays(new Date(m.date), new Date())
              return (
                <div key={m.id} className="border border-indigo-100 bg-indigo-50/50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">{m.name}</p>
                    <p className="text-xs text-indigo-700 mt-1">{new Date(m.date).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <div className="text-xl font-black text-indigo-600">
                    {dDay === 0 ? 'D-Day' : `D-${dDay}`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 예산 사용 현황 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 전체 요약 (Pie Chart) */}
        <div className="card p-5 flex flex-col justify-center items-center">
          <h2 className="text-sm font-bold text-gray-800 mb-2 self-start">전체 예산 사용 현황</h2>
          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                  <Legend 
                    formatter={(value: any) => <span style={{ color: '#000', fontWeight: 500 }}>{value}</span>}
                    wrapperStyle={{ fontFamily: 'Pretendard', fontSize: '11px' }} 
                  />
                </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full space-y-1.5 mt-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">총 예산</span>
              <span className="font-semibold text-gray-900">{totalBudget.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">사용 금액</span>
              <span className="font-semibold text-red-600">{totalUsed.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-gray-100">
              <span className="text-green-600 font-bold">잔액</span>
              <span className="font-bold text-green-700">{totalBalance.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 항목별 한도/사용액 (Bar Chart) */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-800 mb-4">항목별 예산 사용 현황</h2>
          {categoryData.length > 0 ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontFamily: 'Pretendard', fontWeight: 600, fontSize: 12, fill: '#000' }} 
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontFamily: 'Pretendard', fontWeight: 400, fontSize: 11, fill: '#6b7280' }} 
                    tickFormatter={(value) => `${value / 10000}만`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Legend 
                    formatter={(value: any) => <span style={{ color: '#000', fontWeight: 500 }}>{value}</span>}
                    wrapperStyle={{ fontFamily: 'Pretendard', fontSize: '11px', paddingTop: '5px' }} 
                  />
                  <Bar dataKey="사용금액" stackId="a" fill="#3b82f6" name="사용 금액" isAnimationActive={false}>
                    <LabelList 
                      dataKey="사용금액" 
                      position="center" 
                      formatter={(v: any) => v > 0 ? `${v.toLocaleString()}` : ''} 
                      style={{ fill: '#fff', fontSize: 9, fontWeight: 700, pointerEvents: 'none' }} 
                    />
                  </Bar>
                  <Bar dataKey="잔액" stackId="a" fill="#e5e7eb" name="항목별 한도" isAnimationActive={false}>
                    <LabelList 
                      dataKey="한도" 
                      position="top" 
                      formatter={(v: any) => v > 0 ? `${v.toLocaleString()}원` : ''} 
                      style={{ fill: '#111827', fontSize: 10, fontWeight: 900, pointerEvents: 'none' }} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              설정된 항목별 예산이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PlanListSection({ plans, activePlanCount }: { plans: any[], activePlanCount: number }) {
  const [purposeFilter, setPurposeFilter] = useState<string>('ALL')
  
  const filteredPlans = purposeFilter === 'ALL' 
    ? plans 
    : plans.filter(p => p.purpose === purposeFilter)

  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-gray-700">예산 사용 계획서 내역</h2>
          {activePlanCount >= 3 && (
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                작성 제한
              </span>
              <span className="text-[9px] text-gray-400 mt-0.5">증빙 미완료 3건</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">사용 목적:</span>
          <select 
            value={purposeFilter} 
            onChange={(e) => setPurposeFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-500 bg-white"
          >
            <option value="ALL">전체 보기</option>
            {Object.entries(PURPOSE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <div className="px-5 py-12 text-center text-gray-400 text-sm">
          {purposeFilter === 'ALL' ? '작성한 계획서가 없습니다.' : '해당 목적의 계획서가 없습니다.'}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredPlans.map((plan) => {
            const submitted = plan.evidences.filter((e: any) => e.status !== 'PENDING').length
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
                    {(plan.actualAmount ?? plan.amount).toLocaleString()}원 &middot;{' '}
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
  )
}

