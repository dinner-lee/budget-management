'use client'

import { useEffect, useState } from 'react'

// 웹 푸시(Web Push) 구독 관리: 알림을 켜 두면 카드 사용 시각이
// 임박했을 때 서버(cron)가 브라우저로 OS 알림을 발송한다.
// (서비스 워커: public/sw.js, 발송: /api/cron/notify)

const DISMISS_KEY = 'push-prompt-dismissed-until'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from(Array.from(rawData).map((c) => c.charCodeAt(0)))
}

type Status = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'prompt'

export default function UpcomingCardNotice(_props: { plans?: any[]; teams?: any[] }) {
  const [status, setStatus] = useState<Status>('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    async function check() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setStatus('unsupported')
        return
      }
      if (Notification.permission === 'denied') {
        setStatus('denied')
        return
      }
      try {
        const until = localStorage.getItem(DISMISS_KEY)
        if (until && Date.now() < Number(until)) {
          setStatus('unsupported') // 숨김 처리와 동일하게 렌더링 안 함
          return
        }
      } catch {}
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const sub = await reg.pushManager.getSubscription()
        setStatus(sub ? 'subscribed' : 'prompt')
      } catch {
        setStatus('unsupported')
      }
    }
    check()
  }, [])

  async function enable() {
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'prompt')
        return
      }
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) return
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      if (res.ok) setStatus('subscribed')
    } catch {
      // 구독 실패 시 프롬프트 유지
    } finally {
      setBusy(false)
    }
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 3600 * 1000)) // 7일간 숨김
    } catch {}
    setStatus('unsupported')
  }

  if (status !== 'prompt') return null

  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50/70 backdrop-blur-md shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap">
      <svg className="w-4 h-4 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <p className="text-xs text-gray-700 flex-1 min-w-[14rem]">
        브라우저 알림을 켜 두면 <strong>예정된 카드 사용 시각이 임박했을 때</strong> 알림을 받을 수 있습니다.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="font-nexon text-xs font-normal text-white bg-primary-500 rounded-lg px-3 py-1.5 hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {busy ? '설정 중...' : '알림 켜기'}
        </button>
        <button
          type="button"
          onClick={dismiss}
          title="7일간 표시하지 않기"
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  )
}
