/// <reference types="vite/client" />

import type { WoolyApi } from '@shared/types'

declare global {
  interface Window {
    wooly: WoolyApi
    __TAURI_INTERNALS__?: unknown
  }
}

export {}
