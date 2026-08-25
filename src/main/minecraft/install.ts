import { mkdir } from 'fs/promises'
import { MinecraftFolder, Version } from '@xmcl/core'
import {
  createNodeInstallRuntime,
  executeInstallManifest,
  resolveAssetMetadataInstallManifest,
  resolveAssetObjectInstallFiles,
  resolveLibraryInstallFiles,
  resolveMinecraftJarInstallFile,
  resolveMinecraftVersionJsonInstallFile
} from '@xmcl/installer'
import type { CatalogVersion, InstallProgress } from '@shared/types'
import { metaDir } from '../paths'
import { findVersion } from './catalog'
import { downloadInstallFiles } from './download'

let abort: AbortController | null = null

export function cancelInstall(): void {
  abort?.abort()
}

export async function installVanilla(
  versionId: string,
  onProgress: (progress: InstallProgress) => void
): Promise<void> {
  const meta = findVersion(versionId)
  if (!meta) throw new Error(`Unknown version ${versionId}. Refresh the catalog and try again.`)

  abort?.abort()
  abort = new AbortController()
  const minecraft = metaDir()
  await mkdir(minecraft, { recursive: true })
  const folder = MinecraftFolder.from(minecraft)
  const runtime = createNodeInstallRuntime({
    signal: abort.signal,
    download: (files) =>
      downloadInstallFiles(files, (done, total) => {
        onProgress({
          phase: 'files',
          label: `Downloading files ${done}/${total}`,
          current: done,
          total,
          speed: 0
        })
      })
  })

  const report = (phase: string, label: string, current: number, total: number) => {
    onProgress({ phase, label, current, total, speed: 0 })
  }

  report('version.json', `Version index ${meta.id}`, 1, 10)
  await executeInstallManifest(
    {
      schemaVersion: 1,
      tasks: [
        {
          id: 'version-json',
          type: 'files',
          files: [resolveMinecraftVersionJsonInstallFile(meta as CatalogVersion, folder)]
        }
      ]
    },
    runtime,
    { signal: abort.signal }
  )

  const resolved = await Version.parse(folder, versionId)
  const jar = resolveMinecraftJarInstallFile(resolved)

  report('version.jar', `Client ${meta.id}`, 3, 10)
  await executeInstallManifest(
    {
      schemaVersion: 1,
      tasks: [
        ...(jar ? [{ id: 'client-jar', type: 'files' as const, files: [jar] }] : []),
        {
          id: 'libraries',
          type: 'files',
          files: resolveLibraryInstallFiles(resolved.libraries, folder)
        }
      ]
    },
    runtime,
    { signal: abort.signal }
  )

  report('assets', 'Assets index', 7, 10)
  await executeInstallManifest(resolveAssetMetadataInstallManifest(resolved, folder), runtime, {
    signal: abort.signal
  })
  const assets = await resolveAssetObjectInstallFiles(resolved, folder)
  report('assets.assets', 'Assets', 8, 10)
  await executeInstallManifest(
    {
      schemaVersion: 1,
      tasks: [{ id: 'assets', type: 'files', files: assets }]
    },
    runtime,
    { signal: abort.signal }
  )
  report('done', `Installed ${meta.id}`, 10, 10)
}
