import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const runNumber = process.argv[2]
if (!runNumber || !/^\d+$/.test(runNumber)) {
  console.error('usage: node scripts/stamp-version.mjs <github_run_number>')
  process.exit(1)
}

const version = `0.1.${runNumber}`

const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url))
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
pkg.version = version
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

const cargoPath = fileURLToPath(new URL('../src-tauri/Cargo.toml', import.meta.url))
const cargo = readFileSync(cargoPath, 'utf8').replace(
  /^version = ".*"$/m,
  `version = "${version}"`
)
writeFileSync(cargoPath, cargo)

console.log(`Wooly version ${version}`)
