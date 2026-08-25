import { useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { AuthPrompt, PublicAccount } from '@shared/types'
import { Button } from './ui/button'
import { Dialog } from './ui/dialog'

const styles = stylex.create({
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  row: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    display: 'flex',
    gap: 12,
    justifyContent: 'space-between',
    padding: 10
  },
  who: { alignItems: 'center', display: 'flex', gap: 10 },
  avatar: { borderRadius: 999, height: 32, width: 32 },
  muted: { color: colors.mutedForeground, fontSize: 13, lineHeight: 1.6 },
  code: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    fontFamily: 'ui-monospace, Consolas, monospace',
    fontSize: 22,
    letterSpacing: '0.12em',
    padding: '10px 14px',
    textAlign: 'center'
  },
  error: { color: colors.destructive, fontSize: 13 }
})

export function AccountDialog({
  open,
  accounts,
  activeId,
  prompt,
  clientId,
  onClose
}: {
  open: boolean
  accounts: PublicAccount[]
  activeId: string | null
  prompt: AuthPrompt | null
  clientId: string
  onClose: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const login = async () => {
    setError(null)
    setBusy(true)
    try {
      await window.wooly.accounts.login()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} title={t.accounts} onClose={onClose}>
      <p {...stylex.props(styles.muted)}>{t.premiumOnly}</p>
      {prompt ? (
        <div>
          <p {...stylex.props(styles.muted)}>{prompt.message}</p>
          {prompt.userCode ? <div {...stylex.props(styles.code)}>{prompt.userCode}</div> : null}
        </div>
      ) : null}
      <div {...stylex.props(styles.list)}>
        {accounts.length === 0 ? (
          <p {...stylex.props(styles.muted)}>{t.noAccountsHint}</p>
        ) : (
          accounts.map((account) => (
            <div key={account.id} {...stylex.props(styles.row)}>
              <div {...stylex.props(styles.who)}>
                <img alt="" src={account.avatarUrl} {...stylex.props(styles.avatar)} />
                <div>
                  <div>{account.username}</div>
                  <div {...stylex.props(styles.muted)}>
                    {account.id === activeId ? t.active : account.xboxGamertag}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {account.id !== activeId ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void window.wooly.accounts.select(account.id)}
                  >
                    {t.useAccount}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void window.wooly.accounts.logout(account.id)}
                >
                  {t.signOut}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      {error ? <p {...stylex.props(styles.error)}>{error}</p> : null}
      <Button onClick={() => void login()} disabled={busy || !clientId}>
        {t.addAccount}
      </Button>
      {!clientId ? <p {...stylex.props(styles.muted)}>{t.needClientId}</p> : null}
    </Dialog>
  )
}
