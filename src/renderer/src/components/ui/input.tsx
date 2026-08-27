import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-9 w-full rounded-full border border-hairline bg-transparent px-[0.9rem] text-sm text-ink outline-none placeholder:text-muted focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary-edge)_40%,transparent)] disabled:opacity-50',
        className
      )}
    />
  )
}
