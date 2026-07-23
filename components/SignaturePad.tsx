'use client'

import { useRef, useState, useEffect } from 'react'

type Mode = 'draw' | 'upload' | 'saved'

const MAX_UPLOAD_MB = 5
const RESIZE_MAX_WIDTH = 600

export default function SignaturePad({
  value,
  onChange,
  disabled,
}: {
  value: string | null
  onChange: (dataUrl: string | null) => void
  disabled?: boolean
}) {
  const [mode, setMode] = useState<Mode>('draw')
  const [hasStroke, setHasStroke] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [savedSignature, setSavedSignature] = useState<string | null>(null)

  // 저장된 대표 서명 조회 (있으면 재사용 탭 표시)
  useEffect(() => {
    fetch('/api/user/signature')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.signature) {
          setSavedSignature(data.signature)
          setMode('saved')
        }
      })
      .catch(() => {})
  }, [])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  // 캔버스 해상도를 실제 표시 크기 × devicePixelRatio로 맞춤
  useEffect(() => {
    if (mode !== 'draw') return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#111827'
    }
  }, [mode])

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    lastPointRef.current = getPoint(e)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const last = lastPointRef.current
    if (!ctx || !last) return
    const point = getPoint(e)
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPointRef.current = point
    if (!hasStroke) setHasStroke(true)
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPointRef.current = null
    const canvas = canvasRef.current
    if (canvas && hasStroke) onChange(canvas.toDataURL('image/png'))
    else if (canvas) {
      // 첫 획이 점 하나로 끝난 경우에도 반영
      onChange(canvas.toDataURL('image/png'))
      setHasStroke(true)
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setHasStroke(false)
    onChange(null)
  }

  function switchMode(next: Mode) {
    if (next === mode) return
    setMode(next)
    setHasStroke(false)
    setUploadError('')
    onChange(null)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError('')
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('이미지 파일(PNG, JPG 등)만 업로드할 수 있습니다.')
      return
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setUploadError(`${MAX_UPLOAD_MB}MB 이하의 이미지만 업로드할 수 있습니다.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        // 저장 용량을 줄이기 위해 최대 폭 기준으로 축소
        const scale = Math.min(1, RESIZE_MAX_WIDTH / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        onChange(canvas.toDataURL('image/png'))
      }
      img.onerror = () => setUploadError('이미지를 불러올 수 없습니다.')
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex border-b border-gray-200 bg-gray-50">
        {savedSignature && (
          <button
            type="button"
            onClick={() => switchMode('saved')}
            disabled={disabled}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'saved' ? 'bg-white text-primary-500 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            저장된 서명
          </button>
        )}
        <button
          type="button"
          onClick={() => switchMode('draw')}
          disabled={disabled}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === 'draw' ? 'bg-white text-primary-500 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          직접 서명
        </button>
        <button
          type="button"
          onClick={() => switchMode('upload')}
          disabled={disabled}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === 'upload' ? 'bg-white text-primary-500 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          이미지 업로드
        </button>
      </div>

      {mode === 'saved' && savedSignature ? (
        <div className="p-3 space-y-2.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === 'REUSE' ? null : 'REUSE')}
            className={`w-full bg-gray-50 rounded-md p-3 flex justify-center border-2 transition-all ${
              value === 'REUSE' ? 'border-primary-500 ring-1 ring-primary-500 shadow-sm' : 'border-dashed border-gray-300 hover:border-primary-100'
            }`}
            title="클릭하여 이 서명 사용"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={savedSignature} alt="저장된 서명" className="max-h-24 object-contain" />
          </button>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-400">
              {value === 'REUSE' ? (
                <span className="text-primary-500 font-medium">✓ 저장된 서명을 사용합니다 (저장 공간 절약)</span>
              ) : (
                '이전에 사용한 서명입니다. 클릭하면 이 서명을 재사용합니다.'
              )}
            </p>
          </div>
        </div>
      ) : mode === 'draw' ? (
        <div className="p-3">
          <canvas
            ref={canvasRef}
            className="w-full h-40 bg-white border border-dashed border-gray-300 rounded-md cursor-crosshair"
            style={{ touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-400">마우스나 태블릿 펜으로 위 영역에 서명해 주세요.</p>
            <button
              type="button"
              onClick={clearCanvas}
              disabled={disabled || !hasStroke}
              className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-40 font-medium"
            >
              지우기
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={disabled}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-primary-50 file:text-primary-500 file:text-sm file:font-medium hover:file:bg-primary-100"
          />
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          {value && value !== 'REUSE' && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-2 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="서명 미리보기" className="max-h-24 object-contain" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
