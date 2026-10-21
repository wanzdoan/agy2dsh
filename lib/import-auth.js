import { execFileSync } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { normalizeExpiresAt } from './blob.js'
import { isGoogleClientId, extractGoogleClientIdFromJwt, emailFromToken } from './jwt.js'
import { bundledClientSecret } from './vendors/antigravity.js'


// Test seam: a fixture root overrides the real home for the duration of a
// public call. Undefined (the default) keeps production behaviour.
let activeHome = null
let activeFresh = false
let activeWindowsCredentialReader = null
// Reading the credential record means spawning PowerShell, which costs ~300ms of
// blocked event loop, so background callers share one read. `{ fresh: true }`
// bypasses it for explicit user actions (the Hub's "From CLI" button).
const CREDENTIAL_READ_TTL_MS = 10 * 1000
let credentialCache = { at: 0, value: undefined }

export function setWindowsCredentialReaderForTest(fn) {
  activeWindowsCredentialReader = fn
}

export function readWindowsAntigravityCredential(options = {}) {
  if (activeWindowsCredentialReader) {
    return activeWindowsCredentialReader()
  }
  if (process.platform !== 'win32') return null
  const fresh = options && options.fresh === true
  const ttl = Number(options && options.ttlMs)
  const age = Date.now() - credentialCache.at
  if (!fresh && credentialCache.at && age < (Number.isFinite(ttl) ? ttl : CREDENTIAL_READ_TTL_MS)) {
    return credentialCache.value
  }
  try {
    const ps = `Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class CredReadHelper {
    [DllImport("Advapi32.dll", SetLastError = true, EntryPoint = "CredReadW", CharSet = CharSet.Unicode)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags, Type;
        public string TargetName, Comment;
        public long LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist, AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias, UserName;
    }
    public static string Read(string target) {
        IntPtr ptr;
        if (CredRead(target, 1, 0, out ptr)) {
            var cred = (CREDENTIAL)Marshal.PtrToStructure(ptr, typeof(CREDENTIAL));
            byte[] bytes = new byte[cred.CredentialBlobSize];
            Marshal.Copy(cred.CredentialBlob, bytes, 0, cred.CredentialBlobSize);
            return System.Text.Encoding.UTF8.GetString(bytes);
        }
        return null;
    }
}
"@
[CredReadHelper]::Read('gemini:antigravity')`
    const out = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], {
      encoding: 'utf8',
      timeout: 3000,
      // Without this the host spawns a real console window for PowerShell, which
      // flashes a black box on screen every time the record is read (~300ms).
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const text = String(out || '').trim()
    const value = text ? JSON.parse(text) : null
    credentialCache = { at: Date.now(), value }
    return value
  } catch {
    credentialCache = { at: Date.now(), value: null }
    return null
  }
}

function homeFile(...parts) {
  return join(activeHome || homedir(), ...parts)
}

async function readJson(path) {
  try {
    const text = await readFile(path, 'utf8')
    return JSON.parse(text.replace(/^\uFEFF/, ''))
  } catch {
    return undefined
  }
}

export async function discoverLocalCliSessions(options = {}) {
  const prevHome = activeHome
  const prevFresh = activeFresh
  activeHome = options && options.home ? String(options.home) : null
  activeFresh = Boolean(options && options.fresh)
  try {
    return await discoverLocalCliSessionsInner()
  } finally {
    activeHome = prevHome
    activeFresh = prevFresh
  }
}

async function discoverLocalCliSessionsInner() {
  const detected = {}

  // 1. Codex CLI
  const codex = await readJson(homeFile('.codex', 'auth.json'))
  if (codex && (codex.access_token || codex.accessToken || (codex.tokens && codex.tokens.access_token))) {
    const tok = codex.tokens || codex
    detected.codex = {
      provider: 'codex',
      source: 'file',
      path: homeFile('.codex', 'auth.json'),
      email: codex.email || codex.account || '',
      hasRefreshToken: !!(tok.refresh_token || tok.refreshToken),
    }
  }

  // 2. Antigravity / Gemini CLI
  const agyPaths = [
    homeFile('.gemini', 'antigravity-cli', 'antigravity-oauth-token'),
    homeFile('.gemini', 'oauth_creds.json'),
    homeFile('.cli-proxy-api', 'antigravity.json'),
  ]
  for (const p of agyPaths) {
    const agy = await readJson(p)
    const tok = agy && agy.token ? agy.token : agy
    if (tok && (tok.access_token || tok.accessToken)) {
      const idToken = agy?.id_token || agy?.idToken || tok?.id_token || tok?.idToken || ''
      const email = agy?.email || tok?.account || (idToken ? emailFromToken(idToken) : '') || ''
      detected.antigravity = {
        provider: 'antigravity',
        source: 'file',
        path: p,
        email: email || 'Antigravity User',
        hasRefreshToken: !!(tok.refresh_token || tok.refreshToken),
      }
      break
    }
  }

  const canReadWindowsCredentialManager = Boolean(activeWindowsCredentialReader) || (!activeHome && process.platform === 'win32')
  if (!detected.antigravity && canReadWindowsCredentialManager) {
    const winCred = readWindowsAntigravityCredential({ fresh: activeFresh })
    const tok = winCred && winCred.token ? winCred.token : winCred
    if (tok && (tok.access_token || tok.accessToken)) {
      const idToken = winCred?.id_token || winCred?.idToken || tok?.id_token || tok?.idToken || ''
      const email = winCred?.email || tok?.account || (idToken ? emailFromToken(idToken) : '') || ''
      detected.antigravity = {
        provider: 'antigravity',
        source: 'credential-manager',
        path: 'Windows Credential Manager (gemini:antigravity)',
        email: email || 'Antigravity User',
        hasRefreshToken: !!(tok.refresh_token || tok.refreshToken),
      }
    }
  }

  return detected
}

/**
 * Converts an Antigravity credential record (Windows Credential Manager payload,
 * a CLI session file, or any stored copies) into the blob this plugin stores.
 * @param {any} raw
 */
export function antigravityBlobFromRaw(raw) {
  const tok = raw.token || raw
  const idToken = raw.id_token || raw.idToken || tok.id_token || tok.idToken || ''

  const directClientId = raw.client_id || raw.clientId || tok.client_id || tok.clientId ||
    raw.installed?.client_id || raw.web?.client_id || ''
  let clientId = ''
  if (typeof directClientId === 'string' && isGoogleClientId(directClientId)) {
    clientId = directClientId.trim()
  } else if (idToken) {
    clientId = extractGoogleClientIdFromJwt(idToken)
  }

  const directSecret = raw.client_secret || raw.clientSecret || tok.client_secret || tok.clientSecret ||
    raw.installed?.client_secret || raw.web?.client_secret || ''
  let clientSecret = typeof directSecret === 'string' ? directSecret.trim() : ''
  // #05: the CLI's own credential record carries no client metadata, and Google
  // rejects a refresh grant without a client secret. Attach the bundled secret
  // for the known CLI/desktop client so the imported account can refresh itself.
  if (!clientSecret && clientId) clientSecret = bundledClientSecret(clientId)

  const rawExpiry = tok.expiry ?? tok.expires_at ?? tok.expiresAt ?? tok.expiry_date ?? raw.expiry_date ?? raw.expiry ?? (tok.expires_in ? Date.now() + Number(tok.expires_in) * 1000 : 0)
  const expiresAt = normalizeExpiresAt(rawExpiry)

  const email = raw.email || tok.account || (idToken ? emailFromToken(idToken) : '') || ''

  return {
    accessToken: tok.access_token || tok.accessToken || '',
    refreshToken: tok.refresh_token || tok.refreshToken || '',
    expiresAt,
    email,
    projectId: raw.project_id || raw.projectId || tok.project_id || '',
    ...(clientId ? { clientId } : {}),
    ...(clientSecret ? { clientSecret } : {}),
    ...(idToken ? { idToken } : {}),
  }
}

/**
 * Every distinct Antigravity account the vendor tooling left on this machine.
 *
 * The CLI keeps one live record in Windows Credential Manager and, when the user
 * runs an account-manager helper, per-account copies under `.gemini/account-vault
 * /sessions`. Both are scanned; records that resolve to the same refresh token
 * are the same session and are reported once.
 * @param {{ home?: string }} [options]
 * @returns {Promise<Array<{ blob: any, source: string }>>}
 */
export async function loadAllAntigravityBlobs(options = {}) {
  const prevHome = activeHome
  activeHome = options && options.home ? String(options.home) : null
  try {
    /** @type {Array<{ blob: any, source: string }>} */
    const out = []
    const seen = new Set()
    const add = (raw, source) => {
      if (!raw || typeof raw !== 'object') return
      let blob
      try { blob = antigravityBlobFromRaw(raw) } catch { return }
      if (!blob.refreshToken) return
      const key = blob.refreshToken.slice(-24)
      if (seen.has(key)) return
      seen.add(key)
      out.push({ blob, source })
    }

    add(readWindowsAntigravityCredential({ fresh: options && options.fresh === true }), 'credential-manager')

    const vaultDir = homeFile('.gemini', 'account-vault', 'sessions')
    let entries = []
    try {
      entries = await readdir(vaultDir)
    } catch {
      entries = []
    }
    for (const name of entries) {
      if (!name.endsWith('.json')) continue
      const raw = await readJson(join(vaultDir, name))
      add(raw, 'vault:' + name.replace(/\.json$/, ''))
    }
    return out
  } finally {
    activeHome = prevHome
  }
}

export async function loadLocalCliBlob(provider, options = {}) {
  const discovered = await discoverLocalCliSessions(options)
  const info = discovered[provider]
  if (!info) throw new Error(`no local CLI session found for ${provider}`)

  let raw
  if (provider === 'antigravity' && info.source === 'credential-manager') {
    raw = readWindowsAntigravityCredential({ fresh: options && options.fresh === true })
  } else {
    raw = await readJson(info.path)
  }
  if (!raw) throw new Error(`failed to read local CLI file: ${info.path}`)

  if (provider === 'codex') {
    const tok = raw.tokens || raw
    return {
      accessToken: tok.access_token || tok.accessToken || '',
      refreshToken: tok.refresh_token || tok.refreshToken || '',
      expiresAt: tok.expires_at || tok.expiresAt || (Date.now() + 3600 * 1000),
      email: raw.email || raw.account || '',
      accountId: raw.account_id || raw.accountId || '',
    }
  }

  if (provider === 'antigravity') return antigravityBlobFromRaw(raw)

  throw new Error(`unsupported local CLI import for provider ${provider}`)
}
