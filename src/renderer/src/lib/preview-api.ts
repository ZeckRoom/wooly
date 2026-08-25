import { EVENTS } from '@shared/constants'
import { DEFAULT_MEMORY_MAX, DEFAULT_MEMORY_MIN, normalizeInstanceName } from '@shared/instance'
import type {
  AppSettings,
  CatalogVersion,
  GameInstance,
  InstanceDraft,
  PublicAccount,
  WoolyApi
} from '@shared/types'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function installPreviewApi(): void {
  if (typeof window === 'undefined' || window.wooly) return

  const versions: CatalogVersion[] = [
    {
      id: '1.21.8',
      type: 'release',
      releaseTime: '2025-07-17T00:00:00+00:00',
      url: '',
      latestRelease: true
    },
    {
      id: '1.21.4',
      type: 'release',
      releaseTime: '2024-12-03T00:00:00+00:00',
      url: ''
    },
    {
      id: '25w32a',
      type: 'snapshot',
      releaseTime: '2025-08-06T00:00:00+00:00',
      url: '',
      latestSnapshot: true
    }
  ]

  const listeners = new Map<string, Set<(...args: unknown[]) => void>>()
  const emit = (channel: string, ...args: unknown[]) => {
    listeners.get(channel)?.forEach((listener) => listener(...args))
  }

  let settings: AppSettings = {
    microsoftClientId: '',
    keepOpenOnLaunch: true,
    language: 'en'
  }
  let instances: GameInstance[] = []
  const accounts: PublicAccount[] = []
  const activeAccountId: string | null = null
  let logSeq = 0

  const channelOf = (versionId: string): GameInstance['versionType'] =>
    versions.find((item) => item.id === versionId)?.type === 'snapshot' ? 'snapshot' : 'release'

  const createFromDraft = (draft: InstanceDraft): GameInstance => ({
    id: crypto.randomUUID(),
    name: normalizeInstanceName(draft.name),
    group: draft.group,
    versionId: draft.versionId,
    versionType: channelOf(draft.versionId),
    createdAt: new Date().toISOString(),
    lastPlayedAt: null,
    memoryMinMb: draft.memoryMinMb ?? DEFAULT_MEMORY_MIN,
    memoryMaxMb: draft.memoryMaxMb ?? DEFAULT_MEMORY_MAX,
    javaPath: draft.javaPath ?? null,
    jvmArgs: draft.jvmArgs ?? '',
    width: draft.width ?? 1280,
    height: draft.height ?? 720,
    fullscreen: draft.fullscreen ?? false
  })

  window.wooly = {
    bootstrap: async () => {
      emit(EVENTS.splash, 'Restoring your library')
      await delay(180)
      emit(EVENTS.splash, 'Loading instances')
      await delay(180)
      emit(EVENTS.splash, 'Checking Minecraft versions')
      return {
        settings,
        accounts,
        activeAccountId,
        instances,
        versions,
        launch: { phase: 'idle', instanceId: null, error: null }
      }
    },
    window: {
      minimize: async () => undefined,
      maximize: async () => undefined,
      close: async () => undefined,
      isMaximized: async () => false
    },
    settings: {
      get: async () => settings,
      set: async (patch) => {
        settings = { ...settings, ...patch, language: 'en' }
        return settings
      }
    },
    accounts: {
      list: async () => ({ accounts, activeAccountId }),
      login: async () => {
        throw new Error(
          'Microsoft sign-in needs the Wooly desktop app and a premium Minecraft Java account.'
        )
      },
      logout: async () => undefined,
      select: async () => undefined
    },
    instances: {
      list: async () => instances,
      create: async (draft) => {
        const created = createFromDraft(draft)
        instances = [created, ...instances]
        emit(EVENTS.instances, instances)
        return created
      },
      update: async (id, patch) => {
        instances = instances.map((item) => {
          if (item.id !== id) return item
          const versionId = patch.versionId ?? item.versionId
          return {
            ...item,
            name: patch.name ? normalizeInstanceName(patch.name) : item.name,
            group: patch.group ?? item.group,
            versionId,
            versionType: patch.versionId ? channelOf(versionId) : item.versionType,
            memoryMaxMb: patch.memoryMaxMb ?? item.memoryMaxMb,
            memoryMinMb: patch.memoryMinMb ?? item.memoryMinMb,
            javaPath: patch.javaPath === undefined ? item.javaPath : patch.javaPath,
            jvmArgs: patch.jvmArgs ?? item.jvmArgs,
            width: patch.width ?? item.width,
            height: patch.height ?? item.height,
            fullscreen: patch.fullscreen ?? item.fullscreen
          }
        })
        emit(EVENTS.instances, instances)
        const found = instances.find((item) => item.id === id)
        if (!found) throw new Error('Instance not found.')
        return found
      },
      remove: async (id) => {
        instances = instances.filter((item) => item.id !== id)
        emit(EVENTS.instances, instances)
      }
    },
    catalog: {
      versions: async () => versions,
      refresh: async () => {
        emit(EVENTS.catalog, versions)
        return versions
      }
    },
    install: {
      start: async (instanceId) => {
        emit(EVENTS.launch, { phase: 'installing', instanceId, error: null })
        emit(EVENTS.install, {
          phase: 'files',
          label: 'Downloading client files',
          current: 1,
          total: 3,
          speed: 0
        })
        await delay(350)
        emit(EVENTS.install, {
          phase: 'java',
          label: 'Preparing Mojang Java',
          current: 2,
          total: 3,
          speed: 0
        })
        await delay(350)
        emit(EVENTS.install, {
          phase: 'done',
          label: 'Install complete',
          current: 3,
          total: 3,
          speed: 0
        })
        emit(EVENTS.launch, { phase: 'idle', instanceId, error: null })
      },
      cancel: async () => undefined
    },
    launch: {
      play: async (instanceId) => {
        emit(EVENTS.launch, { phase: 'installing', instanceId, error: null })
        emit(EVENTS.install, {
          phase: 'files',
          label: 'Checking files',
          current: 1,
          total: 1,
          speed: 0
        })
        await delay(280)
        emit(EVENTS.launch, { phase: 'launching', instanceId, error: null })
        emit(EVENTS.logs, {
          id: ++logSeq,
          ts: Date.now(),
          stream: 'launcher',
          text: 'Launching preview session (desktop app launches real Minecraft).'
        })
        emit(EVENTS.logs, {
          id: ++logSeq,
          ts: Date.now(),
          stream: 'stdout',
          text: '[Render thread/INFO]: Wooly preview console'
        })
        instances = instances.map((item) =>
          item.id === instanceId ? { ...item, lastPlayedAt: new Date().toISOString() } : item
        )
        emit(EVENTS.instances, instances)
        emit(EVENTS.launch, { phase: 'running', instanceId, error: null })
      },
      stop: async () => {
        emit(EVENTS.launch, { phase: 'idle', instanceId: null, error: null })
        emit(EVENTS.logs, {
          id: ++logSeq,
          ts: Date.now(),
          stream: 'launcher',
          text: 'Minecraft exited (0)'
        })
      }
    },
    openPath: async () => undefined,
    on: (channel, listener) => {
      if (!listeners.has(channel)) listeners.set(channel, new Set())
      listeners.get(channel)!.add(listener)
      return () => listeners.get(channel)?.delete(listener)
    }
  } satisfies WoolyApi
}
