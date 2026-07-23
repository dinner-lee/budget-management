'use client'

import { useEffect } from 'react'
import { LiquidGlassDefs, useLiquidGlassRefract } from '@/components/LiquidGlass'

export default function PrintButton() {
  useLiquidGlassRefract()

  // 목록의 PDF 버튼(?autoprint=1)으로 열렸을 때 인쇄/PDF 저장 대화상자 자동 표시
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('autoprint') === '1') {
      const t = setTimeout(() => window.print(), 400)
      return () => clearTimeout(t)
    }
  }, [])

  return (
    <>
      <LiquidGlassDefs />
      <div className="glass-nav font-nexon sticky top-0 z-10 print:hidden">
        <div className="max-w-[210mm] mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <p className="text-sm font-normal text-gray-700 truncate">예산 사용 계획서 출력</p>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => window.close()} className="btn-secondary font-normal rounded-lg">
              닫기
            </button>
            <button onClick={() => window.print()} className="btn-primary font-normal rounded-lg">
              인쇄 / PDF 저장
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
