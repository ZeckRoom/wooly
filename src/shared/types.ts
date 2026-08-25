import type { AppUpdateState } from './update'

export type { AppUpdateState, UpdatePhase } from './update'

export type InstanceGroup = 'vanilla' | 'modded'
export type VersionChannel = 'release' | 'snapshot'
export type LaunchPhase = 'idle' | 'installing' | 'launching' | 'running' | 'stopping'
export type AuthFlow = 'interactive' | 'device_code'

export interface GameInstance {
  id: string
  name: string
  group: InstanceGroup
  versionId: string
  versionType: VersionChannel
  createdAt: string
  lastPlayedAt: string | null
  memoryMinMb: number
  memoryMaxMb: number
  javaPath: string | null
  jvmArgs: string
  width: number
  height: number
  fullscreen: boolean
}

export interface InstanceDraft {
  name: string
  group: InstanceGroup
  versionId: string
  memoryMaxMb?: number
  memoryMinMb?: number
  javaPath?: string | null
  jvmArgs?: string
  width?: number
  height?: number
  fullscreen?: boolean
}

export interface CatalogVersion {
  id: string
  type: string
  releaseTime: string
  url: string
  latestRelease?: boolean
  latestSnapshot?: boolean
}

export interface PublicAccount {
  id: string
  username: string
  xboxGamertag?: string
  avatarUrl: string
}

export interface AppSettings {
  microsoftClientId: string
  keepOpenOnLaunch: boolean
  language: 'en'
}

export interface LogLine {
  id: number
  ts: number
  stream: 'stdout' | 'stderr' | 'launcher'
  text: string
}

export interface InstallProgress {
  phase: string
  label: string
  current: number
  total: number
  speed: number
}

export interface LaunchState {
  phase: LaunchPhase
  instanceId: string | null
  error: string | null
}

export interface AuthPrompt {
  kind: 'device_code' | 'browser'
  userCode?: string
  verificationUri?: string
  message: string
}

export interface BootstrapPayload {
  settings: AppSettings
  accounts: PublicAccount[]
  activeAccountId: string | null
  instances: GameInstance[]
  versions: CatalogVersion[]
  launch: LaunchState
  update: AppUpdateState
}

export interface WoolyErrorShape {
  code: string
  message: string
}

export interface WoolyApi {
  bootstrap: () => Promise<BootstrapPayload>
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
  }
  settings: {
    get: () => Promise<AppSettings>
    set: (patch: Partial<AppSettings>) => Promise<AppSettings>
  }
  accounts: {
    list: () => Promise<{ accounts: PublicAccount[]; activeAccountId: string | null }>
    login: () => Promise<PublicAccount>
    logout: (id: string) => Promise<void>
    select: (id: string) => Promise<void>
  }
  instances: {
    list: () => Promise<GameInstance[]>
    create: (draft: InstanceDraft) => Promise<GameInstance>
    update: (id: string, patch: Partial<InstanceDraft>) => Promise<GameInstance>
    remove: (id: string) => Promise<void>
  }
  catalog: {
    versions: () => Promise<CatalogVersion[]>
    refresh: () => Promise<CatalogVersion[]>
  }
  install: {
    start: (instanceId: string) => Promise<void>
    cancel: () => Promise<void>
  }
  launch: {
    play: (instanceId: string) => Promise<void>
    stop: () => Promise<void>
  }
  openPath: (kind: 'instance' | 'root' | 'meta', instanceId?: string) => Promise<void>
  update: {
    check: () => Promise<AppUpdateState>
    download: () => Promise<void>
    install: () => Promise<void>
  }
  on: (channel: string, listener: (...args: unknown[]) => void) => () => void
}
