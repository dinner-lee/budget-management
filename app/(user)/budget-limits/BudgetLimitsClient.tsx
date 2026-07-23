'use client'

import { useState } from 'react'
import { PURPOSE_LABELS } from '@/lib/evidence-config'

interface BudgetLimit {
  purpose: string
  amount: number
}

export default function BudgetLimitsClient({ initialLimits }: { initialLimits: BudgetLimit[] }) {
  const TOTAL_BUDGET = 2000000

  const initialMap: Record<string, number> = {}
  initialLimits.forEach((limit) => {
    initialMap[limit.purpose] = limit.amount
  })

  const [limits, setLimits] = useState<Record<string, number>>(initialMap)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleAmountChange = (purpose: string, value: string) => {
    const val = parseInt(value, 10) || 0
    setLimits(prev => ({ ...prev, [purpose]: val }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const res = await fetch('/api/user/budget-limits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limits })
    })

    setSaving(false)
    if (res.ok) {
      setMessage('항목별 예산 계획이 성공적으로 저장되었습니다.')
    } else {
      const data = await res.json()
      setMessage(data.error || '오류가 발생했습니다.')
    }
  }

  const currentTotal = Object.values(limits).reduce((acc, val) => acc + val, 0)
  const isOverBudget = currentTotal > TOTAL_BUDGET

  return (
    <div className="max-w-2xl">
      <div className="mb-5">
        <h1 className="font-nexon flex items-center gap-2 text-base font-bold text-gray-800 tracking-tight">
          <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
          항목별 예산 계획 설정
        </h1>
        <p className="text-sm text-gray-500 mt-1 pl-7">
          각 항목별로 예산 사용 금액을 설정하세요. 총합은 2,000,000원을 초과할 수 없습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">총 예산 한도</p>
            <p className="mt-1 text-xl font-black tracking-tight tabular-nums text-gray-900">
              {TOTAL_BUDGET.toLocaleString()}<span className="text-sm font-semibold text-gray-400 ml-0.5">원</span>
            </p>
          </div>
          <div className={`rounded-xl border p-4 ${isOverBudget ? 'border-red-200 bg-red-50/60' : 'border-primary-100 bg-primary-50/50'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">현재 계획 총액</p>
            <p className={`mt-1 text-xl font-black tracking-tight tabular-nums ${isOverBudget ? 'text-red-600' : 'text-primary-500'}`}>
              {currentTotal.toLocaleString()}<span className="text-sm font-semibold text-gray-400 ml-0.5">원</span>
            </p>
          </div>
        </div>

        <div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${isOverBudget ? 'bg-red-500' : 'bg-primary-500'}`}
              style={{ width: `${Math.min(100, Math.round((currentTotal / TOTAL_BUDGET) * 100))}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[11px] text-gray-400 tabular-nums">
            <span>{Math.round((currentTotal / TOTAL_BUDGET) * 100)}% 계획됨</span>
            {isOverBudget ? (
              <span className="text-red-600 font-semibold">총 예산 한도 초과</span>
            ) : (
              <span>잔여 {Math.max(0, TOTAL_BUDGET - currentTotal).toLocaleString()}원</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(PURPOSE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <label className="text-sm font-medium text-gray-700 w-1/3 shrink-0">
                {label}
              </label>
              <div className="relative flex-1">
                <input
                  type="number"
                  min="0"
                  className="input w-full pr-10 text-right tabular-nums"
                  value={limits[key] || ''}
                  onChange={(e) => handleAmountChange(key, e.target.value)}
                  placeholder="0"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-500 pointer-events-none">
                  원
                </span>
              </div>
            </div>
          ))}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes('오류') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="pt-2">
          <button type="submit" className="btn-primary w-full" disabled={saving || isOverBudget}>
            {saving ? '저장 중...' : '계획 저장하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
