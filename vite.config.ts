import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, relative } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(dir, entry.name)
    return entry.isDirectory() ? listFiles(path) : [path]
  })
}

// Stamps public/sw.js in the build output with a per-build cache version and the list of
// hashed bundle files to precache, so every deploy replaces the previous offline cache.
// The version hashes the content of every output file (bundle, index.html and public/
// files), so a change to e.g. the manifest or an icon also ships a new service worker.
function swBuildVersion(): Plugin {
  let outDir = 'dist'
  let bundleFiles: string[] = []

  return {
    name: 'sw-build-version',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    generateBundle(_options, bundle) {
      bundleFiles = Object.keys(bundle)
        .filter((fileName) => fileName.startsWith('assets/'))
        .sort()
    },
    closeBundle() {
      const swPath = resolve(outDir, 'sw.js')
      if (!existsSync(swPath)) return

      const hash = createHash('sha256')
      for (const file of listFiles(outDir).sort()) {
        if (file === swPath) continue
        hash.update(relative(outDir, file))
        hash.update(readFileSync(file))
      }
      const version = hash.digest('hex').slice(0, 12)

      const source = readFileSync(swPath, 'utf8')
      const stamped = source
        .replace("/*__CACHE_VERSION__*/ 'dev'", JSON.stringify(version))
        .replace('/*__BUILD_ASSETS__*/ []', JSON.stringify(bundleFiles))

      if (stamped === source) {
        throw new Error('sw-build-version: placeholders not found in sw.js')
      }
      writeFileSync(swPath, stamped)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/floorballtimer-web/',
  plugins: [react(), swBuildVersion()],
})
