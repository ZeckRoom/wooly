import { safeStorage } from 'electron'
import type { PublicAccount } from '@shared/types'
import { accountsFile } from '../paths'
import { readJsonFile, writeJsonFile } from './json'

export interface TokenBundle {
  msAccessToken: string
  msRefreshToken: string
  msalCache?: string
  msExpiresAt: number
  mcAccessToken: string
  mcExpiresAt: number
}

export interface StoredAccount extends PublicAccount {
  tokenBlob: string
}

interface AccountStore {
  activeAccountId: string | null
  accounts: StoredAccount[]
}

let cache: AccountStore | null = null

function emptyStore(): AccountStore {
  return { activeAccountId: null, accounts: [] }
}

export function encryptSecret(value: string): string {
  if (safeStorage.isEncryptionAvailable()) {
    return `enc:${safeStorage.encryptString(value).toString('base64')}`
  }
  return `plain:${Buffer.from(value, 'utf8').toString('base64')}`
}

export function decryptSecret(value: string): string {
  if (value.startsWith('enc:')) {
    return safeStorage.decryptString(Buffer.from(value.slice(4), 'base64'))
  }
  if (value.startsWith('plain:')) {
    return Buffer.from(value.slice(6), 'base64').toString('utf8')
  }
  return value
}

async function load(): Promise<AccountStore> {
  if (cache) return cache
  cache = await readJsonFile<AccountStore>(accountsFile(), emptyStore())
  return cache
}

async function persist(): Promise<void> {
  await writeJsonFile(accountsFile(), await load())
}

function toPublic(account: StoredAccount): PublicAccount {
  return {
    id: account.id,
    username: account.username,
    xboxGamertag: account.xboxGamertag,
    avatarUrl: account.avatarUrl
  }
}

export async function listPublicAccounts(): Promise<{
  accounts: PublicAccount[]
  activeAccountId: string | null
}> {
  const data = await load()
  return {
    activeAccountId: data.activeAccountId,
    accounts: data.accounts.map(toPublic)
  }
}

export async function getStoredAccount(id: string): Promise<StoredAccount> {
  const found = (await load()).accounts.find((item) => item.id === id)
  if (!found) throw new Error('Account not found.')
  return found
}

export async function getActiveAccount(): Promise<StoredAccount | null> {
  const data = await load()
  if (!data.activeAccountId) return data.accounts[0] ?? null
  return data.accounts.find((item) => item.id === data.activeAccountId) ?? data.accounts[0] ?? null
}

export async function upsertAccount(
  account: PublicAccount,
  tokens: TokenBundle
): Promise<PublicAccount> {
  const data = await load()
  const stored: StoredAccount = {
    ...account,
    tokenBlob: encryptSecret(JSON.stringify(tokens))
  }
  const index = data.accounts.findIndex((item) => item.id === account.id)
  if (index >= 0) data.accounts[index] = stored
  else data.accounts.unshift(stored)
  data.activeAccountId = account.id
  await persist()
  return toPublic(stored)
}

export async function readTokens(id: string): Promise<TokenBundle> {
  const stored = await getStoredAccount(id)
  return JSON.parse(decryptSecret(stored.tokenBlob)) as TokenBundle
}

export async function selectAccount(id: string): Promise<void> {
  const data = await load()
  if (!data.accounts.some((item) => item.id === id)) throw new Error('Account not found.')
  data.activeAccountId = id
  await persist()
}

export async function removeAccount(id: string): Promise<void> {
  const data = await load()
  data.accounts = data.accounts.filter((item) => item.id !== id)
  if (data.activeAccountId === id) {
    data.activeAccountId = data.accounts[0]?.id ?? null
  }
  await persist()
}
