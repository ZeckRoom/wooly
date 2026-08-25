import { createHash } from 'crypto'
import { createWriteStream } from 'fs'
import { access, mkdir, readFile } from 'fs/promises'
import { dirname } from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import type { InstallFile } from '@xmcl/installer'

const CONCURRENCY = 16

export async function downloadInstallFiles(
  files: InstallFile[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  let completed = 0
  const total = files.length
  const queue = [...files]

  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length || 1) }, async () => {
    while (queue.length) {
      const file = queue.pop()
      if (!file) return
      await downloadOne(file)
      completed += 1
      onProgress?.(completed, total)
    }
  })
  await Promise.all(workers)
}

async function downloadOne(file: InstallFile): Promise<void> {
  await mkdir(dirname(file.path), { recursive: true })
  if (file.checksum && !file.replace) {
    const ok = await matchesChecksum(file.path, file.checksum.algorithm, file.checksum.value)
    if (ok) return
  }

  let lastError: unknown
  for (const url of file.urls) {
    try {
      const response = await fetch(url)
      if (!response.ok || !response.body) {
        throw new Error(`${url} -> ${response.status}`)
      }
      await pipeline(Readable.fromWeb(response.body as never), createWriteStream(file.path))
      if (file.checksum) {
        const ok = await matchesChecksum(file.path, file.checksum.algorithm, file.checksum.value)
        if (!ok) throw new Error(`Checksum mismatch for ${file.path}`)
      }
      return
    } catch (error) {
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to download ${file.path}`)
}

async function matchesChecksum(
  path: string,
  algorithm: string,
  expected: string
): Promise<boolean> {
  try {
    await access(path)
    const buf = await readFile(path)
    const hash = createHash(algorithm).update(buf).digest('hex')
    return hash === expected
  } catch {
    return false
  }
}
