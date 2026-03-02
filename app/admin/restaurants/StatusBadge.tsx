export function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    active:         'bg-green-500/15 text-green-400 border-green-500/30',
    pending_review: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    inactive:       'bg-gray-700/50 text-gray-400 border-gray-600/30',
  }
  const label: Record<string, string> = {
    active:         'Active',
    pending_review: 'Pending',
    inactive:       'Inactive',
  }
  return (
    <span className={`inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg[status] ?? cfg.inactive}`}>
      {label[status] ?? status}
    </span>
  )
}
