import * as stylex from '@stylexjs/stylex'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import Settings01Icon from '@hugeicons/core-free-icons/Settings01Icon'
import UserIcon from '@hugeicons/core-free-icons/UserIcon'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { AppUpdateState, GameInstance, PublicAccount } from '@shared/types'
import { Icon } from './ui/icon'
import { UpdateBanner } from './UpdateBanner'

const styles = stylex.create({
  root: {
    backgroundColor: colors.sidebar,
    borderRightColor: colors.sidebarBorder,
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minWidth: 280,
    padding: 0,
    width: 300
  },
  head: {
    alignItems: 'center',
    backgroundColor: {
      ':hover': 'color-mix(in srgb, white 10%, var(--success))',
      default: colors.success
    },
    borderRadius: 0,
    borderStyle: 'none',
    color: colors.successForeground,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    font: 'inherit',
    fontWeight: 500,
    gap: 8,
    justifyContent: 'flex-start',
    padding: '10px 16px',
    textAlign: 'left',
    width: '100%'
  },
  list: {
    alignItems: 'stretch',
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 0,
    minHeight: 0,
    overflow: 'auto',
    padding: 0,
    width: '100%'
  },
  row: {
    backgroundColor: {
      ':hover': colors.accent,
      default: 'transparent'
    },
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    borderRadius: 0,
    borderStyle: 'none',
    color: colors.foreground,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: 2,
    padding: '12px 16px',
    textAlign: 'left',
    width: '100%'
  },
  rowActive: {
    backgroundColor: colors.accent
  },
  name: {
    fontSize: 14,
    fontWeight: 500
  },
  meta: {
    color: colors.mutedForeground,
    fontSize: 12
  },
  footer: {
    borderColor: colors.border,
    borderLeftWidth: 0,
    borderRadius: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderStyle: 'solid',
    borderTopWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    marginTop: 'auto',
    overflow: 'hidden',
    width: '100%'
  },
  profile: {
    alignItems: 'stretch',
    borderTopColor: colors.border,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    display: 'flex',
    minHeight: 56,
    minWidth: 0,
    padding: 0
  },
  identity: {
    alignItems: 'center',
    backgroundColor: {
      ':hover': colors.accent,
      default: 'transparent'
    },
    borderRadius: 0,
    borderStyle: 'none',
    color: colors.foreground,
    cursor: 'pointer',
    display: 'flex',
    flex: 1,
    gap: 10,
    minWidth: 0,
    padding: '10px 12px',
    textAlign: 'left'
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 999,
    color: colors.mutedForeground,
    display: 'flex',
    flexShrink: 0,
    height: 36,
    justifyContent: 'center',
    objectFit: 'cover',
    overflow: 'hidden',
    width: 36
  },
  identityText: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 1,
    minWidth: 0
  },
  accountName: {
    fontSize: 14,
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  accountMeta: {
    color: colors.mutedForeground,
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  gear: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: {
      ':hover': colors.accent,
      default: 'transparent'
    },
    borderRadius: 0,
    borderStyle: 'none',
    color: colors.mutedForeground,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    width: 52
  },
  gearActive: {
    backgroundColor: colors.accent,
    color: colors.foreground
  }
})

export function InstanceSidebar({
  instances,
  selectedId,
  onSelect,
  onCreate,
  account,
  onAccounts,
  settingsActive,
  onSettings,
  update,
  onUpdateCheck,
  onUpdateDownload,
  onUpdateInstall
}: {
  instances: GameInstance[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  account: PublicAccount | null
  onAccounts: () => void
  settingsActive: boolean
  onSettings: () => void
  update: AppUpdateState
  onUpdateCheck: () => void
  onUpdateDownload: () => void
  onUpdateInstall: () => void
}) {
  return (
    <aside {...stylex.props(styles.root)}>
      <button type="button" onClick={onCreate} {...stylex.props(styles.head)}>
        <Icon icon={PlusSignIcon} size={14} />
        {t.newInstance}
      </button>
      <div {...stylex.props(styles.list)}>
        {instances.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            {...stylex.props(styles.row, selectedId === item.id && styles.rowActive)}
          >
            <span {...stylex.props(styles.name)}>{item.name}</span>
            <span {...stylex.props(styles.meta)}>
              {item.versionId} · {item.versionType === 'snapshot' ? t.snapshot : t.releases}
            </span>
          </button>
        ))}
      </div>
      <div {...stylex.props(styles.footer)}>
        <UpdateBanner
          update={update}
          onCheck={onUpdateCheck}
          onDownload={onUpdateDownload}
          onInstall={onUpdateInstall}
        />
        <div {...stylex.props(styles.profile)}>
          <button type="button" onClick={onAccounts} {...stylex.props(styles.identity)}>
            {account ? (
              <img alt="" {...stylex.props(styles.avatar)} src={account.avatarUrl} />
            ) : (
              <span {...stylex.props(styles.avatar)}>
                <Icon icon={UserIcon} size={18} />
              </span>
            )}
            <span {...stylex.props(styles.identityText)}>
              <span {...stylex.props(styles.accountName)}>
                {account?.username ?? t.accounts}
              </span>
              <span {...stylex.props(styles.accountMeta)}>
                {account ? t.premium : t.signInShort}
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-label={t.settings}
            aria-pressed={settingsActive}
            onClick={onSettings}
            {...stylex.props(styles.gear, settingsActive && styles.gearActive)}
          >
            <Icon icon={Settings01Icon} size={18} />
          </button>
        </div>
      </div>
    </aside>
  )
}
