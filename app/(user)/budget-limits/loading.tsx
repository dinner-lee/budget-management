export default function Loading() {
  return (
    <div className="max-w-2xl animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6 space-y-2">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-72 bg-gray-100 rounded" />
      </div>

      {/* Form card skeleton */}
      <div className="card p-6 space-y-6">
        {/* Budget summary block */}
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-28 bg-gray-200 rounded" />
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        </div>

        {/* Input rows skeleton */}
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="h-9 flex-1 bg-gray-100 rounded-md" />
            </div>
          ))}
        </div>

        {/* Button skeleton */}
        <div className="pt-2">
          <div className="h-10 w-full bg-gray-200 rounded-md" />
        </div>
      </div>
    </div>
  )
}
