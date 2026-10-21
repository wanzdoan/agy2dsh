// Proves the CLI quota path end to end: same values `agy /usage` prints, mapped
// to the four windows the pill renders.
import { cliUsageSnapshot, windowsFromCli, agyBinary, readCliUsage } from '../lib/agy-usage.js'
import { loadLocalCliBlob } from '../lib/import-auth.js'

const bin = agyBinary()
console.log('agy binary:', bin)
if (!bin) process.exit(1)

const blob = await loadLocalCliBlob('antigravity')
const snap = await cliUsageSnapshot(blob.email)
if (!snap) {
  console.log('FAIL no CLI snapshot for', blob.email)
  process.exit(1)
}

console.log('source:', snap.source, '| worst used:', snap.usedPercent)
for (const win of snap.windows) {
  console.log(`  ${String(win.id).padEnd(13)} ${String(win.window).padEnd(7)} remaining ${String(win.remainingPercent) + '%'} reset ${new Date(win.resetAt).toISOString()}`)
}
const pill = snap.families.map((family) => {
  const pick = (id) => {
    const hit = (family.windows || []).find((w) => w.window === id)
    return hit ? Math.round(hit.remainingPercent) + '%' : '—'
  }
  return `${family.en} [${pick('weekly')}|${pick('5h')}]`
}).join(' | ')
console.log('pill:', pill)

const raw = await readCliUsage()
const expected = windowsFromCli(raw)
const sameCount = expected.length === snap.windows.length
const sameValues = expected.every((win) => snap.windows.some((other) => other.id === win.id && other.usedPercent === win.usedPercent))
console.log(sameCount && sameValues ? 'PASS windows match the raw CLI payload' : 'FAIL window mismatch')
process.exitCode = sameCount && sameValues && snap.windows.length === 4 ? 0 : 1
