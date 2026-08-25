import { access, mkdir } from 'fs/promises'
import { join } from 'path'
import { getPlatform } from '@xmcl/core'
import {
  createJavaRuntimeInstallWorkflow,
  createNodeInstallRuntime,
  DEFAULT_RUNTIME_ALL_URL,
  executeInstallWorkflow,
  type JavaRuntimes,
  type JavaRuntimeTarget
} from '@xmcl/installer'
import { javaExecutableName, javaRuntimeFor, type JavaHint } from '@shared/minecraft'
import { runtimesDir } from '../paths'
import { downloadInstallFiles } from './download'

export function javaHomeFor(component: string): string {
  return join(runtimesDir(), component)
}

function runtimePlatformKey(): keyof JavaRuntimes {
  const platform = getPlatform()
  if (platform.name === 'windows') {
    if (platform.arch === 'arm64') return 'windows-arm64'
    if (platform.arch === 'x86' || platform.arch === 'ia32') return 'windows-x86'
    return 'windows-x64'
  }
  if (platform.name === 'osx') {
    return platform.arch === 'arm64' ? 'mac-os-arm64' : 'mac-os'
  }
  if (platform.arch === 'x86' || platform.arch === 'ia32') return 'linux-i386'
  return 'linux'
}

async function officialJavaTarget(component: string): Promise<JavaRuntimeTarget> {
  const response = await fetch(DEFAULT_RUNTIME_ALL_URL)
  if (!response.ok) {
    throw new Error(`Could not fetch Mojang Java index (${response.status}).`)
  }
  const index = (await response.json()) as JavaRuntimes
  const targets = index[runtimePlatformKey()][component]
  const target = targets?.[0]
  if (!target) {
    throw new Error(`No official Java runtime named ${component} for this platform.`)
  }
  return target
}

export async function resolveJavaPath(
  hint: JavaHint | null,
  customPath: string | null
): Promise<string> {
  if (customPath) {
    await access(customPath)
    return customPath
  }
  const component = javaRuntimeFor(hint)
  return join(javaHomeFor(component), 'bin', javaExecutableName())
}

export async function ensureJava(
  hint: JavaHint | null,
  onProgress?: (label: string, current: number, total: number) => void
): Promise<string> {
  const component = javaRuntimeFor(hint)
  const destination = javaHomeFor(component)
  const binary = join(destination, 'bin', javaExecutableName())
  try {
    await access(binary)
    return binary
  } catch {
    onProgress?.('Downloading Java runtime', 0, 1)
    await mkdir(destination, { recursive: true })
    const target = await officialJavaTarget(component)
    await executeInstallWorkflow(
      createJavaRuntimeInstallWorkflow({ target, destination }),
      createNodeInstallRuntime({
        download: (files) => downloadInstallFiles(files)
      })
    )
    await access(binary)
    return binary
  }
}
