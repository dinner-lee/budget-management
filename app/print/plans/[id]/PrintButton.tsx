'use client'

export default function PrintButton() {
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
