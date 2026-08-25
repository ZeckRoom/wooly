import { describe, expect, it } from 'vitest'
import { ownsMinecraftJava, xboxErrorMessage } from './auth'
import { decorateCatalog, filterCatalog, javaRuntimeFor } from './minecraft'
import { DEFAULT_MEMORY_MAX, defaultInstanceDraft, validateInstanceDraft } from './instance'

describe('ownsMinecraftJava', () => {
  it('accepts premium entitlements', () => {
    expect(
      ownsMinecraftJava({
        items: [{ name: 'product_minecraft' }, { name: 'game_minecraft' }]
      })
    ).toBe(true)
    expect(ownsMinecraftJava({ items: [{ name: 'game_minecraft' }] })).toBe(true)
    expect(ownsMinecraftJava({ items: [{ name: 'product_minecraft' }] })).toBe(true)
  })

  it('rejects empty or unrelated entitlements', () => {
    expect(ownsMinecraftJava({ items: [] })).toBe(false)
    expect(ownsMinecraftJava({ items: [{ name: 'product_minecraft_bedrock' }] })).toBe(false)
    expect(ownsMinecraftJava(null)).toBe(false)
  })
})

describe('xboxErrorMessage', () => {
  it('maps known XSTS codes', () => {
    expect(xboxErrorMessage(2148916233)).toMatch(/Xbox profile/)
    expect(xboxErrorMessage('2148916238')).toMatch(/child/)
    expect(xboxErrorMessage('nope')).toBeNull()
  })
})

describe('catalog helpers', () => {
  const versions = decorateCatalog(
    [
      { id: '1.21.4', type: 'release', releaseTime: '2024-12-01', url: 'https://example/a' },
      { id: '25w04a', type: 'snapshot', releaseTime: '2025-01-20', url: 'https://example/b' },
      { id: 'rd-132211', type: 'old_alpha', releaseTime: '2009-05-13', url: 'https://example/c' }
    ],
    { release: '1.21.4', snapshot: '25w04a' }
  )

  it('keeps only release and snapshot', () => {
    expect(versions.map((v) => v.id)).toEqual(['1.21.4', '25w04a'])
    expect(versions[0].latestRelease).toBe(true)
    expect(versions[1].latestSnapshot).toBe(true)
  })

  it('filters by query and channel', () => {
    expect(filterCatalog(versions, '', 'release').map((v) => v.id)).toEqual(['1.21.4'])
    expect(filterCatalog(versions, '25w', 'all').map((v) => v.id)).toEqual(['25w04a'])
  })
})

describe('javaRuntimeFor', () => {
  it('prefers Mojang component names', () => {
    expect(javaRuntimeFor({ component: 'java-runtime-delta', majorVersion: 8 })).toBe(
      'java-runtime-delta'
    )
  })

  it('falls back by major version', () => {
    expect(javaRuntimeFor({ majorVersion: 21 })).toBe('java-runtime-delta')
    expect(javaRuntimeFor({ majorVersion: 17 })).toBe('java-runtime-gamma')
    expect(javaRuntimeFor(undefined)).toBe('jre-legacy')
  })
})

describe('validateInstanceDraft', () => {
  it('accepts a complete vanilla instance', () => {
    const draft = { ...defaultInstanceDraft('vanilla', '1.21.4'), name: 'Survival' }
    expect(validateInstanceDraft(draft, []).ok).toBe(true)
  })

  it('rejects duplicates and empty versions', () => {
    const draft = { ...defaultInstanceDraft('modded'), name: 'Pack', versionId: '' }
    const result = validateInstanceDraft(draft, ['pack'])
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toMatch(/already exists/)
    expect(result.errors.join(' ')).toMatch(/version/)
  })

  it('rejects tiny memory', () => {
    const draft = {
      ...defaultInstanceDraft('vanilla', '1.21.1'),
      name: 'Low',
      memoryMaxMb: 128,
      memoryMinMb: 64
    }
    expect(validateInstanceDraft(draft, []).ok).toBe(false)
  })

  it('uses a sane default max memory', () => {
    expect(DEFAULT_MEMORY_MAX).toBe(4096)
  })
})
