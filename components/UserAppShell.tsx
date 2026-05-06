'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import DashboardClient from '@/app/(user)/dashboard/DashboardClient'
import BudgetLimitsClient from '@/app/(user)/budget-limits/BudgetLimitsClient'
import TeamClient from '@/app/(user)/team/TeamClient'

type TabKey = 'dashboard' | 'budget-limits' | 'team'

const TAB_CONFIG: { key: TabKey; label: string; path: string }[] = [
  { key: 'dashboard', label: '대시보드', path: '/dashboard' },
  { key: 'budget-limits', label: '예산 계획 설정', path: '/budget-limits' },
  { key: 'team', label: '팀 정보', path: '/team' },
]

function pathToTab(pathname: string): TabKey | null {
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname === '/budget-limits') return 'budget-limits'
  if (pathname === '/team') return 'team'
  return null
}

export default function UserAppShell({
  dashboardData,
  budgetLimitsData,
  teamData,
  children,
}: {
  dashboardData: any
  budgetLimitsData: any[]
  teamData: any
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const currentTab = pathToTab(pathname)
  const isTabPage = currentTab !== null

  const [activeTab, setActiveTab] = useState<TabKey>(currentTab || 'dashboard')
  const [isOpen, setIsOpen] = useState(false)

  // URL이 바뀌면 탭 상태 동기화 (뒤로가기 등 대응)
  useEffect(() => {
    if (currentTab) {
      setActiveTab(currentTab)
    }
  }, [currentTab])

  const handleTabClick = (tab: TabKey) => {
    setActiveTab(tab)
    setIsOpen(false)
    
    const config = TAB_CONFIG.find(t => t.key === tab)
    if (config) {
      // 페이지 로딩 없이 URL만 변경
      window.history.replaceState(null, '', config.path)
    }
  }

  // 로고 클릭 시 대시보드 탭으로 이동 (로딩 방지)
  const handleLogoClick = (e: React.MouseEvent) => {
    if (isTabPage) {
      e.preventDefault()
      handleTabClick('dashboard')
    }
  }

  // 서브 페이지(계획서 상세 등)에서는 일반 네비게이션 사용
  if (!isTabPage) {
    return (
      <>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-6">
                <Link href="/dashboard" className="flex items-center gap-2 mr-2">
                  <Image src="/lsri_logo.png" alt="학습과학연구소" width={130} height={32} className="object-contain" priority />
                  <span className="font-light text-[#15378F] text-lg border-l border-gray-300 pl-3 whitespace-nowrap">예산 관리</span>
                </Link>
                <div className="hidden lg:flex items-center gap-1">
                  {TAB_CONFIG.map((tab) => (
                    <Link
                      key={tab.key}
                      href={tab.path}
                      className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-8">{children}</main>
      </>
    )
  }

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              {/* 버튼으로 처리하여 즉시 탭 전환 */}
              <button onClick={() => handleTabClick('dashboard')} className="flex items-center gap-2 mr-2 text-left">
                <Image src="/lsri_logo.png" alt="학습과학연구소" width={130} height={32} className="object-contain" priority />
                <span className="font-light text-[#15378F] text-lg border-l border-gray-300 pl-3 whitespace-nowrap">예산 관리</span>
              </button>
              <div className="hidden lg:flex items-center gap-1">
                {TAB_CONFIG.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabClick(tab.key)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key
                      ? 'bg-primary-50 text-primary-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <span className="text-sm text-gray-600">{session?.user.name}</span>
              <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm text-gray-500 hover:text-gray-700 font-medium">로그아웃</button>
            </div>

            <div className="lg:hidden flex items-center">
              <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-gray-700 p-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 메뉴에서도 버튼 사용 */}
        {isOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg absolute w-full left-0 animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-3 space-y-1">
              {TAB_CONFIG.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`block w-full text-left px-3 py-2.5 rounded-md text-base font-medium ${activeTab === tab.key ? 'bg-primary-50 text-primary-500' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                >
                  {tab.label}
                </button>
              ))}
              <div className="pt-4 pb-2 border-t border-gray-100 mt-2">
                <div className="flex items-center justify-between px-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{session?.user.name}</span>
                    <span className="text-xs text-gray-500">팀원 계정</span>
                  </div>
                  <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm text-red-600 font-bold px-3 py-1.5 border border-red-100 rounded-md bg-red-50">로그아웃</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-8">
        <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
          <DashboardClient {...dashboardData} />
        </div>
        <div style={{ display: activeTab === 'budget-limits' ? 'block' : 'none' }}>
          <BudgetLimitsClient initialLimits={budgetLimitsData} />
        </div>
        <div style={{ display: activeTab === 'team' ? 'block' : 'none' }}>
          <TeamClient initialTeam={teamData} />
        </div>
      </main>
    </>
  )
}
