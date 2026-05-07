import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PURPOSE_LABELS } from '@/lib/evidence-config'
import { PlanStatusBadge, EvidenceStatusBadge } from '@/components/StatusBadge'
import { notFound, redirect } from 'next/navigation'
import SubmitForReviewButton from './SubmitForReviewButton'
import DeletePlanButton from './DeletePlanButton'

export default async function PlanDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { teamId: true }
  })

  const plan = await prisma.budgetPlan.findFirst({
    where: { 
      id: params.id,
      OR: [
        { userId: session.user.id },
        { teamId: user?.teamId || 'NONE' }
      ]
    },
    include: { evidences: { orderBy: { updatedAt: 'asc' } } },
  })
  if (!plan) notFound()

  const isWaitingForDate = plan.isRecurring && plan.nextRepeatDate && new Date() < new Date(plan.nextRepeatDate)
  const canUpload = (plan.status === 'PENDING_EVIDENCE' || plan.status === 'RESUBMIT_REQUIRED') && !isWaitingForDate
  const isOther = plan.purpose === 'OTHER'

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-gray-900">{plan.title}</h1>
            <PlanStatusBadge status={plan.status} />
          </div>
          <DeletePlanButton planId={plan.id} />
          <p className="text-sm text-gray-500">
            {PURPOSE_LABELS[plan.purpose as keyof typeof PURPOSE_LABELS]} &middot;{' '}
            {plan.amount.toLocaleString()}원 (계획){' '}
            {plan.actualAmount !== null && (
              <span className="font-semibold text-blue-600">
                &middot; {plan.actualAmount.toLocaleString()}원 (누적 지출)
              </span>
            )}{' '}
            &middot; {new Date(plan.plannedDate).toLocaleDateString('ko-KR')}
            {plan.plannedTime && ` ${plan.plannedTime}`}
          </p>
          <p className="text-sm text-gray-600 mt-1">{plan.expenditureOverview}</p>
          {plan.isRecurring && (
            <p className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block mt-2 border border-indigo-100">
              반복 결제 건 ({plan.completedRepeats}/{plan.totalRepeats}회 완료)
            </p>
          )}
        </div>
      </div>

      {/* Status guide */}
      {isWaitingForDate && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-indigo-800">
          다음 결제 예정일(<strong>{new Date(plan.nextRepeatDate!).toLocaleDateString('ko-KR')}</strong>)이 되면 증빙 서류 제출이 다시 활성화됩니다.
        </div>
      )}
      {plan.status === 'PENDING_EVIDENCE' && !isWaitingForDate && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          증빙 파일을 모두 준비하신 후, 하단의 안내에 따라 NAS에 파일을 업로드하고 <strong>검토 요청하기</strong> 버튼을 눌러주세요.
        </div>
      )}
      {plan.status === 'UNDER_REVIEW' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          관리자가 제출된 증빙을 검토 중입니다. 결과를 기다려주세요.
        </div>
      )}
      {plan.status === 'RESUBMIT_REQUIRED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          재제출이 필요한 항목이 있습니다. 추가 파일을 업로드한 후 다시 검토를 요청해주세요.
        </div>
      )}
      {plan.status === 'APPROVED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          모든 증빙이 승인 완료되었습니다.
        </div>
      )}

      {/* Evidence items - only show when not in upload mode */}
      {!canUpload && (
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">증빙 항목</h2>
          {isOther && (
            <span className="text-xs text-gray-400">모든 항목 선택사항</span>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {plan.evidences.map((evidence) => {
            const formUrl = 
              evidence.label === '회의록' ? 'https://drive.google.com/file/d/1FaQspUSRiPOmX9aIxVlKLbNbFl01DpjO/view?usp=sharing'
              : evidence.label === '지급청구서' ? 'https://drive.google.com/file/d/1S4oui9OxZv0i9vQcZOctzy8mTuzvyrMh/view?usp=sharing'
              : null

            return (
            <div key={evidence.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{evidence.label}</span>
                    {evidence.status === 'PENDING' && formUrl ? (
                      <a
                        href={formUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        양식 다운로드
                      </a>
                    ) : (
                      <EvidenceStatusBadge status={evidence.status} />
                    )}
                    {!evidence.required && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        선택
                      </span>
                    )}
                  </div>
                  {evidence.hint && (
                    <p className="text-xs text-gray-400 mb-1">예: {evidence.hint}</p>
                  )}
                  {evidence.fileName && (
                    <p className="text-xs text-gray-500">
                      업로드된 파일: {evidence.fileName}
                    </p>
                  )}
                  {evidence.status === 'RESUBMIT_REQUIRED' && evidence.resubmitNote && (
                    <div className="mt-2 text-xs bg-red-50 border border-red-100 rounded p-2 text-red-700">
                      <span className="font-medium">관리자 메모:</span> {evidence.resubmitNote}
                    </div>
                  )}
                </div>
              </div>
            </div>
            )
          })}
        </div>
      </div>
      )}

      {/* 검토 요청 버튼 */}
      {canUpload && (
        <SubmitForReviewButton 
          planId={plan.id} 
          plannedAmount={plan.amount}
          isRecurring={plan.isRecurring}
          completedRepeats={plan.completedRepeats}
          evidences={plan.evidences.map(e => ({ id: e.id, label: e.label, required: e.required, hint: e.hint, status: e.status, resubmitNote: e.resubmitNote }))} 
        />
      )}
    </div>
  )
}
