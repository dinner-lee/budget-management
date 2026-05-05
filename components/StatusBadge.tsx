const PLAN_STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING_EVIDENCE: { label: '증빙 대기', className: 'bg-yellow-100 text-yellow-800' },
  UNDER_REVIEW: { label: '검토 중', className: 'bg-blue-100 text-blue-800' },
  RESUBMIT_REQUIRED: { label: '재제출 필요', className: 'bg-red-100 text-red-800' },
  APPROVED: { label: '승인 완료', className: 'bg-green-100 text-green-800' },
}

const EVIDENCE_STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING: { label: '미제출', className: 'bg-gray-100 text-gray-700' },
  SUBMITTED: { label: '제출됨', className: 'bg-blue-100 text-blue-700' },
  RESUBMIT_REQUIRED: { label: '재제출 필요', className: 'bg-red-100 text-red-800' },
}

export function PlanStatusBadge({ status }: { status: string }) {
  const s = PLAN_STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  )
}

export function EvidenceStatusBadge({ status }: { status: string }) {
  const s = EVIDENCE_STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  )
}
