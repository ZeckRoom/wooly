import * as stylex from '@stylexjs/stylex'
import UserIcon from '@hugeicons/core-free-icons/UserIcon'
import { colors, customClassName } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { PublicAccount } from '@shared/types'
import { Icon } from './ui/icon'

const styles = stylex.create({
  chip: {
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: 'rgb(16 18 22 / 0.82)',
    borderRadius: 999,
    borderStyle: 'none',
    color: colors.foreground,
    cursor: 'pointer',
    display: 'flex',
    font: 'inherit',
    gap: 10,
    maxWidth: 240,
    padding: '6px 16px 6px 6px',
    textAlign: 'left',
    WebkitAppearance: 'none'
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: 'rgb(255 255 255 / 0.1)',
    borderRadius: 999,
    color: colors.foreground,
    display: 'flex',
    flexShrink: 0,
    height: 40,
    justifyContent: 'center',
    objectFit: 'cover',
    overflow: 'hidden',
    width: 40
  },
  name: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: 500,
    overflow: 'hidden',
    paddingRight: 4,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
})

export function AccountChip({
  account,
  onClick
}: {
  account: PublicAccount | null
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...stylex.props(styles.chip, customClassName('wooly-glass'))}
    >
      {account ? (
        <img alt="" {...stylex.props(styles.avatar)} src={account.avatarUrl} />
      ) : (
        <span {...stylex.props(styles.avatar)}>
          <Icon icon={UserIcon} size={18} />
        </span>
      )}
      <span {...stylex.props(styles.name)}>{account?.username ?? t.logIn}</span>
    </button>
  )
}
