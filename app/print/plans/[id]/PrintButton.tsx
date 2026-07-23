'use client'

import { useEffect } from 'react'

export default function PrintButton() {
  // 목록의 PDF 버튼(?autoprint=1)으로 열렸을 때 인쇄/PDF 저장 대화상자 자동 표시
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('autoprint') === '1') {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [])

  return (
    <div className="sticky top-0 z-10 flex justify-end gap-2 max-w-[210mm] mx-auto px-4 py-3 print:hidden">
      <button onClick={() => window.close()} className="btn-secondary">
        닫기
      </button>
      <button onClick={() => window.print()} className="btn-primary">
        인쇄 / PDF 저장
      </button>
    </div>
  )
}
