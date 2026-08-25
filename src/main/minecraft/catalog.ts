import { mkdir } from 'fs/promises'
import { dirname } from 'path'
import { getVersionList } from '@xmcl/installer'
import { decorateCatalog } from '@shared/minecraft'
import type { CatalogVersion } from '@shared/types'
import { catalogCacheFile } from '../paths'
import { readJsonFile, writeJsonFile } from '../store/json'

interface CacheShape {
  fetchedAt: number
  versions: CatalogVersion[]
}

let memory: CatalogVersion[] = []

export function getCachedVersions(): CatalogVersion[] {
  return memory
}

export async function loadCatalogCache(): Promise<CatalogVersion[]> {
  const cached = await readJsonFile<CacheShape | null>(catalogCacheFile(), null)
  if (cached?.versions?.length) {
    memory = cached.versions
  }
  return memory
}

export async function refreshCatalog(): Promise<CatalogVersion[]> {
  const list = await getVersionList({
    remote: 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json'
  })
  memory = decorateCatalog(list.versions, list.latest)
  await mkdir(dirname(catalogCacheFile()), { recursive: true })
  await writeJsonFile(catalogCacheFile(), {
    fetchedAt: Date.now(),
    versions: memory
  })
  return memory
}

export async function ensureCatalog(): Promise<CatalogVersion[]> {
  if (memory.length) return memory
  await loadCatalogCache()
  if (memory.length) {
    void refreshCatalog().catch(() => undefined)
    return memory
  }
  return refreshCatalog()
}

export function findVersion(id: string): CatalogVersion | undefined {
  return memory.find((item) => item.id === id)
}
