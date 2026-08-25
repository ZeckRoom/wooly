import type { WoolyApi } from '@shared/types'

declare global {
  interface Window {
    wooly: WoolyApi
  }
}

export {}
