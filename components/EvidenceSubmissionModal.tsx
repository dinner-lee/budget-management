'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PURPOSE_LABELS } from '@/lib/evidence-config'

interface EvidenceItem {
  id: string
  label: string
  required: boolean
  hint?: string | null
  status?: string
  resubmitNote?: string | null
}

interface PlanData {
  id: string
  title: string
  amount: number
  actualAmount: number | null
  plannedDate: string
  plannedTime: string | null
  purpose: string
  expenditureOverview: string | null
  status: string
  evidences: EvidenceItem[]
}

export default function EvidenceSubmissionModal({
  isOpen,
  onClose,
  planId
}: {
  isOpen: boolean
  onClose: () => void
  planId: string | null
}) {
  const router = useRouter()
  const [plan, setPlan] = useState<PlanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  // Form states
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [actualAmountRaw, setActualAmountRaw] = useState('')
  const [amountTouched, setAmountTouched] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (isOpen && planId) {
      fetchPlan()
    } else {
      // Reset state when closing
      setPlan(null)
      setLoading(true)
      setError('')
      setCheckedItems(new Set())
      setActualAmountRaw('')
      setAmountTouched(false)
      setShowConfirm(false)
    }
  }, [isOpen, planId])

  async function fetchPlan() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/plans/${planId}`)
      if (!res.ok) throw new Error('데이터를 불러오는데 실패했습니다.')
      const data = await res.json()
      setPlan(data)
      setActualAmountRaw(data.amount.toString())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAmountChange = (value: string) => {
    setActualAmountRaw(value)
    setAmountTouched(true)
  }

  const handleToggle = (id: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(id)) {
      newChecked.delete(id)
    } else {
      newChecked.add(id)
    }
    setCheckedItems(newChecked)
  }

  const openNasPopup = () => {
    window.open(
      'https://lsri-admin.tw4.quickconnect.to/sharing/lPkoPufAv',
      'nasUploadPopup',
      'width=800,height=800,left=200,top=100'
    )
  }

  async function doSubmit() {
    setShowConfirm(false)
    setError('')
    setSubmitting(true)

    const actualAmount = parseInt(actualAmountRaw, 10)

    try {
      const res = await fetch(`/api/plans/${planId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualAmount: isNaN(actualAmount) ? null : actualAmount })
      })
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error ?? '오류가 발생했습니다.')
        return
      }

      onClose()
      router.refresh()
    } catch (err) {
      setError('제출 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmit() {
    if (!plan) return

    const requiredEvidences = plan.evidences.filter(e => e.required)
    const allRequiredChecked = requiredEvidences.every(e => checkedItems.has(e.id))

    if (!allRequiredChecked) {
      setError('모든 필수 증빙 파일에 대해 업로드 확인을 체크해주세요.')
      return
    }

    const actualAmount = parseInt(actualAmountRaw, 10)
    if (isNaN(actualAmount) || actualAmount < 0) {
      setError('유효한 실제 지출 금액을 입력해주세요.')
      return
    }

    // 금액을 수정하지 않았다면 확인 팝업 표시
    if (!amountTouched || actualAmount === plan.amount) {
      setShowConfirm(true)
      return
    }

    await doSubmit()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">증빙 서류 제출</h2>
            {plan && (
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[400px]">
                {plan.title}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <SubmissionSkeleton />
          ) : error && !plan ? (
            <div className="py-12 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={fetchPlan} className="btn-secondary text-sm">다시 시도</button>
            </div>
          ) : plan ? (
            <div className="space-y-6">
              {/* Plan Summary Card */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                  <span>
                    <span className="text-gray-400">목적:</span> {PURPOSE_LABELS[plan.purpose as keyof typeof PURPOSE_LABELS] || plan.purpose}
                  </span>
                  <span>
                    <span className="text-gray-400">계획 금액:</span> {plan.amount.toLocaleString()}원
                  </span>
                  <span>
                    <span className="text-gray-400">일시:</span> {new Date(plan.plannedDate).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>

              {/* Status guides */}
              {plan.status === 'RESUBMIT_REQUIRED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                  재제출이 필요한 항목이 있습니다. 추가 파일을 업로드한 후 다시 검토를 요청해주세요.
                </div>
              )}

              {/* NAS Instruction Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-bold text-blue-900 mb-2">증빙 파일 제출 방법</h3>
                <p className="text-sm text-blue-800 mb-3 leading-relaxed">
                  1. <strong>NAS 업로드</strong> 버튼을 눌러 파일 업로드 팝업창을 여세요.<br />
                  2. 증빙 파일들을 NAS에 업로드합니다.<br />
                  3. 업로드 완료 후 아래 체크리스트를 확인해 주세요.
                </p>

                <div className="mt-3 mb-4 bg-white/60 rounded p-3 text-sm border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    파일명 규칙: <span className="font-mono text-blue-700 ml-1">팀번호_날짜_사용목적_증빙항목</span>
                  </p>
                </div>

                <button
                  onClick={openNasPopup}
                  className="w-full bg-blue-600 text-white text-sm font-bold py-2.5 rounded-lg shadow-md hover:bg-blue-700 transition active:scale-[0.98]"
                >
                  NAS 파일 업로드하기
                </button>
              </div>

              {/* Evidence Checklist */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">증빙 항목 체크리스트</h4>
                <div className="space-y-2.5">
                  {plan.evidences.map(evidence => (
                    <div 
                      key={evidence.id} 
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        checkedItems.has(evidence.id) 
                          ? 'bg-green-50 border-green-200 shadow-sm' 
                          : evidence.status === 'RESUBMIT_REQUIRED' 
                            ? 'bg-red-50 border-red-200' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleToggle(evidence.id)}
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems.has(evidence.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleToggle(evidence.id)
                        }}
                        className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded-md focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold ${checkedItems.has(evidence.id) ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {evidence.label}
                          </span>
                          {evidence.required && <span className="text-red-500 text-[10px] font-bold border border-red-200 bg-red-50 px-1 rounded">필수</span>}
                        </div>
                        {evidence.hint && !checkedItems.has(evidence.id) && (
                          <p className="text-xs text-gray-500 mt-0.5">{evidence.hint}</p>
                        )}
                        {evidence.status === 'RESUBMIT_REQUIRED' && evidence.resubmitNote && (
                          <div className="mt-2 text-[11px] bg-red-100 border border-red-200 rounded p-2 text-red-700">
                            <span className="font-bold">재제출 사유:</span> {evidence.resubmitNote}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actual Amount Input */}
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-2" htmlFor="modal-actualAmount">
                  최종 지출 금액 확인
                </label>
                <div className="relative">
                  <input
                    id="modal-actualAmount"
                    type="number"
                    value={actualAmountRaw}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className={`w-full border rounded-xl shadow-sm px-4 py-3 text-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none ${
                      amountTouched && parseInt(actualAmountRaw, 10) !== plan.amount
                        ? 'border-blue-400 text-blue-700 font-bold bg-blue-50/30'
                        : 'border-gray-300 text-gray-900'
                    }`}
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">원</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  계획 금액: <span className="font-medium text-gray-700">{plan.amount.toLocaleString()}원</span>
                </p>
                {amountTouched && parseInt(actualAmountRaw, 10) !== plan.amount && !isNaN(parseInt(actualAmountRaw, 10)) && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg text-xs text-blue-700 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    계획보다 {Math.abs(parseInt(actualAmountRaw, 10) - plan.amount).toLocaleString()}원 {parseInt(actualAmountRaw, 10) > plan.amount ? '더 지출함' : '덜 지출함'}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
          {error && <p className="text-xs text-red-600 mb-2 sm:mb-0 sm:mr-auto self-center">{error}</p>}
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition active:scale-[0.98]"
            disabled={submitting}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 sm:flex-none px-10 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl shadow-lg hover:bg-blue-700 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={submitting || loading || !plan}
          >
            {submitting && (
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {submitting ? '제출 중...' : '검토 요청하기'}
          </button>
        </div>

        {/* Confirm Modal (Nested) */}
        {showConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-150">
              <h3 className="text-lg font-bold text-gray-900 mb-2">실제 지출 금액 확인</h3>
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                계획서상의 금액 <strong>{plan?.amount.toLocaleString()}원</strong>을 그대로 지출하셨습니까?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={doSubmit}
                  className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-xl shadow hover:bg-blue-700 transition"
                  disabled={submitting}
                >
                  네, 맞습니다
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition"
                >
                  수정하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SubmissionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Plan Summary Skeleton */}
      <div className="h-14 bg-gray-100 rounded-xl" />
      
      {/* NAS Box Skeleton */}
      <div className="h-40 bg-gray-100 rounded-xl" />
      
      {/* Checklist Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-32 bg-gray-100 rounded mb-4" />
        <div className="h-12 bg-gray-100 rounded-xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
      </div>
      
      {/* Amount Skeleton */}
      <div className="h-28 bg-gray-100 rounded-xl" />
    </div>
  )
}
