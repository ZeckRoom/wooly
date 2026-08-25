import * as stylex from '@stylexjs/stylex'
import UserIcon from '@hugeicons/core-free-icons/UserIcon'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { PublicAccount } from '@shared/types'
import { Icon } from './ui/icon'

const styles = stylex.create({
  compact: {
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: 'transparent',
    borderStyle: 'none',
    color: colors.foreground,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    font: 'inherit',
    gap: 4,
    padding: 0,
    width: 56
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 999,
    borderStyle: 'solid',
    borderWidth: 1,
    color: colors.foreground,
    display: 'flex',
    flexShrink: 0,
    height: 48,
    justifyContent: 'center',
    objectFit: 'cover',
    overflow: 'hidden',
    width: 48
  },
  name: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: 500,
    maxWidth: '100%',
    overflow: 'hidden',
    textAlign: 'center',
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
  const label = account?.username ?? t.logIn
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} {...stylex.props(styles.compact)}>
      {account ? (
        <img alt="" {...stylex.props(styles.avatar)} src={account.avatarUrl} />
      ) : (
        <span {...stylex.props(styles.avatar)}>
          <Icon icon={UserIcon} size={18} />
        </span>
      )}
      <span {...stylex.props(styles.name)}>{label}</span>
    </button>
  )
}
