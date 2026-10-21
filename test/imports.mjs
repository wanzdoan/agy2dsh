// Whole-server-surface import test after the provider prune.
// Imports every lib/**/*.js module (client.js excluded: browser bundle) and
// prints one line per failure.
import { readdir } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const root = path.join(import.meta.dirname, '..', 'lib')
const skip = new Set(['client.js'])

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(full))
    else if (entry.name.endsWith('.js')) out.push(full)
  }
  return out
}

const files = (await walk(root)).filter((f) => !skip.has(path.basename(f))).sort()
let bad = 0
for (const file of files) {
  try {
    await import(pathToFileURL(path.resolve(file)).href)
  } catch (err) {
    bad += 1
    console.log('FAIL', file, '->', String(err && err.message || err).split('\n')[0])
  }
}
console.log(`${files.length - bad}/${files.length} modules import cleanly`)
process.exitCode = bad ? 1 : 0
