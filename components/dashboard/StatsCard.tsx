type StatsCardProps = {
  label: string
  value: string
  sub?: string
}

export default function StatsCard({ label, value, sub }: StatsCardProps) {
  return (
    <div className="bg-white border border-navy/10 rounded-xl p-4 h-full min-w-0">
      <p className="text-[11px] text-navy/50 font-body mb-1 leading-tight break-words">{label}</p>
      <p className="font-display font-bold text-xl md:text-2xl text-navy leading-none">{value}</p>
      {sub && <p className="text-[11px] text-navy/40 font-body mt-1">{sub}</p>}
    </div>
  )
}
