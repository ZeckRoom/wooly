import { useEffect, useRef } from 'react'
import * as stylex from '@stylexjs/stylex'
import Download01Icon from '@hugeicons/core-free-icons/Download01Icon'
import FolderOpenIcon from '@hugeicons/core-free-icons/FolderOpenIcon'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import { formatBytes, formatSpeed } from '@shared/minecraft'
import type {
  CatalogVersion,
  GameInstance,
  InstallProgress,
  LaunchState,
  LogLine
} from '@shared/types'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { Progress } from './ui/progress'
import { Well } from './ui/well'

const styles = stylex.create({
  root: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 28,
    minWidth: 0,
    padding: '20px 32px 120px'
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  titleRow: {
    alignItems: 'flex-start',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16
  },
  kicker: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.12em',
    textTransform: 'uppercase'
  },
  title: {
    fontSize: 28,
    fontWeight: 500,
    letterSpacing: '-0.03em',
    lineHeight: 1.15
  },
  muted: {
    color: colors.mutedForeground,
    fontSize: 13
  },
  meta: {
    color: colors.mutedForeground,
    fontFamily: "'Geist Mono Variable', ui-monospace, Consolas, monospace",
    fontSize: 13,
    letterSpacing: '-0.02em'
  },
  latest: {
    color: colors.success
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end'
  },
  consoleWell: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minHeight: 180,
    minWidth: 0
  },
  consoleHead: {
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    padding: '12px 18px'
  },
  console: {
    color: '#c4cdc8',
    cursor: 'text',
    flex: 1,
    fontFamily: "'Geist Mono Variable', ui-monospace, Consolas, monospace",
    fontSize: 12,
    lineHeight: 1.65,
    minHeight: 140,
    overflow: 'auto',
    padding: '12px 18px 16px',
    userSelect: 'text',
    whiteSpace: 'pre-wrap'
  },
  err: { color: '#fb923c' },
  out: { color: '#c4cdc8' },
  launch: { color: colors.success }
})

function installLabel(phase: LaunchState['phase'], instanceId: string, currentId: string): string {
  if (instanceId === currentId && phase === 'installing') return t.installing
  return t.install
}

export function InstanceDetail({
  instance,
  versions,
  launch,
  install,
  logs,
  onInstall,
  onEdit,
  onDelete,
  onFolder
}: {
  instance: GameInstance | null
  versions: CatalogVersion[]
  launch: LaunchState
  install: InstallProgress | null
  logs: LogLine[]
  onInstall: () => void
  onEdit: () => void
  onDelete: () => void
  onFolder: () => void
}) {
  const consoleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = consoleRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [logs])

  if (!instance) {
    return (
      <main {...stylex.props(styles.root)}>
        <div {...stylex.props(styles.hero)}>
          <div {...stylex.props(styles.kicker)}>{t.appName}</div>
          <h1 {...stylex.props(styles.title)}>{t.noInstances}</h1>
          <p {...stylex.props(styles.muted)}>{t.noInstancesVanilla}</p>
        </div>
      </main>
    )
  }

  const busy = launch.phase !== 'idle' && launch.instanceId === instance.id
  const percent =
    install && install.total > 0
      ? Math.round((install.current / install.total) * 100)
      : busy
        ? 15
        : 0
  const version = versions.find((item) => item.id === instance.versionId)
  const lastPlayed = instance.lastPlayedAt
    ? new Date(instance.lastPlayedAt).toLocaleString()
    : t.never

  return (
    <main {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.hero)}>
        <div {...stylex.props(styles.titleRow)}>
          <div>
            <div {...stylex.props(styles.kicker)}>{t.instances}</div>
            <h1 {...stylex.props(styles.title)}>{instance.name}</h1>
            <p {...stylex.props(styles.meta)}>
              <span {...stylex.props(version?.latestRelease && styles.latest)}>
                {instance.versionId}
              </span>
              {version?.latestRelease ? ` · ${t.latest}` : ''}
              {version?.latestSnapshot ? ` · ${t.snapshot}` : ''}
              {` · ${instance.memoryMaxMb} ${t.mb}`}
            </p>
            <p {...stylex.props(styles.muted)}>
              {t.lastPlayed}: {lastPlayed}
            </p>
          </div>
          <div {...stylex.props(styles.actions)}>
            <Button variant="secondary" onClick={onInstall} disabled={busy}>
              <Icon icon={Download01Icon} size={14} />
              {installLabel(launch.phase, launch.instanceId ?? '', instance.id)}
            </Button>
            <Button variant="secondary" onClick={onEdit} disabled={busy}>
              {t.edit}
            </Button>
            <Button variant="ghost" onClick={onFolder} aria-label={t.folder}>
              <Icon icon={FolderOpenIcon} size={16} />
            </Button>
            <Button variant="ghost" onClick={onDelete} disabled={busy}>
              {t.delete}
            </Button>
          </div>
        </div>
        {busy && install ? (
          <Progress
            value={percent}
            label={`${install.label}${install.speed ? ` · ${formatSpeed(install.speed)}` : ''}${
              install.total
                ? ` · ${formatBytes(install.current)} / ${formatBytes(install.total)}`
                : ''
            }`}
          />
        ) : null}
        {launch.error && launch.instanceId === instance.id ? (
          <p {...stylex.props(styles.err)}>{launch.error}</p>
        ) : null}
      </div>
      <Well sx={styles.consoleWell}>
        <div {...stylex.props(styles.consoleHead)}>
          <div {...stylex.props(styles.kicker)}>{t.console}</div>
        </div>
        <div ref={consoleRef} {...stylex.props(styles.console)}>
          {logs.length === 0 ? (
            <span {...stylex.props(styles.muted)}>{t.consoleEmpty}</span>
          ) : (
            logs.map((line) => (
              <div
                key={line.id}
                {...stylex.props(
                  line.stream === 'stderr'
                    ? styles.err
                    : line.stream === 'launcher'
                      ? styles.launch
                      : styles.out
                )}
              >
                {line.text}
              </div>
            ))
          )}
        </div>
      </Well>
    </main>
  )
}
