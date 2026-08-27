import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import MinusSignIcon from '@hugeicons/core-free-icons/MinusSignIcon'
import SquareIcon from '@hugeicons/core-free-icons/SquareIcon'
import { island } from '@/lib/chrome'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Icon } from './ui/icon'

const caption =
  'h-full w-[46px] rounded-none hover:enabled:translate-y-0 active:translate-y-0 active:scale-100'

export function TitleBar({
  maximized,
  view,
  onLibrary,
  onSettings
}: {
  maximized: boolean
  view: 'library' | 'settings'
  onLibrary: () => void
  onSettings: () => void
}) {
  return (
    <header
      data-tauri-drag-region
      className="relative z-10 flex h-[var(--titlebar)] items-center justify-end bg-transparent pr-0 pl-3"
    >
      <nav
        className={cn(
          'no-drag pointer-events-auto absolute top-1/2 left-1/2 z-[1] flex h-10 -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 rounded-full p-1',
          island
        )}
        aria-label={t.appProduct}
      >
        <button
          type="button"
          title={t.appProduct}
          aria-label={t.appProduct}
          onClick={onLibrary}
          className="flex size-7 shrink-0 items-center justify-center rounded-[10px] border border-primary-edge bg-primary text-[13px] font-semibold tracking-[-0.04em] text-white"
        >
          W
        </button>
        <button
          type="button"
          aria-current={view === 'library' ? 'page' : undefined}
          onClick={onLibrary}
          className={cn(
            'flex h-8 items-center rounded-full px-3 text-[13px] font-medium whitespace-nowrap text-muted hover:bg-white/[0.07]',
            view === 'library' && 'bg-white/[0.08] text-ink'
          )}
        >
          {t.library}
        </button>
        <button
          type="button"
          aria-current={view === 'settings' ? 'page' : undefined}
          onClick={onSettings}
          className={cn(
            'flex h-8 items-center rounded-full px-3 text-[13px] font-medium whitespace-nowrap text-muted hover:bg-white/[0.07]',
            view === 'settings' && 'bg-white/[0.08] text-ink'
          )}
        >
          {t.settings}
        </button>
      </nav>
      <div className="no-drag z-[2] flex h-full shrink-0 items-stretch justify-end gap-0 self-stretch">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t.minimize}
          className={caption}
          onClick={() => window.wooly.window.minimize()}
        >
          <Icon icon={MinusSignIcon} size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={maximized ? t.restore : t.maximize}
          className={caption}
          onClick={() => window.wooly.window.maximize()}
        >
          <Icon icon={SquareIcon} size={12} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t.close}
          className={cn(
            caption,
            'text-ink hover:enabled:bg-destructive/50 hover:enabled:text-white'
          )}
          onClick={() => window.wooly.window.close()}
        >
          <Icon icon={Cancel01Icon} size={14} />
        </Button>
      </div>
    </header>
  )
}
