'use client'

import { useState } from 'react'
import { downloadExcel, todayStamp, type ExcelSheet } from '@/lib/excel-export'

/**
 * 현재 화면의 데이터를 엑셀로 내려받는 단추.
 * getSheets는 누르는 순간 호출되므로 필터·정렬 등 화면 상태가 그대로 반영된다.
 */
export default function ExcelDownloadButton({
  fileName,
  getSheets,
  label = '엑셀',
  title = '현재 화면의 데이터를 엑셀 파일로 내려받기',
  className = '',
}: {
  fileName: string // 날짜와 확장자는 자동으로 붙음
  getSheets: () => ExcelSheet[]
  label?: string
  title?: string
  className?: string
}) {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    if (busy) return
    setBusy(true)
    try {
      await downloadExcel(`${fileName}_${todayStamp()}`, getSheets())
    } catch (e) {
      console.error('[excel] 내보내기 실패', e)
      window.alert('엑셀 파일을 만들지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      title={title}
      className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 text-xs font-medium text-emerald-700 border border-emerald-200 bg-white rounded-lg px-2.5 py-1 hover:bg-emerald-50 hover:shadow-sm transition-all disabled:opacity-60 ${className}`}
    >
      {busy ? (
        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
      {label}
    </button>
  )
}
