'use client'

import { useState } from 'react'
import UserCreateForm from './UserCreateForm'
import UserRoleSelect from './UserRoleSelect'

export default function AdminUsersClient({ initialUsers, currentUserId }: { initialUsers: any[], currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers)

  return (
    <div className="max-w-2xl space-y-6">
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">새 사용자 추가</h2>
        <UserCreateForm />
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">사용자 목록 ({users.length}명)</h2>
        </div>
        {users.length === 0 ? (
          <p className="px-5 py-12 text-center text-gray-400 text-sm">사용자가 없습니다.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((user) => (
              <div key={user.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {user.email} &middot; 계획서 {user._count.plans}건
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')} 등록
                  </span>
                  <UserRoleSelect userId={user.id} initialRole={user.role} isSelf={user.id === currentUserId} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
