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

    if (!res.ok) {
      setLoading(false)
      setError(data.error ?? '오류가 발생했습니다.')
      return
    }

    // 성공 시에는 loading을 false로 돌리지 않고 바로 이동하여 버튼이 다시 활성화되는 것을 방지
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">새 예산 사용 계획서 작성</h1>
      </div>

      {/* 지출 가이드라인 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 shadow-sm">
        <h2 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          지출 항목별 가이드라인
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
              <span className="w-1 h-1 bg-amber-400 rounded-full"></span> 회의비
            </p>
            <p className="text-sm text-amber-800 ml-2">1인당 30,000원</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
              <span className="w-1 h-1 bg-amber-400 rounded-full"></span> 전문가활용비
            </p>
            <p className="text-sm text-amber-800 ml-2 leading-tight">
              최초 1시간 15만 원<br />
              이후 시간당 10만 원 추가<br />
              <span className="text-[11px] text-amber-600">(1일 최대 30만 원 상한)</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
              <span className="w-1 h-1 bg-amber-400 rounded-full"></span> 구매지출비
            </p>
            <p className="text-sm text-amber-800 ml-2 leading-tight">
              사무용품 등 소모품 가능<br />
              <span className="text-[11px] text-amber-600 leading-tight">
                * 비소모품(1년 이상 사용, 10만 원 이상) 불가
              </span>
            </p>
          </div>
        </div>
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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
                if (form.timeEnd && form.timeEnd <= e.target.value) set('timeEnd', '')
              }}
              disabled={loading}
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
              disabled={!form.timeStart || loading}
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
            placeholder="예: EEG 기반 ERP 연구의 설계 타당성을 제고하기 위해 기존 연구 계획을 수정·보완하고..."
            value={form.expenditureOverview}
            onChange={(e) => set('expenditureOverview', e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? '제출 중...' : '계획서 제출'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.back()} disabled={loading}>
            취소
          </button>
        </div>
      </form>
    </div>
  )
}

