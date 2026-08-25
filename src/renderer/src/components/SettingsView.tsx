import { useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { AppSettings } from '@shared/types'
import { useLauncher } from '@/state/store'
import { Button } from './ui/button'
import { Plate } from './ui/plate'

const styles = stylex.create({
  root: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: 16,
    padding: '8px 24px 24px'
  },
  title: {
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: '-0.04em'
  },
  plate: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 20
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
      <h1 {...stylex.props(styles.title)}>{t.settings}</h1>
      <Plate>
        <div {...stylex.props(styles.plate)}>
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
            {t.appVersion} {appVersion}
          </p>
          <div {...stylex.props(styles.row)}>
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
      </Plate>
    </main>
  )
}
