'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import AdminDashboardClient from '@/app/admin/dashboard/AdminDashboardClient'
import AdminTeamsClient from '@/app/admin/teams/AdminTeamsClient'
import AdminUsersClient from '@/app/admin/users/AdminUsersClient'
import AdminSettingsClient from '@/app/admin/settings/AdminSettingsClient'

type TabKey = 'dashboard' | 'teams' | 'users' | 'settings'

const TAB_CONFIG: { key: TabKey; label: string; path: string }[] = [
  { key: 'dashboard', label: '대시보드', path: '/admin/dashboard' },
  { key: 'teams', label: '팀 관리', path: '/admin/teams' },
  { key: 'users', label: '사용자 관리', path: '/admin/users' },
  { key: 'settings', label: '일정', path: '/admin/settings' },
]

function pathToTab(pathname: string): TabKey | null {
  if (pathname === '/admin/dashboard') return 'dashboard'
  if (pathname === '/admin/teams') return 'teams'
  if (pathname === '/admin/users') return 'users'
  if (pathname === '/admin/settings') return 'settings'
  return null
}

export default function AdminAppShell({
  dashboardData,
  teamsData,
  usersData,
  settingsData,
  children,
}: {
  dashboardData: any
  teamsData: { teams: any[], users: any[] }
  usersData: any[]
  settingsData: any[]
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const currentTab = pathToTab(pathname)
  const isTabPage = currentTab !== null

  const [activeTab, setActiveTab] = useState<TabKey>(currentTab || 'dashboard')
  const [isOpen, setIsOpen] = useState(false)

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
      window.history.replaceState(null, '', config.path)
    }
  }

  if (!isTabPage) {
    return (
      <>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-6">
                <Link href="/admin/dashboard" className="flex items-center gap-2 mr-2">
                  <Image src="/lsri_logo.png" alt="학습과학연구소" width={130} height={32} className="object-contain" priority />
                  <span className="font-light text-[#15378F] text-lg border-l border-gray-300 pl-3 whitespace-nowrap">예산 관리</span>
                </Link>
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{session?.user.name}</span>
                <span className="text-[10px] bg-primary-100 text-primary-500 px-1.5 py-0.5 rounded font-bold">관리자</span>
              </div>
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
                    <span className="text-xs text-gray-500">관리자 계정</span>
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
          <AdminDashboardClient {...dashboardData} />
        </div>
        <div style={{ display: activeTab === 'teams' ? 'block' : 'none' }}>
          <AdminTeamsClient initialTeams={teamsData.teams} initialUsers={teamsData.users} />
        </div>
        <div style={{ display: activeTab === 'users' ? 'block' : 'none' }}>
          <AdminUsersClient initialUsers={usersData} currentUserId={session?.user.id || ''} />
        </div>
        <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
          <AdminSettingsClient initialMilestones={settingsData} />
        </div>
      </main>
    </>
  )
}
