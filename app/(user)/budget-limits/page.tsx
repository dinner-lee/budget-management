'use client'

import { useState, useEffect } from 'react'
import { PURPOSE_LABELS } from '@/lib/evidence-config'

export default function BudgetLimitsPage() {
  const [limits, setLimits] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const TOTAL_BUDGET = 2000000

  useEffect(() => {
    fetch('/api/user/budget-limits')
      .then(res => res.json())
      .then(data => {
        if (data.limits) {
          const l: Record<string, number> = {}
          data.limits.forEach((limit: any) => {
            l[limit.purpose] = limit.amount
          })
          setLimits(l)
        }
        setLoading(false)
      })
  }, [])

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

  if (loading) return <div className="p-6 text-sm text-gray-500">로딩 중...</div>

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">항목별 예산 계획 설정</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          각 항목별로 예산 사용 금액을 설정하세요. 총합은 2,000,000원을 초과할 수 없습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700">총 예산 한도</span>
            <span className="font-bold text-gray-900">{TOTAL_BUDGET.toLocaleString()}원</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
            <span className="font-semibold text-gray-700">현재 계획 총액</span>
            <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}>
              {currentTotal.toLocaleString()}원
            </span>
          </div>
          {isOverBudget && (
            <p className="text-xs text-red-600 mt-2 text-right">⚠️ 총 예산 한도를 초과했습니다.</p>
          )}
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
                  className="input w-full pr-10 text-right"
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
          <div className={`p-3 rounded-md text-sm ${message.includes('오류') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
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
