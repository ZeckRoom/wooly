import { forwardRef } from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cn } from '@/lib/utils'

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'

const variants: Record<ButtonVariant, string> = {
  default: 'border-primary-edge bg-primary text-white hover:enabled:brightness-110',
  destructive: 'border-destructive-edge bg-destructive text-white hover:enabled:brightness-110',
  ghost: 'border-transparent bg-transparent text-ink hover:enabled:bg-white/[0.06]',
  link: 'border-transparent bg-transparent text-success underline-offset-4 hover:underline',
  outline: 'border-hairline bg-transparent text-ink hover:enabled:bg-white/[0.06]',
  secondary: 'border-hairline bg-secondary text-ink hover:enabled:bg-white/[0.06]'
}

const sizes: Record<ButtonSize, string> = {
  default: 'h-9 px-4',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-10 px-5',
  icon: 'size-9 p-0',
  'icon-sm': 'size-8 p-0',
  'icon-lg': 'size-10 p-0'
}

export type ButtonProps = ButtonPrimitive.Props & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', type = 'button', ...props },
  ref
) {
  return (
    <ButtonPrimitive
      nativeButton
      data-slot="button"
      {...props}
      ref={ref}
      type={type}
      data-variant={variant}
      data-size={size}
      className={(state) =>
        cn(
          'inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-solid text-sm font-medium whitespace-nowrap outline-none transition-[color,background-color,border-color,filter,transform] duration-150 ease-out select-none hover:enabled:-translate-y-px focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary-edge)_45%,transparent)] active:translate-y-px active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          typeof className === 'function' ? className(state) : className
        )
      }
    />
  )
})
