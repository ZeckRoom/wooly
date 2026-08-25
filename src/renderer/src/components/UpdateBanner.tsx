import * as stylex from '@stylexjs/stylex'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { AppUpdateState } from '@shared/types'
import { Button } from './ui/button'

const styles = stylex.create({
  card: {
    backgroundColor: colors.info,
    borderRadius: 22,
    boxShadow: '0 8px 24px rgb(20 50 120 / 0.28)',
    color: colors.infoForeground,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '14px 16px'
  },
  kicker: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.08em',
    opacity: 0.86,
    textTransform: 'uppercase'
  },
  title: {
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: '-0.03em',
    lineHeight: 1.25
  },
  meta: {
    fontSize: 12,
    lineHeight: 1.45,
    opacity: 0.9
  },
  track: {
    backgroundColor: 'rgb(255 255 255 / 0.22)',
    borderRadius: 999,
    height: 6,
    overflow: 'hidden',
    width: '100%'
  },
  bar: {
    backgroundColor: colors.infoForeground,
    height: '100%',
    transition: 'width 0.2s ease-out'
  },
  actions: {
    display: 'flex',
    gap: 8
  },
  action: {
    backgroundColor: {
      ':hover': 'rgb(255 255 255 / 0.92)',
      default: '#fff'
    },
    color: colors.info
  }
})

export function UpdateBanner({
  update,
  onDownload,
  onInstall
}: {
  update: AppUpdateState
  onDownload: () => void
  onInstall: () => void
}) {
  if (update.phase === 'idle') return null

  const title =
    update.phase === 'ready'
      ? t.updateReady
      : update.phase === 'downloading'
        ? t.updateDownloading
        : update.phase === 'error'
          ? t.updateError
          : t.updateAvailable

  const meta =
    update.phase === 'error'
      ? update.error
      : update.availableVersion
        ? `${t.updateTo} ${update.availableVersion}`
        : t.updateHint

  return (
    <aside {...stylex.props(styles.card)} aria-live="polite">
      <div {...stylex.props(styles.kicker)}>{t.updateKicker}</div>
      <div {...stylex.props(styles.title)}>{title}</div>
      {meta ? <p {...stylex.props(styles.meta)}>{meta}</p> : null}
      {update.phase === 'downloading' ? (
        <div {...stylex.props(styles.track)} role="progressbar" aria-valuenow={update.percent}>
          <div {...stylex.props(styles.bar)} style={{ width: `${update.percent}%` }} />
        </div>
      ) : null}
      <div {...stylex.props(styles.actions)}>
        {update.phase === 'ready' ? (
          <Button size="sm" sx={styles.action} onClick={onInstall}>
            {t.updateRestart}
          </Button>
        ) : update.phase === 'downloading' ? null : update.phase === 'error' ? (
          <Button size="sm" sx={styles.action} onClick={onDownload}>
            {t.updateRetry}
          </Button>
        ) : (
          <Button size="sm" sx={styles.action} onClick={onDownload}>
            {t.updateNow}
          </Button>
        )}
      </div>
    </aside>
  )
}
