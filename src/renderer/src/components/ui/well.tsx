import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** One surface. Do not nest Wells. */
export function Well({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      data-slot="well"
      className={cn(
        'overflow-hidden rounded-[24px] border border-white/10 bg-black/40 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.1)] backdrop-blur-xl',
        className
      )}
    >
      {children}
    </section>
  )
}
