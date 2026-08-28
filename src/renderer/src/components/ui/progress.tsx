import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
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
    <ProgressPrimitive.Root
      value={width}
      data-slot="progress"
      className={cn('flex w-full flex-col gap-2', className)}
    >
      {label ? (
        <ProgressPrimitive.Label className="font-mono text-xs text-muted">
          {label}
        </ProgressPrimitive.Label>
      ) : null}
      <ProgressPrimitive.Track className="relative h-[0.35rem] w-full overflow-hidden rounded-full bg-success/18">
        <ProgressPrimitive.Indicator className="h-full bg-success transition-[width] duration-200 ease-out" />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}
