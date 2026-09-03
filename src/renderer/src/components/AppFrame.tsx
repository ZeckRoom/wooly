import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useLauncher } from '@/state/store'

/** Outer window chrome: thin border + large radius. Square when maximized. */
export function AppFrame({ children }: { children: ReactNode }) {
  const maximized = useLauncher((s) => s.maximized)
  return (
    <div
      data-frame=""
      data-maximized={maximized ? 'true' : undefined}
      className={cn(
        'flex h-full w-full min-h-0 flex-col overflow-hidden bg-void',
        maximized
          ? 'rounded-none border-transparent shadow-none'
          : 'rounded-[var(--frame)] border border-black shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)]'
      )}
    >
      {children}
    </div>
  )
}
