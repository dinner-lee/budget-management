'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeletePlanButton({ planId }: { planId: string }) {
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
      router.push('/dashboard')
      router.refresh()
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
        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
      >
        삭제하기
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
