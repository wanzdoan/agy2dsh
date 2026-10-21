// Quota straight from the Antigravity CLI.
//
// The Antigravity HTTP API answers with two different quota views: per-model
// `:retrieveUserQuota` buckets (which carry no window) and
// `:retrieveUserQuotaSummary`. For Gemini the summary describes a *different*
// bucket instance than the CLI does — measured at the same second: summary said
// 100% left with a reset 7 days out, `agy /usage` said 94.8% left resetting in
// 4d19h — so a pill fed by the summary disagrees with the number the user reads
// in their terminal. Claude agrees on both sources, Gemini does not.
//
// The CLI is the reference implementation, so run its own `/usage` and parse it.
// Rules that keep this safe:
//   - only when the binary exists and the account `agy` is logged into is the
//     same account being displayed (agy reports whoever is logged in, not an
//     arbitrary stored token);
//   - one process at a time, cached, hard timeout;
//   - **never interactive**: the probe runs with AGY_CLI_NONINTERACTIVE_HEADLESS
//     set, so a stale or offline credential makes the CLI print a login URL and
//     exit instead of launching a browser tab and blocking on a human. Without
//     that flag print mode logs `Print mode: silent auth failed` and then
//     `Print mode: triggering interactive OAuth`, which opens the Antigravity
//     login page. The CLI stores its access token in Windows Credential Manager
//     and rewrites that record with its own (expired) copy on every run, so a
//     refresh on startup is the normal case - which is why a proxy blip or a
//     slow keyring read was enough to pop a browser tab while the pill refreshed.
//   - a failed probe backs off instead of retrying every two minutes, so a
//     network outage cannot turn into a login-prompt loop;
//   - any failure returns null and the caller falls back to the HTTP API.
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { loadLocalCliBlob } from './import-auth.js'
import { quotaFamiliesFromWindows } from './usage.js'

const DEFAULT_CACHE_MS = 5 * 60 * 1000
const DEFAULT_TIMEOUT_MS = 20 * 1000
const DEFAULT_BACKOFF_MS = 5 * 60 * 1000
// A credential the CLI cannot use is not going to fix itself in five minutes.
const AUTH_BACKOFF_MS = 15 * 60 * 1000
// How long a CLI reading stays trustworthy enough to keep while the CLI is
// unreachable. The probe backs off for 5-15 minutes on failure, so this covers a
// normal outage without letting a stale number survive for hours.
export const CLI_READING_GRACE_MS = 30 * 60 * 1000

/**
 * Should the last CLI reading be kept instead of falling back to the HTTP
 * summary? The summary is not a safe stand-in for Gemini: measured at the same
 * second it claimed 100% left where the CLI said 94.8%, and the pill's colour is
 * driven by that number, so an outage must not paint an exhausted window green.
 */
export function keepCliReading({ lastSource, lastCliAt, now = Date.now(), graceMs = CLI_READING_GRACE_MS } = {}) {
  if (String(lastSource || '') !== 'cli') return false
  const at = Number(lastCliAt) || 0
  if (!at) return false
  return now - at < Number(graceMs || CLI_READING_GRACE_MS)
}

let usageCache = { at: 0, payload: null }
let emailCache = { at: 0, email: '' }
let inflight = null
let probeState = { at: 0, backoffUntil: 0, reason: '', ok: false }

export function agyBinary() {
  const fromEnv = process.env.DSH_AGY_PATH || process.env.AGY_PATH
  if (fromEnv && existsSync(fromEnv)) return fromEnv
  const base = process.env.LOCALAPPDATA || process.env.APPDATA
  const candidates = [
    base && path.join(base, 'agy', 'bin', 'agy.exe'),
    base && path.join(base, 'agy', 'bin', 'agy'),
    process.env.USERPROFILE && path.join(process.env.USERPROFILE, 'AppData', 'Local', 'agy', 'bin', 'agy.exe'),
  ].filter(Boolean)
  return candidates.find((candidate) => existsSync(candidate)) || null
}

/**
 * Environment for the probe. `AGY_CLI_NONINTERACTIVE_HEADLESS` is the important
 * one: with it the CLI answers a missing credential with
 * `Authentication required. Please visit the URL to log in: https://...` on
 * stderr and exits, instead of `Print mode: triggering interactive OAuth`.
 */
export function cliProbeEnv(base) {
  const env = { ...(base || process.env) }
  env.NO_COLOR = '1'
  env.AGY_CLI_NONINTERACTIVE_HEADLESS = '1'
  return env
}

/** Did the CLI ask for a login instead of answering? */
export function looksLikeAuthPrompt(text) {
  const s = String(text || '')
  if (!s) return false
  return /authentication required|please visit the url to log in|not logged into antigravity|triggering interactive oauth|accounts\.google\.com\/o\/oauth2/i.test(s)
}

/** Parse the JSON line the CLI prints for `--output-format json`. */
export function parseCliUsageText(stdout) {
  const text = String(stdout || '').replace(/^\uFEFF/, '').trim()
  if (!text) return null
  const line = text.slice(text.lastIndexOf('\n') + 1) || text
  try {
    const parsed = JSON.parse(line)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

/** Normalise the CLI's buckets into the window records the rest of the plugin uses. */
export function windowsFromCli(payload) {
  const groups = (payload && payload.command && payload.command.data && payload.command.data.groups) || []
  const windows = []
  for (const group of groups) {
    for (const bucket of group.buckets || []) {
      const id = String(bucket.id || bucket.bucketId || '')
      if (!id) continue
      const remaining = Number(bucket.remaining_fraction ?? bucket.remainingFraction)
      if (!Number.isFinite(remaining)) continue
      const resetRaw = bucket.reset_time || bucket.resetTime
      const resetAt = resetRaw ? Date.parse(resetRaw) : 0
      const family = /^(gemini)/i.test(id) ? 'gemini' : /^(3p|claude)/i.test(id) ? 'claude' : ''
      const window = String(bucket.window || (/weekly/i.test(id) ? 'weekly' : /5h|five/i.test(id) ? '5h' : ''))
      windows.push({
        id,
        family,
        window,
        usedPercent: Math.round((1 - remaining) * 10000) / 100,
        remainingPercent: Math.round(remaining * 10000) / 100,
        resetAt: Number.isFinite(resetAt) ? resetAt : 0,
      })
    }
  }
  return windows
}

function defaultExec(bin, args, options) {
  return new Promise((resolve, reject) => {
    execFile(bin, args, options, (error, stdout, stderr) => {
      if (error && !stdout && !stderr) { reject(error); return }
      resolve({ stdout: String(stdout || ''), stderr: String(stderr || ''), error })
    })
  })
}

/**
 * Raw payload from `agy --print "/usage" --output-format json`.
 * @param {{ force?: boolean, ttlMs?: number, backoffMs?: number, timeoutMs?: number, bin?: string, exec?: Function }} [options]
 */
export function readCliUsage(options = {}) {
  if (String(process.env.DSH_SUBSCRIPTIONS_QUOTA_SOURCE || '') === 'api') return Promise.resolve(null)
  const now = Date.now()
  const force = options.force === true
  const ttlMs = Number(options.ttlMs) || DEFAULT_CACHE_MS
  const backoffMs = Number(options.backoffMs) || DEFAULT_BACKOFF_MS
  const timeoutMs = Number(options.timeoutMs) || DEFAULT_TIMEOUT_MS

  if (!force && usageCache.payload && now - usageCache.at < ttlMs) return Promise.resolve(usageCache.payload)
  if (!force && probeState.backoffUntil > now) return Promise.resolve(null)

  // An explicit `bin` (including '') wins over discovery so callers - and tests -
  // can pin the probe to one binary.
  const bin = Object.prototype.hasOwnProperty.call(options, 'bin') ? options.bin : agyBinary()
  if (!bin) return Promise.resolve(null)
  if (inflight) return inflight
  const exec = typeof options.exec === 'function' ? options.exec : defaultExec

  inflight = exec(bin, ['--print', '/usage', '--output-format', 'json'], {
    timeout: timeoutMs,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
    env: cliProbeEnv(options.env),
  })
    .then((result) => {
      const stdout = result && result.stdout ? result.stdout : ''
      const stderr = result && result.stderr ? result.stderr : ''
      const parsed = parseCliUsageText(stdout)
      if (parsed) {
        usageCache = { at: Date.now(), payload: parsed }
        probeState = { at: Date.now(), backoffUntil: 0, reason: '', ok: true }
        return parsed
      }
      const auth = looksLikeAuthPrompt(stdout + '\n' + stderr)
      probeState = {
        at: Date.now(),
        backoffUntil: Date.now() + (auth ? Math.max(backoffMs, AUTH_BACKOFF_MS) : backoffMs),
        reason: auth ? 'auth-required' : 'unreadable',
        ok: false,
      }
      return null
    })
    .catch((err) => {
      const timedOut = Boolean(err && (err.killed || err.signal || /ETIMEDOUT|timed? ?out/i.test(String(err.message || ''))))
      probeState = {
        at: Date.now(),
        backoffUntil: Date.now() + backoffMs,
        reason: timedOut ? 'timeout' : 'error',
        ok: false,
      }
      return null
    })
    .finally(() => { inflight = null })

  return inflight
}

/** Last probe outcome, for the Hub and diagnostics. */
export function cliProbeStatus() {
  return {
    ok: probeState.ok,
    reason: probeState.reason,
    at: probeState.at,
    backoffUntil: probeState.backoffUntil,
    cachedAt: usageCache.at,
    backoff: probeState.backoffUntil > Date.now(),
  }
}

/** The account the CLI is currently logged in as (empty when unknown). */
export async function cliAccountEmail() {
  if (emailCache.email && Date.now() - emailCache.at < DEFAULT_CACHE_MS) return emailCache.email
  try {
    const blob = await loadLocalCliBlob('antigravity')
    const email = String((blob && blob.email) || '')
    emailCache = { at: Date.now(), email }
    return email
  } catch {
    return ''
  }
}

/**
 * Usage snapshot for `email`, taken from the CLI when it is the same account.
 * Returns null whenever the CLI cannot answer for this account.
 */
export async function cliUsageSnapshot(email, options = {}) {
  const wanted = String(email || '').trim().toLowerCase()
  if (!wanted) return null
  const cliEmail = String(await cliAccountEmail()).trim().toLowerCase()
  if (!cliEmail || cliEmail !== wanted) return null
  const payload = await readCliUsage(options)
  if (!payload) return null
  const windows = windowsFromCli(payload)
  if (!windows.length) return null
  return {
    usedPercent: Math.max(...windows.map((win) => win.usedPercent)),
    windows,
    families: quotaFamiliesFromWindows(windows),
    source: 'cli',
  }
}

export function resetCliUsageCache() {
  usageCache = { at: 0, payload: null }
  emailCache = { at: 0, email: '' }
  probeState = { at: 0, backoffUntil: 0, reason: '', ok: false }
}
