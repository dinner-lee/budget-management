export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-nexon relative isolate overflow-hidden min-h-screen flex items-center justify-center bg-gradient-to-br from-[#eef2fc] via-[#f8faff] to-[#e9effc]">
      {/* liquid glass 카드 아래로 비치는 배경 */}
      <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-24 w-[30rem] h-[30rem] rounded-full bg-primary-100/70 blur-3xl" />
        <div className="absolute top-1/3 -right-28 w-[26rem] h-[26rem] rounded-full bg-sky-100/70 blur-3xl" />
        <div className="absolute -bottom-36 left-1/4 w-[28rem] h-[28rem] rounded-full bg-indigo-100/50 blur-3xl" />
      </div>
      {children}
    </div>
  )
}
