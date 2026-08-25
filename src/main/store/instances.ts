import { randomUUID } from 'crypto'
import type { GameInstance, InstanceDraft } from '@shared/types'
import {
  DEFAULT_MEMORY_MAX,
  DEFAULT_MEMORY_MIN,
  normalizeInstanceName,
  validateInstanceDraft,
  versionChannelOf
} from '@shared/instance'
import { mkdir, rm } from 'fs/promises'
import { instanceGameDir, instanceRoot, instancesFile } from '../paths'
import { readJsonFile, writeJsonFile } from './json'

interface StoreShape {
  instances: GameInstance[]
}

let cache: StoreShape | null = null

async function load(): Promise<StoreShape> {
  if (cache) return cache
  cache = await readJsonFile<StoreShape>(instancesFile(), { instances: [] })
  return cache
}

async function persist(): Promise<void> {
  const data = await load()
  await writeJsonFile(instancesFile(), data)
}

export async function listInstances(): Promise<GameInstance[]> {
  return (await load()).instances
}

export async function getInstance(id: string): Promise<GameInstance> {
  const found = (await load()).instances.find((item) => item.id === id)
  if (!found) throw new Error('Instance not found.')
  return found
}

export async function createInstance(draft: InstanceDraft): Promise<GameInstance> {
  const data = await load()
  const name = normalizeInstanceName(draft.name)
  const check = validateInstanceDraft(
    { ...draft, name },
    data.instances.map((i) => i.name)
  )
  if (!check.ok) throw new Error(check.errors[0])

  const instance: GameInstance = {
    id: randomUUID(),
    name,
    group: draft.group,
    versionId: draft.versionId.trim(),
    versionType: versionChannelOf(draft.versionId.includes('w') ? 'snapshot' : 'release'),
    createdAt: new Date().toISOString(),
    lastPlayedAt: null,
    memoryMinMb: draft.memoryMinMb ?? DEFAULT_MEMORY_MIN,
    memoryMaxMb: draft.memoryMaxMb ?? DEFAULT_MEMORY_MAX,
    javaPath: draft.javaPath ?? null,
    jvmArgs: draft.jvmArgs?.trim() ?? '',
    width: draft.width ?? 1280,
    height: draft.height ?? 720,
    fullscreen: draft.fullscreen ?? false
  }

  // Prefer the catalog type when the caller already classified it.
  if (draft.versionId) {
    instance.versionType = instance.versionId.includes('w') ? 'snapshot' : 'release'
  }

  await mkdir(instanceGameDir(instance.id), { recursive: true })
  data.instances.unshift(instance)
  await persist()
  return instance
}

export async function updateInstance(
  id: string,
  patch: Partial<InstanceDraft> & {
    lastPlayedAt?: string | null
    versionType?: GameInstance['versionType']
  }
): Promise<GameInstance> {
  const data = await load()
  const index = data.instances.findIndex((item) => item.id === id)
  if (index < 0) throw new Error('Instance not found.')
  const current = data.instances[index]
  const nextName = patch.name !== undefined ? normalizeInstanceName(patch.name) : current.name
  const mergedDraft: InstanceDraft = {
    name: nextName,
    group: patch.group ?? current.group,
    versionId: patch.versionId ?? current.versionId,
    memoryMaxMb: patch.memoryMaxMb ?? current.memoryMaxMb,
    memoryMinMb: patch.memoryMinMb ?? current.memoryMinMb
  }
  const check = validateInstanceDraft(
    mergedDraft,
    data.instances.map((i) => i.name),
    {
      currentName: current.name
    }
  )
  if (!check.ok) throw new Error(check.errors[0])

  const updated: GameInstance = {
    ...current,
    ...mergedDraft,
    javaPath: patch.javaPath === undefined ? current.javaPath : patch.javaPath,
    jvmArgs: patch.jvmArgs === undefined ? current.jvmArgs : patch.jvmArgs.trim(),
    width: patch.width ?? current.width,
    height: patch.height ?? current.height,
    fullscreen: patch.fullscreen ?? current.fullscreen,
    lastPlayedAt: patch.lastPlayedAt === undefined ? current.lastPlayedAt : patch.lastPlayedAt,
    versionType: patch.versionType ?? current.versionType
  }
  data.instances[index] = updated
  await persist()
  return updated
}

export async function deleteInstance(id: string): Promise<void> {
  const data = await load()
  data.instances = data.instances.filter((item) => item.id !== id)
  await persist()
  await rm(instanceRoot(id), { recursive: true, force: true })
}

export async function touchPlayed(id: string): Promise<GameInstance> {
  return updateInstance(id, { lastPlayedAt: new Date().toISOString() })
}

export async function setInstanceVersionType(
  id: string,
  versionType: GameInstance['versionType']
): Promise<GameInstance> {
  return updateInstance(id, { versionType })
}
