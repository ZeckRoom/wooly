function readPackage(pkg) {
  if (pkg.name === '@xmcl/unzip' || pkg.name === '@xmcl/file-transfer') {
    pkg.main = './dist/index.js'
    pkg.module = './dist/index.mjs'
    pkg.types = './dist/index.d.ts'
  }
  return pkg
}

module.exports = {
  hooks: {
    readPackage
  }
}
