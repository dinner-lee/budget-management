
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-nexon min-h-screen flex items-center justify-center bg-[#f5f8fd]">
      {children}
    </div>
  )
}
