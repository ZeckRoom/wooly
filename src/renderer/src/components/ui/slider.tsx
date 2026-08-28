import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { cn } from '@/lib/utils'

export function Slider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  className
}: {
  value: number
  min: number
  max: number
  step?: number
  onValueChange: (value: number) => void
  className?: string
}) {
  return (
    <SliderPrimitive.Root
      value={value}
      min={min}
      max={max}
      step={step}
      onValueChange={onValueChange}
      data-slot="slider"
      className={cn('w-full', className)}
    >
      <SliderPrimitive.Control className="flex w-full touch-none items-center py-2 select-none">
        <SliderPrimitive.Track className="h-1.5 w-full rounded-full bg-hairline select-none">
          <SliderPrimitive.Indicator className="rounded-full bg-success select-none" />
          <SliderPrimitive.Thumb className="size-4 rounded-full border border-primary-edge bg-ink select-none has-focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary-edge)_45%,transparent)]" />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}
