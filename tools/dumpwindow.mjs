// Print the printable runs inside a file window: used to read Go proto
// descriptors (field names) embedded in the binary.
import { openSync, readSync, closeSync } from 'node:fs'

const file = process.argv[2]
const start = Number(process.argv[3])
const length = Number(process.argv[4] || 4096)
const fd = openSync(file, 'r')
const buf = Buffer.alloc(length)
readSync(fd, buf, 0, length, start)
closeSync(fd)

const text = buf.toString('latin1')
let run = ''
let lineStart = 0
const out = []
for (let i = 0; i < text.length; i += 1) {
  const code = text.charCodeAt(i)
  if (code >= 0x20 && code < 0x7f) {
    if (!run) lineStart = start + i
    run += text[i]
  } else if (run) {
    if (run.length >= 3) out.push(String(lineStart).padStart(11) + ' | ' + run)
    run = ''
  }
}
if (run.length >= 3) out.push(String(lineStart).padStart(11) + ' | ' + run)
console.log(out.join('\n'))
