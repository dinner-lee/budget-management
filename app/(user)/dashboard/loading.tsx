export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Milestones skeleton */}
      <div className="card p-5">
        <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Budget summary skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-5 h-52 bg-gray-100 rounded-lg" />
        <div className="card p-5 lg:col-span-2 h-52 bg-gray-100 rounded-lg" />
      </div>

      {/* Plan list skeleton */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-4 w-36 bg-gray-200 rounded" />
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
              <div className="h-7 w-20 bg-gray-200 rounded-md ml-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
