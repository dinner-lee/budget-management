'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { PURPOSE_LABELS } from '@/lib/evidence-config'
import { PlanStatusBadge, EvidenceStatusBadge } from '@/components/StatusBadge'
import AdminReviewForm from '../plans/[id]/AdminReviewForm'
import { lockBodyForModal, unlockBodyForModal } from '@/lib/modal-lock'

interface Props {
  plan: any
  team?: { teamNumber: string; leaderName: string } | null
  onClose: () => void
  // 검토 처리 성공 시 갱신된 계획서를 대시보드에 즉시 반영
  onReviewed: (updatedPlan: any) => void
  // PDF 버튼: 페이지 이동 없이 인쇄 모달 열기
  onOpenPrint: (planId: string) => void
}

export default function PlanReviewModal({ plan, team, onClose, onReviewed, onOpenPrint }: Props) {
  // body 직속 포털로 렌더링해 navbar 등 상위 요소와의 backdrop-filter 합성 간섭을 차단
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // ESC로 닫기 + 배경 스크롤 잠금 + navbar 블러 아티팩트 방지 플래그
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // 위에 인쇄 모달이 떠 있으면 그쪽만 닫히도록 무시
      if (e.key === 'Escape' && document.body.dataset.printPlan !== '1') onClose()
    }
    document.addEventListener('keydown', onKey)
    lockBodyForModal()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlockBodyForModal()
    }
  }, [onClose])

  const canReview = plan.status === 'UNDER_REVIEW'
  const purposeLabel = PURPOSE_LABELS[plan.purpose as keyof typeof PURPOSE_LABELS]

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[850px] max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
      >
        {/* 헤더 */}
        <div className="shrink-0 px-5 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg font-black text-primary-500 shrink-0">{team?.teamNumber ?? '-'}</span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{plan.title}</p>
              <p className="text-[11px] text-gray-500 truncate">
                {team?.leaderName ?? ''}{plan.user?.name ? ` · 제출자 ${plan.user.name}` : ''}
              </p>
            </div>
            <PlanStatusBadge status={plan.status} />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenPrint(plan.id)}
              title="계획서 PDF 다운로드"
              className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-gray-500 border border-gray-200 bg-white rounded-lg px-2 py-1.5 hover:bg-gray-50 hover:text-gray-700 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              PDF
            </button>
            <Link
              href={`/admin/plans/${plan.id}`}
              title="검토 이력·서명 등 전체 상세 페이지"
              className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-gray-500 border border-gray-200 bg-white rounded-lg px-2 py-1.5 hover:bg-gray-50 hover:text-gray-700 transition-all"
            >
              상세
            </Link>
            <button
              type="button"
              onClick={onClose}
              title="닫기 (ESC)"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {/* 계획 요약 */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-600 tabular-nums">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">목적</span>
              <p>{purposeLabel}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">금액</span>
              <p>
                {plan.amount.toLocaleString()}원 (계획)
                {plan.lastSubmittedAmount != null && (
                  <>
                    <br />
                    <span className="font-semibold text-amber-600">
                      {plan.lastSubmittedAmount.toLocaleString()}원 (제출된 실제 사용 금액)
                    </span>
                  </>
                )}
                {plan.actualAmount != null && (
                  <>
                    <br />
                    <span className="font-semibold text-blue-600">
                      {plan.actualAmount.toLocaleString()}원 (실제 지출{plan.isRecurring ? ' 누계' : ''})
                    </span>
                  </>
                )}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">사용 예정일</span>
              <p>
                {new Date(plan.plannedDate).toLocaleDateString('ko-KR')}
                {plan.plannedTime && ` ${plan.plannedTime}`}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">제출자</span>
              <p className="truncate">{plan.user?.name ?? '-'}</p>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">지출 개요</span>
              <p className="whitespace-pre-wrap">{plan.expenditureOverview}</p>
            </div>
          </div>

          {/* 증빙 항목 */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-semibold text-gray-700">증빙 항목</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {plan.evidences?.map((evidence: any) => (
                <div key={evidence.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{evidence.label}</span>
                    <EvidenceStatusBadge status={evidence.status} />
                  </div>
                  {evidence.fileName && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      파일명: {evidence.fileName}
                      {evidence.uploadedAt && (
                        <span className="ml-2 text-gray-400">
                          ({new Date(evidence.uploadedAt).toLocaleString('ko-KR')})
                        </span>
                      )}
                    </p>
                  )}
                  {evidence.resubmitNote && (
                    <p className="text-xs text-red-600 mt-0.5">재제출 사유: {evidence.resubmitNote}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 검토 결정 폼 */}
          {canReview && (
            <AdminReviewForm
              planId={plan.id}
              bare
              evidences={(plan.evidences ?? []).map((e: any) => ({
                id: e.id,
                label: e.label,
                status: e.status,
              }))}
              onSuccess={(updatedPlan) => {
                if (updatedPlan) onReviewed(updatedPlan)
                onClose()
              }}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
