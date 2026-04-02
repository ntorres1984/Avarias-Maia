'use client'

type DashboardTopbarProps = {
  title: string
  subtitle?: string
}

export default function DashboardTopbar({
  title,
  subtitle,
}: DashboardTopbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-1">
      <h1 className="text-2xl font-semibold text-slate-800">{title}</h1>
      {subtitle ? (
        <p className="text-sm text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  )
}
