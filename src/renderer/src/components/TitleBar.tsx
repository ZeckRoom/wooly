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
    backgroundColor: colors.sidebar,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    display: 'flex',
    height: 'var(--titlebar)',
    justifyContent: 'space-between',
    paddingInline: 12,
    position: 'relative',
    WebkitAppRegion: 'drag',
    zIndex: 10
  },
  left: {
    alignItems: 'center',
    display: 'flex',
    minWidth: 0,
    WebkitAppRegion: 'no-drag'
  },
  brand: {
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: '-0.03em',
    whiteSpace: 'nowrap'
  },
  right: {
    alignItems: 'stretch',
    alignSelf: 'stretch',
    display: 'flex',
    gap: 0,
    height: '100%',
    justifyContent: 'flex-end',
    marginRight: -12,
    WebkitAppRegion: 'no-drag'
  },
  caption: {
    borderRadius: 0,
    height: '100%',
    transform: { ':active': 'none', default: 'none' },
    width: 46
  }
})

export function TitleBar({ maximized }: { maximized: boolean }) {
  return (
    <header
      data-tauri-drag-region
      {...stylex.props(styles.bar, customClassName('wooly-titlebar'))}
    >
      <div {...stylex.props(styles.left)}>
        <span {...stylex.props(styles.brand)}>{t.appProduct}</span>
      </div>
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
          sx={styles.caption}
          onClick={() => window.wooly.window.close()}
        >
          <Icon icon={Cancel01Icon} size={14} />
        </Button>
      </div>
    </header>
  )
}
