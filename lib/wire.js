import { fetchWithTimeout } from "./http.js"
import { iterateSse, jsonSse } from './sse.js'
import { validationFromHttpError, validationRequiredError, googleRateLimitMessage, googleLicenseMessage } from './google-validation.js'

/**
 * @param {number} status
 * @param {string} [bodyText]
 * @param {string} [code]
 * @returns {Error & { status?: number, code?: string }}
 */
export function httpError(status, bodyText, code) {
  const snippet = String(bodyText || '').slice(0, 400)
  const err = /** @type {Error & { status?: number, code?: string }} */ (new Error(snippet ? `vendor http ${status}: ${snippet}` : `vendor http ${status}`))
  err.status = status
  if (code) {
    err.code = code
    return err
  }
  if (status === 429) err.code = 'RATE_LIMIT'
  else if (status === 402) err.code = 'QUOTA'
  else if (status === 401 || status === 403) err.code = 'VENDOR'
  else if (/quota|rate.?limit|usage.?limit|billing/i.test(snippet)) {
    err.code = status === 400 ? 'QUOTA' : 'RATE_LIMIT'
  } else err.code = 'VENDOR'
  return err
}

export function throwHttpError(status, bodyText) {
  const validation = validationFromHttpError(status, bodyText)
  if (validation) throw validationRequiredError(validation)
  const license = googleLicenseMessage(status, bodyText)
  if (license) {
    const err = httpError(status, bodyText, 'LICENSE_REQUIRED')
    err.message = `${license} (${err.message})`
    throw err
  }
  const hint = googleRateLimitMessage(status, bodyText)
  if (hint) {
    const err = httpError(status, bodyText, status === 429 ? 'RATE_LIMIT' : undefined)
    err.message = `${hint} (${err.message})`
    throw err
  }
  throw httpError(status, bodyText)
}

export async function readJson(res) {
  const text = await res.text()
  if (!res.ok) {
    const validation = validationFromHttpError(res.status, text)
    if (validation) throw validationRequiredError(validation)
    throw httpError(res.status, text)
  }
  try { return JSON.parse(text) } catch { return {} }
}

export function tokenBlobFromOAuth(json, extra) {
  const expiresIn = Number(json.expires_in) || 3600
  return {
    accessToken: json.access_token || json.accessToken || '',
    refreshToken: json.refresh_token || json.refreshToken || '',
    expiresAt: Date.now() + expiresIn * 1000,
    idToken: json.id_token || json.idToken || '',
    ...(extra || {}),
  }
}

function toCount(v) {
  if (typeof v === "number") {
    return Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0
  }
  if (typeof v === "string" && v.trim()) {
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
  }
  return 0
}

/**
 * Normalizes vendor usage metadata into canonical DSH TokenUsage format.
 * Guarantees inputTokens and outputTokens are non-negative finite integer numbers (never NaN/undefined).
 * Calculates disjoint uncached input tokens where providers fold cache hits into total prompt tokens.
 * Returns null if raw is not an object or contains no token-related fields.
 */
export function toTokenUsage(raw) {
  if (!raw || typeof raw !== "object") return null

  const hasKnownField = (
    "inputTokens" in raw || "input_tokens" in raw || "promptTokens" in raw || "prompt_tokens" in raw || "input" in raw ||
    "outputTokens" in raw || "output_tokens" in raw || "completionTokens" in raw || "completion_tokens" in raw || "output" in raw ||
    "totalTokens" in raw || "total_tokens" in raw || "totalTokenCount" in raw ||
    "promptTokenCount" in raw || "candidatesTokenCount" in raw || "thoughtsTokenCount" in raw
  )
  if (!hasKnownField) return null

  const rawCached = toCount(
    raw.input_token_details?.cached_tokens ??
    raw.prompt_tokens_details?.cached_tokens ??
    raw.cache_read_input_tokens ??
    raw.cached_tokens ??
    raw.cacheReadTokens ??
    raw.cachedContentTokenCount
  )

  let inputTokens = 0
  if (raw.inputTokens !== undefined) {
    inputTokens = toCount(raw.inputTokens)
  } else if (raw.prompt_tokens !== undefined || raw.promptTokens !== undefined) {
    const prompt = toCount(raw.prompt_tokens ?? raw.promptTokens)
    inputTokens = rawCached > 0 && prompt >= rawCached ? prompt - rawCached : prompt
  } else if (raw.input_token_details?.cached_tokens !== undefined) {
    const prompt = toCount(raw.input_tokens ?? raw.input)
    inputTokens = rawCached > 0 && prompt >= rawCached ? prompt - rawCached : prompt
  } else if (raw.promptTokenCount !== undefined) {
    const prompt = toCount(raw.promptTokenCount)
    inputTokens = rawCached > 0 && prompt >= rawCached ? prompt - rawCached : prompt
  } else {
    inputTokens = toCount(raw.input_tokens ?? raw.input)
  }

  let outputTokens = 0
  if (raw.outputTokens !== undefined) {
    outputTokens = toCount(raw.outputTokens)
  } else {
    outputTokens = toCount(
      raw.completion_tokens ??
      raw.output_tokens ??
      raw.completionTokens ??
      raw.output ??
      raw.candidatesTokenCount
    )
  }

  const cacheWriteTokens = toCount(raw.cacheWriteTokens ?? raw.cache_creation_input_tokens)
  const reasoningTokens = toCount(
    raw.reasoningTokens ??
    raw.output_token_details?.reasoning_tokens ??
    raw.completion_tokens_details?.reasoning_tokens ??
    raw.reasoning_tokens ??
    raw.thoughtsTokenCount
  )
  const rawTotal = toCount(raw.totalTokens ?? raw.total_tokens ?? raw.totalTokenCount)

  const out = {
    inputTokens,
    outputTokens,
  }

  if (rawCached > 0 || raw.cacheReadTokens !== undefined || raw.cache_read_input_tokens !== undefined || raw.input_token_details?.cached_tokens !== undefined || raw.prompt_tokens_details?.cached_tokens !== undefined || raw.cachedContentTokenCount !== undefined) {
    out.cacheReadTokens = rawCached
  }
  if (cacheWriteTokens > 0 || raw.cacheWriteTokens !== undefined || raw.cache_creation_input_tokens !== undefined) {
    out.cacheWriteTokens = cacheWriteTokens
  }
  if (reasoningTokens > 0 || raw.reasoningTokens !== undefined || raw.output_token_details?.reasoning_tokens !== undefined || raw.completion_tokens_details?.reasoning_tokens !== undefined || raw.thoughtsTokenCount !== undefined) {
    out.reasoningTokens = reasoningTokens
  }
  if (rawTotal > 0 || raw.totalTokens !== undefined || raw.total_tokens !== undefined || raw.totalTokenCount !== undefined) {
    out.totalTokens = rawTotal > 0 ? rawTotal : (inputTokens + (out.cacheReadTokens || 0) + (out.cacheWriteTokens || 0) + outputTokens)
  }

  return out
}

export { streamResponses as codexResponsesStream } from './responses-stream.js'

/**
 * @param {any} body
 * @param {{ signal?: AbortSignal, idleTimeoutMs?: number, totalTimeoutMs?: number }} [options]
 */
export async function* googleStream(body, { signal, idleTimeoutMs, totalTimeoutMs } = {}) {
  let index = 0
  let started = false
  let callCount = 0
  const functionCallIndexes = new Map()
  let finish = { kind: 'stop' }
  let sawTerminal = false
  for await (const data of iterateSse(body, { signal, idleTimeoutMs, ...(totalTimeoutMs === undefined ? {} : { totalTimeoutMs }) })) {
    if (data === '[DONE]') {
      sawTerminal = true
      break
    }
    const json = jsonSse(data)
    const wrapped = json && json.response ? json.response : json
    if (!wrapped) continue
    const cand = wrapped.candidates && wrapped.candidates[0]
    if (cand && cand.finishReason) {
      sawTerminal = true
      const fr = cand.finishReason
      if (fr === 'MAX_TOKENS') finish = { kind: 'max-tokens' }
      else if (fr === 'SAFETY' || fr === 'RECITATION' || fr === 'BLOCKLIST' || fr === 'PROHIBITED_CONTENT' || fr === 'SPII') {
        finish = { kind: 'error', failure: { code: fr, message: cand.finishMessage || fr } }
      } else if (fr === 'STOP') {
        finish = { kind: 'stop' }
      }
    }
    const parts = cand && cand.content && Array.isArray(cand.content.parts) ? cand.content.parts : []
    for (const part of parts) {
      if (part.thought && part.text) {
        yield { type: 'reasoning-delta', index, text: part.text }
      } else if (part.text) {
        if (!started) {
          yield { type: 'block-start', index, blockType: 'text' }
          started = true
        }
        yield { type: 'text-delta', index, text: part.text }
      }
      if (part.functionCall) {
        const rawId = part.functionCall.id
        let callIndex
        let callId
        if (rawId && functionCallIndexes.has(rawId)) {
          callIndex = functionCallIndexes.get(rawId)
          callId = String(rawId)
        } else {
          callCount++
          callIndex = index + callCount
          callId = String(rawId || `gemini_call_${callCount}`)
          if (rawId) functionCallIndexes.set(rawId, callIndex)
          yield { type: 'block-start', index: callIndex, blockType: 'tool-call' }
        }
        yield {
          type: 'tool-call-delta',
          index: callIndex,
          id: callId,
          name: part.functionCall.name,
          argumentsDelta: JSON.stringify(part.functionCall.args || {}),
        }
      }
    }
    if (wrapped.usageMetadata) {
      const u = wrapped.usageMetadata
      const norm = toTokenUsage(u)
      yield {
        type: 'usage',
        usage: {
          ...u,
          ...(norm || {}),
          input: norm ? norm.inputTokens : (Number(u.promptTokenCount ?? 0) || 0),
          output: norm ? norm.outputTokens : (Number(u.candidatesTokenCount ?? 0) || 0),
        },
      }
    }
  }
  if (!sawTerminal && (started || callCount > 0)) {
    yield { type: 'finish', reason: { kind: 'error', failure: { code: 'INCOMPLETE', message: 'stream terminated before finishReason' } } }
    return
  }
  if (finish.kind === 'stop' && (functionCallIndexes.size > 0 || callCount > 0)) {
    finish = { kind: 'tool-calls' }
  }
  yield { type: 'finish', reason: finish }
}

export async function formTokenRequest(url, params, fetchImpl, headers, { timeoutMs = 25000 } = {}) {
  const res = await fetchWithTimeout(fetchImpl || fetch, url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', ...(headers || {}) },
    body: new URLSearchParams(params),
  }, { timeoutMs })
  return readJson(res)
}

export async function readErrorBody(res, maxChars = 4096) {
  if (!res || typeof res !== 'object') return ''
  try {
    if (!res.body || typeof res.body.getReader !== 'function') {
      const text = await res.text()
      return String(text || '').slice(0, maxChars)
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let out = ''
    try {
      while (out.length < maxChars) {
        const { done, value } = await reader.read()
        if (done) break
        out += decoder.decode(value, { stream: true })
      }
      out += decoder.decode()
    } finally {
      if (typeof reader.cancel === 'function') await reader.cancel().catch(() => {})
    }
    return out.slice(0, maxChars)
  } catch {
    return ''
  }
}
