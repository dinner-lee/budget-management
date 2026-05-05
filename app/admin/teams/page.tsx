'use client'

import { useState, useEffect } from 'react'

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    teamNumber: '',
    leaderName: '',
    leaderAffiliation: '',
    members: '',
    researchTopic: '',
    userId: ''
  })
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [assignUserId, setAssignUserId] = useState<string>('')

  const fetchTeams = () => {
    fetch('/api/admin/teams').then(res => res.json()).then(data => setTeams(data.teams || []))
  }
  const fetchUsers = () => {
    // There is no dedicated users API yet, but we can hit /api/admin/users if it exists or create one.
    // For now we will fetch from an endpoint. Wait, there is no /api/admin/users API yet.
    // Let's create a quick API or fetch in server side.
    // I'll fetch them from a new API we will create or just handle it if it exists.
  }

  useEffect(() => {
    fetchTeams()
    fetch('/api/admin/users')
      .then(res => { if(res.ok) return res.json(); return [] })
      .then(data => { if(Array.isArray(data)) setUsers(data) })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/admin/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm({ teamNumber: '', leaderName: '', leaderAffiliation: '', members: '', researchTopic: '', userId: '' })
    setLoading(false)
    fetchTeams()
  }

  const handleAssignUser = async (teamId: string, action: 'add' | 'remove', uId?: string) => {
    const targetUserId = action === 'add' ? assignUserId : uId;
    if (!targetUserId) return
    setLoading(true)
    await fetch('/api/admin/teams', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, userId: targetUserId, action })
    })
    if (action === 'add') setAssignUserId('')
    setLoading(false)
    fetchTeams()
    fetch('/api/admin/users')
      .then(res => { if(res.ok) return res.json(); return [] })
      .then(data => { if(Array.isArray(data)) setUsers(data) })
      .catch(() => {})
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit} className="card p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-800">새 팀 생성</h2>
            <div>
              <label className="label">팀 번호</label>
              <input type="text" className="input" value={form.teamNumber} onChange={e => setForm({...form, teamNumber: e.target.value})} required />
            </div>
            <div>
              <label className="label">대표 학생 이름</label>
              <input type="text" className="input" value={form.leaderName} onChange={e => setForm({...form, leaderName: e.target.value})} required />
            </div>
            <div>
              <label className="label">대표 학생 소속</label>
              <input type="text" className="input" value={form.leaderAffiliation} onChange={e => setForm({...form, leaderAffiliation: e.target.value})} required />
            </div>
            <div>
              <label className="label">연구 주제</label>
              <input type="text" className="input" value={form.researchTopic} onChange={e => setForm({...form, researchTopic: e.target.value})} required />
            </div>
            <div>
              <label className="label">사용자 할당</label>
              <select className="input" value={form.userId} onChange={e => setForm({...form, userId: e.target.value})}>
                <option value="">-- 사용자 선택 (선택사항) --</option>
                {users.filter(u => !u.teamId).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>팀 생성</button>
          </form>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-700">생성된 팀 목록</h2></div>
            <div className="divide-y divide-gray-100">
              {teams.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">팀이 없습니다.</div>
              ) : (
                teams.map(team => (
                  <div key={team.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{team.teamNumber}: {team.researchTopic}</p>
                        <p className="text-xs text-gray-500 mt-1">대표: {team.leaderName} ({team.leaderAffiliation})</p>
                        {team.members && <p className="text-xs text-gray-500">팀원: {team.members}</p>}
                      </div>
                      <div className="text-right">
                        {team.editLogs && team.editLogs.length > 0 && (
                          <button onClick={() => setSelectedLog(team.editLogs[0])} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            최근 수정 기록 보기
                          </button>
                        )}
                      </div>
                    </div>
                    {/* 사용자 할당 영역 */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <select className="input py-1 text-xs" value={assignUserId} onChange={e => setAssignUserId(e.target.value)}>
                          <option value="">-- 사용자 할당 --</option>
                          {users.filter(u => !u.teamId).map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                        <button onClick={() => handleAssignUser(team.id, 'add')} disabled={!assignUserId || loading} className="btn-secondary px-2 py-1 text-xs shrink-0">할당</button>
                      </div>
                      
                      {team.users && team.users.length > 0 ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-700">할당된 사용자:</p>
                          {team.users.map((u: any) => (
                            <div key={u.id} className="flex justify-between items-center bg-gray-50 px-2 py-1.5 rounded">
                              <span className="text-xs text-gray-900">{u.name} ({u.email})</span>
                              <button onClick={() => handleAssignUser(team.id, 'remove', u.id)} disabled={loading} className="text-xs text-red-500 hover:text-red-700">해제</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">할당된 사용자가 없습니다.</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold">정보 수정 로그</h3>
            <p className="text-sm text-gray-500">수정자: {selectedLog.user.name} | 일시: {new Date(selectedLog.createdAt).toLocaleString()}</p>
            <div className="bg-gray-50 p-4 rounded text-sm font-mono overflow-auto max-h-60">
              {(() => {
                try {
                  const c = JSON.parse(selectedLog.changes)
                  return Object.keys(c).map(k => (
                    <div key={k} className="mb-2">
                      <p className="font-bold">{k}</p>
                      <p className="text-red-500 line-through">- {c[k].old}</p>
                      <p className="text-green-600">+ {c[k].new}</p>
                    </div>
                  ))
                } catch(e) {
                  return selectedLog.changes
                }
              })()}
            </div>
            <button onClick={() => setSelectedLog(null)} className="btn-secondary w-full">닫기</button>
          </div>
        </div>
      )}
    </div>
  )
}
