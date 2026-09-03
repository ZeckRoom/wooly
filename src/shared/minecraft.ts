import type { CatalogVersion, VersionChannel } from './types'
import { versionChannelOf } from './instance'

export interface JavaHint {
  component?: string
  majorVersion?: number
}

export function isSupportedChannel(type: string): type is VersionChannel {
  return type === 'release' || type === 'snapshot'
}

export function decorateCatalog(
  versions: Array<{ id: string; type: string; releaseTime: string; url: string }>,
  latest?: { release?: string; snapshot?: string }
): CatalogVersion[] {
  return versions
    .filter((v) => isSupportedChannel(v.type))
    .map((v) => ({
      id: v.id,
      type: v.type,
      releaseTime: v.releaseTime,
      url: v.url,
      latestRelease: latest?.release === v.id,
      latestSnapshot: latest?.snapshot === v.id
    }))
}

export function filterCatalog(
  versions: CatalogVersion[],
  query: string,
  channel: VersionChannel | 'all' = 'all'
): CatalogVersion[] {
  const q = query.trim().toLowerCase()
  return versions.filter((v) => {
    if (channel !== 'all' && versionChannelOf(v.type) !== channel) return false
    if (!q) return true
    return v.id.toLowerCase().includes(q) || v.type.toLowerCase().includes(q)
  })
}

export function javaRuntimeFor(hint?: JavaHint | null): string {
  if (hint?.component) return hint.component
  const major = hint?.majorVersion ?? 8
  if (major >= 21) return 'java-runtime-delta'
  if (major >= 17) return 'java-runtime-gamma'
  if (major >= 16) return 'java-runtime-beta'
  if (major >= 11) return 'java-runtime-alpha'
  return 'jre-legacy'
}

export function javaExecutableName(platform = process.platform): string {
  return platform === 'win32' ? 'javaw.exe' : 'java'
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** i
  return `${value >= 10 || i === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`
}

export function formatSpeed(bytesPerSec: number): string {
  return `${formatBytes(bytesPerSec)}/s`
}
