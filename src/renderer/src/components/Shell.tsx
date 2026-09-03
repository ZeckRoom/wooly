import { useState } from 'react'
import { stage } from '@/lib/chrome'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { InstanceDraft } from '@shared/types'
import { AccountDialog } from './AccountDialog'
import { InstanceDetail } from './InstanceDetail'
import { InstanceFormDialog } from './InstanceFormDialog'
import { InstanceRail } from './InstanceRail'
import { LauncherDock } from './LauncherDock'
import { SettingsView } from './SettingsView'
import { TitleBar } from './TitleBar'
import {
  getSelectedInstance,
  useActiveAccount,
  useLauncher,
  useSelectedInstance,
  useShellChrome
} from '@/state/store'

export function Shell() {
  const {
    view,
    instances,
    versions,
    settings,
    accounts,
    activeAccountId,
    authPrompt,
    maximized,
    error,
    launchError,
    selectInstance,
    setView,
    setError
  } = useShellChrome()
  const account = useActiveAccount()
  const selected = useSelectedInstance()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)

  const create = async (draft: InstanceDraft) => {
    const created = await window.wooly.instances.create({ ...draft, group: draft.group })
    selectInstance(created.id)
  }

  const fail = (error: unknown, fallback: string) => {
    setError(error instanceof Error ? error.message : fallback)
  }

  const play = async () => {
    const instance = getSelectedInstance()
    if (!instance) return
    try {
      await window.wooly.launch.play(instance.id)
    } catch (error) {
      fail(error, 'Launch failed.')
    }
  }

  const install = async () => {
    const instance = getSelectedInstance()
    if (!instance) return
    try {
      await window.wooly.install.start(instance.id)
    } catch (error) {
      fail(error, 'Install failed.')
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-row overflow-hidden bg-void">
      <InstanceRail
        instances={instances}
        selectedId={selected?.id ?? null}
        account={account}
        onSelect={(id) => {
          selectInstance(id)
          setView('library')
        }}
        onCreate={() => {
          setView('library')
          setCreateOpen(true)
        }}
        onHome={() => setView('library')}
        onAccounts={() => setAccountsOpen(true)}
      />
      <section
        className={cn(
          'relative my-[var(--frame-gap)] mr-[var(--frame-gap)] ml-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
          stage,
          maximized ? 'rounded-none' : 'rounded-[var(--stage)] border border-white/10'
        )}
      >
        <TitleBar
          maximized={maximized}
          view={view}
          onLibrary={() => setView('library')}
          onSettings={() => setView('settings')}
        />
        {error && error !== launchError ? (
          <p role="alert" className="px-5 pb-2 text-[13px] text-destructive">
            {error}
          </p>
        ) : null}
        <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
          {view === 'settings' ? (
            <SettingsView
              settings={settings}
              onChange={(next) => useLauncher.setState({ settings: next })}
            />
          ) : (
            <InstanceDetail
              onInstall={() => void install()}
              onEdit={() => setEditOpen(true)}
              onDelete={() => {
                const instance = getSelectedInstance()
                if (!instance) return
                if (!window.confirm(t.deleteConfirm)) return
                void window.wooly.instances.remove(instance.id)
              }}
              onFolder={() => {
                const instance = getSelectedInstance()
                if (instance) void window.wooly.openPath('instance', instance.id)
              }}
            />
          )}
          <div className="pointer-events-none absolute inset-0 z-20">
            <LauncherDock
              onPlay={() => void play()}
              onStop={() => void window.wooly.launch.stop()}
              onSelect={(id) => {
                selectInstance(id)
                setView('library')
              }}
              onCreate={() => {
                setView('library')
                setCreateOpen(true)
              }}
              onUpdateCheck={() => void window.wooly.update.check()}
              onUpdateDownload={() => void window.wooly.update.download()}
              onUpdateInstall={() => void window.wooly.update.install()}
            />
          </div>
        </div>
      </section>
      <InstanceFormDialog
        key={`create-${createOpen}`}
        open={createOpen}
        group="vanilla"
        versions={versions}
        existing={instances}
        onClose={() => setCreateOpen(false)}
        onSubmit={create}
      />
      <InstanceFormDialog
        key={`edit-${selected?.id ?? 'none'}-${editOpen}`}
        open={editOpen}
        group="vanilla"
        versions={versions}
        existing={instances}
        instance={selected}
        onClose={() => setEditOpen(false)}
        onSubmit={async (draft) => {
          const instance = getSelectedInstance()
          if (!instance) return
          await window.wooly.instances.update(instance.id, draft)
        }}
      />
      <AccountDialog
        open={accountsOpen}
        accounts={accounts}
        activeId={activeAccountId}
        prompt={authPrompt}
        onClose={() => setAccountsOpen(false)}
      />
    </div>
  )
}
