import { useEffect, useRef } from 'react'
import { kicker } from '@/lib/chrome'
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
      <main className="flex min-h-0 min-w-0 w-full flex-1 flex-col gap-7 px-8 pt-5 pb-[120px]">
        <div className="flex flex-col gap-2.5">
          <div className={kicker}>{t.appName}</div>
          <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.03em]">
            {t.noInstances}
          </h1>
          <p className="text-[13px] text-muted">{t.noInstancesVanilla}</p>
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
    <main className="flex min-h-0 min-w-0 w-full flex-1 flex-col gap-7 px-8 pt-5 pb-[120px]">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={kicker}>{t.instances}</div>
            <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.03em]">
              {instance.name}
            </h1>
            <p className="font-mono text-[13px] tracking-[-0.02em] text-muted">
              <span className={version?.latestRelease ? 'text-success' : undefined}>
                {instance.versionId}
              </span>
              {version?.latestRelease ? ` · ${t.latest}` : ''}
              {version?.latestSnapshot ? ` · ${t.snapshot}` : ''}
              {` · ${instance.memoryMaxMb} ${t.mb}`}
            </p>
            <p className="text-[13px] text-muted">
              {t.lastPlayed}: {lastPlayed}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={onInstall} disabled={busy}>
              <Icon name="download" size={16} />
              {installLabel(launch.phase, launch.instanceId ?? '', instance.id)}
            </Button>
            <Button variant="secondary" onClick={onEdit} disabled={busy}>
              {t.edit}
            </Button>
            <Button variant="ghost" onClick={onFolder} aria-label={t.folder}>
              <Icon name="folder" size={16} />
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
          <p className="text-[13px] text-destructive-edge">{launch.error}</p>
        ) : null}
      </div>
      <Well className="flex min-h-[180px] min-w-0 flex-1 flex-col">
        <div className="border-b border-hairline px-[18px] py-3">
          <div className={kicker}>{t.console}</div>
        </div>
        <div
          ref={consoleRef}
          className="min-h-[140px] flex-1 cursor-text overflow-auto px-[18px] pt-3 pb-4 font-mono text-xs leading-[1.65] whitespace-pre-wrap text-[#c4cdc8] select-text"
        >
          {logs.length === 0 ? (
            <span className="text-[13px] text-muted">{t.consoleEmpty}</span>
          ) : (
            logs.map((line) => (
              <div
                key={line.id}
                className={
                  line.stream === 'stderr'
                    ? 'text-destructive-edge'
                    : line.stream === 'launcher'
                      ? 'text-success'
                      : 'text-[#c4cdc8]'
                }
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
