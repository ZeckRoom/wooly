import type { ReactNode } from 'react'
import { t } from '@/lib/i18n'
import { Button } from './button'

export function Dialog({
  open,
  title,
  children,
  onClose
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 no-drag"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[min(640px,calc(100vh-72px))] w-[min(560px,calc(100vw-48px))] max-w-[560px] flex-col gap-4 rounded-[20px] bg-card p-5 shadow-[inset_0_0_0_1px_var(--color-hairline),0_24px_80px_rgb(0_0_0/0.55)]"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-lg font-medium tracking-[-0.03em] text-ink">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t.close}
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function DialogBody({ children }: { children: ReactNode }) {
  return <div className="text-sm leading-relaxed text-muted">{children}</div>
}
