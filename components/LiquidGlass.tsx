'use client'

import { useEffect } from 'react'

// Liquid glass 굴절(SVG displacement)은 Chromium에서만 backdrop-filter: url()을 지원
export function useLiquidGlassRefract() {
  useEffect(() => {
    try {
      const uaData = (navigator as any).userAgentData
      const isChromium = !!uaData?.brands?.some((b: any) => /Chromium/i.test(b.brand))
      if (isChromium && typeof CSS !== 'undefined' && CSS.supports('backdrop-filter', 'url(#liquid-distort)')) {
        document.documentElement.dataset.lgRefract = '1'
      }
    } catch {}
  }, [])
}

export function LiquidGlassDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <filter id="liquid-distort" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="2" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale="16" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  )
}

