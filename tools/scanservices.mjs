// Enumerate every gRPC full-method path and every proto service embedded in the binary.
import { openSync, readSync, closeSync, statSync } from 'node:fs'

const file = process.argv[2] || (process.env.LOCALAPPDATA || '') + '\\agy\\bin\\agy.exe'
const CHUNK = 16 * 1024 * 1024
const size = statSync(file).size
const fd = openSync(file, 'r')
const paths = new Map()
const services = new Map()

let offset = 0
let carry = ''
while (offset < size) {
  const buf = Buffer.alloc(CHUNK)
  const read = readSync(fd, buf, 0, CHUNK, offset)
  if (read <= 0) break
  const text = carry + buf.toString('latin1', 0, read)
  for (const match of text.matchAll(/\/[a-z0-9_.]+\.[A-Za-z0-9]+\/[A-Z][A-Za-z0-9_]+/g)) {
    if (!paths.has(match[0])) paths.set(match[0], offset + match.index)
  }
  for (const match of text.matchAll(/\bgoogle\.internal\.[a-z0-9]+(\.[a-z0-9]+)*\b/g)) {
    if (!services.has(match[0])) services.set(match[0], offset + match.index)
  }
  carry = text.slice(-512)
  offset += read
}
closeSync(fd)

console.log(`--- ${services.size} proto service packages`)
for (const key of [...services.keys()].sort()) console.log('   ', key)
console.log(`\n--- ${paths.size} gRPC method paths`)
const byService = new Map()
for (const path of paths.keys()) {
  const [, service] = path.split('/')
  if (!byService.has(service)) byService.set(service, [])
  byService.get(service).push(path.split('/')[2])
}
for (const [service, methods] of [...byService.entries()].sort()) {
  console.log(`\n${service} (${methods.length})`)
  console.log('   ' + methods.sort().join(', '))
}
