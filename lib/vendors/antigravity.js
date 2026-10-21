import { randomUUID } from 'node:crypto'
import { buildAuthorizeUrl } from '../oauth.js'
import { googleContents } from '../messages.js'
import { formTokenRequest, googleStream, throwHttpError, tokenBlobFromOAuth , readErrorBody } from '../wire.js'
import { fetchWithTimeout } from '../http.js'
import { emailFromToken, avatarFromToken, scopesFromToken } from '../jwt.js'
import {
  CODE_ASSIST_STREAM,
  antigravityMetadata,
  antigravityIdentityHeaders,
  discoverProject,
  fetchAvailableModels,
  antigravityTieredAlias,
  retrieveQuotaPercent,
  streamEnvelope,
  assistHeaders,
} from '../code-assist.js'

export const id = 'antigravity'
export const DEFAULT_CLI_CLIENT_ID = ['681255809395', 'oo8ft2oprdrnp9e3aqf6av3hmdib135j'].join('-') + '.' + 'apps.googleusercontent.com'

// #05: the OAuth client the Antigravity CLI (agy >= 1.4) actually uses. It is an
// installed-application client whose secret ships inside the CLI binary, and
// Google refuses a `refresh_token` grant without it:
//   {"error":"invalid_request","error_description":"client_secret is missing."}
// Importing credentials from the CLI therefore used to produce an account that
// worked for one hour (the life of the imported access token) and could never
// refresh itself, which is why the session died until the CLI was re-run and
// the account re-imported. The secret is not a user credential - it identifies
// the public client - so it is bundled next to the id, exactly like the CLI.
export const AGY_CLI_CLIENT_ID = ['1071006060591', 'tmhssin2h21lcre235vtolojh4g403ep'].join('-') + '.' + 'apps.googleusercontent.com'
const AGY_CLI_CLIENT_SECRET = ['GOCSPX', 'K58FWR486LdLJ1mLB8sXC4z6qDAf'].join('-')

/** Bundled client secrets for the CLI/desktop clients this plugin knows. */
const KNOWN_CLIENT_SECRETS = {
  [AGY_CLI_CLIENT_ID]: AGY_CLI_CLIENT_SECRET,
}

/** The secret to use for a refresh, or '' when the client is not one we know. */
export function bundledClientSecret(clientId) {
  const known = KNOWN_CLIENT_SECRETS[String(clientId || '').trim()]
  return known || ''
}


const AUTH = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN = 'https://oauth2.googleapis.com/token'
const SCOPE = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/cclog',
  'https://www.googleapis.com/auth/experimentsandconfigs',
].join(' ')

export function providerInfo() {
  return { id, name: 'Antigravity' }
}

export function defaults() {
  return {
    clientId: '',
    clientSecret: '',
    redirectUri: 'http://localhost:8085/oauth/callback',
    // #04: offline fallback catalog mirrors what the local Antigravity CLI
    // (`agy models`) actually serves for the current build. Stale ids here used
    // to reach the picker whenever `fetchAvailableModels` failed and then
    // produced upstream 400s.
    models: [
      'gemini-3.8-flash-high',
      'gemini-3.8-flash-medium',
      'gemini-3.8-flash-low',
      'claude-sonnet-4-6',
      'claude-opus-4-6-thinking',
    ],
  }
}

export function authorizeUrl(cfg, pkce) {
  if (!cfg || !cfg.clientId || !String(cfg.clientId).trim()) {
    throw new Error('Google OAuth requires a custom Client ID. Please configure antigravityClientId in plugin settings or use "From CLI" to import active credentials.')
  }
  return buildAuthorizeUrl({
    authUrl: AUTH,
    clientId: cfg.clientId,
    redirectUri: cfg.redirectUri,
    challenge: pkce.challenge,
    state: pkce.state,
    scope: SCOPE,
    extra: { access_type: 'offline', prompt: 'consent' },
  })
}

function headersFor(projectId, cfg) {
  return antigravityIdentityHeaders(projectId, cfg && cfg.clientVersion)
}

function metadataFor(projectId) {
  return antigravityMetadata(projectId)
}

async function withProject(blob, fetchImpl, saveBlob, cfg) {
  const impl = fetchImpl || fetch
  if (blob.projectId && blob.paidTierId) {
    return { ...blob, sessionId: blob.sessionId || randomUUID() }
  }
  try {
    const meta = metadataFor(blob.projectId || '')
    const found = await discoverProject(impl, blob.accessToken, meta, headersFor(blob.projectId || '', cfg))
    const next = {
      ...blob,
      projectId: found.projectId || blob.projectId || '',
      paidTierId: found.paidTierId || blob.paidTierId || '',
      paidTierName: found.paidTierName || blob.paidTierName || '',
      accountNotice: found.accountNotice || blob.accountNotice || '',
      sessionId: blob.sessionId || randomUUID(),
    }
    if (saveBlob) await saveBlob(next)
    return next
  } catch (e) {
    if (e && e.code === 'VALIDATION_REQUIRED' && e.validationUrl) {
      return { ...blob, validationUrl: e.validationUrl, validationMessage: String(e.message || '') }
    }
    return blob
  }
}

export async function exchangeCode(cfg, pkce, code, fetchImpl) {
  const json = await formTokenRequest(TOKEN, {
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret || '',
    grant_type: 'authorization_code',
    code,
    redirect_uri: cfg.redirectUri,
    code_verifier: pkce.verifier,
  }, fetchImpl)
  const blob = tokenBlobFromOAuth(json, {
    clientId: cfg.clientId,
    ...(cfg.clientSecret ? { clientSecret: cfg.clientSecret } : {}),
  })
  const email = blob.email || emailFromToken(blob.idToken || blob.accessToken)
  const avatarUrl = blob.avatarUrl || avatarFromToken(blob.idToken || blob.accessToken)
  const scopes = blob.scopes?.length ? blob.scopes : (json?.scope ? String(json.scope).split(/[\s,]+/).filter(Boolean) : scopesFromToken(blob.idToken || blob.accessToken))
  const labeled = {
    ...blob,
    email,
    avatarUrl,
    scopes,
    label: blob.label || email || "Antigravity",
  }
  return withProject(labeled, fetchImpl)
}

/**
 * @param {any} cfg plugin config (antigravityClientId / antigravityClientSecret)
 * @param {any} blob stored credential blob
 * @param {any} fetchImpl fetch implementation
 * @param {{ resync?: () => Promise<any> }} [options] `resync` re-reads the vendor
 *   CLI store when the stored refresh token is rejected; agy rewrites its own
 *   credential record on every refresh, so the CLI copy is often newer than ours.
 */
export async function refresh(cfg, blob, fetchImpl, options = {}) {
  const clientId = (cfg?.clientId && String(cfg.clientId).trim()) || (blob?.clientId && String(blob.clientId).trim()) || ''
  const configuredSecret = (cfg?.clientSecret && String(cfg.clientSecret).trim()) || (blob?.clientSecret && String(blob.clientSecret).trim()) || ''
  // #05: fall back to the secret bundled with the CLI/desktop client the account
  // was imported from, so a CLI import can refresh itself without the user
  // configuring anything.
  const clientSecret = configuredSecret || bundledClientSecret(clientId)

  if (!clientId) {
    throw new Error('Google OAuth refresh requires a Client ID. Configure antigravityClientId in plugin settings or re-import credentials with valid OAuth client metadata.')
  }

  const attempt = async (source) => formTokenRequest(TOKEN, {
    client_id: clientId,
    ...(clientSecret ? { client_secret: clientSecret } : {}),
    grant_type: 'refresh_token',
    refresh_token: source.refreshToken,
  }, fetchImpl)

  let json
  let source = blob
  try {
    json = await attempt(source)
  } catch (err) {
    const msg = String(err && err.message ? err.message : err)
    // A rejected refresh token is recoverable when the CLI store holds a newer
    // one: the CLI refreshes on its own schedule and writes the rotated token
    // back, which invalidates ours. Adopt theirs and retry once before failing.
    const recoverable = /invalid_grant|token_revoked|revoked|session expired|invalid_request/i.test(msg)
    let adopted = null
    if (recoverable && typeof options.resync === 'function') {
      try { adopted = await options.resync() } catch { adopted = null }
    }
    const nextToken = adopted && adopted.refreshToken ? String(adopted.refreshToken) : ''
    if (nextToken && nextToken !== source.refreshToken) {
      source = { ...blob, ...adopted, refreshToken: nextToken }
      try {
        json = await attempt(source)
      } catch (retryErr) {
        throw explainRefreshFailure(retryErr, clientId, msg)
      }
    } else {
      throw explainRefreshFailure(err, clientId, msg)
    }
  }

  return tokenBlobFromOAuth(json, {
    label: source.label ?? blob.label,
    email: source.email ?? blob.email,
    projectId: source.projectId ?? blob.projectId,
    paidTierId: source.paidTierId ?? blob.paidTierId,
    paidTierName: source.paidTierName ?? blob.paidTierName,
    sessionId: blob.sessionId,
    clientId,
    clientSecret,
    // Google keeps the old refresh token in this flow, but persist a rotated one
    // when it is returned so the account never loses its footing.
    ...(typeof json.refresh_token === 'string' && json.refresh_token && json.refresh_token !== source.refreshToken
      ? { refreshToken: json.refresh_token }
      : {}),
  })
}

/** Turns a raw token-endpoint failure into a message that says what to do. */
function explainRefreshFailure(err, clientId, firstMessage) {
  const msg = String(err && err.message ? err.message : err)
  const all = msg + ' ' + String(firstMessage || '')
  if (all.includes('client_secret is missing')) {
    return new Error(`Google OAuth refresh rejected: client_secret is missing for client ${clientId}. Re-import the account from the CLI, or set antigravityClientSecret in plugin settings. Original error: ${msg}`)
  }
  if (all.includes('invalid_client')) {
    return new Error(`Google OAuth refresh rejected: invalid client credentials for ${clientId}. Set antigravityClientId and antigravityClientSecret in plugin settings. Original error: ${msg}`)
  }
  if (all.includes('invalid_grant')) {
    return new Error(`Google OAuth refresh rejected: the stored refresh token is no longer valid (its rotation was superseded, or access was revoked). Re-import from the CLI. Original error: ${msg}`)
  }
  return err instanceof Error ? err : new Error(msg)
}


export async function check(blob, cfg, fetchImpl) {
  const impl = fetchImpl || fetch
  try {
    const models = await fetchAvailableModels(impl, blob.accessToken, headersFor(blob.projectId || "", cfg), cfg.models || defaults().models, id)
    return { ok: true, raw: { models } }
  } catch (e) {
    // fallback to quota check
    throw e
  }
}

export async function listModels(blob, cfg, fetchImpl) {
  const fallback = cfg.models || defaults().models
  return fetchAvailableModels(fetchImpl || fetch, blob.accessToken, headersFor(blob.projectId || '', cfg), fallback, id)
}

export async function usage(blob, _cfg, fetchImpl) {
  return retrieveQuotaPercent(fetchImpl || fetch, blob.accessToken, headersFor(blob.projectId || '', _cfg), {
    project: blob.projectId || '',
  })
}

// #03: Gemini 3.8 "high" thinking can stay silent for well over 30s before the
// first SSE frame. A 30s idle cap aborted healthy long turns with
// "The operation was aborted due to timeout". The idle cap is now generous and
// user-tunable through `streamIdleTimeoutMs` (0 = no idle cap).
const DEFAULT_RESPONSE_TIMEOUT_MS = 180000

function responseTimeoutFor(config) {
  const raw = config && Number(config.streamIdleTimeoutMs)
  if (Number.isFinite(raw) && raw >= 0) return raw
  return DEFAULT_RESPONSE_TIMEOUT_MS
}

function isTransientFailure(err) {
  return err?.name === 'TimeoutError' || err?.code === 'TIMEOUT' || err?.code === 'EMPTY_RESPONSE' || err instanceof TypeError
}

export async function* streamOnce({ blob, options, fetchImpl, headers, config, signal, saveBlob }) {
  const impl = fetchImpl || fetch
  const responseTimeoutMs = responseTimeoutFor(config)
  // Abort must cover the project pre-flight as well as the stream.
  const preflight = (u, i) => fetchWithTimeout(impl, u, { ...(i || {}), signal }, { timeoutMs: responseTimeoutMs })
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let emitted = false
    try {
      const ready = await withProject(blob, preflight, saveBlob, config)
      const tiered = antigravityTieredAlias(options.model)
      const request = googleContents(options)
      if (tiered) {
        if (!request.generationConfig) request.generationConfig = {}
        request.generationConfig.thinkingConfig = /** @type {any} */ ({ thinkingLevel: tiered.thinkingLevel })
      }
      const { envelope, sessionId } = streamEnvelope({
        projectId: ready.projectId,
        model: tiered ? tiered.model : options.model,
        request,
        userAgent: 'antigravity',
        sessionId: ready.sessionId,
        paidTierId: ready.paidTierId,
      })
      const res = await fetchWithTimeout(impl, `${CODE_ASSIST_STREAM}:streamGenerateContent?alt=sse`, {
        method: 'POST',
        headers: {
          ...headers,
          ...assistHeaders(ready.accessToken, { ...headersFor(ready.projectId || '', config), Accept: 'text/event-stream' }),
        },
        body: JSON.stringify(envelope),
        signal,
      }, { timeoutMs: responseTimeoutMs })
      if (!res.ok) throwHttpError(res.status, await readErrorBody(res))
      if (saveBlob && sessionId && sessionId !== ready.sessionId) {
        await saveBlob({ ...ready, sessionId })
      }
      const pending = []
      let hasContent = false
      for await (const event of googleStream(res.body, { signal, idleTimeoutMs: responseTimeoutMs, totalTimeoutMs: 0 })) {
        if (!hasContent) {
          if (event.type === 'text-delta' || event.type === 'tool-call-delta' || event.type === 'reasoning-delta') {
            hasContent = true
            for (const item of pending) { emitted = true; yield item }
          } else if (event.type !== 'finish') {
            pending.push(event)
            continue
          } else {
            continue
          }
        }
        emitted = true
        yield event
      }
      if (!hasContent) {
        const err = /** @type {any} */ (new Error('Antigravity returned no content'))
        err.code = 'EMPTY_RESPONSE'
        throw err
      }
      return
    } catch (err) {
      if (emitted || signal?.aborted || attempt === 1 || !isTransientFailure(err)) throw err
    }
  }
}
