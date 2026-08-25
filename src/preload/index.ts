import { contextBridge, ipcRenderer } from 'electron'
import { EVENTS, IPC } from '@shared/constants'
import type { AppSettings, InstanceDraft, WoolyApi } from '@shared/types'

const api: WoolyApi = {
  bootstrap: () => ipcRenderer.invoke(IPC.bootstrap),
  window: {
    minimize: () => ipcRenderer.invoke(IPC.windowMinimize),
    maximize: () => ipcRenderer.invoke(IPC.windowMaximize),
    close: () => ipcRenderer.invoke(IPC.windowClose),
    isMaximized: () => ipcRenderer.invoke(IPC.windowIsMaximized)
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC.settingsGet),
    set: (patch: Partial<AppSettings>) => ipcRenderer.invoke(IPC.settingsSet, patch)
  },
  accounts: {
    list: () => ipcRenderer.invoke(IPC.accountsList),
    login: () => ipcRenderer.invoke(IPC.accountsLogin),
    logout: (id) => ipcRenderer.invoke(IPC.accountsLogout, id),
    select: (id) => ipcRenderer.invoke(IPC.accountsSelect, id)
  },
  instances: {
    list: () => ipcRenderer.invoke(IPC.instancesList),
    create: (draft: InstanceDraft) => ipcRenderer.invoke(IPC.instancesCreate, draft),
    update: (id, patch) => ipcRenderer.invoke(IPC.instancesUpdate, id, patch),
    remove: (id) => ipcRenderer.invoke(IPC.instancesDelete, id)
  },
  catalog: {
    versions: () => ipcRenderer.invoke(IPC.catalogVersions),
    refresh: () => ipcRenderer.invoke(IPC.catalogRefresh)
  },
  install: {
    start: (instanceId) => ipcRenderer.invoke(IPC.installStart, instanceId),
    cancel: () => ipcRenderer.invoke(IPC.installCancel)
  },
  launch: {
    play: (instanceId) => ipcRenderer.invoke(IPC.launchPlay, instanceId),
    stop: () => ipcRenderer.invoke(IPC.launchStop)
  },
  openPath: (kind, instanceId) => ipcRenderer.invoke(IPC.openPath, kind, instanceId),
  update: {
    check: () => ipcRenderer.invoke(IPC.updateCheck),
    download: () => ipcRenderer.invoke(IPC.updateDownload),
    install: () => ipcRenderer.invoke(IPC.updateInstall)
  },
  on: (channel, listener) => {
    const allowed = new Set<string>(Object.values(EVENTS))
    if (!allowed.has(channel)) return () => undefined
    const wrapped = (_event: unknown, ...args: unknown[]) => listener(...args)
    ipcRenderer.on(channel, wrapped)
    return () => ipcRenderer.removeListener(channel, wrapped)
  }
}

contextBridge.exposeInMainWorld('wooly', api)
