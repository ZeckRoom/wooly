import { resolve, sep } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import stylex from '@stylexjs/unplugin'

/** StyleX alias matching breaks on Windows if paths keep backslashes. */
function posixPath(filePath: string): string {
  return filePath.split(sep).join('/')
}

const shared = resolve('src/shared')
const rendererSrc = posixPath(resolve('src/renderer/src'))

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
          '@': [rendererSrc],
          '@/*': [`${rendererSrc}/*`]
        },
        unstable_moduleResolution: {
          type: 'commonJS',
          rootDir: posixPath(process.cwd())
        }
      }),
      react()
    ]
  }
})
