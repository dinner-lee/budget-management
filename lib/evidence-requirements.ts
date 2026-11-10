import { unstable_cache } from 'next/cache'
import { prisma } from './db'
import {
  EVIDENCE_REQUIREMENTS,
  PURPOSE_LABELS,
  type EvidenceItem,
  type Purpose,
} from './evidence-config'

// 관리자가 수정할 때만 바뀌므로 태그 기반 캐싱. 수정 API에서 revalidateTag로 무효화.
export const EVIDENCE_TAG = 'evidence-requirements'

export const PURPOSE_KEYS = Object.keys(PURPOSE_LABELS) as Purpose[]

export type EvidenceRequirements = Record<Purpose, EvidenceItem[]>

/** 관리자가 저장한 목록이 있으면 그것을, 없으면 기본값을 목적별로 돌려준다. */
export const getEvidenceRequirements = unstable_cache(
  async (): Promise<{ requirements: EvidenceRequirements; customized: Purpose[] }> => {
    // 테이블이 아직 없을 때(db push 전) 등은 기본값으로 동작
    const rows = await prisma.evidenceConfig.findMany().catch((e) => {
      console.error('[evidence-requirements] 기본값 사용:', e)
      return []
    })
    const requirements = { ...EVIDENCE_REQUIREMENTS }
    const customized: Purpose[] = []
    for (const row of rows) {
      if (!PURPOSE_KEYS.includes(row.purpose as Purpose)) continue
      const items = sanitizeItems(row.items)
      if (!items) continue
      requirements[row.purpose as Purpose] = items
      customized.push(row.purpose as Purpose)
    }
    return { requirements, customized }
  },
  [EVIDENCE_TAG],
  { tags: [EVIDENCE_TAG] },
)

/** 입력을 검증·정리한다. 형식이 틀리면 null. */
export function sanitizeItems(raw: unknown): EvidenceItem[] | null {
  if (!Array.isArray(raw)) return null
  const seen = new Set<string>()
  const items: EvidenceItem[] = []
  for (const r of raw) {
    if (!r || typeof r !== 'object') return null
    const { key, label, hint, required } = r as Record<string, unknown>
    if (typeof key !== 'string' || !/^[a-z0-9_]{1,64}$/.test(key)) return null
    if (typeof label !== 'string' || !label.trim() || label.length > 100) return null
    if (hint !== undefined && hint !== null && (typeof hint !== 'string' || hint.length > 200)) return null
    if (seen.has(key)) return null
    seen.add(key)
    const item: EvidenceItem = { key, label: label.trim() }
    if (typeof hint === 'string' && hint.trim()) item.hint = hint.trim()
    if (required === false) item.required = false
    items.push(item)
  }
  return items
}
