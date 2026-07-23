'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EvidenceSummary {
  id: string
  label: string
  status: string
}

interface Props {
  planId: string
  evidences: EvidenceSummary[]
}

export default function AdminReviewForm({ planId, evidences }: Props) {
  const router = useRouter()
  const [action, setAction] = useState<'approve' | 'resubmit'>('approve')
  const [note, setNote] = useState('')
  const [resubmitItems, setResubmitItems] = useState<Record<string, string>>({}) // evidenceId -> note
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submittedEvidences = evidences.filter((e) => e.status === 'SUBMITTED')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (action === 'resubmit') {
      const selected = Object.entries(resubmitItems).filter(([, note]) => note.trim() !== '')
      if (selected.length === 0) {
        setError('재제출이 필요한 항목을 1개 이상 선택하고 사유를 입력해주세요.')
        return
      }
    }

    setLoading(true)

    const res = await fetch(`/api/admin/plans/${planId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        note,
        resubmitItems:
          action === 'resubmit'
            ? Object.entries(resubmitItems)
                .filter(([, n]) => n.trim() !== '')
                .map(([id, note]) => ({ evidenceId: id, note }))
            : [],
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? '오류가 발생했습니다.')
      return
    }

    router.refresh()
  }

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">검토 결정</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAction('approve')}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-all ${
              action === 'approve'
                ? 'border-green-500 bg-green-50 text-green-700 ring-1 ring-green-500 shadow-sm'
                : 'border-gray-200 text-gray-500 hover:border-green-200 hover:bg-green-50/40 hover:text-green-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            전체 승인
          </button>
          <button
            type="button"
            onClick={() => setAction('resubmit')}
            className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-all ${
              action === 'resubmit'
                ? 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500 shadow-sm'
                : 'border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50/40 hover:text-red-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            재제출 요구
          </button>
        </div>

        {action === 'resubmit' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              재제출이 필요한 항목에 사유를 입력하세요. 사유를 입력한 항목만 재제출 요청됩니다.
            </p>
            {submittedEvidences.map((ev) => (
              <div key={ev.id} className="border border-gray-200 rounded-md p-3">
                <p className="text-sm font-medium text-gray-700 mb-1.5">{ev.label}</p>
                <input
                  type="text"
                  className="input text-xs"
                  placeholder="재제출 사유 (입력 시 재제출 요청)"
                  value={resubmitItems[ev.id] ?? ''}
                  onChange={(e) =>
                    setResubmitItems((prev) => ({
                      ...prev,
                      [ev.id]: e.target.value,
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="label text-xs">검토 메모 (선택)</label>
          <textarea
            className="input text-sm"
            rows={2}
            placeholder="사용자에게 전달할 메모를 입력하세요"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          className={`btn w-full text-white shadow-sm transition-colors ${
            action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}
          disabled={loading}
        >
          {loading ? '처리 중...' : action === 'approve' ? '승인하기' : '재제출 요구하기'}
        </button>
      </form>
    </div>
  )
}
