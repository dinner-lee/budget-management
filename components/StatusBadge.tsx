const PLAN_STATUS_MAP: Record<string, { label: string; className: string; dot: string }> = {
  PENDING_EVIDENCE: { label: '증빙 대기', className: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  UNDER_REVIEW: { label: '검토 중', className: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  RESUBMIT_REQUIRED: { label: '재제출 필요', className: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },
  APPROVED: { label: '승인 완료', className: 'bg-green-50 text-green-700 ring-green-600/20', dot: 'bg-green-500' },
}

const EVIDENCE_STATUS_MAP: Record<string, { label: string; className: string; dot: string }> = {
  PENDING: { label: '미제출', className: 'bg-gray-50 text-gray-600 ring-gray-500/20', dot: 'bg-gray-400' },
  SUBMITTED: { label: '제출됨', className: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  RESUBMIT_REQUIRED: { label: '재제출 필요', className: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },
}

const FALLBACK = { label: '', className: 'bg-gray-50 text-gray-600 ring-gray-500/20', dot: 'bg-gray-400' }

function Badge({ label, className, dot }: { label: string; className: string; dot: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

export function PlanStatusBadge({ status }: { status: string }) {
  const s = PLAN_STATUS_MAP[status] ?? { ...FALLBACK, label: status }
  return <Badge {...s} />
}

export function EvidenceStatusBadge({ status }: { status: string }) {
  const s = EVIDENCE_STATUS_MAP[status] ?? { ...FALLBACK, label: status }
  return <Badge {...s} />
}
