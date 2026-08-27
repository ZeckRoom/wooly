import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** One surface. Do not nest Wells. */
export function Well({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      data-slot="well"
      className={cn(
        'overflow-hidden rounded-[20px] bg-card shadow-[inset_0_0_0_1px_var(--color-hairline)]',
        className
      )}
    >
      {children}
    </section>
  )
}
