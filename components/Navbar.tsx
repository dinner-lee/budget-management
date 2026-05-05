'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isAdmin = session?.user.role === 'ADMIN'

  const userLinks = [
    { href: '/dashboard', label: '대시보드' },
    { href: '/budget-limits', label: '항목별 예산 계획 설정' },
    { href: '/team', label: '나의 팀 정보' }
  ]
  const adminLinks = [
    { href: '/admin/dashboard', label: '대시보드' },
    { href: '/admin/teams', label: '팀 관리' },
    { href: '/admin/users', label: '사용자 관리' },
    { href: '/admin/settings', label: '일정 설정' }
  ]
  const links = isAdmin ? adminLinks : userLinks

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <Link href={links[0].href} className="flex items-center gap-2 mr-4">
            <Image 
              src="/lsri_logo.png" 
              alt="학습과학연구소" 
              width={160} 
              height={40} 
              className="object-contain"
              priority
            />
            <span className="font-semibold text-gray-900 text-sm border-l border-gray-300 pl-3">예산 관리</span>
          </Link>
          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {session?.user.name}
            {isAdmin && (
              <span className="ml-1.5 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                관리자
              </span>
            )}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  )
}
