'use client'

import { useState, useEffect } from 'react'

export default function AdminSettingsPage() {
  const [milestones, setMilestones] = useState<any[]>([])
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchMilestones = () => {
    fetch('/api/admin/milestones')
      .then(res => res.json())
      .then(data => setMilestones(data.milestones || []))
  }

  useEffect(() => {
    fetchMilestones()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/admin/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, date })
    })
    setName('')
    setDate('')
    setLoading(false)
    fetchMilestones()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await fetch(`/api/admin/milestones?id=${id}`, { method: 'DELETE' })
    fetchMilestones()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">주요 일정 설정</h1>
      <p className="text-sm text-gray-500">대시보드에 표시될 예산 사용 관련 주요 일정(중간발표, 마감일 등)을 관리합니다.</p>

      <form onSubmit={handleAdd} className="card p-5 flex gap-3 items-end">
        <div className="flex-1">
          <label className="label">일정 이름</label>
          <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required placeholder="예: 예산사용 마감일" />
        </div>
        <div className="flex-1">
          <label className="label">날짜</label>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>추가</button>
      </form>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">등록된 일정</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {milestones.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">등록된 일정이 없습니다.</div>
          ) : (
            milestones.map(m => (
              <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString('ko-KR')}</p>
                </div>
                <button onClick={() => handleDelete(m.id)} className="text-xs text-red-600 hover:underline">삭제</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
