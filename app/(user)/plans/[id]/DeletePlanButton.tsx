'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeletePlanButton({ 
  planId, 
  onDeleted 
}: { 
  planId: string, 
  onDeleted?: () => void 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/plans/${planId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '삭제 중 오류가 발생했습니다.')
        return
      }
      if (onDeleted) {
        onDeleted()
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all shadow-sm active:scale-95"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        계획서 삭제
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">계획서를 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              삭제된 계획서는 복구할 수 없습니다. 정말 삭제하시겠습니까?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="btn-primary flex-1 bg-red-600 hover:bg-red-700 border-red-600"
              >
                {loading ? '삭제 중...' : '네, 삭제합니다'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="btn-secondary flex-1"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
