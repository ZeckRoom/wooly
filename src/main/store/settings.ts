import type { AppSettings } from '@shared/types'
import { settingsFile } from '../paths'
import { readJsonFile, writeJsonFile } from './json'

const defaults: AppSettings = {
  microsoftClientId: process.env.WOOLY_MS_CLIENT_ID?.trim() ?? '',
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
    microsoftClientId: stored.microsoftClientId?.trim() || defaults.microsoftClientId,
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
    microsoftClientId: (patch.microsoftClientId ?? current.microsoftClientId).trim()
  }
  await writeJsonFile(settingsFile(), cache)
  return cache
}
