// Guard: the settings service only writes paths whose schema is marked volatile.
// Every user-editable field must therefore carry `.volatile()`, or saving the
// settings form fails with `Config field "<x>" is not volatile`.
import { Config } from '../lib/config-schema.js'

const missing = []
for (const key of Object.keys(Config.dict || {})) {
  const field = Config.dict[key]
  const volatile = !!(field && field.meta && field.meta.volatile)
  if (!volatile) missing.push(key)
}

const total = Object.keys(Config.dict || {}).length
if (missing.length) {
  console.log(`FAIL ${missing.length}/${total} fields are not volatile: ${missing.join(', ')}`)
  process.exit(1)
}
console.log(`PASS all ${total} config fields are volatile (saveable from the settings form)`)
