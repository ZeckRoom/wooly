import { app } from 'electron'
import { join } from 'path'

export function launcherRoot(): string {
  return join(app.getPath('userData'))
}

export function metaDir(): string {
  return join(launcherRoot(), 'meta')
}

export function instancesDir(): string {
  return join(launcherRoot(), 'instances')
}

export function instanceRoot(id: string): string {
  return join(instancesDir(), id)
}

export function instanceGameDir(id: string): string {
  return join(instanceRoot(id), 'game')
}

export function runtimesDir(): string {
  return join(metaDir(), 'runtimes')
}

export function cacheDir(): string {
  return join(launcherRoot(), 'cache')
}

export function accountsFile(): string {
  return join(launcherRoot(), 'accounts.json')
}

export function settingsFile(): string {
  return join(launcherRoot(), 'settings.json')
}

export function instancesFile(): string {
  return join(launcherRoot(), 'instances.json')
}

export function catalogCacheFile(): string {
  return join(cacheDir(), 'version_manifest.json')
}
