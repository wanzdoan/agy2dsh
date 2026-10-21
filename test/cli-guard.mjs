// Guards the quota probe against the failure that made a browser tab appear.
//
// Measured on a real machine (.gemini/antigravity-cli/log/cli-20261021_1602*.log):
//   keyringAuth: loaded token, expiry=... expired=true
//   token refresh failed due to network error: ... 127.0.0.1:9 ...
//   Print mode: silent auth failed
//   Print mode: triggering interactive OAuth      <-- browser tab, then a hang
// The probe now runs headless, so a missing credential prints a URL and exits,
// and a failed probe backs off instead of retrying every two minutes.
import {
  cliProbeEnv,
  looksLikeAuthPrompt,
  parseCliUsageText,
  readCliUsage,
  resetCliUsageCache,
  windowsFromCli,
  cliProbeStatus,
  keepCliReading,
} from '../lib/agy-usage.js'

const results = []
const check = (name, ok, detail) => results.push({ name, ok, detail })

// --- environment -----------------------------------------------------------
const env = cliProbeEnv({ PATH: '/bin', HTTPS_PROXY: 'http://127.0.0.1:9' })
check('probe forces headless print mode', env.AGY_CLI_NONINTERACTIVE_HEADLESS === '1', JSON.stringify(env.AGY_CLI_NONINTERACTIVE_HEADLESS))
check('probe keeps the rest of the environment', env.PATH === '/bin' && env.HTTPS_PROXY === 'http://127.0.0.1:9')
check('probe disables colour codes', env.NO_COLOR === '1')
check('probe does not mutate process.env', process.env.AGY_CLI_NONINTERACTIVE_HEADLESS === undefined)

// --- auth prompt detection -------------------------------------------------
const authStderr = 'Authentication required. Please visit the URL to log in:\n  https://accounts.google.com/o/oauth2/auth?client_id=1071006060591-x'
check('auth prompt recognised', looksLikeAuthPrompt(authStderr) === true)
check('oauth url alone is enough', looksLikeAuthPrompt('https://accounts.google.com/o/oauth2/auth?x=1') === true)
check('cli log line recognised', looksLikeAuthPrompt('Print mode: triggering interactive OAuth') === true)
check('normal quota output is not an auth prompt',
  looksLikeAuthPrompt('{"status":"SUCCESS","response":"Gemini Models\\tWeekly Limit Remaining\\t94%"}') === false)
check('empty output is not an auth prompt', looksLikeAuthPrompt('') === false)

// --- parsing ---------------------------------------------------------------
const goodPayload = {
  status: 'SUCCESS',
  command: {
    name: 'usage',
    data: {
      groups: [
        { buckets: [
          { id: 'gemini-weekly', window: 'weekly', remaining_fraction: 0.9481, reset_time: '2026-10-26T04:12:55Z' },
          { id: 'gemini-5h', window: '5h', remaining_fraction: 0.9194, reset_time: '2026-10-21T16:33:30Z' },
        ] },
        { buckets: [
          { id: '3p-weekly', window: 'weekly', remaining_fraction: 0.0025872, reset_time: '2026-10-22T11:50:16Z' },
          { id: '3p-5h', window: '5h', remaining_fraction: 1, reset_time: '2026-10-21T16:42:37Z' },
        ] },
      ],
    },
  },
}
const stdoutWithNoise = 'some startup banner\n' + JSON.stringify(goodPayload) + '\n'
check('last json line wins', parseCliUsageText(stdoutWithNoise)?.status === 'SUCCESS')
check('garbage yields null', parseCliUsageText('Authentication required.') === null)
check('empty yields null', parseCliUsageText('') === null)

const windows = windowsFromCli(goodPayload)
check('four windows from the CLI', windows.length === 4, windows.map((w) => w.id).join(','))
check('families named from the bucket id',
  windows.every((w) => w.family === (/^(gemini)/i.test(w.id) ? 'gemini' : 'claude')))
check('remaining 0.9481 becomes 5.19% used', Math.abs(windows[0].usedPercent - 5.19) < 0.01, String(windows[0].usedPercent))
check('reset time parsed', windows[0].resetAt === Date.parse('2026-10-26T04:12:55Z'))

// --- probe behaviour -------------------------------------------------------
const okExec = async (bin, args, options) => {
  if (!options.env || options.env.AGY_CLI_NONINTERACTIVE_HEADLESS !== '1') throw new Error('probe ran without the headless flag')
  if (!args.includes('/usage')) throw new Error('probe did not ask for /usage')
  return { stdout: stdoutWithNoise, stderr: '' }
}
resetCliUsageCache()
let payload = await readCliUsage({ bin: 'agy', exec: okExec, ttlMs: 60000 })
check('probe returns the parsed payload', payload && payload.status === 'SUCCESS')
check('probe status marked ok', cliProbeStatus().ok === true)

// second call inside the ttl must not spawn again
let spawns = 0
const countingExec = async (...args) => { spawns += 1; return okExec(...args) }
payload = await readCliUsage({ bin: 'agy', exec: countingExec, ttlMs: 60000 })
check('cached reading is reused', spawns === 0 && payload && payload.status === 'SUCCESS', String(spawns))

// a failing probe backs off
resetCliUsageCache()
let failingSpawns = 0
const authExec = async () => {
  failingSpawns += 1
  return { stdout: '', stderr: authStderr }
}
const first = await readCliUsage({ bin: 'agy', exec: authExec, backoffMs: 1000 })
check('auth prompt yields no payload', first === null)
check('auth prompt sets a backoff', cliProbeStatus().backoff === true && cliProbeStatus().reason === 'auth-required', cliProbeStatus().reason)
const second = await readCliUsage({ bin: 'agy', exec: authExec, backoffMs: 1000 })
check('backoff prevents a second spawn', second === null && failingSpawns === 1, String(failingSpawns))

// a thrown probe (timeout / kill) also backs off instead of throwing
resetCliUsageCache()
let throwSpawns = 0
const timeoutExec = async () => { throwSpawns += 1; const e = new Error('killed'); e.killed = true; throw e }
const third = await readCliUsage({ bin: 'agy', exec: timeoutExec, backoffMs: 1000 })
check('timeout yields no payload and no throw', third === null && cliProbeStatus().reason === 'timeout', cliProbeStatus().reason)
await readCliUsage({ bin: 'agy', exec: timeoutExec, backoffMs: 1000 })
check('timeout backed off too', throwSpawns === 1, String(throwSpawns))

// force bypasses both the cache and the backoff
resetCliUsageCache()
let forced = 0
const mixedExec = async () => { forced += 1; return { stdout: stdoutWithNoise, stderr: '' } }
await readCliUsage({ bin: 'agy', exec: authExec, backoffMs: 60000 })
const afterForce = await readCliUsage({ bin: 'agy', exec: mixedExec, force: true })
check('force re-probes after a failure', afterForce && forced === 1, String(forced))
check('success clears the backoff', cliProbeStatus().backoff === false && cliProbeStatus().ok === true)

// missing binary is a quiet null, never a crash
resetCliUsageCache()
check('no binary means no probe', (await readCliUsage({ bin: '', exec: okExec })) === null)

// --- keeping an honest reading during an outage ----------------------------
// The HTTP summary claimed 100% for Gemini while the CLI said 94.8% left, so a
// failed probe must not swap a recent CLI reading for the rosier summary.
const nowMs = Date.now()
check('recent cli reading is kept', keepCliReading({ lastSource: 'cli', lastCliAt: nowMs - 60 * 1000, now: nowMs }) === true)
check('old cli reading is dropped', keepCliReading({ lastSource: 'cli', lastCliAt: nowMs - 45 * 60 * 1000, now: nowMs }) === false)
check('api reading is never kept', keepCliReading({ lastSource: 'api', lastCliAt: nowMs, now: nowMs }) === false)
check('no previous reading is not kept', keepCliReading({ lastSource: 'cli', lastCliAt: 0, now: nowMs }) === false)
check('empty context is safe', keepCliReading() === false)

const failed = results.filter((r) => !r.ok)
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  [' + r.detail + ']' : ''}`)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exitCode = failed.length ? 1 : 0
