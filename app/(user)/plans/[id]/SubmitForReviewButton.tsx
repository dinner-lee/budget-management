'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EvidenceItem {
  id: string
  label: string
  required: boolean
}

export default function SubmitForReviewButton({
  planId,
  plannedAmount,
  evidences
}: {
  planId: string
  plannedAmount: number
  evidences: EvidenceItem[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [isDifferentAmount, setIsDifferentAmount] = useState(false)
  const [actualAmountRaw, setActualAmountRaw] = useState(plannedAmount.toString())

  const requiredEvidences = evidences.filter(e => e.required)
  const allRequiredChecked = requiredEvidences.every(e => checkedItems.has(e.id))

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

  async function handleSubmit() {
    if (!allRequiredChecked) {
      setError('모든 필수 증빙 파일에 대해 업로드 확인을 체크해주세요.')
      return
    }

    let actualAmount: number | null = null
    if (isDifferentAmount) {
      actualAmount = parseInt(actualAmountRaw, 10)
      if (isNaN(actualAmount) || actualAmount < 0) {
        setError('유효한 실제 지출 금액을 입력해주세요.')
        return
      }
    }

    setError('')
    setLoading(true)

    const res = await fetch(`/api/plans/${planId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actualAmount })
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? '오류가 발생했습니다.')
      return
    }

    // 완전히 성공했을 시, 대시보드로 이동
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="card p-5 mt-6 border-t border-gray-100">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
        <h3 className="text-sm font-bold text-blue-900 mb-2">증빙 파일 제출 시작하기</h3>
        <p className="text-sm text-blue-800 mb-3 leading-relaxed">
          1. 아래 버튼을 눌러 NAS 파일 업로드 팝업창을 여세요.<br />
          2. 자신의 예산 계획에 해당하는 증빙 파일들을 모두 팝업창(NAS)에 업로드합니다.<br />
          3. 업로드한 파일은 아래 체크리스트에 체크하여 모두 올렸는지 확인해주세요.
        </p>
        <button
          onClick={openNasPopup}
          className="inline-block bg-blue-600 text-white text-xs px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          NAS에 파일 업로드하기 (로딩이 오래 걸릴 수 있습니다)
        </button>
      </div>

      <div className="mb-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">업로드 완료 확인 체크리스트</h4>
        <div className="space-y-2">
          {evidences.map(evidence => (
            <label key={evidence.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={checkedItems.has(evidence.id)}
                onChange={() => handleToggle(evidence.id)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className={`text-sm ${checkedItems.has(evidence.id) ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {evidence.label}
                {evidence.required && <span className="text-red-500 ml-1 text-xs">*필수</span>}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-5 bg-gray-50 p-4 rounded-md border border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={isDifferentAmount}
            onChange={(e) => setIsDifferentAmount(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            실제 지출 금액이 계획서의 금액({plannedAmount.toLocaleString()}원)과 다릅니다.
          </span>
        </label>
        
        {isDifferentAmount && (
          <div className="pl-6">
            <label className="block text-xs text-gray-500 mb-1">실제 지출 금액 (원)</label>
            <input
              type="number"
              value={actualAmountRaw}
              onChange={(e) => setActualAmountRaw(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-1.5"
              min="0"
            />
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3">
        모든 필수 파일이 업로드 되었나요? 체크리스트를 확인한 후 검토를 요청해주세요.
      </p>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2 mb-3">{error}</p>
      )}
      <button
        className="btn-primary w-full sm:w-auto"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? '요청 중...' : '검토 요청하기'}
      </button>
    </div>
  )
}
