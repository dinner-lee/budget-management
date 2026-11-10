'use client'

import { useState } from 'react'
import {
  EVIDENCE_REQUIREMENTS,
  PURPOSE_LABELS,
  type EvidenceItem,
  type Purpose,
} from '@/lib/evidence-config'

export interface EvidenceRequirementsData {
  requirements: Record<Purpose, EvidenceItem[]>
  customized: Purpose[]
}

const PURPOSES = Object.keys(PURPOSE_LABELS) as Purpose[]

// 편집 중 행 식별용 (key는 사용자가 바꾸지 않으므로 그대로 써도 되지만, 새 행은 아직 key가 없음)
type Row = EvidenceItem & { _id: string }

function toRows(items: EvidenceItem[]): Row[] {
  return items.map(i => ({ ...i, _id: i.key }))
}

function newKey() {
  return `custom_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function sameItems(a: EvidenceItem[], b: EvidenceItem[]) {
  const norm = (l: EvidenceItem[]) =>
    JSON.stringify(l.map(i => [i.key, i.label.trim(), (i.hint ?? '').trim(), i.required !== false]))
  return norm(a) === norm(b)
}

export default function AdminEvidenceClient({ initial }: { initial: EvidenceRequirementsData }) {
  const [saved, setSaved] = useState(initial.requirements)
  const [customized, setCustomized] = useState<Set<Purpose>>(new Set(initial.customized))
  const [purpose, setPurpose] = useState<Purpose>(PURPOSES[0])
  const [rows, setRows] = useState<Row[]>(toRows(initial.requirements[PURPOSES[0]]))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  const dirty = !sameItems(rows, saved[purpose])

  function selectPurpose(p: Purpose) {
    if (p === purpose) return
    if (dirty && !confirm('저장하지 않은 변경 사항이 있습니다. 버리고 이동할까요?')) return
    setPurpose(p)
    setRows(toRows(saved[p]))
    setMessage(null)
  }

  function update(id: string, patch: Partial<EvidenceItem>) {
    setRows(rs => rs.map(r => (r._id === id ? { ...r, ...patch } : r)))
  }

  function move(index: number, dir: -1 | 1) {
    setRows(rs => {
      const next = [...rs]
      const j = index + dir
      if (j < 0 || j >= next.length) return rs
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
  }

  function addRow() {
    const key = newKey()
    setRows(rs => [...rs, { _id: key, key, label: '', required: purpose === 'OTHER' ? false : undefined }])
  }

  function removeRow(id: string) {
    setRows(rs => rs.filter(r => r._id !== id))
  }

  async function save() {
    setMessage(null)
    if (rows.some(r => !r.label.trim())) {
      setMessage({ type: 'error', text: '문서 이름이 비어 있는 항목이 있습니다.' })
      return
    }
    if (rows.length === 0 && !confirm('첨부 문서가 하나도 없습니다. 이 목적의 계획서는 증빙 없이 제출됩니다. 저장할까요?')) return
    setSaving(true)
    const items: EvidenceItem[] = rows.map(({ _id, ...i }) => i)
    const res = await fetch('/api/admin/evidence-requirements', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose, items }),
    })
    setSaving(false)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMessage({ type: 'error', text: data.error || '저장에 실패했습니다.' })
      return
    }
    setSaved(s => ({ ...s, [purpose]: data.items }))
    setRows(toRows(data.items))
    setCustomized(c => new Set(c).add(purpose))
    setMessage({ type: 'ok', text: '저장했습니다. 이후 새로 작성하는 계획서부터 적용됩니다.' })
  }

  async function resetToDefault() {
    if (!confirm(`'${PURPOSE_LABELS[purpose]}'의 첨부 문서 목록을 기본값으로 되돌릴까요?`)) return
    setSaving(true)
    const res = await fetch(`/api/admin/evidence-requirements?purpose=${purpose}`, { method: 'DELETE' })
    setSaving(false)
    if (!res.ok) {
      setMessage({ type: 'error', text: '되돌리기에 실패했습니다.' })
      return
    }
    const defaults = EVIDENCE_REQUIREMENTS[purpose]
    setSaved(s => ({ ...s, [purpose]: defaults }))
    setRows(toRows(defaults))
    setCustomized(c => {
      const n = new Set(c)
      n.delete(purpose)
      return n
    })
    setMessage({ type: 'ok', text: '기본 목록으로 되돌렸습니다.' })
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="card p-4">
        <p className="label mb-2">사용 목적</p>
        <div className="flex flex-wrap gap-1.5">
          {PURPOSES.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => selectPurpose(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                purpose === p
                  ? 'bg-primary-50 text-primary-500 ring-1 ring-inset ring-primary-100'
                  : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {PURPOSE_LABELS[p]}
              {customized.has(p) && <span className="ml-1 text-[10px] text-amber-600">수정됨</span>}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-gray-400">
          일반 사용자가 계획서를 작성할 때 제출해야 하는 첨부 문서 목록입니다. 변경 내용은 저장 후 새로 작성하는 계획서부터 적용되며, 이미 제출된 계획서의 목록은 바뀌지 않습니다.
        </p>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            {PURPOSE_LABELS[purpose]} 첨부 문서
            <span className="ml-1 text-xs text-gray-400 font-normal">({rows.length}건)</span>
          </h2>
          {customized.has(purpose) && (
            <button type="button" onClick={resetToDefault} disabled={saving} className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2">
              기본값으로 되돌리기
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {rows.length === 0 && (
            <div className="p-6 text-center text-gray-400 text-sm">첨부 문서가 없습니다.</div>
          )}
          {rows.map((r, i) => (
            <div key={r._id} className="p-4 flex flex-col sm:flex-row gap-3 sm:items-start">
              <div className="flex sm:flex-col gap-1 shrink-0">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로" className="w-7 h-7 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="아래로" className="w-7 h-7 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30">↓</button>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gray-500">문서 이름</label>
                  <input className="input" value={r.label} maxLength={100} placeholder="예: 영수증" onChange={e => update(r._id, { label: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500">설명 (선택)</label>
                  <input className="input" value={r.hint ?? ''} maxLength={200} placeholder="예: 강연자료, 면담 자료 등" onChange={e => update(r._id, { hint: e.target.value })} />
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0 sm:pt-4">
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={r.required !== false}
                    onChange={e => update(r._id, { required: e.target.checked ? undefined : false })}
                  />
                  필수
                </label>
                <button type="button" onClick={() => removeRow(r._id)} className="text-xs font-medium text-red-600 border border-red-100 bg-red-50/50 rounded-lg px-2.5 py-1 hover:bg-red-50 transition-colors">
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
          <button type="button" onClick={addRow} className="btn-secondary">+ 문서 추가</button>
          <div className="flex-1" />
          {message && (
            <span className={`text-xs ${message.type === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>{message.text}</span>
          )}
          {dirty && (
            <button type="button" onClick={() => { setRows(toRows(saved[purpose])); setMessage(null) }} className="btn-secondary" disabled={saving}>
              취소
            </button>
          )}
          <button type="button" onClick={save} className="btn-primary" disabled={saving || !dirty}>
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
