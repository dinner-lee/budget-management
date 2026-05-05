import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UserCreateForm from './UserCreateForm'
import UserRoleSelect from './UserRoleSelect'

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { plans: true } } },
  })

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← 대시보드
        </Link>
      </div>

      <h1 className="text-xl font-bold text-gray-900">사용자 관리</h1>

      {/* Create user form */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">새 사용자 추가</h2>
        <UserCreateForm />
      </div>

      {/* User list */}
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
                  <UserRoleSelect userId={user.id} initialRole={user.role} isSelf={user.id === session.user.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
