'use client'

import { PURPOSE_LABELS } from '@/lib/evidence-config'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList
} from 'recharts'
import { differenceInDays, isAfter, isToday } from 'date-fns'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function DashboardClient({
  budgetStatus,
  milestones
}: {
  budgetStatus: any
  milestones: any[]
}) {
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
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#ef4444" /> {/* 사용 금액: Red */}
                    <Cell fill="#22c55e" /> {/* 잔액: Green */}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => `${Number(value).toLocaleString()}원`}
                    contentStyle={{ fontFamily: 'Pretendard', fontWeight: 400, borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'Pretendard', fontWeight: 800, fontSize: '12px' }} />
                </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full space-y-2 mt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">총 예산</span>
              <span className="font-semibold text-gray-900">{totalBudget.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-500">사용 금액</span>
              <span className="font-semibold text-red-600">{totalUsed.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-green-600 font-bold">잔액</span>
              <span className="font-bold text-green-700">{totalBalance.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 항목별 한도/사용액 (Bar Chart) */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-800 mb-4">항목별 예산 사용 현황</h2>
          {categoryData.length > 0 ? (
            <div className="w-full h-80">
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
                    tick={{ fontFamily: 'Pretendard', fontWeight: 400, fontSize: 12, fill: '#6b7280' }} 
                    tickFormatter={(value) => `${value / 10000}만`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value: any) => `${Number(value).toLocaleString()}원`} 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ fontFamily: 'Pretendard', fontWeight: 400, borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'Pretendard', fontWeight: 800, fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="사용금액" stackId="a" fill="#3b82f6" name="사용 금액">
                    <LabelList 
                      dataKey="사용금액" 
                      position="center" 
                      formatter={(v: any) => v > 0 ? `${v.toLocaleString()}` : ''} 
                      style={{ fill: '#fff', fontSize: 9, fontWeight: 700, pointerEvents: 'none' }} 
                    />
                  </Bar>
                  <Bar dataKey="잔액" stackId="a" fill="#e5e7eb" name="항목별 한도">
                    <LabelList 
                      dataKey="한도" 
                      position="top" 
                      formatter={(v: any) => v > 0 ? `${v.toLocaleString()}원` : ''} 
                      style={{ fill: '#111827', fontSize: 11, fontWeight: 900, pointerEvents: 'none' }} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-gray-400 text-sm">
              설정된 항목별 예산이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
