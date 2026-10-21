import * as codex from './codex.js'
import * as antigravity from './antigravity.js'

// The supported subscription vendors. `codex` speaks the ChatGPT Codex
// Responses API, `antigravity` speaks Google Cloud Code Assist.
const vendors = {
  codex,
  antigravity,
}

export function getVendor(provider) {
  if (!Object.hasOwn(vendors, provider)) throw new Error(`unknown provider: ${provider}`)
  return vendors[provider]
}
