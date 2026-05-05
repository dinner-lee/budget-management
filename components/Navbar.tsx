'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const isAdmin = session?.user.role === 'ADMIN'

  const userLinks = [
    { href: '/dashboard', label: '대시보드' },
    { href: '/budget-limits', label: '예산 계획 설정' },
    { href: '/team', label: '팀 정보' }
  ]
  const adminLinks = [
    { href: '/admin/dashboard', label: '대시보드' },
    { href: '/admin/teams', label: '팀 관리' },
    { href: '/admin/users', label: '사용자 관리' },
    { href: '/admin/settings', label: '일정' }
  ]
  const links = isAdmin ? adminLinks : userLinks

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href={links[0].href} className="flex items-center gap-2 mr-2">
              <Image
                src="/lsri_logo.png"
                alt="학습과학연구소"
                width={130}
                height={32}
                className="object-contain"
                priority
              />
              <span className="font-semibold text-gray-900 text-sm border-l border-gray-300 pl-3 whitespace-nowrap">예산 관리</span>
            </Link>
            <div className="hidden lg:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pathname.startsWith(link.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {session?.user.name}
              </span>
              {isAdmin && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                  관리자
                </span>
              )}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              로그아웃
            </button>
          </div>

          {/* Hamburger button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full left-0 animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2.5 rounded-md text-base font-medium ${pathname.startsWith(link.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 pb-2 border-t border-gray-100 mt-2">
              <div className="flex items-center justify-between px-3">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">{session?.user.name}</span>
                  <span className="text-xs text-gray-500">{isAdmin ? '관리자 계정' : '팀원 계정'}</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-sm text-red-600 font-bold px-3 py-1.5 border border-red-100 rounded-md bg-red-50"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
