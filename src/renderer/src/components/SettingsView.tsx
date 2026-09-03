import { kicker } from '@/lib/chrome'
import { t } from '@/lib/i18n'
import type { AppSettings } from '@shared/types'
import { useLauncher } from '@/state/store'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Well } from './ui/well'

export function SettingsView({
  settings,
  onChange
}: {
  settings: AppSettings
  onChange: (settings: AppSettings) => void
}) {
  const appVersion = useLauncher((s) => s.update.currentVersion)

  return (
    <main className="flex min-h-0 min-w-0 w-full flex-1 flex-col gap-5 px-8 pt-5 pb-[120px]">
      <div>
        <div className={kicker}>{t.appName}</div>
        <h1 className="text-[28px] font-medium tracking-[-0.03em]">{t.settings}</h1>
      </div>
      <Well>
        <div className="flex flex-col gap-3.5 px-5 py-[18px]">
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={settings.keepOpenOnLaunch}
              onCheckedChange={(checked) => {
                void window.wooly.settings.set({ keepOpenOnLaunch: checked }).then(onChange)
              }}
            />
            {t.keepOpen}
          </label>
          <p className="text-[13px] leading-relaxed text-muted">{t.microsoftReady}</p>
          <p className="text-[13px] leading-relaxed text-muted">
            {t.language}: {t.languageValue}. {t.languageSoon}
          </p>
          <p className="text-[13px] leading-relaxed text-muted">
            {t.appVersion}{' '}
            <span className="font-mono text-[13px] tabular-nums text-success">{appVersion}</span>
          </p>
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => void window.wooly.update.check()}>
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
