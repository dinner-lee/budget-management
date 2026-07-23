import { AmbientBackground } from '@/components/LiquidGlass'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-primary-50/60">
      <AmbientBackground />
      {children}
    </div>
  )
}
