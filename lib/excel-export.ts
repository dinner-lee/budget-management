// 관리자 화면 엑셀(.xlsx) 내보내기 공통 유틸 — 브라우저에서 바로 파일을 만든다.
// 라이브러리는 버튼을 누를 때만 불러와 첫 화면 번들에 포함되지 않게 한다.

export type ExcelValue = string | number | Date | null | undefined

export interface ExcelColumn {
  header: string
  width?: number // 문자 수 기준 열 너비
  type?: 'text' | 'number' | 'date' | 'percent'
}

export interface ExcelSheet {
  name: string
  columns: ExcelColumn[]
  rows: ExcelValue[][]
  /** 마지막에 굵게 표시할 합계 행 */
  totalRow?: ExcelValue[]
}

const HEADER_BG = '#E8EEF8'

// 시트 이름: 31자 이하, []:*?/\ 사용 불가
function safeSheetName(name: string) {
  return name.replace(/[\[\]:*?/\\]/g, ' ').slice(0, 31) || 'Sheet'
}

function toCell(value: ExcelValue, col: ExcelColumn | undefined, bold = false) {
  const base = bold ? { fontWeight: 'bold' as const } : {}
  if (value === null || value === undefined || value === '') return bold ? { ...base, value: '' } : null
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : { ...base, value, type: Date, format: 'yyyy-mm-dd' }
  }
  if (typeof value === 'number') {
    if (!isFinite(value)) return null
    if (col?.type === 'percent') return { ...base, value, type: Number, format: '0%' }
    return { ...base, value, type: Number, format: '#,##0' }
  }
  return { ...base, value: String(value), type: String }
}

export async function downloadExcel(fileName: string, sheets: ExcelSheet[]) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const used = new Set<string>()
  const data = sheets.map((s) => {
    let name = safeSheetName(s.name)
    for (let i = 2; used.has(name); i++) name = safeSheetName(`${s.name.slice(0, 27)} (${i})`)
    used.add(name)
    const header = s.columns.map((c) => ({
      value: c.header,
      fontWeight: 'bold' as const,
      backgroundColor: HEADER_BG,
    }))
    const body = s.rows.map((r) => r.map((v, i) => toCell(v, s.columns[i])))
    const total = s.totalRow ? [s.totalRow.map((v, i) => toCell(v, s.columns[i], true))] : []
    return {
      sheet: name,
      data: [header, ...body, ...total] as any,
      columns: s.columns.map((c) => ({ width: c.width ?? Math.max(10, c.header.length * 2 + 2) })),
      stickyRowsCount: 1,
    }
  })
  await writeXlsxFile(data, { fontFamily: '맑은 고딕', fontSize: 10 }).toFile(
    fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`,
  )
}

/** 파일 이름용 오늘 날짜 (YYYYMMDD) */
export function todayStamp() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

/** 'YYYY-MM-DD' 또는 Date → 시각 없는 로컬 날짜 (엑셀에서 하루 밀리지 않도록) */
export function asDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null
  const d = new Date(v)
  if (isNaN(d.getTime())) return null
  // 엑셀은 시간대가 없으므로 UTC 자정 기준 날짜로 고정
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}
