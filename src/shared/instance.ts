import type { InstanceDraft, VersionChannel } from './types'

export const NAME_MIN = 1
export const NAME_MAX = 32
export const MEMORY_MIN = 512
export const MEMORY_MAX = 32768
export const MEMORY_STEP = 1024
export const MEMORY_SLIDER_MAX = 16384
export const DEFAULT_MEMORY_MAX = 4096
export const DEFAULT_MEMORY_MIN = 512

export interface InstanceValidation {
  ok: boolean
  errors: string[]
}

const NAME_PATTERN = /^[\p{L}\p{N} _.'-]+$/u

export function snapMemoryMb(mb: number): number {
  const snapped = Math.round(mb / MEMORY_STEP) * MEMORY_STEP
  return Math.min(MEMORY_SLIDER_MAX, Math.max(MEMORY_STEP, snapped))
}

export function normalizeInstanceName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function validateInstanceDraft(
  draft: InstanceDraft,
  existingNames: string[],
  options: { currentName?: string } = {}
): InstanceValidation {
  const errors: string[] = []
  const name = normalizeInstanceName(draft.name)

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    errors.push(`Name must be between ${NAME_MIN} and ${NAME_MAX} characters.`)
  } else if (!NAME_PATTERN.test(name)) {
    errors.push("Name can only contain letters, numbers, spaces, and _ . ' -")
  }

  const taken = existingNames
    .map((n) => n.trim().toLowerCase())
    .filter((n) => n !== options.currentName?.trim().toLowerCase())
  if (taken.includes(name.toLowerCase())) {
    errors.push('An instance with this name already exists.')
  }

  if (!draft.versionId?.trim()) {
    errors.push('Pick a Minecraft version.')
  }

  if (draft.group !== 'vanilla' && draft.group !== 'modded') {
    errors.push('Pick Vanilla or Modded.')
  }

  const max = draft.memoryMaxMb ?? DEFAULT_MEMORY_MAX
  const min = draft.memoryMinMb ?? DEFAULT_MEMORY_MIN
  if (max < MEMORY_STEP || max > MEMORY_MAX || max % MEMORY_STEP !== 0) {
    errors.push(`Max memory must be a multiple of ${MEMORY_STEP} MB.`)
  }
  if (min < MEMORY_MIN || min > max) {
    errors.push('Min memory must be at least 512 MB and not greater than max memory.')
  }

  return { ok: errors.length === 0, errors }
}

export function defaultInstanceDraft(group: InstanceDraft['group'], versionId = ''): InstanceDraft {
  return {
    name: group === 'modded' ? 'New modded instance' : 'New vanilla instance',
    group,
    versionId,
    memoryMaxMb: DEFAULT_MEMORY_MAX,
    memoryMinMb: DEFAULT_MEMORY_MIN,
    javaPath: null,
    jvmArgs: '',
    width: 1280,
    height: 720,
    fullscreen: false
  }
}

export function versionChannelOf(type: string): VersionChannel {
  return type === 'snapshot' ? 'snapshot' : 'release'
}
