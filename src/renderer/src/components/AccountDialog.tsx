import { useState } from 'react'
import { t } from '@/lib/i18n'
import type { AuthPrompt, PublicAccount } from '@shared/types'
import { Button } from './ui/button'
import { Dialog } from './ui/dialog'

export function AccountDialog({
  open,
  accounts,
  activeId,
  prompt,
  onClose
}: {
  open: boolean
  accounts: PublicAccount[]
  activeId: string | null
  prompt: AuthPrompt | null
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
      <p className="text-[13px] leading-relaxed text-muted">{t.premiumOnly}</p>
      {prompt ? (
        <div>
          <p className="text-[13px] leading-relaxed text-muted">{prompt.message}</p>
          {prompt.userCode ? (
            <div className="py-2 text-center font-mono text-[22px] tracking-[0.12em] text-success">
              {prompt.userCode}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between gap-3 border-b border-hairline py-3"
          >
            <div className="flex items-center gap-2.5">
              <img alt="" src={account.avatarUrl} className="size-8 rounded-full" />
              <div>
                <div className="font-medium">{account.username}</div>
                <div className="text-[13px] leading-relaxed text-muted">
                  {account.id === activeId ? t.active : account.xboxGamertag}
                </div>
              </div>
            </div>
            <div className="flex gap-1.5">
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
        ))}
      </div>
      {error ? <p className="text-[13px] text-destructive">{error}</p> : null}
      <Button onClick={() => void login()} disabled={busy}>
        {t.addAccount}
      </Button>
    </Dialog>
  )
}
