import { useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import { colors } from '../lib/tokens.stylex'
import { t } from '@/lib/i18n'
import type { InstanceDraft } from '@shared/types'
import { AccountChip } from './AccountChip'
import { AccountDialog } from './AccountDialog'
import { InstanceDetail } from './InstanceDetail'
import { InstanceFormDialog } from './InstanceFormDialog'
import { LauncherDock } from './LauncherDock'
import { SettingsView } from './SettingsView'
import { TitleBar } from './TitleBar'
import { activeAccount, useLauncher } from '@/state/store'

const styles = stylex.create({
  root: {
    backgroundColor: colors.background,
    backgroundImage:
      'radial-gradient(ellipse 90% 55% at 50% 115%, rgb(61 125 255 / 0.22), transparent 58%), radial-gradient(ellipse 45% 40% at 8% 88%, rgb(47 191 113 / 0.12), transparent 52%)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    position: 'relative'
  },
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    position: 'relative'
  },
  chrome: {
    inset: 0,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 20
  },
  account: {
    bottom: 18,
    left: 18,
    pointerEvents: 'auto',
    position: 'absolute',
    zIndex: 21
  },
  dock: {
    bottom: 18,
    display: 'flex',
    justifyContent: 'center',
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    zIndex: 21
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
        <div {...stylex.props(styles.chrome)}>
          <div {...stylex.props(styles.account)}>
            <AccountChip account={account} onClick={() => setAccountsOpen(true)} />
          </div>
          <div {...stylex.props(styles.dock)}>
            <LauncherDock
              instances={store.instances}
              selected={selected}
              versions={store.versions}
              launch={store.launch}
              settingsActive={store.view === 'settings'}
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
              onSettings={() => store.setView(store.view === 'settings' ? 'library' : 'settings')}
              onUpdateCheck={() => void window.wooly.update.check()}
              onUpdateDownload={() => void window.wooly.update.download()}
              onUpdateInstall={() => void window.wooly.update.install()}
            />
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
