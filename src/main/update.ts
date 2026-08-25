import { app, BrowserWindow } from 'electron'
import { is } from '@electron-toolkit/utils'
import { autoUpdater, NsisUpdater } from 'electron-updater'
import { EVENTS } from '@shared/constants'
import type { AppUpdateState } from '@shared/types'
import { idleUpdateState, isLauncherUpdate, updateDownloadPercent } from '@shared/update'

let state: AppUpdateState = idleUpdateState('0.1.0')
let started = false

function emit(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(EVENTS.update, state)
  }
}

export function getUpdateState(): AppUpdateState {
  return state
}

function canUseUpdater(): boolean {
  return app.isPackaged && !is.dev
}

export function setupAutoUpdate(): void {
  state = idleUpdateState(app.getVersion())
  if (!canUseUpdater() || started) {
    return
  }
  started = true

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false
  autoUpdater.allowDowngrade = false
  if ('verifyUpdateCodeSignature' in autoUpdater) {
    ;(autoUpdater as NsisUpdater).verifyUpdateCodeSignature = async () => null
  }

  autoUpdater.on('update-available', (info) => {
    if (!isLauncherUpdate(state.currentVersion, info.version)) {
      return
    }
    state = {
      phase: 'available',
      currentVersion: state.currentVersion,
      availableVersion: info.version,
      percent: 0,
      error: null
    }
    emit()
  })

  autoUpdater.on('update-not-available', () => {
    if (state.phase === 'downloading' || state.phase === 'ready') {
      return
    }
    state = idleUpdateState(state.currentVersion)
    emit()
  })

  autoUpdater.on('download-progress', (progress) => {
    const percent =
      Number.isFinite(progress.percent) && progress.percent > 0
        ? Math.round(progress.percent)
        : updateDownloadPercent(progress.transferred, progress.total)
    state = {
      phase: 'downloading',
      currentVersion: state.currentVersion,
      availableVersion: state.availableVersion,
      percent,
      error: null
    }
    emit()
  })

  autoUpdater.on('update-downloaded', (info) => {
    state = {
      phase: 'ready',
      currentVersion: state.currentVersion,
      availableVersion: info.version ?? state.availableVersion,
      percent: 100,
      error: null
    }
    emit()
  })

  autoUpdater.on('error', (error) => {
    if (state.phase === 'idle') {
      return
    }
    state = {
      ...state,
      phase: 'error',
      error: error.message || 'Update failed.'
    }
    emit()
  })

  setTimeout(() => {
    void checkForUpdates()
  }, 2500)
  setInterval(() => {
    void checkForUpdates()
  }, 4 * 60 * 60 * 1000)
}

export async function checkForUpdates(): Promise<AppUpdateState> {
  if (!canUseUpdater()) {
    return state
  }
  try {
    await autoUpdater.checkForUpdates()
  } catch {
    // No release yet, or the network is down — keep the banner hidden.
  }
  return state
}

export async function downloadUpdate(): Promise<void> {
  if (!canUseUpdater()) {
    return
  }
  state = {
    ...state,
    phase: 'downloading',
    percent: Math.max(state.percent, 1),
    error: null
  }
  emit()
  await autoUpdater.downloadUpdate()
}

export function installUpdate(): void {
  if (!canUseUpdater()) {
    return
  }
  autoUpdater.quitAndInstall(false, true)
}
