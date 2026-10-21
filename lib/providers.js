// The only two subscription vendors this build supports.
// Every credential ref, slot and model catalog entry is scoped to one of them.
export const BUILTIN_PROVIDERS = Object.freeze([
  'codex',
  'antigravity',
])

const DISPLAY = {
  codex: 'ChatGPT Codex',
  antigravity: 'Antigravity',
}

export const PROVIDERS = BUILTIN_PROVIDERS

export function listProviders() {
  return [...PROVIDERS]
}

export function isProvider(value) {
  return BUILTIN_PROVIDERS.includes(value)
}

export function displayName(provider) {
  return DISPLAY[provider] || provider
}
