import * as stylex from '@stylexjs/stylex'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import Settings01Icon from '@hugeicons/core-free-icons/Settings01Icon'
import UserIcon from '@hugeicons/core-free-icons/UserIcon'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { AppUpdateState, GameInstance, InstanceGroup, PublicAccount } from '@shared/types'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { Plate } from './ui/plate'
import { UpdateBanner } from './UpdateBanner'

const styles = stylex.create({
  root: {
    backgroundColor: colors.sidebar,
    borderRightColor: colors.sidebarBorder,
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    height: '100%',
    minWidth: 280,
    padding: 16,
    width: 300
  },
  head: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between'
  },
  title: {
    color: colors.mutedForeground,
    fontSize: 12,
    letterSpacing: '0.08em',
    textTransform: 'uppercase'
  },
  tabs: {
    display: 'flex',
    gap: 4,
    width: '100%'
  },
  tab: {
    borderRadius: 999,
    flex: 1,
    fontSize: 13,
    height: 28
  },
  tabActive: {
    backgroundColor: colors.secondary,
    color: colors.foreground
  },
  list: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 8,
    minHeight: 0,
    overflow: 'auto'
  },
  row: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderRadius: 18,
    borderStyle: 'solid',
    borderWidth: 1,
    color: colors.foreground,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '10px 12px',
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
  empty: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 1.6,
    padding: 12
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 'auto'
  },
  profile: {
    alignItems: 'center',
    display: 'flex',
    gap: 4,
    minWidth: 0,
    paddingBlock: 4
  },
  identity: {
    alignItems: 'center',
    backgroundColor: {
      ':hover': colors.accent,
      default: 'transparent'
    },
    borderRadius: 14,
    borderStyle: 'none',
    color: colors.foreground,
    cursor: 'pointer',
    display: 'flex',
    flex: 1,
    gap: 10,
    minWidth: 0,
    padding: '6px 8px',
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
    color: colors.mutedForeground,
    flexShrink: 0
  },
  gearActive: {
    backgroundColor: colors.accent,
    color: colors.foreground
  }
})

export function InstanceSidebar({
  group,
  onGroup,
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
  group: InstanceGroup
  onGroup: (group: InstanceGroup) => void
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
  const rows = instances.filter((item) => item.group === group)
  return (
    <aside {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.head)}>
        <div {...stylex.props(styles.title)}>{t.instances}</div>
        <Button size="sm" variant="secondary" onClick={onCreate}>
          <Icon icon={PlusSignIcon} size={14} />
          {t.newInstance}
        </Button>
      </div>
      <div {...stylex.props(styles.tabs)} role="tablist" aria-label={t.instances}>
        {(['vanilla', 'modded'] as const).map((item) => (
          <Button
            key={item}
            variant="ghost"
            size="sm"
            role="tab"
            aria-selected={group === item}
            onClick={() => onGroup(item)}
            sx={group === item ? [styles.tab, styles.tabActive] : styles.tab}
          >
            {item === 'vanilla' ? t.vanilla : t.modded}
          </Button>
        ))}
      </div>
      <div {...stylex.props(styles.list)}>
        {rows.length === 0 ? (
          <Plate>
            <p {...stylex.props(styles.empty)}>
              {group === 'modded' ? t.noInstancesModded : t.noInstancesVanilla}
            </p>
          </Plate>
        ) : (
          rows.map((item) => (
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
          ))
        )}
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
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.settings}
            aria-pressed={settingsActive}
            onClick={onSettings}
            sx={settingsActive ? [styles.gear, styles.gearActive] : styles.gear}
          >
            <Icon icon={Settings01Icon} size={18} />
          </Button>
        </div>
      </div>
    </aside>
  )
}
