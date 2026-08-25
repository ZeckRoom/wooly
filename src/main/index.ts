import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { EVENTS } from '@shared/constants'
import { registerIpc } from './ipc'
import { loadCatalogCache } from './minecraft/catalog'
import { loadSettings } from './store/settings'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1080,
    minHeight: 680,
    show: false,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#161310',
    title: 'Wooly Launcher',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })
  mainWindow.on('maximize', () => mainWindow.webContents.send(EVENTS.maximized, true))
  mainWindow.on('unmaximize', () => mainWindow.webContents.send(EVENTS.maximized, false))

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('net.wooly.launcher')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  registerIpc()
  await loadSettings()
  await loadCatalogCache()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
