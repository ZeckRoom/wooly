import * as stylex from '@stylexjs/stylex'
import { colors } from '../../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import { Button } from './button'

const styles = stylex.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgb(0 0 0 / 0.55)',
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    position: 'fixed',
    WebkitAppRegion: 'no-drag',
    zIndex: 40
  },
  panel: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderStyle: 'solid',
    borderWidth: 1,
    boxShadow: '0 12px 40px rgb(0 0 0 / 0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxHeight: 'min(640px, calc(100vh - 72px))',
    maxWidth: 560,
    padding: '1.25rem 1.35rem',
    width: 'min(560px, calc(100vw - 48px))'
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: 500,
    letterSpacing: '-0.03em'
  },
  body: {
    color: colors.mutedForeground,
    fontSize: '0.875rem',
    lineHeight: 1.6
  }
})

export function Dialog({
  open,
  title,
  children,
  onClose
}: {
  open: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div
      {...stylex.props(styles.backdrop)}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={title} {...stylex.props(styles.panel)}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12
          }}
        >
          <h2 {...stylex.props(styles.title)}>{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t.close}
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function DialogBody({ children }: { children: React.ReactNode }) {
  return <div {...stylex.props(styles.body)}>{children}</div>
}
