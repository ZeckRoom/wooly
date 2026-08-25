import { useEffect, useRef } from 'react'
import * as stylex from '@stylexjs/stylex'
import Download01Icon from '@hugeicons/core-free-icons/Download01Icon'
import FolderOpenIcon from '@hugeicons/core-free-icons/FolderOpenIcon'
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon'
import StopIcon from '@hugeicons/core-free-icons/StopIcon'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import { formatBytes, formatSpeed } from '@shared/minecraft'
import type {
  CatalogVersion,
  GameInstance,
  InstallProgress,
  InstanceGroup,
  LaunchState,
  LogLine
} from '@shared/types'
import { Button } from './ui/button'
import { Icon } from './ui/icon'
import { Plate } from './ui/plate'
import { Progress } from './ui/progress'

const styles = stylex.create({
  root: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 16,
    minWidth: 0,
    padding: '8px 20px 20px 8px'
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '20px 22px'
  },
  titleRow: {
    alignItems: 'flex-start',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16
  },
  title: {
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: '-0.04em'
  },
  muted: {
    color: colors.mutedForeground,
    fontSize: 13
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end'
  },
  console: {
    backgroundColor: '#120f0c',
    borderRadius: 18,
    color: '#d8cfc4',
    cursor: 'text',
    flex: 1,
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontSize: 12,
    lineHeight: 1.6,
    minHeight: 180,
    overflow: 'auto',
    padding: 14,
    userSelect: 'text',
    whiteSpace: 'pre-wrap'
  },
  err: { color: '#e26d5a' },
  out: { color: '#d8cfc4' },
  launch: { color: colors.primary }
})

function playLabel(phase: LaunchState['phase']): string {
  if (phase === 'installing') return t.installing
  if (phase === 'launching') return t.launching
  if (phase === 'running') return t.playing
  if (phase === 'stopping') return t.stop
  return t.play
}

export function InstanceDetail({
  instance,
  group,
  versions,
  launch,
  install,
  logs,
  onPlay,
  onInstall,
  onStop,
  onEdit,
  onDelete,
  onFolder
}: {
  instance: GameInstance | null
  group: InstanceGroup
  versions: CatalogVersion[]
  launch: LaunchState
  install: InstallProgress | null
  logs: LogLine[]
  onPlay: () => void
  onInstall: () => void
  onStop: () => void
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
        <Plate>
          <div {...stylex.props(styles.hero)}>
            <h1 {...stylex.props(styles.title)}>{t.noInstances}</h1>
            <p {...stylex.props(styles.muted)}>
              {group === 'modded' ? t.noInstancesModded : t.noInstancesVanilla}
            </p>
          </div>
        </Plate>
      </main>
    )
  }

  const busy = launch.phase !== 'idle' && launch.instanceId === instance.id
  const running = launch.phase === 'running' && launch.instanceId === instance.id
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
      <Plate>
        <div {...stylex.props(styles.hero)}>
          <div {...stylex.props(styles.titleRow)}>
            <div>
              <h1 {...stylex.props(styles.title)}>{instance.name}</h1>
              <p {...stylex.props(styles.muted)}>
                {instance.versionId}
                {version?.latestRelease ? ` · ${t.latest}` : ''}
                {version?.latestSnapshot ? ` · ${t.snapshot}` : ''}
                {` · ${instance.memoryMaxMb} ${t.mb}`}
              </p>
              <p {...stylex.props(styles.muted)}>
                {t.lastPlayed}: {lastPlayed}
              </p>
            </div>
            <div {...stylex.props(styles.actions)}>
              {running ? (
                <Button variant="secondary" onClick={onStop}>
                  <Icon icon={StopIcon} size={14} />
                  {t.stop}
                </Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={onInstall} disabled={busy}>
                    <Icon icon={Download01Icon} size={14} />
                    {launch.instanceId === instance.id && launch.phase === 'installing'
                      ? t.installing
                      : t.install}
                  </Button>
                  <Button onClick={onPlay} disabled={busy}>
                    <Icon icon={PlayIcon} size={14} />
                    {playLabel(launch.instanceId === instance.id ? launch.phase : 'idle')}
                  </Button>
                </>
              )}
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
      </Plate>
      <Plate>
        <div {...stylex.props(styles.hero)} style={{ paddingBottom: 8 }}>
          <div {...stylex.props(styles.title)} style={{ fontSize: 14 }}>
            {t.console}
          </div>
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
      </Plate>
    </main>
  )
}
