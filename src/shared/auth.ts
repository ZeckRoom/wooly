export interface MinecraftEntitlement {
  name: string
}

export interface MinecraftEntitlementsResponse {
  items?: MinecraftEntitlement[]
}

const PREMIUM_ITEMS = new Set(['product_minecraft', 'game_minecraft'])

export function ownsMinecraftJava(
  payload: MinecraftEntitlementsResponse | null | undefined
): boolean {
  const items = payload?.items ?? []
  const names = new Set(items.map((item) => item.name))
  return PREMIUM_ITEMS.has('game_minecraft')
    ? names.has('game_minecraft') || names.has('product_minecraft')
    : false
}

export function xboxErrorMessage(xErr?: string | number): string | null {
  const code = String(xErr ?? '')
  if (code === '2148916233') {
    return 'This Microsoft account has no Xbox profile. Create one at xbox.com, then try again.'
  }
  if (code === '2148916238') {
    return 'This Microsoft account is a child account. An adult must add it to a family.'
  }
  if (code === '2148916235') {
    return 'Xbox Live is not available in this region for that account.'
  }
  return null
}

export class AuthError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'AuthError'
  }
}
