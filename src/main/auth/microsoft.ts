import { PublicClientApplication, type DeviceCodeRequest } from '@azure/msal-node'
import { shell } from 'electron'
import { AuthError, ownsMinecraftJava, xboxErrorMessage } from '@shared/auth'
import { MS_SCOPES } from '@shared/constants'
import type { AuthPrompt, PublicAccount } from '@shared/types'
import { loadSettings } from '../store/settings'
import { readTokens, upsertAccount, type TokenBundle } from '../store/accounts'

const XBOX_USER = 'https://user.auth.xboxlive.com/user/authenticate'
const XBOX_XSTS = 'https://xsts.auth.xboxlive.com/xsts/authorize'
const MC_LOGIN = 'https://api.minecraftservices.com/authentication/login_with_xbox'
const MC_ENTITLEMENTS = 'https://api.minecraftservices.com/entitlements/mcstore'
const MC_PROFILE = 'https://api.minecraftservices.com/minecraft/profile'

export type AuthEventSink = (prompt: AuthPrompt | null) => void

function msal(clientId: string): PublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId,
      authority: 'https://login.microsoftonline.com/consumers'
    }
  })
}

async function json<T>(input: string, init: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  const body = (await response.json().catch(() => ({}))) as T & {
    XErr?: number
    errorMessage?: string
    error?: string
  }
  if (!response.ok) {
    const xbox = xboxErrorMessage(body.XErr)
    throw new AuthError(
      String(body.XErr ?? body.error ?? response.status),
      xbox ?? body.errorMessage ?? body.error ?? `Request failed (${response.status})`
    )
  }
  return body
}

async function xboxToMinecraft(msAccessToken: string): Promise<{
  mcAccessToken: string
  mcExpiresAt: number
  xboxGamertag?: string
}> {
  const rpsTicket = msAccessToken.startsWith('d=') ? msAccessToken : `d=${msAccessToken}`
  const xbox = await json<{
    Token: string
    DisplayClaims: { xui: Array<{ uhs: string; gtg?: string }> }
  }>(XBOX_USER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      Properties: {
        AuthMethod: 'RPS',
        SiteName: 'user.auth.xboxlive.com',
        RpsTicket: rpsTicket
      },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType: 'JWT'
    })
  })

  const xsts = await json<{
    Token: string
    DisplayClaims: { xui: Array<{ uhs: string }> }
  }>(XBOX_XSTS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      Properties: {
        SandboxId: 'RETAIL',
        UserTokens: [xbox.Token]
      },
      RelyingParty: 'rp://api.minecraftservices.com/',
      TokenType: 'JWT'
    })
  })

  const uhs = xsts.DisplayClaims.xui[0]?.uhs
  const mc = await json<{ access_token: string; expires_in: number }>(MC_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identityToken: `XBL3.0 x=${uhs};${xsts.Token}`
    })
  })

  return {
    mcAccessToken: mc.access_token,
    mcExpiresAt: Date.now() + (mc.expires_in - 60) * 1000,
    xboxGamertag: xbox.DisplayClaims.xui[0]?.gtg
  }
}

async function requirePremiumProfile(
  mcAccessToken: string,
  xboxGamertag?: string
): Promise<PublicAccount> {
  const entitlements = await json<{ items?: Array<{ name: string }> }>(MC_ENTITLEMENTS, {
    headers: { Authorization: `Bearer ${mcAccessToken}` }
  })
  if (!ownsMinecraftJava(entitlements)) {
    throw new AuthError(
      'NOT_PREMIUM',
      'This Microsoft account does not own Minecraft Java Edition. Wooly only launches premium accounts.'
    )
  }

  const profile = await json<{ id: string; name: string }>(MC_PROFILE, {
    headers: { Authorization: `Bearer ${mcAccessToken}` }
  })
  if (!profile?.id || !profile.name) {
    throw new AuthError(
      'NO_PROFILE',
      'Minecraft Java is owned, but no profile was returned. Open minecraft.net once, then try again.'
    )
  }

  return {
    id: profile.id,
    username: profile.name,
    xboxGamertag,
    avatarUrl: `https://mc-heads.net/avatar/${profile.id}/64`
  }
}

export async function resolveClientId(): Promise<string> {
  const settings = await loadSettings()
  return settings.microsoftClientId
}

export async function loginMicrosoft(onPrompt: AuthEventSink): Promise<PublicAccount> {
  const clientId = await resolveClientId()
  const pca = msal(clientId)

  let result
  try {
    onPrompt({
      kind: 'browser',
      message: 'Complete sign-in in your browser. Wooly is waiting for Microsoft.'
    })
    result = await pca.acquireTokenInteractive({
      scopes: [...MS_SCOPES],
      openBrowser: async (url) => {
        await shell.openExternal(url)
      },
      successTemplate:
        '<html><body style="font-family:Inter,sans-serif;background:#161310;color:#f3ece3;display:grid;place-items:center;height:100vh"><p>You can close this tab and return to Wooly.</p></body></html>',
      errorTemplate:
        '<html><body style="font-family:Inter,sans-serif;background:#161310;color:#f3ece3;display:grid;place-items:center;height:100vh"><p>Sign-in failed. Close this tab and try again in Wooly.</p></body></html>'
    })
  } catch {
    const device: DeviceCodeRequest = {
      scopes: [...MS_SCOPES],
      deviceCodeCallback: (response) => {
        onPrompt({
          kind: 'device_code',
          userCode: response.userCode,
          verificationUri: response.verificationUri,
          message: response.message
        })
        void shell.openExternal(response.verificationUri)
      }
    }
    result = await pca.acquireTokenByDeviceCode(device)
  } finally {
    onPrompt(null)
  }

  if (!result?.accessToken) {
    throw new AuthError('MS_LOGIN_FAILED', 'Microsoft sign-in did not return an access token.')
  }

  const xbox = await xboxToMinecraft(result.accessToken)
  const account = await requirePremiumProfile(xbox.mcAccessToken, xbox.xboxGamertag)
  const tokens: TokenBundle = {
    msAccessToken: result.accessToken,
    msRefreshToken: (result as { refreshToken?: string }).refreshToken ?? '',
    msalCache: pca.getTokenCache().serialize(),
    msExpiresAt: result.expiresOn ? result.expiresOn.getTime() : Date.now() + 3600_000,
    mcAccessToken: xbox.mcAccessToken,
    mcExpiresAt: xbox.mcExpiresAt
  }
  return upsertAccount(account, tokens)
}

async function refreshMicrosoftToken(
  refreshToken: string,
  clientId: string
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: MS_SCOPES.join(' ')
  })
  const response = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  const payload = (await response.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error_description?: string
  }
  if (!response.ok || !payload.access_token) {
    throw new AuthError(
      'SESSION_EXPIRED',
      payload.error_description ??
        'This Microsoft session expired. Sign in again from the account menu.'
    )
  }
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? refreshToken,
    expiresAt: Date.now() + ((payload.expires_in ?? 3600) - 60) * 1000
  }
}

function refreshTokenFromCache(serialized?: string): string | null {
  if (!serialized) return null
  try {
    const parsed = JSON.parse(serialized) as { RefreshToken?: Record<string, { secret?: string }> }
    const first = Object.values(parsed.RefreshToken ?? {})[0]
    return first?.secret ?? null
  } catch {
    return null
  }
}

export async function silentMinecraftToken(accountId: string): Promise<string> {
  const tokens = await readTokens(accountId)
  if (tokens.mcAccessToken && tokens.mcExpiresAt > Date.now() + 15_000) {
    return tokens.mcAccessToken
  }

  const clientId = await resolveClientId()
  let access = ''
  let refresh = tokens.msRefreshToken || refreshTokenFromCache(tokens.msalCache) || ''
  let expiresAt = Date.now() + 3600_000
  let cache = tokens.msalCache

  const pca = msal(clientId)
  if (tokens.msalCache) {
    pca.getTokenCache().deserialize(tokens.msalCache)
    const accounts = await pca.getTokenCache().getAllAccounts()
    const silent = accounts[0]
      ? await pca
          .acquireTokenSilent({ scopes: [...MS_SCOPES], account: accounts[0] })
          .catch(() => null)
      : null
    if (silent?.accessToken) {
      access = silent.accessToken
      expiresAt = silent.expiresOn ? silent.expiresOn.getTime() : expiresAt
      cache = pca.getTokenCache().serialize()
      refresh = refreshTokenFromCache(cache) ?? refresh
    }
  }

  if (!access) {
    if (!refresh) {
      throw new AuthError(
        'SESSION_EXPIRED',
        'This Microsoft session expired. Sign in again from the account menu.'
      )
    }
    const refreshed = await refreshMicrosoftToken(refresh, clientId)
    access = refreshed.accessToken
    refresh = refreshed.refreshToken
    expiresAt = refreshed.expiresAt
  }

  const xbox = await xboxToMinecraft(access)
  const profile = await requirePremiumProfile(xbox.mcAccessToken, xbox.xboxGamertag)
  await upsertAccount(profile, {
    msAccessToken: access,
    msRefreshToken: refresh,
    msalCache: cache,
    msExpiresAt: expiresAt,
    mcAccessToken: xbox.mcAccessToken,
    mcExpiresAt: xbox.mcExpiresAt
  })
  return xbox.mcAccessToken
}
