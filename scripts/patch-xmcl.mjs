import { writeFileSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

function patchMain(name) {
  const pkgPath = require.resolve(`${name}/package.json`)
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  pkg.main = './dist/index.js'
  pkg.module = './dist/index.mjs'
  pkg.types = './dist/index.d.ts'
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

function patchCoreUtils() {
  const pkgPath = require.resolve('@xmcl/core/package.json')
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

for (const name of ['@xmcl/unzip', '@xmcl/file-transfer']) {
  patchMain(name)
}
patchCoreUtils()
