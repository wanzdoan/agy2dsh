// Generic gRPC probe for the CloudCode/Prediction/Jetski services of the
// Antigravity backend: send a request, decode the protobuf reply generically.
//
//   node grpcprobe.mjs <host> <Service> <Method> [protoHexBody]
import http2 from 'node:http2'
import { loadLocalCliBlob } from './dsh-subscriptions/lib/import-auth.js'
import { refresh } from './dsh-subscriptions/lib/vendors/antigravity.js'

const [, , host = 'cloudcode-pa.googleapis.com', service = 'PredictionService', method = 'RetrieveUserQuotaSummary', protoHex = ''] = process.argv

const blob = await loadLocalCliBlob('antigravity')
const fresh = await refresh({}, blob, fetch, {})
const token = fresh.accessToken

const message = protoHex ? Buffer.from(protoHex, 'hex') : Buffer.alloc(0)
const header = Buffer.alloc(5)
header[0] = 0
header.writeUInt32BE(message.length, 1)
const frame = Buffer.concat([header, message])

const client = http2.connect(`https://${host}`)
const result = await new Promise((resolve, reject) => {
  const req = client.request({
    ':method': 'POST',
    ':path': `/google.internal.cloud.code.v1internal.${service}/${method}`,
    'content-type': 'application/grpc',
    te: 'trailers',
    'grpc-timeout': '20S',
    authorization: 'Bearer ' + token,
    'user-agent': 'antigravity/1.18.3 windows/amd64',
    'x-goog-api-client': 'gl-node/22.19.0',
    'client-metadata': JSON.stringify({ ideType: 'ANTIGRAVITY', platform: 'WINDOWS_AMD64', pluginType: 'GEMINI' }),
  })
  const chunks = []
  let headers = null
  let trailers = null
  req.on('response', (h) => { headers = h })
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('trailers', (t) => { trailers = t })
  req.on('end', () => resolve({ headers, trailers, body: Buffer.concat(chunks) }))
  req.on('error', reject)
  req.end(frame)
})
client.close()

console.log(`\n=== ${host} ${service}/${method}  status=${result.headers && result.headers[':status']} grpc=${(result.trailers && result.trailers['grpc-status']) || (result.headers && result.headers['grpc-status'])}`)
const gmsg = (result.trailers && result.trailers['grpc-message']) || (result.headers && result.headers['grpc-message'])
if (gmsg) console.log('grpc-message:', decodeURIComponent(gmsg).slice(0, 400))
console.log('payload bytes:', result.body.length)
if (!result.body.length) process.exit(0)

const readVarint = (buf, pos) => {
  let value = 0
  let shift = 0
  let index = pos
  while (index < buf.length) {
    const byte = buf[index]
    value += (byte & 0x7f) * Math.pow(2, shift)
    shift += 7
    index += 1
    if ((byte & 0x80) === 0) break
  }
  return { value, pos: index }
}

const tryMessage = (buf) => {
  const fields = []
  let pos = 0
  while (pos < buf.length) {
    const tag = readVarint(buf, pos)
    pos = tag.pos
    const field = Math.floor(tag.value / 8)
    const type = tag.value % 8
    if (field === 0 || field > 4096) return null
    if (type === 0) {
      const v = readVarint(buf, pos)
      pos = v.pos
      fields.push({ field, type: 'varint', value: v.value })
    } else if (type === 1) {
      if (pos + 8 > buf.length) return null
      fields.push({ field, type: 'double', value: buf.readDoubleLE(pos) })
      pos += 8
    } else if (type === 2) {
      const len = readVarint(buf, pos)
      pos = len.pos
      const end = pos + len.value
      if (end > buf.length) return null
      const slice = buf.subarray(pos, end)
      fields.push({ field, type: 'bytes', len: len.value, raw: slice, nested: tryMessage(slice) })
      pos = end
    } else if (type === 5) {
      if (pos + 4 > buf.length) return null
      fields.push({ field, type: 'fixed32', value: buf.readFloatLE(pos) })
      pos += 4
    } else {
      return null
    }
  }
  return fields
}

const printable = (buf) => {
  const text = buf.toString('utf8')
  return /^[\x20-\x7e\u00a0-\uffff]*$/.test(text) ? text : ''
}

const walk = (fields, depth = 0) => {
  for (const f of fields) {
    const pad = '  '.repeat(depth)
    if (f.type === 'bytes') {
      const text = printable(f.raw)
      if (text) console.log(`${pad}#${f.field} = "${text}"`)
      else if (f.nested) { console.log(`${pad}#${f.field} {`); walk(f.nested, depth + 1); console.log(`${pad}}`) }
      else console.log(`${pad}#${f.field} = <${f.len} bytes>`)
    } else {
      console.log(`${pad}#${f.field} = ${f.value}`)
    }
  }
}

let offset = 0
while (offset + 5 <= result.body.length) {
  const compressed = result.body[offset]
  const len = result.body.readUInt32BE(offset + 1)
  const start = offset + 5
  const end = Math.min(start + len, result.body.length)
  const slice = result.body.subarray(start, end)
  if (compressed !== 0) { console.log(`frame @${offset} compressed=${compressed} len=${len}`); offset = end; continue }
  const fields = tryMessage(slice)
  if (fields) walk(fields)
  else console.log(`frame @${offset} undecodable: ${slice.subarray(0, 80).toString('hex')}`)
  offset = end
}
