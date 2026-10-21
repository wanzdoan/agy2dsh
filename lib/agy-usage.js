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
//   - one process at a time, cached for a minute, hard timeout;
//   - any failure returns null and the caller falls back to the HTTP API.
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { loadLocalCliBlob } from './import-auth.js'
import { quotaFamiliesFromWindows } from './usage.js'

const CACHE_MS = 60 * 1000
const TIMEOUT_MS = 25 * 1000

let usageCache = { at: 0, payload: null }
let emailCache = { at: 0, email: '' }
let inflight = null

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

/** Raw payload from `agy --print "/usage" --output-format json`, cached briefly. */
export function readCliUsage({ force = false } = {}) {
  if (String(process.env.DSH_SUBSCRIPTIONS_QUOTA_SOURCE || '') === 'api') return Promise.resolve(null)
  const bin = agyBinary()
  if (!bin) return Promise.resolve(null)
  if (!force && usageCache.payload && Date.now() - usageCache.at < CACHE_MS) return Promise.resolve(usageCache.payload)
  if (inflight) return inflight

  inflight = new Promise((resolve) => {
    execFile(
      bin,
      ['--print', '/usage', '--output-format', 'json'],
      { timeout: TIMEOUT_MS, windowsHide: true, maxBuffer: 4 * 1024 * 1024, env: { ...process.env, NO_COLOR: '1' } },
      (error, stdout) => {
        let parsed = null
        if (!error && stdout) {
          const text = String(stdout).replace(/^\uFEFF/, '').trim()
          const line = text.slice(text.lastIndexOf('\n') + 1) || text
          try { parsed = JSON.parse(line) } catch { parsed = null }
        }
        if (parsed) usageCache = { at: Date.now(), payload: parsed }
        resolve(parsed)
      },
    )
  }).finally(() => { inflight = null })

  return inflight
}

/** The account the CLI is currently logged in as (empty when unknown). */
export async function cliAccountEmail() {
  if (emailCache.email && Date.now() - emailCache.at < CACHE_MS) return emailCache.email
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
export async function cliUsageSnapshot(email) {
  const wanted = String(email || '').trim().toLowerCase()
  if (!wanted) return null
  const cliEmail = String(await cliAccountEmail()).trim().toLowerCase()
  if (!cliEmail || cliEmail !== wanted) return null
  const payload = await readCliUsage()
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
}
