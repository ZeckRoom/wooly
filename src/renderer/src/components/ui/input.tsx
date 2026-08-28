import { forwardRef } from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from '@/lib/utils'

export type InputProps = InputPrimitive.Props

export const Input = forwardRef<HTMLElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <InputPrimitive
      data-slot="input"
      {...props}
      ref={ref}
      className={(state) =>
        cn(
          'h-9 w-full rounded-full border border-hairline bg-transparent px-[0.9rem] text-sm text-ink outline-none placeholder:text-muted focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary-edge)_40%,transparent)] disabled:opacity-50',
          typeof className === 'function' ? className(state) : className
        )
      }
    />
  )
})
