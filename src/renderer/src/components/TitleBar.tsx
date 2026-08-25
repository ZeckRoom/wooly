import * as stylex from '@stylexjs/stylex'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import MinusSignIcon from '@hugeicons/core-free-icons/MinusSignIcon'
import SquareIcon from '@hugeicons/core-free-icons/SquareIcon'
import { colors, customClassName } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import { Button } from './ui/button'
import { Icon } from './ui/icon'

const styles = stylex.create({
  bar: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    display: 'flex',
    height: 'var(--titlebar)',
    justifyContent: 'flex-end',
    paddingLeft: 12,
    paddingRight: 0,
    position: 'relative',
    WebkitAppRegion: 'drag',
    zIndex: 10
  },
  nav: {
    alignItems: 'center',
    display: 'flex',
    gap: 2,
    height: 40,
    left: '50%',
    padding: 4,
    pointerEvents: 'auto',
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    WebkitAppRegion: 'no-drag',
    zIndex: 1
  },
  mark: {
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: colors.primary,
    borderColor: 'var(--primary-edge)',
    borderRadius: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    color: colors.primaryForeground,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    font: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    height: 28,
    justifyContent: 'center',
    letterSpacing: '-0.04em',
    width: 28
  },
  link: {
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: {
      ':hover': 'rgb(255 255 255 / 0.07)',
      default: 'transparent'
    },
    borderRadius: 999,
    borderStyle: 'none',
    color: colors.mutedForeground,
    cursor: 'pointer',
    display: 'flex',
    font: 'inherit',
    fontSize: 13,
    fontWeight: 500,
    height: 32,
    paddingInline: 12,
    whiteSpace: 'nowrap'
  },
  linkActive: {
    backgroundColor: 'rgb(255 255 255 / 0.08)',
    color: colors.foreground
  },
  right: {
    alignItems: 'stretch',
    alignSelf: 'stretch',
    display: 'flex',
    flexShrink: 0,
    gap: 0,
    height: '100%',
    justifyContent: 'flex-end',
    WebkitAppRegion: 'no-drag',
    zIndex: 2
  },
  caption: {
    borderRadius: 0,
    height: '100%',
    transform: { ':active': 'none', default: 'none' },
    width: 46
  },
  captionClose: {
    backgroundColor: {
      ':hover': 'color-mix(in srgb, var(--destructive) 46%, transparent)',
      default: 'transparent'
    },
    color: { ':hover': '#fff', default: colors.foreground }
  }
})

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
      {...stylex.props(styles.bar, customClassName('wooly-titlebar'))}
    >
      <nav {...stylex.props(styles.nav, customClassName('wooly-glass'))} aria-label={t.appProduct}>
        <button
          type="button"
          title={t.appProduct}
          aria-label={t.appProduct}
          onClick={onLibrary}
          {...stylex.props(styles.mark)}
        >
          W
        </button>
        <button
          type="button"
          aria-current={view === 'library' ? 'page' : undefined}
          onClick={onLibrary}
          {...stylex.props(styles.link, view === 'library' && styles.linkActive)}
        >
          {t.library}
        </button>
        <button
          type="button"
          aria-current={view === 'settings' ? 'page' : undefined}
          onClick={onSettings}
          {...stylex.props(styles.link, view === 'settings' && styles.linkActive)}
        >
          {t.settings}
        </button>
      </nav>
      <div {...stylex.props(styles.right)}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t.minimize}
          sx={styles.caption}
          onClick={() => window.wooly.window.minimize()}
        >
          <Icon icon={MinusSignIcon} size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={maximized ? t.restore : t.maximize}
          sx={styles.caption}
          onClick={() => window.wooly.window.maximize()}
        >
          <Icon icon={SquareIcon} size={12} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t.close}
          sx={[styles.caption, styles.captionClose]}
          onClick={() => window.wooly.window.close()}
        >
          <Icon icon={Cancel01Icon} size={14} />
        </Button>
      </div>
    </header>
  )
}
