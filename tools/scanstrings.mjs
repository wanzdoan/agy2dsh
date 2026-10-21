// Extract printable strings from a binary and report the ones that matter for the
// `/usage` command: hosts, RPC method names, and quota-related identifiers.
import { openSync, readSync, closeSync, statSync } from 'node:fs'

const file = process.argv[2] || (process.env.LOCALAPPDATA || '') + '\\agy\\bin\\agy.exe'
const patterns = process.argv[3] ? new RegExp(process.argv[3], 'i') : /googleapis|v1internal|quota|usage|billing|antigravity/i
const minLen = 6
const CHUNK = 8 * 1024 * 1024

const size = statSync(file).size
const fd = openSync(file, 'r')
const seen = new Map()
let carry = Buffer.alloc(0)
let offset = 0

const flush = (buf, baseOffset) => {
  let start = -1
  for (let i = 0; i <= buf.length; i += 1) {
    const byte = i < buf.length ? buf[i] : 0
    const printable = byte >= 0x20 && byte < 0x7f
    if (printable) {
      if (start < 0) start = i
    } else if (start >= 0) {
      const len = i - start
      if (len >= minLen) {
        const text = buf.toString('latin1', start, i)
        if (patterns.test(text) && !seen.has(text)) seen.set(text, baseOffset + start)
      }
      start = -1
    }
  }
}

while (offset < size) {
  const buf = Buffer.alloc(CHUNK)
  const read = readSync(fd, buf, 0, CHUNK, offset)
  if (read <= 0) break
  const slice = Buffer.concat([carry, buf.subarray(0, read)])
  const base = offset - carry.length
  flush(slice, base)
  carry = slice.subarray(Math.max(0, slice.length - 512))
  offset += read
}
closeSync(fd)

const rows = [...seen.entries()].sort((a, b) => a[1] - b[1])
console.log(`file ${file} (${size} bytes) — ${rows.length} matching strings\n`)
for (const [text, at] of rows) console.log(String(at).padStart(11), text.slice(0, 300))
