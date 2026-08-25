import * as stylex from '@stylexjs/stylex'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import MinusSignIcon from '@hugeicons/core-free-icons/MinusSignIcon'
import SquareIcon from '@hugeicons/core-free-icons/SquareIcon'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { InstanceGroup, PublicAccount } from '@shared/types'
import { Button } from './ui/button'
import { Icon } from './ui/icon'

const styles = stylex.create({
  bar: {
    alignItems: 'center',
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
    gap: 10,
    minWidth: 180,
    WebkitAppRegion: 'no-drag'
  },
  brand: {
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: '-0.03em'
  },
  tabs: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    display: 'flex',
    gap: 2,
    padding: 3,
    WebkitAppRegion: 'no-drag'
  },
  tab: {
    borderRadius: 999,
    fontSize: 13,
    height: 28,
    minWidth: 88,
    paddingInline: 14
  },
  tabActive: {
    backgroundColor: colors.card,
    color: colors.foreground
  },
  right: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
    minWidth: 180,
    WebkitAppRegion: 'no-drag'
  },
  account: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    maxWidth: 180
  },
  avatar: {
    borderRadius: 999,
    height: 22,
    width: 22,
    backgroundColor: colors.secondary,
    objectFit: 'cover'
  },
  name: {
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
})

export function TitleBar({
  group,
  onGroup,
  account,
  onAccounts,
  onSettings,
  maximized
}: {
  group: InstanceGroup
  onGroup: (group: InstanceGroup) => void
  account: PublicAccount | null
  onAccounts: () => void
  onSettings: () => void
  maximized: boolean
}) {
  return (
    <header {...stylex.props(styles.bar)}>
      <div {...stylex.props(styles.left)}>
        <span {...stylex.props(styles.brand)}>{t.appName}</span>
      </div>
      <div {...stylex.props(styles.tabs)}>
        {(['vanilla', 'modded'] as const).map((item) => (
          <Button
            key={item}
            variant="ghost"
            size="sm"
            aria-pressed={group === item}
            onClick={() => onGroup(item)}
            sx={group === item ? [styles.tab, styles.tabActive] : styles.tab}
          >
            {item === 'vanilla' ? t.vanilla : t.modded}
          </Button>
        ))}
      </div>
      <div {...stylex.props(styles.right)}>
        <Button variant="ghost" size="sm" onClick={onAccounts}>
          <span {...stylex.props(styles.account)}>
            {account ? (
              <img alt="" {...stylex.props(styles.avatar)} src={account.avatarUrl} />
            ) : (
              <span {...stylex.props(styles.avatar)} />
            )}
            <span {...stylex.props(styles.name)}>{account?.username ?? t.accounts}</span>
          </span>
        </Button>
        <Button variant="ghost" size="sm" onClick={onSettings}>
          {t.settings}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t.minimize}
          onClick={() => window.wooly.window.minimize()}
        >
          <Icon icon={MinusSignIcon} size={14} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={maximized ? t.restore : t.maximize}
          onClick={() => window.wooly.window.maximize()}
        >
          <Icon icon={SquareIcon} size={12} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t.close}
          onClick={() => window.wooly.window.close()}
        >
          <Icon icon={Cancel01Icon} size={14} />
        </Button>
      </div>
    </header>
  )
}
