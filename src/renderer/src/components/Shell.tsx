import { useState } from 'react'
import { t } from '@/lib/i18n'
import type { InstanceDraft } from '@shared/types'
import { AccountDialog } from './AccountDialog'
import { InstanceDetail } from './InstanceDetail'
import { InstanceFormDialog } from './InstanceFormDialog'
import { InstanceRail } from './InstanceRail'
import { LauncherDock } from './LauncherDock'
import { SettingsView } from './SettingsView'
import { TitleBar } from './TitleBar'
import { activeAccount, useLauncher } from '@/state/store'

export function Shell() {
  const store = useLauncher()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const account = activeAccount()
  const selected = store.instances.find((item) => item.id === store.selectedId) ?? null

  const create = async (draft: InstanceDraft) => {
    const created = await window.wooly.instances.create({ ...draft, group: draft.group })
    store.selectInstance(created.id)
  }

  const fail = (error: unknown, fallback: string) => {
    store.setError(error instanceof Error ? error.message : fallback)
  }

  const play = async () => {
    if (!selected) return
    try {
      await window.wooly.launch.play(selected.id)
    } catch (error) {
      fail(error, 'Launch failed.')
    }
  }

  const install = async () => {
    if (!selected) return
    try {
      await window.wooly.install.start(selected.id)
    } catch (error) {
      fail(error, 'Install failed.')
    }
  }

  return (
    <div className="flex h-full flex-row overflow-hidden bg-void">
      <InstanceRail
        instances={store.instances}
        selectedId={store.selectedId}
        account={account}
        onSelect={(id) => {
          store.selectInstance(id)
          store.setView('library')
        }}
        onCreate={() => {
          store.setView('library')
          setCreateOpen(true)
        }}
        onHome={() => store.setView('library')}
        onAccounts={() => setAccountsOpen(true)}
      />
      <div className="relative flex min-w-0 flex-1 flex-col bg-void bg-[radial-gradient(ellipse_78%_42%_at_50%_118%,rgb(22_101_52/0.28),transparent_62%)]">
        <TitleBar
          maximized={store.maximized}
          view={store.view}
          onLibrary={() => store.setView('library')}
          onSettings={() => store.setView('settings')}
        />
        {store.error && store.error !== store.launch.error ? (
          <p role="alert" className="px-5 pb-2 text-[13px] text-destructive">
            {store.error}
          </p>
        ) : null}
        <div className="relative flex min-h-0 flex-1">
          {store.view === 'settings' ? (
            <SettingsView
              settings={store.settings}
              onChange={(settings) => useLauncher.setState({ settings })}
            />
          ) : (
            <InstanceDetail
              instance={selected}
              versions={store.versions}
              launch={store.launch}
              install={store.install}
              logs={store.logs}
              onInstall={() => void install()}
              onEdit={() => setEditOpen(true)}
              onDelete={() => {
                if (!selected) return
                if (!window.confirm(t.deleteConfirm)) return
                void window.wooly.instances.remove(selected.id)
              }}
              onFolder={() => selected && void window.wooly.openPath('instance', selected.id)}
            />
          )}
          <div className="pointer-events-none absolute inset-0 z-20">
            <div className="pointer-events-none absolute right-0 bottom-[18px] left-0 z-21 flex justify-center">
              <LauncherDock
                instances={store.instances}
                selected={selected}
                versions={store.versions}
                launch={store.launch}
                update={store.update}
                onPlay={() => void play()}
                onStop={() => void window.wooly.launch.stop()}
                onSelect={(id) => {
                  store.selectInstance(id)
                  store.setView('library')
                }}
                onCreate={() => {
                  store.setView('library')
                  setCreateOpen(true)
                }}
                onUpdateCheck={() => void window.wooly.update.check()}
                onUpdateDownload={() => void window.wooly.update.download()}
                onUpdateInstall={() => void window.wooly.update.install()}
              />
            </div>
          </div>
        </div>
      </div>
      <InstanceFormDialog
        key={`create-${createOpen}`}
        open={createOpen}
        group="vanilla"
        versions={store.versions}
        existing={store.instances}
        onClose={() => setCreateOpen(false)}
        onSubmit={create}
      />
      <InstanceFormDialog
        key={`edit-${selected?.id ?? 'none'}-${editOpen}`}
        open={editOpen}
        group="vanilla"
        versions={store.versions}
        existing={store.instances}
        instance={selected}
        onClose={() => setEditOpen(false)}
        onSubmit={async (draft) => {
          if (!selected) return
          await window.wooly.instances.update(selected.id, draft)
        }}
      />
      <AccountDialog
        open={accountsOpen}
        accounts={store.accounts}
        activeId={store.activeAccountId}
        prompt={store.authPrompt}
        onClose={() => setAccountsOpen(false)}
      />
    </div>
  )
}
