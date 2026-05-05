'use client'

import { useState, useEffect } from 'react'

export default function TeamPage() {
  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    leaderName: '',
    leaderAffiliation: '',
    members: '',
    researchTopic: ''
  })

  useEffect(() => {
    fetch('/api/user/team')
      .then(res => res.json())
      .then(data => {
        if (data.team) {
          setTeam(data.team)
          setForm({
            leaderName: data.team.leaderName || '',
            leaderAffiliation: data.team.leaderAffiliation || '',
            members: data.team.members || '',
            researchTopic: data.team.researchTopic || ''
          })
        }
        setLoading(false)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const res = await fetch('/api/user/team', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    setSaving(false)
    if (res.ok) {
      setMessage('팀 정보가 성공적으로 수정되었습니다.')
    } else {
      const data = await res.json()
      setMessage(data.error || '오류가 발생했습니다.')
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">로딩 중...</div>

  if (!team) {
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 mb-4">나의 팀 정보</h1>
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md border border-yellow-200">
          아직 배정된 팀이 없습니다. 관리자에게 문의하여 팀을 할당받으세요.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">나의 팀 정보</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          팀 정보를 열람하고 수정할 수 있습니다(수정 시 관리자에게 알림이 전송됩니다).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">팀 번호</label>
            <input type="text" className="input bg-gray-50 text-gray-500" value={team.teamNumber} disabled />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">대표 학생 이름</label>
            <input
              type="text"
              className="input"
              value={form.leaderName}
              onChange={e => setForm({ ...form, leaderName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">대표 학생 소속</label>
            <input
              type="text"
              className="input"
              value={form.leaderAffiliation}
              onChange={e => setForm({ ...form, leaderAffiliation: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">참여 학생 (이름 및 소속)</label>
          <p className="text-xs text-gray-400 mb-1">여러 명일 경우 쉼표(,) 또는 줄바꿈으로 구분해 주세요.</p>
          <textarea
            className="input"
            rows={3}
            value={form.members}
            onChange={e => setForm({ ...form, members: e.target.value })}
          />
        </div>

        <div>
          <label className="label">연구 주제</label>
          <input
            type="text"
            className="input"
            value={form.researchTopic}
            onChange={e => setForm({ ...form, researchTopic: e.target.value })}
            required
          />
        </div>

        {message && (
          <div className={`p-3 rounded-md text-sm ${message.includes('오류') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        <div className="pt-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? '저장 중...' : '정보 저장하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
