'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function UserRoleSelect({ userId, initialRole, isSelf }: { userId: string, initialRole: string, isSelf: boolean }) {
  const [role, setRole] = useState(initialRole)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRoleChange = async (newRole: string) => {
    if (isSelf) {
      alert('자신의 권한은 변경할 수 없습니다.')
      return
    }
    if (!confirm(`해당 사용자의 권한을 ${newRole}(으)로 변경하시겠습니까?`)) return

    setLoading(true)
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    })
    
    setLoading(false)
    if (res.ok) {
      setRole(newRole)
      router.refresh()
    } else {
      alert('권한 변경에 실패했습니다.')
    }
  }

  return (
    <select 
      value={role} 
      onChange={(e) => handleRoleChange(e.target.value)}
      disabled={loading || isSelf}
      className="text-xs border-gray-300 rounded-md py-1 px-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="USER">일반 사용자 (USER)</option>
      <option value="ADMIN">관리자 (ADMIN)</option>
    </select>
  )
}
