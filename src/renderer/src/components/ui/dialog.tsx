import type { ReactNode } from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
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
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="no-drag fixed inset-0 z-40 bg-black/70 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <DialogPrimitive.Popup className="no-drag fixed top-1/2 left-1/2 z-50 flex max-h-[min(640px,calc(100vh-72px))] w-[min(560px,calc(100vw-48px))] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[20px] bg-card p-5 shadow-[inset_0_0_0_1px_var(--color-hairline),0_24px_80px_rgb(0_0_0/0.55)] outline-none transition-[opacity,transform] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <div className="flex items-center justify-between gap-3">
            <DialogPrimitive.Title className="m-0 text-lg font-medium tracking-[-0.03em] text-ink">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close render={<Button variant="ghost" size="sm" />}>
              {t.close}
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function DialogBody({ children }: { children: ReactNode }) {
  return <div className="text-sm leading-relaxed text-muted">{children}</div>
}
