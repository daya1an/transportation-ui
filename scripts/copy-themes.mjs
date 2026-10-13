// PrimeReact themes are plain CSS files. Both are served from /themes so the theme switcher can swap them at runtime.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(root, 'node_modules/primereact/resources/themes')
const target = resolve(root, 'public/themes')
const themes = ['lara-light-blue', 'lara-dark-blue']

if (!existsSync(source)) {
  console.warn('PrimeReact themes not found yet, run npm install first')
  process.exit(0)
}
mkdirSync(target, { recursive: true })
for (const name of themes) {
  rmSync(resolve(target, name), { recursive: true, force: true })
  cpSync(resolve(source, name), resolve(target, name), { recursive: true })
}
console.log(`Copied PrimeReact themes: ${themes.join(', ')}`)
