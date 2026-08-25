import * as stylex from '@stylexjs/stylex'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { AppSettings } from '@shared/types'
import { useLauncher } from '@/state/store'
import { Button } from './ui/button'
import { Well } from './ui/well'

const styles = stylex.create({
  root: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 20,
    padding: '20px 32px 120px'
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
    letterSpacing: '-0.03em'
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    padding: '18px 20px'
  },
  muted: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 1.6
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: 10
  },
  version: {
    color: colors.success,
    fontFamily: "'Geist Mono Variable', ui-monospace, Consolas, monospace",
    fontSize: 13
  }
})

export function SettingsView({
  settings,
  onChange
}: {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}) {
  const appVersion = useLauncher((s) => s.update.currentVersion)

  return (
    <main {...stylex.props(styles.root)}>
      <div>
        <div {...stylex.props(styles.kicker)}>{t.appName}</div>
        <h1 {...stylex.props(styles.title)}>{t.settings}</h1>
      </div>
      <Well>
        <div {...stylex.props(styles.body)}>
          <label {...stylex.props(styles.row)}>
            <input
              type="checkbox"
              checked={settings.keepOpenOnLaunch}
              onChange={(e) => {
                void window.wooly.settings
                  .set({ keepOpenOnLaunch: e.target.checked })
                  .then(onChange)
              }}
            />
            {t.keepOpen}
          </label>
          <p {...stylex.props(styles.muted)}>{t.microsoftReady}</p>
          <p {...stylex.props(styles.muted)}>
            {t.language}: {t.languageValue}. {t.languageSoon}
          </p>
          <p {...stylex.props(styles.muted)}>
            {t.appVersion} <span {...stylex.props(styles.version)}>{appVersion}</span>
          </p>
          <div {...stylex.props(styles.row)}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void window.wooly.update.check()}
            >
              {t.updateCheck}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void window.wooly.openPath('root')}
            >
              {t.dataFolder}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void window.wooly.openPath('meta')}
            >
              {t.metaFolder}
            </Button>
          </div>
        </div>
      </Well>
    </main>
  )
}
