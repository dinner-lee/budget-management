import Navbar from '@/components/Navbar'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-8">{children}</main>
    </div>
  )
}
