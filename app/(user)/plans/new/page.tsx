'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PURPOSE_LABELS, EVIDENCE_REQUIREMENTS } from '@/lib/evidence-config'

const PURPOSES = Object.entries(PURPOSE_LABELS) as [keyof typeof PURPOSE_LABELS, string][]

const ALL_TIME_OPTIONS: string[] = []
for (let h = 9; h <= 21; h++) {
  ALL_TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 21) ALL_TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

function getTimeOptions(purpose: string) {
  if (!purpose) return []
  
  // 회의비, 전문가, 참여자, 기타: 09:00~12:00, 13:00~21:00
  // 구매지출비, 소프트웨어: 09:00~12:00, 13:00~18:00
  const isPurchaseOrSoftware = purpose === 'PURCHASE_FEE' || purpose === 'SOFTWARE_FEE'
  const maxHour = isPurchaseOrSoftware ? 18 : 21
  
  return ALL_TIME_OPTIONS.filter(t => {
    const [h, m] = t.split(':').map(Number)
    if (h >= 12 && h < 13) return false // 12:00~13:00 제외
    if (h > maxHour || (h === maxHour && m > 0)) return false
    return true
  })
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
    repeatMonths: '1',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [budgetStatus, setBudgetStatus] = useState<any>(null)
  const [conflictInfo, setConflictInfo] = useState<any>(null)

  useEffect(() => {
    fetch('/api/user/budget-status')
      .then(res => res.json())
      .then(data => setBudgetStatus(data))
  }, [])

  const selectedPurpose = form.purpose as keyof typeof EVIDENCE_REQUIREMENTS | ''
  const previewItems = selectedPurpose ? EVIDENCE_REQUIREMENTS[selectedPurpose] : []
  const timeOptions = getTimeOptions(form.purpose)

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'purpose') {
      setForm(prev => ({ ...prev, timeStart: '', timeEnd: '' }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setConflictInfo(null)
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
        repeatMonths: form.purpose === 'SOFTWARE_FEE' ? Number(form.repeatMonths) : 1,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setLoading(false)
      if (res.status === 409 && data.conflicts) {
        setConflictInfo(data)
      } else {
        setError(data.error ?? '오류가 발생했습니다.')
      }
      return
    }

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
            <p className="text-sm text-amber-800 ml-2">1인당 30,000원 이하</p>
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

        {/* 반복 결제 설정 (소프트웨어 구독료 전용) */}
        {form.purpose === 'SOFTWARE_FEE' && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
            <label className="block text-sm font-bold text-indigo-900 mb-2" htmlFor="repeatMonths">
              반복 결제 기간 설정 (월 단위)
            </label>
            <div className="flex items-center gap-3">
              <select
                id="repeatMonths"
                className="input bg-white border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500"
                value={form.repeatMonths}
                onChange={(e) => set('repeatMonths', e.target.value)}
                disabled={loading}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <option key={m} value={m}>{m}개월</option>
                ))}
              </select>
              <p className="text-xs text-indigo-700 leading-tight">
                * 매달 지정된 날짜에 '영수증' 증빙을 위한 버튼이 자동으로 활성화됩니다.<br/>
                * 견적서/타견적서는 최초 1회만 제출하면 됩니다.
              </p>
            </div>
          </div>
        )}

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
          <label className="label" htmlFor="amount">
            {form.purpose === 'SOFTWARE_FEE' && Number(form.repeatMonths) > 1 ? '매달 예상 결제 금액 (원)' : '예상 사용 금액 (원)'}
            <span className="text-red-500"> *</span>
          </label>
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
          <label className="label" htmlFor="plannedDate">
            {form.purpose === 'SOFTWARE_FEE' && Number(form.repeatMonths) > 1 ? '최초 결제 예정일' : '사용 예정일'}
            <span className="text-red-500"> *</span>
          </label>
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
          <label className="label">사용 시간 (30분 단위)</label>
          {form.purpose ? (
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
                {timeOptions.map((t) => (
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
                {timeOptions.filter((t) => t > form.timeStart).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded p-3 text-center">
              사용 목적을 먼저 선택하면 사용 가능한 시간대가 표시됩니다.
            </p>
          )}
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
          <button type="submit" className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2" disabled={loading}>
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? '제출 중...' : '계획서 제출'}
          </button>
          <button type="button" className="btn-secondary px-6" onClick={() => router.back()} disabled={loading}>
            취소
          </button>
        </div>
      </form>

      {/* 카드 대여 중복 안내 팝업 */}
      {conflictInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 rounded-full">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold">카드 대여 예약 중복</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              선택하신 시간대에 이미 <strong>2팀</strong>의 카드 대여 예약이 완료되어 있어 추가 신청이 불가능합니다. 아래 기존 예약을 참고하여 다른 날짜나 시간대를 선택해 주세요.
            </p>

            <div className="space-y-3 mb-6">
              {conflictInfo.conflicts.map((c: any, i: number) => (
                <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-900">{c.teamNumber}팀</span>
                    <span className="text-[11px] font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                      {PURPOSE_LABELS[c.purpose as keyof typeof PURPOSE_LABELS]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{c.time}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setConflictInfo(null)}
              className="w-full btn-primary py-3"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

