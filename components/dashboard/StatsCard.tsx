type StatsCardProps = {
  label: string
  value: string
  sub?: string
}

export default function StatsCard({ label, value, sub }: StatsCardProps) {
  return (
    <div className="bg-white border border-navy/10 rounded-xl p-3 md:p-4">
      <p className="text-[10px] md:text-xs text-navy/50 font-body mb-1 leading-tight">{label}</p>
      <p className="font-display font-bold text-lg md:text-2xl text-navy leading-none">{value}</p>
      {sub && <p className="text-[10px] md:text-xs text-navy/40 font-body mt-1">{sub}</p>}
    </div>
  )
}
