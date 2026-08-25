import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import stylex from '@stylexjs/unplugin'

const shared = resolve('src/shared')

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': shared,
        '@xmcl/file-transfer': resolve('node_modules/@xmcl/file-transfer/dist/index.js'),
        '@xmcl/unzip': resolve('node_modules/@xmcl/unzip/dist/index.js'),
        '@xmcl/core/utils': resolve('node_modules/@xmcl/core/utils.js')
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@shared': shared
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src'),
        '@shared': shared
      }
    },
    plugins: [
      stylex.vite({
        useCSSLayers: true,
        aliases: {
          '@/*': [`${resolve('src/renderer/src')}/*`]
        },
        unstable_moduleResolution: {
          type: 'commonJS',
          rootDir: process.cwd()
        }
      }),
      react()
    ]
  }
})
