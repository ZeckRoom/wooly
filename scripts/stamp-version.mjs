import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const runNumber = process.argv[2]
if (!runNumber || !/^\d+$/.test(runNumber)) {
  console.error('usage: node scripts/stamp-version.mjs <github_run_number>')
  process.exit(1)
}

const path = fileURLToPath(new URL('../package.json', import.meta.url))
const pkg = JSON.parse(readFileSync(path, 'utf8'))
pkg.version = `0.1.${runNumber}`
writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`)
console.log(`Wooly version ${pkg.version}`)
