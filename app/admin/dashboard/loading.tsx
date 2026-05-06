export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 h-24 bg-gray-100 rounded-lg" />
        ))}
      </div>

      {/* Charts row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 h-64 bg-gray-100 rounded-lg" />
        <div className="card p-5 h-64 bg-gray-100 rounded-lg" />
      </div>

      {/* Plan list skeleton */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-4 w-40 bg-gray-200 rounded" />
        </div>
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-56 bg-gray-200 rounded" />
                <div className="h-3 w-36 bg-gray-100 rounded" />
              </div>
              <div className="h-7 w-20 bg-gray-200 rounded-md ml-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
