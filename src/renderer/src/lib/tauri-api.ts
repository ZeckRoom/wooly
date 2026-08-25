import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import type { AppSettings, InstanceDraft, WoolyApi } from '@shared/types'

function asError(error: unknown): Error {
  if (error instanceof Error) return error
  if (typeof error === 'string') return new Error(error)
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message))
  }
  return new Error('Something went wrong.')
}

async function call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args)
  } catch (error) {
    throw asError(error)
  }
}

export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function installTauriApi(): void {
  if (typeof window === 'undefined' || window.wooly) return
  const current = getCurrentWindow()

  window.wooly = {
    bootstrap: () => call('wooly_bootstrap'),
    window: {
      minimize: () => current.minimize(),
      maximize: async () => {
        if (await current.isMaximized()) await current.unmaximize()
        else await current.maximize()
      },
      close: () => current.close(),
      isMaximized: () => current.isMaximized()
    },
    settings: {
      get: () => call('wooly_settings_get'),
      set: (patch: Partial<AppSettings>) => call('wooly_settings_set', { patch })
    },
    accounts: {
      list: () => call('wooly_accounts_list'),
      login: () => call('wooly_accounts_login'),
      logout: (id) => call('wooly_accounts_logout', { id }),
      select: (id) => call('wooly_accounts_select', { id })
    },
    instances: {
      list: () => call('wooly_instances_list'),
      create: (draft: InstanceDraft) => call('wooly_instances_create', { draft }),
      update: (id, patch) => call('wooly_instances_update', { id, patch }),
      remove: (id) => call('wooly_instances_delete', { id })
    },
    catalog: {
      versions: () => call('wooly_catalog_versions'),
      refresh: () => call('wooly_catalog_refresh')
    },
    install: {
      start: (instanceId) => call('wooly_install_start', { instanceId }),
      cancel: () => call('wooly_install_cancel')
    },
    launch: {
      play: (instanceId) => call('wooly_launch_play', { instanceId }),
      stop: () => call('wooly_launch_stop')
    },
    openPath: (kind, instanceId) => call('wooly_open_path', { kind, instanceId }),
    update: {
      check: () => call('wooly_update_check'),
      download: () => call('wooly_update_download'),
      install: () => call('wooly_update_install')
    },
    on: (channel, listener) => {
      let cancelled = false
      let unlisten: (() => void) | undefined
      void listen(channel, (event) => {
        listener(event.payload)
      }).then((fn) => {
        if (cancelled) fn()
        else unlisten = fn
      })
      return () => {
        cancelled = true
        unlisten?.()
      }
    }
  } satisfies WoolyApi
}
