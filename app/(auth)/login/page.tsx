'use client'

import { useState } from 'react'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showEmailLogin, setShowEmailLogin] = useState(false)

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex flex-col items-center w-full max-w-3xl px-4">
      <div className="w-full grid md:grid-cols-2 glass-card rounded-3xl shadow-xl ring-1 ring-white/60 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500">
        {/* 좌측 브랜드 패널 */}
        <div className="relative hidden md:flex flex-col m-3 p-8 rounded-[1.25rem] bg-gradient-to-br from-[#1c46ac] via-[#15378F] to-[#0a1d52] text-white overflow-hidden ring-1 ring-inset ring-white/15 shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.16),transparent_55%)]" aria-hidden="true" />
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5" aria-hidden="true" />
          <div className="absolute -bottom-24 -left-10 w-64 h-64 rounded-full bg-white/5" aria-hidden="true" />

          <Image
            src="/lsri_logo_white.png"
            alt="학습과학연구소"
            width={182}
            height={40}
            className="relative object-contain self-start"
            priority
          />

          <div className="relative mt-14 w-fit">
            <p className="text-[13px] text-blue-100/80 whitespace-nowrap">학부생·대학원생 학습과학연구지원사업</p>
            <h2 className="mt-0.5 text-[1.8rem] font-normal leading-snug tracking-tight [text-align-last:justify]">
              예산 관리 시스템
            </h2>
          </div>
        </div>

        {/* 우측 로그인 폼 */}
        <div className="flex flex-col justify-center p-8 sm:p-10">
          {/* 모바일 전용 브랜드 헤더 */}
          <div className="md:hidden flex flex-col items-center text-center mb-8">
            <Image src="/lsri_logo.png" alt="학습과학연구소" width={170} height={42} className="object-contain mb-4" priority />
            <p className="text-xs text-gray-500 break-keep">학부생·대학원생 학습과학연구지원사업</p>
            <h2 className="text-xl font-normal text-[#15378F] tracking-tight whitespace-nowrap">예산 관리 시스템</h2>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-500/60">Welcome</p>
          <h1 className="mt-1 text-xl font-bold text-gray-900 tracking-tight">로그인</h1>
          <p className="mt-1.5 text-sm text-gray-500 break-keep">
            <strong className="text-[#15378F] font-bold">구글 계정(@snu.ac.kr)</strong>으로 로그인해 주세요.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="mt-7 w-full flex justify-center items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-normal text-gray-700 shadow-sm hover:shadow-md hover:border-gray-300 hover:-translate-y-px active:translate-y-0 active:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-2 disabled:opacity-50 transition-all"
          >
            {googleLoading ? (
              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? '연결 중...' : 'Google 계정으로 로그인'}
          </button>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-gray-400 flex-wrap">
            <span className="whitespace-nowrap">관리자 발급 계정이 있으신가요?</span>
            <button
              type="button"
              onClick={() => setShowEmailLogin(!showEmailLogin)}
              disabled={loading || googleLoading}
              className="whitespace-nowrap font-medium text-primary-500 hover:text-primary-600 hover:underline transition-colors disabled:opacity-50"
            >
              {showEmailLogin ? '접기' : '이메일로 로그인'}
            </button>
          </div>

          {showEmailLogin && (
            <form onSubmit={handleSubmit} className="space-y-4 pt-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="email">이메일</label>
                <input
                  id="email"
                  type="email"
                  className="input py-2 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading || googleLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="password">비밀번호</label>
                <input
                  id="password"
                  type="password"
                  className="input py-2 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading || googleLoading}
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">{error}</p>
              )}

              <button type="submit" className="btn-primary w-full py-2.5 text-sm font-normal rounded-xl flex items-center justify-center gap-2" disabled={loading || googleLoading}>
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? '로그인 중...' : '이메일로 로그인'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-[11px] text-gray-400 leading-relaxed">
        <p>
          <a
            href="https://ls.snu.ac.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-500 hover:text-primary-500 hover:underline transition-colors"
          >
            서울대학교 학습과학연구소
          </a>
        </p>
        <p className="break-keep">
          <span className="whitespace-nowrap">(08826) 서울시 관악구 관악로 1 서울대학교 학습과학연구소 10-1동 401호</span>
          {' · '}
          <span className="whitespace-nowrap">02-880-4498</span>
          {' · '}
          <span className="whitespace-nowrap">jjl0909@snu.ac.kr</span>
        </p>
      </div>
    </div>
  )
}
