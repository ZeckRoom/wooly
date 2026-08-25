import type { AppSettings } from '@shared/types'
import { resolveWoolyMsClientId } from '@shared/constants'
import { settingsFile } from '../paths'
import { readJsonFile, writeJsonFile } from './json'

const defaults: AppSettings = {
  microsoftClientId: resolveWoolyMsClientId({ env: process.env.WOOLY_MS_CLIENT_ID }),
  keepOpenOnLaunch: true,
  language: 'en'
}

let cache: AppSettings | null = null

export async function loadSettings(): Promise<AppSettings> {
  if (cache) return cache
  const stored = await readJsonFile<Partial<AppSettings>>(settingsFile(), {})
  cache = {
    ...defaults,
    ...stored,
    microsoftClientId: resolveWoolyMsClientId({
      stored: stored.microsoftClientId,
      env: process.env.WOOLY_MS_CLIENT_ID
    }),
    language: 'en'
  }
  return cache
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings()
  cache = {
    ...current,
    ...patch,
    language: 'en',
    microsoftClientId: resolveWoolyMsClientId({
      stored: patch.microsoftClientId ?? current.microsoftClientId,
      env: process.env.WOOLY_MS_CLIENT_ID
    })
  }
  await writeJsonFile(settingsFile(), cache)
  return cache
}
