import { launch, Version } from '@xmcl/core'
import type { ChildProcess } from 'child_process'
import type { GameInstance, LogLine } from '@shared/types'
import { getActiveAccount } from '../store/accounts'
import { silentMinecraftToken } from '../auth/microsoft'
import { instanceGameDir, metaDir } from '../paths'
import { ensureJava } from './java'

export interface LaunchHandle {
  process: ChildProcess
}

let current: ChildProcess | null = null
let logSeq = 0

export function isGameRunning(): boolean {
  return Boolean(current && current.exitCode === null)
}

export function stopGame(): void {
  if (!current) return
  const proc = current
  current = null
  if (process.platform === 'win32') {
    proc.kill()
  } else {
    proc.kill('SIGTERM')
  }
}

export async function playInstance(
  instance: GameInstance,
  onLog: (line: LogLine) => void,
  onExit: (code: number | null) => void
): Promise<void> {
  if (isGameRunning()) {
    throw new Error('Minecraft is already running.')
  }

  const account = await getActiveAccount()
  if (!account) {
    throw new Error('Sign in with a premium Microsoft account before playing.')
  }
  const accessToken = await silentMinecraftToken(account.id)

  const resourcePath = metaDir()
  const resolved = await Version.parse(resourcePath, instance.versionId)
  const javaPath = instance.javaPath
    ? instance.javaPath
    : await ensureJava(resolved.javaVersion ?? null, (label, currentBytes, total) => {
        onLog({
          id: ++logSeq,
          ts: Date.now(),
          stream: 'launcher',
          text: total ? `${label} ${Math.round((currentBytes / total) * 100)}%` : label
        })
      })

  const extraJvm = instance.jvmArgs
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)

  const gameProfile = {
    id: account.id,
    name: account.username
  }

  onLog({
    id: ++logSeq,
    ts: Date.now(),
    stream: 'launcher',
    text: `Launching ${instance.versionId} as ${account.username}`
  })

  const proc = await launch({
    gamePath: instanceGameDir(instance.id),
    resourcePath,
    javaPath,
    version: instance.versionId,
    gameProfile,
    accessToken,
    minMemory: instance.memoryMinMb,
    maxMemory: instance.memoryMaxMb,
    extraJVMArgs: extraJvm,
    resolution: {
      width: instance.width,
      height: instance.height,
      fullscreen: instance.fullscreen
    },
    launcherName: 'wooly',
    launcherBrand: 'wooly',
    extraExecOption: {
      stdio: ['ignore', 'pipe', 'pipe']
    }
  })

  current = proc
  const push = (stream: LogLine['stream'], chunk: Buffer | string) => {
    const text = chunk.toString()
    for (const line of text.split(/\r?\n/)) {
      if (!line) continue
      onLog({ id: ++logSeq, ts: Date.now(), stream, text: line })
    }
  }
  proc.stdout?.on('data', (chunk) => push('stdout', chunk))
  proc.stderr?.on('data', (chunk) => push('stderr', chunk))
  proc.on('exit', (code) => {
    if (current === proc) current = null
    onLog({
      id: ++logSeq,
      ts: Date.now(),
      stream: 'launcher',
      text: `Minecraft exited (${code ?? 'null'})`
    })
    onExit(code)
  })
}
