import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { EVENTS, WOOLY_MS_CLIENT_ID } from '@shared/constants'
import { idleUpdateState } from '@shared/update'
import type {
  AppSettings,
  AuthPrompt,
  CatalogVersion,
  GameInstance,
  InstallProgress,
  InstanceGroup,
  LaunchState,
  LogLine,
  PublicAccount,
  AppUpdateState
} from '@shared/types'

interface LauncherStore {
  splash: boolean
  splashStatus: string
  splashProgress: number
  group: InstanceGroup
  view: 'library' | 'settings'
  settings: AppSettings
  accounts: PublicAccount[]
  activeAccountId: string | null
  instances: GameInstance[]
  selectedId: string | null
  versions: CatalogVersion[]
  launch: LaunchState
  install: InstallProgress | null
  logs: LogLine[]
  authPrompt: AuthPrompt | null
  maximized: boolean
  error: string | null
  update: AppUpdateState
  hydrate: () => Promise<void>
  setGroup: (group: InstanceGroup) => void
  setView: (view: 'library' | 'settings') => void
  selectInstance: (id: string | null) => void
  setError: (error: string | null) => void
}

const MAX_LOGS = 400

export const useLauncher = create<LauncherStore>((set, get) => ({
  splash: true,
  splashStatus: 'Opening Wooly',
  splashProgress: 0,
  group: 'vanilla',
  view: 'library',
  settings: { microsoftClientId: WOOLY_MS_CLIENT_ID, keepOpenOnLaunch: true, language: 'en' },
  accounts: [],
  activeAccountId: null,
  instances: [],
  selectedId: null,
  versions: [],
  launch: { phase: 'idle', instanceId: null, error: null },
  install: null,
  logs: [],
  authPrompt: null,
  maximized: false,
  error: null,
  update: idleUpdateState('0.1.0'),
  setGroup: (group) => {
    const first = get().instances.find((item) => item.group === group)
    set({ group, selectedId: first?.id ?? null, view: 'library' })
  },
  setView: (view) => set({ view }),
  selectInstance: (id) => set({ selectedId: id }),
  setError: (error) => set({ error }),
  hydrate: async () => {
    const offSplash = window.wooly.on(EVENTS.splash, (status) => {
      set({
        splashStatus: String(status),
        splashProgress: Math.min(90, get().splashProgress + 18)
      })
    })
    const offCatalog = window.wooly.on(EVENTS.catalog, (versions) => {
      set({ versions: versions as CatalogVersion[] })
    })
    const offAccounts = window.wooly.on(EVENTS.accounts, (payload) => {
      const data = payload as { accounts: PublicAccount[]; activeAccountId: string | null }
      set({ accounts: data.accounts, activeAccountId: data.activeAccountId })
    })
    const offInstances = window.wooly.on(EVENTS.instances, (instances) => {
      const list = instances as GameInstance[]
      const selectedId = get().selectedId
      const stillThere = list.some((item) => item.id === selectedId)
      const fallback = list.find((item) => item.group === get().group)?.id ?? list[0]?.id ?? null
      set({ instances: list, selectedId: stillThere ? selectedId : fallback })
    })
    const offInstall = window.wooly.on(EVENTS.install, (progress) => {
      set({ install: progress as InstallProgress })
    })
    const offLaunch = window.wooly.on(EVENTS.launch, (launch) => {
      set({ launch: launch as LaunchState, error: (launch as LaunchState).error })
    })
    const offLogs = window.wooly.on(EVENTS.logs, (line) => {
      const logs = [...get().logs, line as LogLine]
      set({ logs: logs.slice(-MAX_LOGS) })
    })
    const offAuth = window.wooly.on(EVENTS.auth, (prompt) => {
      set({ authPrompt: prompt as AuthPrompt | null })
    })
    const offMax = window.wooly.on(EVENTS.maximized, (value) => {
      set({ maximized: Boolean(value) })
    })
    const offUpdate = window.wooly.on(EVENTS.update, (payload) => {
      set({ update: payload as AppUpdateState })
    })
    void offSplash
    void offCatalog
    void offAccounts
    void offInstances
    void offInstall
    void offLaunch
    void offLogs
    void offAuth
    void offMax
    void offUpdate

    try {
      const payload = await window.wooly.bootstrap()
      const first =
        payload.instances.find((item) => item.group === 'vanilla') ?? payload.instances[0]
      set({
        settings: payload.settings,
        accounts: payload.accounts,
        activeAccountId: payload.activeAccountId,
        instances: payload.instances,
        versions: payload.versions,
        launch: payload.launch,
        update: payload.update,
        selectedId: first?.id ?? null,
        splashProgress: 100,
        splashStatus: 'Ready'
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start Wooly.',
        splashProgress: 100,
        splashStatus: 'Ready'
      })
    }
  }
}))

export function getSelectedInstance(): GameInstance | null {
  const { instances, selectedId } = useLauncher.getState()
  return instances.find((item) => item.id === selectedId) ?? null
}

export function useActiveAccount(): PublicAccount | null {
  return useLauncher(
    useShallow(
      (s) => s.accounts.find((item) => item.id === s.activeAccountId) ?? s.accounts[0] ?? null
    )
  )
}

export function useSelectedInstance(): GameInstance | null {
  return useLauncher(
    useShallow((s) => s.instances.find((item) => item.id === s.selectedId) ?? null)
  )
}

/** Chrome that must not re-render when the console streams. */
export function useShellChrome() {
  return useLauncher(
    useShallow((s) => ({
      view: s.view,
      instances: s.instances,
      versions: s.versions,
      settings: s.settings,
      accounts: s.accounts,
      activeAccountId: s.activeAccountId,
      authPrompt: s.authPrompt,
      maximized: s.maximized,
      error: s.error,
      launchError: s.launch.error,
      selectInstance: s.selectInstance,
      setView: s.setView,
      setError: s.setError
    }))
  )
}
