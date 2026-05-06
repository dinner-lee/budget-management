export default function Loading() {
  return (
    <div className="max-w-2xl animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6 space-y-2">
        <div className="h-6 w-36 bg-gray-200 rounded" />
        <div className="h-4 w-80 bg-gray-100 rounded" />
      </div>

      {/* Form card skeleton */}
      <div className="card p-6 space-y-5">
        {/* Team number */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-9 bg-gray-100 rounded-md" />
          </div>
        </div>

        {/* Leader fields */}
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-9 bg-gray-100 rounded-md" />
            </div>
          ))}
        </div>

        {/* Members textarea */}
        <div className="space-y-1">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-100 rounded-md" />
        </div>

        {/* Research topic */}
        <div className="space-y-1">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="h-9 bg-gray-100 rounded-md" />
        </div>

        {/* Button */}
        <div className="pt-2">
          <div className="h-10 w-32 bg-gray-200 rounded-md" />
        </div>
      </div>

      {/* Members card skeleton */}
      <div className="card p-6 mt-6">
        <div className="h-4 w-28 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 bg-gray-100 rounded border border-gray-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
