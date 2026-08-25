import { BrowserWindow, ipcMain, shell } from 'electron'
import { Version } from '@xmcl/core'
import { EVENTS, IPC } from '@shared/constants'
import type {
  AuthPrompt,
  BootstrapPayload,
  InstanceDraft,
  InstallProgress,
  LaunchState,
  LogLine
} from '@shared/types'
import { versionChannelOf } from '@shared/instance'
import { loginMicrosoft } from './auth/microsoft'
import { ensureCatalog, findVersion, getCachedVersions, refreshCatalog } from './minecraft/catalog'
import { cancelInstall, installVanilla } from './minecraft/install'
import { ensureJava } from './minecraft/java'
import { isGameRunning, playInstance, stopGame } from './minecraft/launch'
import { instanceGameDir, instanceRoot, launcherRoot, metaDir } from './paths'
import {
  getActiveAccount,
  listPublicAccounts,
  removeAccount,
  selectAccount
} from './store/accounts'
import {
  createInstance,
  deleteInstance,
  getInstance,
  listInstances,
  setInstanceVersionType,
  touchPlayed,
  updateInstance
} from './store/instances'
import { loadSettings, saveSettings } from './store/settings'

function send(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, payload)
  }
}

function fail(error: unknown): never {
  const err = error as { code?: string; message?: string }
  const wrapped = new Error(err.message || 'Something went wrong.')
  ;(wrapped as Error & { code?: string }).code = err.code
  throw wrapped
}

export function registerIpc(): void {
  ipcMain.handle(IPC.bootstrap, async (): Promise<BootstrapPayload> => {
    send(EVENTS.splash, 'Restoring your library')
    const settings = await loadSettings()
    const { accounts, activeAccountId } = await listPublicAccounts()
    send(EVENTS.splash, 'Loading instances')
    const instances = await listInstances()
    send(EVENTS.splash, 'Checking Minecraft versions')
    const versions = await ensureCatalog().catch(() => getCachedVersions())
    return {
      settings,
      accounts,
      activeAccountId,
      instances,
      versions,
      launch: {
        phase: isGameRunning() ? 'running' : 'idle',
        instanceId: null,
        error: null
      }
    }
  })

  ipcMain.handle(IPC.windowMinimize, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize()
  })
  ipcMain.handle(IPC.windowMaximize, (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })
  ipcMain.handle(IPC.windowClose, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close()
  })
  ipcMain.handle(IPC.windowIsMaximized, (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
  })

  ipcMain.handle(IPC.settingsGet, () => loadSettings())
  ipcMain.handle(IPC.settingsSet, (_e, patch) => saveSettings(patch))

  ipcMain.handle(IPC.accountsList, () => listPublicAccounts())
  ipcMain.handle(IPC.accountsLogin, async () => {
    try {
      const account = await loginMicrosoft((prompt: AuthPrompt | null) => {
        send(EVENTS.auth, prompt)
      })
      send(EVENTS.accounts, await listPublicAccounts())
      return account
    } catch (error) {
      fail(error)
    }
  })
  ipcMain.handle(IPC.accountsLogout, async (_e, id: string) => {
    await removeAccount(id)
    send(EVENTS.accounts, await listPublicAccounts())
  })
  ipcMain.handle(IPC.accountsSelect, async (_e, id: string) => {
    await selectAccount(id)
    send(EVENTS.accounts, await listPublicAccounts())
  })

  ipcMain.handle(IPC.instancesList, () => listInstances())
  ipcMain.handle(IPC.instancesCreate, async (_e, draft: InstanceDraft) => {
    const created = await createInstance(draft)
    const found = findVersion(created.versionId)
    const typed = await setInstanceVersionType(
      created.id,
      found ? versionChannelOf(found.type) : created.versionType
    )
    send(EVENTS.instances, await listInstances())
    return typed
  })
  ipcMain.handle(IPC.instancesUpdate, async (_e, id: string, patch: Partial<InstanceDraft>) => {
    await updateInstance(id, patch)
    if (patch.versionId) {
      const found = findVersion(patch.versionId)
      if (found) await setInstanceVersionType(id, versionChannelOf(found.type))
    }
    send(EVENTS.instances, await listInstances())
    return getInstance(id)
  })
  ipcMain.handle(IPC.instancesDelete, async (_e, id: string) => {
    await deleteInstance(id)
    send(EVENTS.instances, await listInstances())
  })

  ipcMain.handle(IPC.catalogVersions, () => ensureCatalog())
  ipcMain.handle(IPC.catalogRefresh, async () => {
    const versions = await refreshCatalog()
    send(EVENTS.catalog, versions)
    return versions
  })

  ipcMain.handle(IPC.installStart, async (_e, instanceId: string) => {
    const instance = await getInstance(instanceId)
    send(EVENTS.launch, {
      phase: 'installing',
      instanceId,
      error: null
    } satisfies LaunchState)
    try {
      await installVanilla(instance.versionId, (progress: InstallProgress) => {
        send(EVENTS.install, progress)
      })
      const resolved = await Version.parse(metaDir(), instance.versionId)
      await ensureJava(resolved.javaVersion ?? null, (label, current, total) => {
        send(EVENTS.install, {
          phase: 'java',
          label,
          current,
          total,
          speed: 0
        } satisfies InstallProgress)
      })
      send(EVENTS.launch, { phase: 'idle', instanceId, error: null } satisfies LaunchState)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      send(EVENTS.launch, { phase: 'idle', instanceId, error: message } satisfies LaunchState)
      fail(error)
    }
  })
  ipcMain.handle(IPC.installCancel, async () => {
    cancelInstall()
  })

  ipcMain.handle(IPC.launchPlay, async (_e, instanceId: string) => {
    const instance = await getInstance(instanceId)
    const account = await getActiveAccount()
    if (!account) {
      const message = 'Sign in with a premium Microsoft account before playing.'
      send(EVENTS.launch, { phase: 'idle', instanceId, error: message } satisfies LaunchState)
      fail(new Error(message))
    }
    send(EVENTS.launch, { phase: 'installing', instanceId, error: null } satisfies LaunchState)
    try {
      await installVanilla(instance.versionId, (progress) => send(EVENTS.install, progress))
      send(EVENTS.launch, { phase: 'launching', instanceId, error: null } satisfies LaunchState)
      await playInstance(
        instance,
        (line: LogLine) => send(EVENTS.logs, line),
        () => send(EVENTS.launch, { phase: 'idle', instanceId, error: null } satisfies LaunchState)
      )
      await touchPlayed(instanceId)
      send(EVENTS.instances, await listInstances())
      send(EVENTS.launch, { phase: 'running', instanceId, error: null } satisfies LaunchState)
      const settings = await loadSettings()
      if (!settings.keepOpenOnLaunch) {
        BrowserWindow.getAllWindows()[0]?.minimize()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      send(EVENTS.launch, { phase: 'idle', instanceId, error: message } satisfies LaunchState)
      fail(error)
    }
  })
  ipcMain.handle(IPC.launchStop, async () => {
    send(EVENTS.launch, { phase: 'stopping', instanceId: null, error: null } satisfies LaunchState)
    stopGame()
  })

  ipcMain.handle(
    IPC.openPath,
    async (_e, kind: 'instance' | 'root' | 'meta', instanceId?: string) => {
      const target =
        kind === 'root'
          ? launcherRoot()
          : kind === 'meta'
            ? metaDir()
            : instanceId
              ? instanceGameDir(instanceId)
              : instanceRoot('missing')
      await shell.openPath(target)
    }
  )
}
