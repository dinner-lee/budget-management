import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PURPOSE_LABELS } from '@/lib/evidence-config'
import { PlanStatusBadge, EvidenceStatusBadge } from '@/components/StatusBadge'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import AdminReviewForm from './AdminReviewForm'

export default async function AdminPlanDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  const plan = await prisma.budgetPlan.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      evidences: { orderBy: { updatedAt: 'asc' } },
      reviews: {
        include: { admin: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!plan) notFound()

  const canReview = plan.status === 'UNDER_REVIEW'

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Link href="/admin/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← 목록으로
        </Link>
        <a
          href={`/print/plans/${plan.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm inline-flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          계획서 출력
        </a>
      </div>

      {/* Plan info */}
      <div className="card p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold tracking-tight text-gray-900">{plan.title}</h1>
              <PlanStatusBadge status={plan.status} />
            </div>
            <p className="text-sm text-gray-500">
              {plan.user.name} ({plan.user.email})
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-600 tabular-nums">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">목적</span>
            <p>{PURPOSE_LABELS[plan.purpose as keyof typeof PURPOSE_LABELS]}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">금액</span>
            <p>
              {plan.amount.toLocaleString()}원 (계획)
              {plan.lastSubmittedAmount !== null && (
                <>
                  <br />
                  <span className="font-semibold text-amber-600">
                    {plan.lastSubmittedAmount.toLocaleString()}원 (제출된 실제 사용 금액)
                  </span>
                </>
              )}
              {plan.actualAmount !== null && (
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
          <div className="col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">지출 개요</span>
            <p>{plan.expenditureOverview}</p>
          </div>
          {plan.signature && (
            <div className="col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">신청자 서명</span>
              <div className="mt-1 inline-block bg-gray-50 border border-gray-200 rounded-md p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={plan.signature} alt="신청자 서명" className="h-16 object-contain" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Evidence items */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">증빙 항목</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {plan.evidences.map((evidence) => (
            <div key={evidence.id} className="px-5 py-4 hover:bg-gray-50/60 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{evidence.label}</span>
                    <EvidenceStatusBadge status={evidence.status} />
                  </div>
                  {evidence.hint && (
                    <p className="text-xs text-gray-400">예: {evidence.hint}</p>
                  )}
                  {evidence.fileName && (
                    <p className="text-xs text-gray-500 mt-1">
                      파일명: {evidence.fileName}
                      {evidence.uploadedAt && (
                        <span className="ml-2 text-gray-400">
                          ({new Date(evidence.uploadedAt).toLocaleString('ko-KR')})
                        </span>
                      )}
                    </p>
                  )}
                  {evidence.resubmitNote && (
                    <p className="text-xs text-red-600 mt-1">재제출 사유: {evidence.resubmitNote}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin review form */}
      {canReview && (
        <AdminReviewForm
          planId={plan.id}
          evidences={plan.evidences.map((e) => ({
            id: e.id,
            label: e.label,
            status: e.status,
          }))}
        />
      )}

      {/* Review history */}
      {plan.reviews.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">검토 이력</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {plan.reviews.map((review) => (
              <div key={review.id} className="px-5 py-3">
                <p className="text-xs text-gray-500">
                  {new Date(review.createdAt).toLocaleString('ko-KR')} &middot; {review.admin.name}
                </p>
                {review.note && (
                  <p className="text-sm text-gray-700 mt-0.5">{review.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
