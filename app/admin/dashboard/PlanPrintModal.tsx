'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import PlanPrintSheet from '@/components/PlanPrintSheet'
import { lockBodyForModal, unlockBodyForModal } from '@/lib/modal-lock'

interface Props {
  plan: any
  teamNumber?: string | null
  onClose: () => void
}

// 페이지 이동 없이 예산 사용 계획서를 인쇄/PDF 저장하는 모달.
// 계획서 데이터는 목록에 이미 로드되어 있고, 서명만 소형 API로 가져온다.
export default function PlanPrintModal({ plan, teamNumber, onClose }: Props) {
  const [signature, setSignature] = useState<string | null>(null)
  const [sigLoaded, setSigLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // 서명 로드
  useEffect(() => {
    let cancelled = false
    fetch(`/api/admin/plans/${plan.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return
        setSignature(d?.signature ?? null)
        setSigLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setSigLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [plan.id])

  // 서명 로드가 끝나면 인쇄 대화상자 자동 표시 (기존 ?autoprint=1과 동일한 UX)
  useEffect(() => {
    if (!sigLoaded) return
    const t = setTimeout(() => window.print(), 350)
    return () => clearTimeout(t)
  }, [sigLoaded])

  // ESC 닫기 + 배경 스크롤 잠금 + 인쇄 시 모달만 출력되도록 body 플래그 설정
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    lockBodyForModal()
    document.body.dataset.printPlan = '1'
    return () => {
      document.removeEventListener('keydown', onKey)
      delete document.body.dataset.printPlan
      unlockBodyForModal()
    }
  }, [onClose])

  if (!mounted) return null

  return createPortal(
    <div
      id="plan-print-root"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 print:static print:block print:p-0"
    >
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200 print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[850px] max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:static print:block print:max-w-none print:max-h-none print:rounded-none print:shadow-none print:ring-0 print:overflow-visible"
      >
        {/* 헤더 바 (liquid glass) */}
        <div className="glass-nav font-nexon shrink-0 px-4 py-3 flex items-center justify-between gap-2 print:hidden">
          <p className="text-sm font-normal text-gray-700 truncate">예산 사용 계획서 출력</p>
          <div className="flex items-center gap-2 shrink-0">
            {!sigLoaded && <span className="text-xs text-gray-400">서명 불러오는 중...</span>}
            <button onClick={onClose} className="btn-secondary font-normal rounded-lg">
              닫기
            </button>
            <button onClick={() => window.print()} className="btn-primary font-normal rounded-lg">
              인쇄 / PDF 저장
            </button>
          </div>
        </div>
        <div className="overflow-y-auto bg-[#f5f8fd] p-4 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
          <PlanPrintSheet
            plan={plan}
            userName={plan.user?.name}
            teamNumber={teamNumber}
            signature={signature}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
