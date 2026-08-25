import * as stylex from '@stylexjs/stylex'
import Download01Icon from '@hugeicons/core-free-icons/Download01Icon'
import RefreshCwIcon from '@hugeicons/core-free-icons/RefreshCwIcon'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { AppUpdateState } from '@shared/types'
import { Icon } from './ui/icon'

const styles = stylex.create({
  row: {
    alignItems: 'center',
    backgroundColor: {
      ':hover': 'rgb(255 255 255 / 0.05)',
      default: 'transparent'
    },
    borderRadius: 10,
    borderStyle: 'none',
    color: colors.foreground,
    cursor: { ':disabled': 'default', default: 'pointer' },
    display: 'flex',
    font: 'inherit',
    gap: 10,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: '10px 12px',
    position: 'relative',
    textAlign: 'left',
    width: '100%'
  },
  live: {
    color: colors.success
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: '-0.03em',
    lineHeight: 1.2,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  glyph: {
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
    height: 18,
    justifyContent: 'center',
    lineHeight: 0,
    width: 18
  },
  track: {
    backgroundColor: 'rgb(52 211 153 / 0.22)',
    bottom: 0,
    height: 2,
    left: 12,
    position: 'absolute',
    right: 12
  },
  bar: {
    backgroundColor: colors.success,
    height: '100%',
    transition: 'width 0.2s ease-out'
  }
})

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
      {...stylex.props(styles.row, !idle && styles.live)}
    >
      <span {...stylex.props(styles.title)}>{title}</span>
      <span {...stylex.props(styles.glyph)} aria-hidden>
        <Icon icon={idle || update.phase === 'ready' ? RefreshCwIcon : Download01Icon} size={18} />
      </span>
      {busy ? (
        <span {...stylex.props(styles.track)} role="progressbar" aria-valuenow={update.percent}>
          <span {...stylex.props(styles.bar)} style={{ width: `${update.percent}%` }} />
        </span>
      ) : null}
    </button>
  )
}
