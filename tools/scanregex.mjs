// Regex extraction over the binary's printable runs: gRPC full method names,
// googleapis hosts, and quota-related identifiers.
import { openSync, readSync, closeSync, statSync } from 'node:fs'

const file = process.argv[2] || (process.env.LOCALAPPDATA || '') + '\\agy\\bin\\agy.exe'
const mode = process.argv[3] || 'methods'
const CHUNK = 16 * 1024 * 1024
const size = statSync(file).size
const fd = openSync(file, 'r')
const hits = new Map()

const patterns = {
  methods: /\/google\.internal\.cloud\.code\.v1internal\.[A-Za-z0-9]+\/[A-Za-z0-9_]+/g,
  services: /\b(?:CloudCode|JetskiService[A-Za-z]*)\/[A-Za-z0-9_]+/g,
  hosts: /https?:\/\/[a-z0-9.-]*googleapis\.com[a-zA-Z0-9/_.:-]*/g,
  quota: /[A-Za-z0-9_.\/-]*[Qq]uota[A-Za-z0-9_.\/-]*/g,
}

let offset = 0
let carry = ''
while (offset < size) {
  const buf = Buffer.alloc(CHUNK)
  const read = readSync(fd, buf, 0, CHUNK, offset)
  if (read <= 0) break
  const text = carry + buf.toString('latin1', 0, read)
  const regex = new RegExp(patterns[mode].source, 'g')
  let match
  while ((match = regex.exec(text)) !== null) {
    const value = match[0]
    if (!hits.has(value)) hits.set(value, offset + match.index)
  }
  carry = text.slice(-256)
  offset += read
}
closeSync(fd)

const rows = [...hits.entries()].sort((a, b) => a[1] - b[1])
console.log(`${rows.length} unique ${mode} hits\n`)
for (const [value, at] of rows) console.log(String(at).padStart(11), value)
