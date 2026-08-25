import { useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { InstanceDraft } from '@shared/types'
import { AccountDialog } from './AccountDialog'
import { InstanceDetail } from './InstanceDetail'
import { InstanceFormDialog } from './InstanceFormDialog'
import { InstanceSidebar } from './InstanceSidebar'
import { SettingsView } from './SettingsView'
import { TitleBar } from './TitleBar'
import { activeAccount, useLauncher } from '@/state/store'

const styles = stylex.create({
  root: {
    backgroundColor: colors.background,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative'
  },
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0
  },
  banner: {
    color: colors.destructive,
    fontSize: 13,
    padding: '0 20px 8px'
  }
})

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
    <div {...stylex.props(styles.root)}>
      <TitleBar maximized={store.maximized} />
      {store.error && store.error !== store.launch.error ? (
        <p role="alert" {...stylex.props(styles.banner)}>
          {store.error}
        </p>
      ) : null}
      <div {...stylex.props(styles.body)}>
        <InstanceSidebar
          instances={store.instances}
          selectedId={store.selectedId}
          onSelect={(id) => {
            store.selectInstance(id)
            store.setView('library')
          }}
          onCreate={() => {
            store.setView('library')
            setCreateOpen(true)
          }}
          account={account}
          onAccounts={() => setAccountsOpen(true)}
          settingsActive={store.view === 'settings'}
          onSettings={() => store.setView(store.view === 'settings' ? 'library' : 'settings')}
          update={store.update}
          onUpdateCheck={() => void window.wooly.update.check()}
          onUpdateDownload={() => void window.wooly.update.download()}
          onUpdateInstall={() => void window.wooly.update.install()}
        />
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
            onPlay={() => void play()}
            onInstall={() => void install()}
            onStop={() => void window.wooly.launch.stop()}
            onEdit={() => setEditOpen(true)}
            onDelete={() => {
              if (!selected) return
              if (!window.confirm(t.deleteConfirm)) return
              void window.wooly.instances.remove(selected.id)
            }}
            onFolder={() => selected && void window.wooly.openPath('instance', selected.id)}
          />
        )}
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
