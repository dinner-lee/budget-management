'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EvidenceItem {
  id: string
  label: string
  required: boolean
  hint?: string | null
  status?: string
  resubmitNote?: string | null
}

export default function SubmitForReviewButton({
  planId,
  plannedAmount,
  evidences,
  isRecurring,
  completedRepeats
}: {
  planId: string
  plannedAmount: number
  evidences: EvidenceItem[]
  isRecurring?: boolean
  completedRepeats?: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [actualAmountRaw, setActualAmountRaw] = useState(plannedAmount.toString())
  const [amountTouched, setAmountTouched] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // 반복 결제 건의 경우, 2회차(completedRepeats > 0)부터는 '영수증'만 증빙하도록 필터링
  const displayEvidences = (isRecurring && (completedRepeats || 0) > 0)
    ? evidences.filter(e => e.label === '영수증')
    : evidences

  const requiredEvidences = displayEvidences.filter(e => e.required)
  const allRequiredChecked = requiredEvidences.every(e => checkedItems.has(e.id))

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
    setLoading(true)

    const actualAmount = parseInt(actualAmountRaw, 10)

    const res = await fetch(`/api/plans/${planId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actualAmount: isNaN(actualAmount) ? null : actualAmount })
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

  async function handleSubmit() {
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
    if (!amountTouched || actualAmount === plannedAmount) {
      setShowConfirm(true)
      return
    }

    await doSubmit()
  }

  return (
    <div className="card p-5 mt-6 border-t border-gray-100">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
        <h3 className="text-sm font-bold text-blue-900 mb-2">
          {isRecurring && (completedRepeats || 0) > 0 
            ? `${(completedRepeats || 0) + 1}회차 증빙 파일 제출 시작하기` 
            : '증빙 파일 제출 시작하기'}
        </h3>
        <p className="text-sm text-blue-800 mb-3 leading-relaxed">
          1. 아래 버튼을 눌러 NAS 파일 업로드 팝업창을 여세요.<br />
          2. 자신의 예산 계획에 해당하는 증빙 파일들을 모두 팝업창(NAS)에 업로드합니다.<br />
          3. 업로드한 파일은 아래 체크리스트에 체크하여 모두 올렸는지 확인해 주세요.
        </p>

        <div className="mt-3 mb-4 bg-white/60 rounded p-3 text-sm border border-blue-100">
          <p className="font-semibold text-blue-900 mb-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            파일명 작성 규칙
          </p>
          <p className="text-blue-800 mb-1.5">
            NAS에 업로드하는 파일명은 다음과 같은 형식으로 정리해 주세요.
          </p>
          <div className="bg-blue-50 rounded px-2.5 py-1.5 text-xs text-blue-900 font-mono mb-1.5 border border-blue-200">
            팀번호_날짜(MMDD)_사용 목적_증빙 항목
          </div>

          <p className="text-xs text-blue-600 mt-1">
            (예) <span className="font-mono font-semibold">1_0630_회의비_영수증</span>
          </p>
        </div>

        <button
          onClick={openNasPopup}
          className="inline-block bg-blue-600 text-white text-xs px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          NAS에 파일 업로드하기 (로딩에 시간이 다소 소요될 수 있습니다. 대기해 주세요.)
        </button>
      </div>

      {/* 증빙 항목 체크리스트 */}
      <div className="mb-5 bg-gray-50 border border-gray-200 rounded-lg p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-1">증빙 항목</h4>
        <p className="text-xs text-gray-500 mb-4">
          {isRecurring && (completedRepeats || 0) > 0 
            ? '이번 달 결제 영수증을 업로드한 후 체크해 주세요.' 
            : '각 항목의 증빙 파일을 NAS에 업로드한 후 체크해 주세요.'}
        </p>
        <div className="space-y-3">
          {displayEvidences.map(evidence => {
            const formUrl = evidence.label === '회의록'
              ? 'https://drive.google.com/file/d/1FaQspUSRiPOmX9aIxVlKLbNbFl01DpjO/view?usp=sharing'
              : evidence.label === '지급청구서'
                ? 'https://drive.google.com/file/d/1S4oui9OxZv0i9vQcZOctzy8mTuzvyrMh/view?usp=sharing'
                : null

            return (
              <div key={evidence.id} className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${checkedItems.has(evidence.id) ? 'bg-green-50 border-green-200'
                : evidence.status === 'RESUBMIT_REQUIRED' ? 'bg-red-50 border-red-200'
                  : 'bg-white border-gray-200'
                }`}>
                <input
                  type="checkbox"
                  checked={checkedItems.has(evidence.id)}
                  onChange={() => handleToggle(evidence.id)}
                  className="w-4 h-4 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 shrink-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-medium ${checkedItems.has(evidence.id) ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {evidence.label}
                    </span>
                    {evidence.required && <span className="text-red-500 text-xs">필수</span>}
                    {!evidence.required && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">선택</span>}
                    {formUrl && (
                      <a
                        href={formUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        양식 다운로드
                      </a>
                    )}
                  </div>
                  {evidence.hint && (
                    <p className="text-xs text-gray-400 mt-0.5">예: {evidence.hint}</p>
                  )}
                  {evidence.status === 'RESUBMIT_REQUIRED' && evidence.resubmitNote && (
                    <div className="mt-1.5 text-xs bg-red-100 border border-red-200 rounded p-2 text-red-700">
                      <span className="font-medium">관리자 메모:</span> {evidence.resubmitNote}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 실제 지출 금액 입력 */}
      <div className="mb-5 bg-gray-50 p-5 rounded-lg border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="actualAmount">
          {isRecurring && (completedRepeats || 0) > 0 ? '이번 회차 실제 지출 금액' : '실제 지출 금액'}
        </label>
        <p className="text-xs text-gray-500 mb-3">
          {isRecurring && (completedRepeats || 0) > 0 
            ? `매달 결제 예정 금액: ${plannedAmount.toLocaleString()}원` 
            : `계획서 금액: ${plannedAmount.toLocaleString()}원 · 실제 지출한 금액이 다르다면 수정해 주세요.`}
        </p>
        <div className="relative">
          <input
            id="actualAmount"
            type="number"
            value={actualAmountRaw}
            onChange={(e) => handleAmountChange(e.target.value)}
            className={`w-full border rounded-lg shadow-sm px-4 py-3 text-lg focus:border-blue-500 focus:ring-blue-500 transition-colors ${amountTouched && parseInt(actualAmountRaw, 10) !== plannedAmount
              ? 'border-blue-400 text-gray-900 font-bold bg-white'
              : 'border-gray-300 text-gray-500 bg-white'
              }`}
            min="0"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">원</span>
        </div>
        {amountTouched && parseInt(actualAmountRaw, 10) !== plannedAmount && (
          <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            계획 금액과 {Math.abs(parseInt(actualAmountRaw, 10) - plannedAmount).toLocaleString()}원 차이가 있습니다.
          </p>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3">
        모든 필수 파일이 업로드되었나요? 체크리스트를 확인한 후 검토를 요청해 주세요.
      </p>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mb-3">{error}</p>
      )}
      <button
        className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {loading ? '요청 중...' : '검토 요청하기'}
      </button>

      {/* 금액 확인 팝업 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">실제로 지출한 금액을 확인해 주세요.</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              계획서상의 금액 <strong>{plannedAmount.toLocaleString()}원</strong>을 지출하셨습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={doSubmit}
                disabled={loading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                네, 맞습니다
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="btn-secondary flex-1"
              >
                금액 수정하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
