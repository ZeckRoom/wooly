import Download01Icon from '@hugeicons/core-free-icons/Download01Icon'
import RefreshCwIcon from '@hugeicons/core-free-icons/RefreshCwIcon'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { AppUpdateState } from '@shared/types'
import { Icon } from './ui/icon'

export function UpdateBanner({
  update,
  onCheck,
  onDownload,
  onInstall
}: {
  update: AppUpdateState
  onCheck?: () => void
  onDownload: () => void
  onInstall: () => void
}) {
  const busy = update.phase === 'downloading'
  const idle = update.phase === 'idle'
  const title =
    update.phase === 'ready'
      ? t.updateReady
      : update.phase === 'downloading'
        ? t.updateDownloading
        : update.phase === 'error'
          ? t.updateError
          : idle
            ? t.updateCheck
            : t.updateAvailable

  const hint =
    update.phase === 'error'
      ? (update.error ?? t.updateError)
      : update.availableVersion
        ? `${t.updateTo} ${update.availableVersion}`
        : idle
          ? `${t.appVersion} ${update.currentVersion}`
          : t.updateHint

  const activate = () => {
    if (busy) return
    if (update.phase === 'ready') onInstall()
    else if (update.phase === 'error') (onCheck ?? onDownload)()
    else if (idle) onCheck?.()
    else onDownload()
  }

  return (
    <button
      type="button"
      disabled={busy || (idle && !onCheck)}
      title={hint}
      aria-live="polite"
      aria-label={hint ? `${title}. ${hint}` : title}
      onClick={activate}
      className={cn(
        'relative flex w-full items-center justify-between gap-2.5 overflow-hidden rounded-[10px] bg-transparent px-3 py-2.5 text-left text-ink hover:enabled:bg-white/[0.05] disabled:cursor-default',
        !idle && 'text-success'
      )}
    >
      <span className="min-w-0 flex-1 truncate text-sm font-medium tracking-[-0.03em] leading-tight">
        {title}
      </span>
      <span
        className="flex size-[18px] shrink-0 items-center justify-center leading-none"
        aria-hidden
      >
        <Icon icon={idle || update.phase === 'ready' ? RefreshCwIcon : Download01Icon} size={18} />
      </span>
      {busy ? (
        <span
          className="absolute right-3 bottom-0 left-3 h-0.5 bg-success/22"
          role="progressbar"
          aria-valuenow={update.percent}
        >
          <span
            className="block h-full bg-success transition-[width] duration-200 ease-out"
            style={{ width: `${update.percent}%` }}
          />
        </span>
      ) : null}
    </button>
  )
}
