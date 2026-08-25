import { existsSync } from 'fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import stylex from '@stylexjs/unplugin'

const shared = resolve('src/shared')
const rendererSrc = resolve('src/renderer/src')
const STYLEX_EXTS = ['', '.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs'] as const
const host = process.env.TAURI_DEV_HOST

function expandStylexSpecs(
  importPath: string,
  aliases: Readonly<{ [key: string]: ReadonlyArray<string> }> | null | undefined
): string[] {
  const specs = [importPath]
  if (aliases == null) {
    return specs
  }
  for (const [alias, values] of Object.entries(aliases)) {
    if (alias.includes('*')) {
      const [before, after = ''] = alias.split('*')
      if (importPath.startsWith(before) && importPath.endsWith(after)) {
        const mid = importPath.slice(before.length, after.length > 0 ? -after.length : undefined)
        for (const value of values) {
          specs.push(value.split('*').join(mid))
        }
      }
    } else if (importPath === alias || importPath.startsWith(`${alias}/`)) {
      const rest = importPath === alias ? '' : importPath.slice(alias.length + 1)
      for (const value of values) {
        specs.push(rest ? `${value.replace(/[/\\]+$/, '')}/${rest}` : value)
      }
    }
  }
  return specs
}

function resolveStylexFile(
  importPath: string,
  sourceFilePath: string,
  aliases: Readonly<{ [key: string]: ReadonlyArray<string> }> | null | undefined
): string | undefined {
  const fromDir = dirname(sourceFilePath)
  for (const spec of expandStylexSpecs(importPath, aliases)) {
    const absolute = spec.startsWith('.') || !isAbsolute(spec) ? resolve(fromDir, spec) : spec
    for (const ext of STYLEX_EXTS) {
      const candidate = absolute + ext
      if (existsSync(candidate)) {
        return candidate
      }
    }
  }
  return undefined
}

export default defineConfig({
  root: resolve('src/renderer'),
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  server: {
    host: host || '127.0.0.1',
    port: 5173,
    strictPort: true,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**']
    }
  },
  resolve: {
    alias: {
      '@renderer': rendererSrc,
      '@': rendererSrc,
      '@shared': shared
    }
  },
  plugins: [
    stylex.vite({
      useCSSLayers: true,
      aliases: {
        '@': [rendererSrc],
        '@/*': [`${rendererSrc.split('\\').join('/')}/*`]
      },
      unstable_moduleResolution: {
        type: 'custom',
        filePathResolver: (importPath, sourceFilePath, aliases) =>
          resolveStylexFile(importPath, sourceFilePath, aliases),
        getCanonicalFilePath: (filePath) => relative(process.cwd(), filePath).split(sep).join('/')
      }
    }),
    react()
  ],
  build: {
    outDir: resolve('dist'),
    emptyOutDir: true,
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari14',
    minify: process.env.TAURI_ENV_DEBUG ? false : 'esbuild',
    sourcemap: !!process.env.TAURI_ENV_DEBUG
  }
})
