'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PURPOSE_LABELS, EVIDENCE_REQUIREMENTS } from '@/lib/evidence-config'

const PURPOSES = Object.entries(PURPOSE_LABELS) as [keyof typeof PURPOSE_LABELS, string][]

// 06:00 ~ 23:00, 30분 간격
const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 23) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

export default function NewPlanPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    purpose: '',
    amount: '',
    plannedDate: '',
    timeStart: '',
    timeEnd: '',
    expenditureOverview: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [budgetStatus, setBudgetStatus] = useState<any>(null)

  useEffect(() => {
    fetch('/api/user/budget-status')
      .then(res => res.json())
      .then(data => setBudgetStatus(data))
  }, [])

  const selectedPurpose = form.purpose as keyof typeof EVIDENCE_REQUIREMENTS | ''
  const previewItems = selectedPurpose ? EVIDENCE_REQUIREMENTS[selectedPurpose] : []

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purpose: form.purpose,
        amount: Number(form.amount),
        plannedDate: form.plannedDate,
        plannedTime: form.timeStart
          ? form.timeEnd && form.timeEnd > form.timeStart
            ? `${form.timeStart}~${form.timeEnd}`
            : form.timeStart
          : null,
        expenditureOverview: form.expenditureOverview,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? '오류가 발생했습니다.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">새 예산 사용 계획서 작성</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          계획서를 제출하면 해당 목적에 맞는 증빙 항목이 생성됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* 사용 목적 */}
        <div>
          <label className="label" htmlFor="purpose">사용 목적 <span className="text-red-500">*</span></label>
          <select
            id="purpose"
            className="input"
            value={form.purpose}
            onChange={(e) => set('purpose', e.target.value)}
            required
          >
            <option value="">-- 목적 선택 --</option>
            {PURPOSES.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* 증빙 항목 미리보기 */}
        {previewItems.length > 0 && (
          <div className="bg-blue-50 rounded-md p-3">
            <p className="text-xs font-medium text-blue-700 mb-2">필요한 증빙 항목:</p>
            <ul className="space-y-0.5">
              {previewItems.map((item) => (
                <li key={item.key} className="text-xs text-blue-600">
                  • {item.label}
                  {item.hint && <span className="text-blue-400"> ({item.hint})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 예상 사용 금액 */}
        <div>
          <label className="label" htmlFor="amount">예상 사용 금액 (원) <span className="text-red-500">*</span></label>
          <input
            id="amount"
            type="number"
            className="input"
            placeholder="0"
            min="0"
            value={form.amount}
            onChange={(e) => set('amount', e.target.value)}
            required
          />
          {budgetStatus && form.purpose && form.amount && (
            <div className="mt-2 space-y-1">
              {budgetStatus.categoryLimits?.[form.purpose] !== undefined && (
                (budgetStatus.categoryUsage?.[form.purpose] || 0) + Number(form.amount) > budgetStatus.categoryLimits[form.purpose]
              ) && (
                <p className="text-sm text-red-600">
                  ⚠️ 설정하신 이 항목의 예산 금액({budgetStatus.categoryLimits[form.purpose].toLocaleString()}원)을 초과합니다. 항목별 예산 금액을 조정해 주세요.
                </p>
              )}
              {budgetStatus.totalUsed + Number(form.amount) > budgetStatus.totalBudget && (
                <p className="text-sm text-orange-600">
                  ⚠️ 총 예산({budgetStatus.totalBudget.toLocaleString()}원)을 초과하게 됩니다.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 사용 예정일 */}
        <div>
          <label className="label" htmlFor="plannedDate">사용 예정일 <span className="text-red-500">*</span></label>
          <input
            id="plannedDate"
            type="date"
            className="input"
            value={form.plannedDate}
            onChange={(e) => set('plannedDate', e.target.value)}
            required
          />
        </div>

        {/* 사용 시간 */}
        <div>
          <label className="label">사용 시간</label>
          <div className="flex items-center gap-2">
            <select
              className="input"
              value={form.timeStart}
              onChange={(e) => {
                set('timeStart', e.target.value)
                // 종료 시간이 시작보다 이르면 초기화
                if (form.timeEnd && form.timeEnd <= e.target.value) set('timeEnd', '')
              }}
            >
              <option value="">시작 시간</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="text-gray-400 text-sm shrink-0">~</span>
            <select
              className="input"
              value={form.timeEnd}
              onChange={(e) => set('timeEnd', e.target.value)}
              disabled={!form.timeStart}
            >
              <option value="">종료 시간 (선택)</option>
              {TIME_OPTIONS.filter((t) => t > form.timeStart).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 지출 개요 */}
        <div>
          <label className="label" htmlFor="expenditureOverview">
            지출 개요 <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-400 mb-1">지출할 내용을 간략히 입력하세요.</p>
          <textarea
            id="expenditureOverview"
            className="input"
            rows={4}
            placeholder="예: ○○ 연구 관련 전문가 자문 회의 참석자 3인, 식사비 포함"
            value={form.expenditureOverview}
            onChange={(e) => set('expenditureOverview', e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '제출 중...' : '계획서 제출'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
