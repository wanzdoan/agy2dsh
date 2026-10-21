import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { normalizeExpiresAt } from './blob.js'
import { isGoogleClientId, extractGoogleClientIdFromJwt, emailFromToken } from './jwt.js'
import { bundledClientSecret } from './vendors/antigravity.js'


// Test seam: a fixture root overrides the real home for the duration of a
// public call. Undefined (the default) keeps production behaviour.
let activeHome = null
let activeWindowsCredentialReader = null

export function setWindowsCredentialReaderForTest(fn) {
  activeWindowsCredentialReader = fn
}

export function readWindowsAntigravityCredential() {
  if (activeWindowsCredentialReader) {
    return activeWindowsCredentialReader()
  }
  if (process.platform !== 'win32') return null
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
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const text = String(out || '').trim()
    if (!text) return null
    return JSON.parse(text)
  } catch {
    return null
  }
}

function homeFile(...parts) {
  return join(activeHome || homedir(), ...parts)
}

async function readJson(path) {
  try {
    const text = await readFile(path, 'utf8')
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

export async function discoverLocalCliSessions(options = {}) {
  const prevHome = activeHome
  activeHome = options && options.home ? String(options.home) : null
  try {
    return await discoverLocalCliSessionsInner()
  } finally {
    activeHome = prevHome
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
    const winCred = readWindowsAntigravityCredential()
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

export async function loadLocalCliBlob(provider, options = {}) {
  const discovered = await discoverLocalCliSessions(options)
  const info = discovered[provider]
  if (!info) throw new Error(`no local CLI session found for ${provider}`)

  let raw
  if (provider === 'antigravity' && info.source === 'credential-manager') {
    raw = readWindowsAntigravityCredential()
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

  if (provider === 'antigravity') {
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

  throw new Error(`unsupported local CLI import for provider ${provider}`)
}
