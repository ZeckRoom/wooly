export type UpdatePhase = 'idle' | 'available' | 'downloading' | 'ready' | 'error'

export interface AppUpdateState {
  phase: UpdatePhase
  currentVersion: string
  availableVersion: string | null
  percent: number
  error: string | null
}

export function idleUpdateState(currentVersion: string): AppUpdateState {
  return {
    phase: 'idle',
    currentVersion,
    availableVersion: null,
    percent: 0,
    error: null
  }
}

export function parseLauncherVersion(version: string): number[] {
  const core = version.trim().split('+')[0] ?? version
  return core.split(/[.-]/).map((part) => {
    const n = Number.parseInt(part, 10)
    return Number.isFinite(n) ? n : 0
  })
}

export function compareLauncherVersions(left: string, right: string): number {
  const a = parseLauncherVersion(left)
  const b = parseLauncherVersion(right)
  const length = Math.max(a.length, b.length)
  for (let i = 0; i < length; i++) {
    const da = a[i] ?? 0
    const db = b[i] ?? 0
    if (da > db) return 1
    if (da < db) return -1
  }
  return 0
}

export function isLauncherUpdate(current: string, available: string): boolean {
  return compareLauncherVersions(available, current) > 0
}

export function updateDownloadPercent(transferred: number, total: number): number {
  if (!Number.isFinite(transferred) || !Number.isFinite(total) || total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((transferred / total) * 100)))
}

export function updateFeedErrorMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error ?? '')
  if (/404|not found|HttpError:\s*404/i.test(text)) {
    return 'Could not read GitHub Releases. The wooly repository must be public for in-app updates.'
  }
  const trimmed = text.trim()
  return trimmed || 'Could not check for updates.'
}
