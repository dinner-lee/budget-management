export type Purpose =
  | 'MEETING_FEE'
  | 'EXPERT_FEE'
  | 'PARTICIPANT_FEE'
  | 'PURCHASE_FEE'
  | 'SOFTWARE_FEE'
  | 'OTHER'

export interface EvidenceItem {
  key: string
  label: string
  hint?: string
  required?: boolean // undefined → true (기본 필수). false일 때만 선택사항
}

export const PURPOSE_LABELS: Record<Purpose, string> = {
  MEETING_FEE: '회의비',
  EXPERT_FEE: '전문가 활용비',
  PARTICIPANT_FEE: '연구참여자 사례비',
  PURCHASE_FEE: '구매지출비',
  SOFTWARE_FEE: '소프트웨어 구독료',
  OTHER: '기타',
}

export const EVIDENCE_REQUIREMENTS: Record<Purpose, EvidenceItem[]> = {
  MEETING_FEE: [
    { key: 'meeting_minutes', label: '회의록' },
    { key: 'receipt', label: '영수증' },
  ],
  EXPERT_FEE: [
    { key: 'payment_request', label: '지급청구서' },
    { key: 'resume', label: '이력서' },
    { key: 'proof_document', label: '증빙자료', hint: '강연자료, 면담 자료 등' },
    { key: 'bank_account_copy', label: '통장 사본' },
    { key: 'id_copy', label: '신분증 사본' },
  ],
  PARTICIPANT_FEE: [
    { key: 'payment_request', label: '지급청구서' },
    { key: 'proof_document', label: '증빙자료', hint: '안내문, 설문 결과, 면담 결과 등' },
    { key: 'bank_account_copy', label: '통장 사본' },
    { key: 'id_copy', label: '신분증 사본' },
  ],
  PURCHASE_FEE: [
    { key: 'estimate', label: '견적서' },
    { key: 'other_estimate', label: '타견적서' },
    { key: 'product_photo', label: '구매 물품 실제 사진' },
    { key: 'transaction_record', label: '거래내역서' },
    { key: 'receipt', label: '영수증' },
  ],
  SOFTWARE_FEE: [
    { key: 'estimate', label: '견적서' },
    { key: 'other_estimate', label: '타견적서' },
    { key: 'receipt', label: '영수증' },
  ],
  // 기타: 모든 증빙 항목을 선택사항으로 제공
  OTHER: [
    { key: 'meeting_minutes',    label: '회의록',              required: false },
    { key: 'receipt',            label: '영수증',              required: false },
    { key: 'payment_request',    label: '지급청구서',          required: false },
    { key: 'resume',             label: '이력서',              required: false },
    { key: 'proof_document',     label: '증빙자료',            hint: '강연자료, 면담자료, 안내문, 설문/면담 결과 등', required: false },
    { key: 'bank_account_copy',  label: '통장 사본',           required: false },
    { key: 'id_copy',            label: '신분증 사본',         required: false },
    { key: 'estimate',           label: '견적서',              required: false },
    { key: 'other_estimate',     label: '타견적서',            required: false },
    { key: 'product_photo',      label: '구매 물품 실제 사진', required: false },
    { key: 'transaction_record', label: '거래내역서',          required: false },
  ],
}
