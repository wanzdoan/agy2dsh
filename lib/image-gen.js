// Image generation through the Antigravity subscription session.
//
// The vendor CLI hides image generation behind a built-in `image-generator`
// subagent (third_party/jetski/cortex/customizations/builtin/agents/image_generator.go),
// so an LLM adapter that only speaks `generateContent` never sees it and the
// agent falls back to drawing with PIL. The backend itself is available to any
// caller holding the account token:
//
//   POST {host}/v1internal:generateContent
//   { project, model: <id from imageGenerationModelIds>,
//     request: { contents: [...], generationConfig: { responseModalities: ["TEXT","IMAGE"] } } }
//   -> { response: { candidates: [{ content: { parts: [ { inlineData: { mimeType, data } } ] } }] } }
//
// Two facts measured against a live account: the image model id is published in
// `imageGenerationModelIds` (never in the chat `models` catalog), and the daily
// host serves it while the production host answered 429 RESOURCE_EXHAUSTED for
// the same request. So the daily host is tried first and the working one is
// remembered.
import {
  CODE_ASSIST_PROD,
  CODE_ASSIST_STREAM,
  antigravityIdentityHeaders,
  assistHeaders,
  postAssist,
} from './code-assist.js'

/** Id used only when the backend publishes nothing (the value observed live). */
export const IMAGE_MODEL_FALLBACK = 'gemini-3.1-flash-image'
export const DEFAULT_IMAGE_TIMEOUT_MS = 120000
export const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9']

/** Hosts tried in order; the daily one is what actually answered. */
export const IMAGE_HOSTS = [CODE_ASSIST_STREAM, CODE_ASSIST_PROD]

const MODEL_TTL_MS = 10 * 60 * 1000
const HOST_TTL_MS = 10 * 60 * 1000
const modelCache = new Map()
let preferredHost = { host: '', at: 0 }

/** Forget cached model ids and host preference (tests, and after re-login). */
export function resetImageCaches() {
  modelCache.clear()
  preferredHost = { host: '', at: 0 }
}

/**
 * The image model id the backend published for this account. `models` is the
 * chat catalog and never contains it; `imageGenerationModelIds` does.
 * @param {any} payload raw FetchAvailableModels response
 * @returns {string} model id, or '' when the payload carries none
 */
export function pickImageModelId(payload) {
  const ids = payload && payload.imageGenerationModelIds
  if (!Array.isArray(ids)) return ''
  for (const raw of ids) {
    if (raw === null || raw === undefined) continue
    const id = String(raw).replace(/^models\//, '').trim()
    if (id) return id
  }
  return ''
}

/**
 * Resolve (and cache) the image model id for one account.
 * @param {{ token: string, projectId?: string, fetchImpl?: Function, ref?: string, override?: string, ttlMs?: number, force?: boolean }} options
 * @returns {Promise<string>}
 */
export async function resolveImageModelId(options = {}) {
  const override = String(options.override || '').trim()
  if (override) return override
  const ref = String(options.ref || 'default')
  const ttlMs = Number.isFinite(Number(options.ttlMs)) ? Number(options.ttlMs) : MODEL_TTL_MS
  const cached = modelCache.get(ref)
  if (!options.force && cached && Date.now() - cached.at < ttlMs) return cached.id
  const impl = options.fetchImpl || fetch
  try {
    const headers = antigravityIdentityHeaders(options.projectId || '')
    const json = await postAssist(impl, 'fetchAvailableModels', options.token, {}, headers)
    const id = pickImageModelId(json) || IMAGE_MODEL_FALLBACK
    modelCache.set(ref, { at: Date.now(), id })
    return id
  } catch {
    // A catalog hiccup must not block image generation: fall back to the id that
    // was verified against a live account.
    const id = (cached && cached.id) || IMAGE_MODEL_FALLBACK
    modelCache.set(ref, { at: Date.now(), id })
    return id
  }
}

/**
 * The generationConfig block: image output is opt-in on Gemini image models, and
 * an unknown aspect ratio is dropped rather than sent.
 * @param {{ aspectRatio?: string }} [options]
 */
export function imageGenerationConfig(options = {}) {
  const config = { responseModalities: ['TEXT', 'IMAGE'] }
  const ratio = String(options.aspectRatio || '').trim()
  if (ratio && ASPECT_RATIOS.includes(ratio)) config.imageConfig = { aspectRatio: ratio }
  return config
}

/**
 * The `request` member of the envelope (what goes inside `request`).
 * @param {{ prompt: string, aspectRatio?: string }} options
 */
export function buildImageRequest(options = {}) {
  const prompt = String(options.prompt == null ? '' : options.prompt).trim()
  if (!prompt) throw new Error('image prompt is empty')
  return {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: imageGenerationConfig(options),
  }
}

/**
 * Full POST body, shaped like the streaming envelope the adapter already sends.
 * @param {{ projectId?: string, model: string, prompt: string, aspectRatio?: string, sessionId?: string }} options
 */
export function buildImageEnvelope(options = {}) {
  const request = buildImageRequest(options)
  request.session_id = String(options.sessionId || randomId())
  const envelope = { model: options.model, request, userAgent: 'antigravity' }
  if (options.projectId) envelope.project = options.projectId
  return envelope
}

function randomId() {
  const bytes = new Uint8Array(16)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

const MAGIC = [
  { mediaType: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mediaType: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mediaType: 'image/gif', bytes: [0x47, 0x49, 0x46] },
  { mediaType: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
]

/**
 * Sniff the media type from the bytes rather than trusting the server's label.
 * @param {Buffer|Uint8Array} data
 * @returns {string|undefined}
 */
export function sniffImageMediaType(data) {
  if (!data || !data.length) return undefined
  for (const row of MAGIC) {
    if (row.bytes.every((b, i) => data[i] === b)) return row.mediaType
  }
  return undefined
}

/**
 * Pull the image (and any text the model added) out of a generateContent reply.
 * @param {any} json
 * @returns {{ mediaType: string, data: Buffer, text: string, model?: string }}
 */
export function parseImageResponse(json) {
  const body = json && json.response ? json.response : json
  const candidates = (body && body.candidates) || []
  const first = candidates[0] || {}
  const parts = (first.content && first.content.parts) || []
  let text = ''
  let inline = null
  for (const part of parts) {
    if (!part) continue
    if (typeof part.text === 'string' && part.text) text += part.text
    const candidate = part.inlineData || part.inline_data
    if (candidate && candidate.data) inline = candidate
  }
  if (!inline) {
    const finish = first.finishReason || first.finish_reason || ''
    const reason = finish && finish !== 'STOP' ? ` (finishReason: ${finish})` : ''
    const blocked = body && body.promptFeedback && body.promptFeedback.blockReason
    const detail = blocked ? ` (prompt blocked: ${blocked})` : reason
    throw new Error(`the image model returned no image${detail}${text ? ': ' + text.slice(0, 200) : ''}`)
  }
  const data = Buffer.from(String(inline.data), 'base64')
  if (!data.length) throw new Error('the image model returned an empty image')
  const mediaType = sniffImageMediaType(data) || String(inline.mimeType || inline.mime_type || 'image/png')
  return { mediaType, data, text: text.trim(), model: json && json.model }
}

/** Order the hosts so the one that worked last is tried first. */
export function hostOrder(now = Date.now()) {
  const preferred = preferredHost.host && now - preferredHost.at < HOST_TTL_MS ? preferredHost.host : ''
  if (!preferred) return [...IMAGE_HOSTS]
  return [preferred, ...IMAGE_HOSTS.filter((host) => host !== preferred)]
}

function withTimeout(signal, timeoutMs) {
  const timeout = Number(timeoutMs) > 0 ? Number(timeoutMs) : DEFAULT_IMAGE_TIMEOUT_MS
  const timeoutSignal = typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(timeout) : null
  if (!signal) return timeoutSignal || undefined
  if (!timeoutSignal) return signal
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([signal, timeoutSignal])
  return signal
}

/**
 * Generate one image. Tries the remembered host first, then the others; a host
 * that answers is remembered for the next call.
 * @param {{ token: string, projectId?: string, prompt: string, aspectRatio?: string, model?: string, fetchImpl?: Function, signal?: AbortSignal, timeoutMs?: number, hosts?: string[] }} options
 * @returns {Promise<{ mediaType: string, data: Buffer, text: string, model: string, host: string }>}
 */
export async function generateImage(options = {}) {
  const impl = options.fetchImpl || fetch
  const model = String(options.model || '').trim() || IMAGE_MODEL_FALLBACK
  const envelope = buildImageEnvelope({
    projectId: options.projectId,
    model,
    prompt: options.prompt,
    aspectRatio: options.aspectRatio,
  })
  const body = JSON.stringify(envelope)
  const hosts = Array.isArray(options.hosts) && options.hosts.length ? options.hosts : hostOrder()
  const failures = []
  for (const host of hosts) {
    const url = `${host}:generateContent`
    let res
    try {
      res = await impl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...assistHeaders(options.token, antigravityIdentityHeaders(options.projectId || '')),
        },
        body,
        signal: withTimeout(options.signal, options.timeoutMs),
      })
    } catch (err) {
      failures.push(`${host.split('/')[2]}: ${String((err && err.message) || err).slice(0, 120)}`)
      continue
    }
    if (!res.ok) {
      let detail = ''
      try { detail = String(await res.text()).slice(0, 200) } catch { /* body already consumed */ }
      failures.push(`${host.split('/')[2]}: HTTP ${res.status}${detail ? ' ' + detail.replace(/\s+/g, ' ') : ''}`)
      // A quota or availability answer from one host is worth retrying on the
      // other; a 401/403 means the token itself is bad on every host.
      if (res.status === 401 || res.status === 403) break
      continue
    }
    let json
    try {
      json = await res.json()
    } catch (err) {
      failures.push(`${host.split('/')[2]}: unreadable response`)
      continue
    }
    const parsed = parseImageResponse(json)
    preferredHost = { host, at: Date.now() }
    return { ...parsed, model, host }
  }
  const err = /** @type {Error & { code?: string }} */ (new Error(`image generation failed: ${failures.join(' | ')}`))
  err.code = 'IMAGE_FAILED'
  throw err
}

/**
 * Default directory for generated files: <DSH home>/artifacts/agy2dsh/images.
 * Mirrors resolveHistoryDir() so a custom DSH_HOME moves both.
 */
export function resolveImageDir(customDir) {
  const dir = String(customDir || '').trim()
  if (dir) return dir
  if (process.env.DSH_IMAGE_DIR) return process.env.DSH_IMAGE_DIR
  if (process.env.DSH_STORAGE_DIR) return process.env.DSH_STORAGE_DIR
  if (process.env.DSH_HOME) return `${process.env.DSH_HOME}/artifacts/agy2dsh/images`
  const home = process.env.USERPROFILE || process.env.HOME || '.'
  return `${home}/.dsh/artifacts/agy2dsh/images`
}

/**
 * Reject an image the deployment's attachment store would refuse, with a message
 * that tells the model what to do instead of surfacing a storage error.
 * @param {{ data: Buffer, mediaType: string, width?: number, height?: number }} image
 * @param {{ mediaTypes?: string[], maxImageBytes?: number, maxImageDimension?: number, maxImagePixels?: number }} limits
 */
export function assertImageWithinLimits(image, limits = {}) {
  const data = image.data
  const mediaType = String(image.mediaType || '')
  if (Array.isArray(limits.mediaTypes) && limits.mediaTypes.length && !limits.mediaTypes.includes(mediaType)) {
    throw new Error(`generated ${mediaType} but this deployment only stores ${limits.mediaTypes.join(', ')}`)
  }
  if (limits.maxImageBytes && data.length > limits.maxImageBytes) {
    throw new Error(`generated image is ${data.length} bytes, over the ${limits.maxImageBytes} byte attachment limit`)
  }
  const width = Number(image.width) || 0
  const height = Number(image.height) || 0
  if (limits.maxImageDimension && Math.max(width, height) > limits.maxImageDimension) {
    throw new Error(`generated image is ${width}x${height}, over the ${limits.maxImageDimension}px side limit`)
  }
  if (limits.maxImagePixels && width * height > limits.maxImagePixels) {
    throw new Error(`generated image is ${width}x${height}, over the ${limits.maxImagePixels} pixel limit`)
  }
}

/**
 * Read width/height out of a PNG/JPEG/WebP/GIF header without an image library.
 * @param {Buffer} data
 * @returns {{ width: number, height: number }|undefined}
 */
export function imageDimensions(data) {
  if (!data || data.length < 24) return undefined
  if (data[0] === 0x89 && data[1] === 0x50) {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) }
  }
  if (data[0] === 0xff && data[1] === 0xd8) {
    let offset = 2
    while (offset + 9 < data.length) {
      if (data[offset] !== 0xff) { offset += 1; continue }
      const marker = data[offset + 1]
      const length = data.readUInt16BE(offset + 2)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: data.readUInt16BE(offset + 5), width: data.readUInt16BE(offset + 7) }
      }
      offset += 2 + length
    }
    return undefined
  }
  if (data[0] === 0x52 && data[1] === 0x49 && data[8] === 0x57 && data[9] === 0x45) {
    const format = data.subarray(12, 16).toString('ascii')
    if (format === 'VP8X') {
      const width = 1 + (data[24] | (data[25] << 8) | (data[26] << 16))
      const height = 1 + (data[27] | (data[28] << 8) | (data[29] << 16))
      return { width, height }
    }
    if (format === 'VP8 ') {
      return { width: data.readUInt16LE(26) & 0x3fff, height: data.readUInt16LE(28) & 0x3fff }
    }
    if (format === 'VP8L') {
      const bits = data.readUInt32LE(21)
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
    }
    return undefined
  }
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) {
    return { width: data.readUInt16LE(6), height: data.readUInt16LE(8) }
  }
  return undefined
}
