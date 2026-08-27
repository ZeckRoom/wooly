import { cn } from '@/lib/utils'

export function Progress({
  value = 0,
  label,
  className
}: {
  value?: number
  label?: string
  className?: string
}) {
  const width = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('flex w-full flex-col gap-2', className)}
      role="progressbar"
      aria-valuenow={width}
    >
      {label ? <div className="font-mono text-xs text-muted">{label}</div> : null}
      <div className="relative h-[0.35rem] w-full overflow-hidden rounded-full bg-success/18">
        <div
          className="h-full bg-success transition-[width] duration-200 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}
