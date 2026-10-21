// Image generation on a subscription.
//
// This module only implements the protocol: where to go, what to send and how to read the response. Everything
// else - saving the file, attaching it to the conversation, the card - is the job of the generation
// plugin; this plugin only lends its account.
//
// The token never leaves the process: the plugin exposes an in-process service, not
// a network route. The harness on this machine is reachable without a password, and an endpoint
// handing out a live subscription token would be a wider hole than the ones we already closed.

/** Where the ChatGPT subscription request goes. */
export const CODEX_URL = 'https://chatgpt.com/backend-api/codex/images/generations'
/** The model served by this endpoint. */
export const CODEX_MODEL = 'gpt-image-2'

/** Sizes understood by ChatGPT. */
export const SIZES = ['1024x1024', '1024x1536', '1536x1024', 'auto']

export function codexBody({ prompt, size, quality }) {
  const text = String(prompt || '').trim()
  if (!text) throw new Error('prompt must be a non-empty string')
  return {
    prompt: text,
    model: CODEX_MODEL,
    ...(size ? { size } : {}),
    ...(quality ? { quality } : {}),
  }
}

/** Response parsing: both sides reply in the same shape. */
export function parseImages(payload) {  const body = payload && typeof payload === 'object' ? payload : {}
  const rows = Array.isArray(body.data) ? body.data : []
  const images = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    if (typeof row.b64_json !== 'string' || !row.b64_json) continue
    images.push({
      b64_json: row.b64_json,
      ...(typeof row.revised_prompt === 'string' && row.revised_prompt
        ? { revisedPrompt: row.revised_prompt }
        : {}),
    })
  }
  if (!images.length) throw new Error('response contains no images')
  return images
}

/**
 * One request to the ChatGPT image endpoint.
 *
 * @param options {{provider, prompt, size, quality, session, fetchImpl, signal}}
 *   session - already refreshed token block: accessToken and accountId.
 */
export async function generateOnce(options) {
  const { provider, session, fetchImpl, signal } = options
  const url = CODEX_URL
  const body = codexBody(options)
  const headers = {
    authorization: `Bearer ${session.accessToken}`,
    // ChatGPT distinguishes accounts with a separate header; without it the request is rejected.
    'chatgpt-account-id': session.accountId || '',
    originator: 'codex_cli_rs',
    'content-type': 'application/json',
    accept: 'application/json',
  }

  const res = await fetchImpl(url, { method: 'POST', headers, body: JSON.stringify(body), signal })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = payload && payload.error
      && (payload.error.message || payload.error.code || payload.error)
    throw new Error(`${provider} HTTP ${res.status}${detail ? ': ' + String(detail).slice(0, 200) : ''}`)
  }
  return parseImages(payload)
}

// Multimodal Payload Normalization for Vision Models
export function parseDataUri(uri) {
  if (typeof uri !== 'string') return null
  const m = /^data:([a-zA-Z0-9.+/-]+);base64,(.+)$/.exec(uri.trim())
  if (!m) return null
  return { mimeType: m[1], base64: m[2] }
}

export function normalizeImage(item) {
  if (!item) return null

  // 1. Direct string (data URI or URL)
  if (typeof item === 'string') {
    const dataUri = parseDataUri(item)
    if (dataUri) {
      return { mimeType: dataUri.mimeType, base64: dataUri.base64, url: item.trim() }
    }
    if (/^https?:\/\//i.test(item.trim())) {
      return { mimeType: 'image/jpeg', base64: null, url: item.trim() }
    }
    return null
  }

  if (typeof item !== 'object') return null

  // 2. Anthropic style: { type: 'image', source: { type: 'base64', media_type, data } }
  if (item.source && item.source.type === 'base64' && item.source.data) {
    const mimeType = item.source.media_type || 'image/jpeg'
    const base64 = item.source.data
    return {
      mimeType,
      base64,
      url: `data:${mimeType};base64,${base64}`,
    }
  }

  // 3. Gemini style: { inlineData: { mimeType, data } }
  if (item.inlineData && item.inlineData.data) {
    const mimeType = item.inlineData.mimeType || 'image/jpeg'
    const base64 = item.inlineData.data
    return {
      mimeType,
      base64,
      url: `data:${mimeType};base64,${base64}`,
    }
  }

  // 4. OpenAI style: { type: 'image_url', image_url: { url } } or { type: 'image', image: '...' }
  const rawUrl = (item.image_url && (item.image_url.url || item.image_url)) ||
                 item.image || item.url

  if (typeof rawUrl === 'string') {
    const dataUri = parseDataUri(rawUrl)
    if (dataUri) {
      return { mimeType: dataUri.mimeType, base64: dataUri.base64, url: rawUrl.trim() }
    }
    if (/^https?:\/\//i.test(rawUrl.trim())) {
      return { mimeType: 'image/jpeg', base64: null, url: rawUrl.trim() }
    }
  }

  return null
}

/**
 * True for a DSH durable image block: `{ type: 'image', attachment: ref }`.
 * The bytes live in the attachment store, so a provider adapter must read them
 * before serializing the request.
 */
export function isAttachmentImageBlock(block) {
  return Boolean(
    block
    && typeof block === 'object'
    && block.type === 'image'
    && block.attachment
    && typeof block.attachment.attachmentId === 'string',
  )
}

/**
 * Replace durable image blocks with inline base64 image blocks the vendors can
 * serialize. Messages without durable images are returned untouched so the
 * normal path keeps zero extra work.
 *
 * @param messages - provider-neutral history from DSH
 * @param readVersion - `(ref, signal) => Promise<{ data, mediaType }>` backed by the attachment service
 * @param signal - request cancellation
 * @returns history with inline base64 images (or the original array when nothing changed)
 */
export async function materializeImageBlocks(messages, readVersion, signal) {
  if (!Array.isArray(messages) || typeof readVersion !== 'function') return messages
  const versions = new Map()
  let changed = false
  const next = []
  for (const message of messages) {
    if (!message || !Array.isArray(message.content) || !message.content.some(isAttachmentImageBlock)) {
      next.push(message)
      continue
    }
    const blocks = []
    for (const block of message.content) {
      if (!isAttachmentImageBlock(block)) {
        blocks.push(block)
        continue
      }
      const key = String(block.attachment.attachmentId)
      let version = versions.get(key)
      if (version === undefined) {
        version = await readVersion(block.attachment, signal)
        versions.set(key, version)
      }
      if (!version || !version.data) {
        blocks.push(block)
        continue
      }
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: version.mediaType || block.attachment.mediaType || 'image/png',
          data: Buffer.from(version.data).toString('base64'),
        },
      })
      changed = true
    }
    next.push({ ...message, content: blocks })
  }
  return changed ? next : messages
}

export function extractImages(content) {
  if (!Array.isArray(content)) {
    const norm = normalizeImage(content)
    return norm ? [norm] : []
  }
  const images = []
  for (const block of content) {
    if (!block) continue
    if (typeof block === 'string') {
      const norm = normalizeImage(block)
      if (norm) images.push(norm)
      continue
    }
    if (block.type === 'image' || block.type === 'image_url' || block.inlineData || block.image_url || block.image) {
      const norm = normalizeImage(block)
      if (norm) images.push(norm)
    }
  }
  return images
}

export function toOpenAiImage(norm) {
  const url = norm.url || (norm.base64 ? `data:${norm.mimeType};base64,${norm.base64}` : null)
  if (!url) return null
  return {
    type: 'image_url',
    image_url: { url },
  }
}

export function toGeminiImage(norm) {
  if (!norm) return null
  if (norm.base64) {
    return {
      inlineData: {
        mimeType: norm.mimeType || 'image/jpeg',
        data: norm.base64,
      },
    }
  }
  if (norm.url) {
    return {
      fileData: {
        mimeType: norm.mimeType || 'image/jpeg',
        fileUri: norm.url,
      },
    }
  }
  return null
}

export function toCodexImage(norm) {
  const url = norm.url || (norm.base64 ? `data:${norm.mimeType};base64,${norm.base64}` : null)
  if (!url) return null
  return {
    type: 'input_image',
    image_url: url,
  }
}
