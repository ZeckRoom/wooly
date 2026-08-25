import { writeFileSync, readFileSync, globSync } from 'fs'
import { dirname, join } from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

function packageJsonPaths(name) {
  const found = new Set()
  try {
    found.add(require.resolve(`${name}/package.json`))
  } catch {
    // nested under .pnpm when not hoisted
  }
  const folder = name.replace('/', '+')
  for (const pattern of [
    `node_modules/${name}/package.json`,
    `node_modules/.pnpm/${folder}@*/node_modules/${name}/package.json`,
    `node_modules/.pnpm/*/node_modules/${name}/package.json`
  ]) {
    for (const match of globSync(pattern)) {
      found.add(join(process.cwd(), match))
    }
  }
  if (found.size === 0) {
    throw new Error(`Cannot find ${name}/package.json`)
  }
  return [...found]
}

function patchMain(name) {
  for (const pkgPath of packageJsonPaths(name)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    pkg.main = './dist/index.js'
    pkg.module = './dist/index.mjs'
    pkg.types = './dist/index.d.ts'
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  }
}

function patchCoreUtils() {
  for (const pkgPath of packageJsonPaths('@xmcl/core')) {
    writeFileSync(
      join(dirname(pkgPath), 'utils.js'),
      `function isNotNull(v) { return v != null }
async function exists(file) {
  const { access } = require('fs/promises')
  return access(file).then(() => true, () => false)
}
module.exports = { isNotNull, exists }
`
    )
  }
}

for (const name of ['@xmcl/unzip', '@xmcl/file-transfer']) {
  patchMain(name)
}
patchCoreUtils()
