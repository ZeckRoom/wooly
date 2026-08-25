import * as stylex from '@stylexjs/stylex'
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon'
import Settings01Icon from '@hugeicons/core-free-icons/Settings01Icon'
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
    backgroundColor: colors.background,
    borderRadius: 999,
    display: 'flex',
    gap: 2,
    padding: 3,
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
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  },
  navBtn: {
    justifyContent: 'flex-start',
    width: '100%'
  },
  navActive: {
    backgroundColor: colors.accent
  },
  account: {
    alignItems: 'center',
    display: 'flex',
    gap: 8,
    minWidth: 0,
    overflow: 'hidden'
  },
  avatar: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    flexShrink: 0,
    height: 22,
    objectFit: 'cover',
    width: 22
  },
  accountName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
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
        <div {...stylex.props(styles.nav)}>
          <Button variant="ghost" size="sm" onClick={onAccounts} sx={styles.navBtn}>
            <span {...stylex.props(styles.account)}>
              {account ? (
                <img alt="" {...stylex.props(styles.avatar)} src={account.avatarUrl} />
              ) : (
                <span {...stylex.props(styles.avatar)} />
              )}
              <span {...stylex.props(styles.accountName)}>
                {account?.username ?? t.accounts}
              </span>
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={settingsActive}
            onClick={onSettings}
            sx={settingsActive ? [styles.navBtn, styles.navActive] : styles.navBtn}
          >
            <Icon icon={Settings01Icon} size={14} />
            {t.settings}
          </Button>
        </div>
      </div>
    </aside>
  )
}
