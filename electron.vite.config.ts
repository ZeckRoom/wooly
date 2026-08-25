import { existsSync } from 'fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import stylex from '@stylexjs/unplugin'

const shared = resolve('src/shared')
const rendererSrc = resolve('src/renderer/src')
const STYLEX_EXTS = ['', '.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs'] as const

/**
 * StyleX's default resolver uses import.meta.resolve. On Windows that cannot
 * load aliased absolute paths like D:/project/src/... (Linux /abs paths work).
 */
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
    ]
  }
})
