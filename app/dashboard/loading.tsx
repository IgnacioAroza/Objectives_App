export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse pb-20 md:pb-0">
      <div>
        <div className="h-3 w-40 bg-beige rounded mb-2" />
        <div className="h-7 w-48 bg-beige rounded" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-beige rounded-2xl h-28" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-beige rounded-xl h-20" />
        ))}
      </div>
      <div className="bg-beige rounded-2xl h-24" />
      <div className="bg-beige rounded-2xl h-32" />
    </div>
  )
}
