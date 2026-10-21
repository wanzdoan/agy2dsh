// Verifies the quota derivation against the payloads the live endpoint returns.
// Gemini and Claude each have a weekly and a 5-hour window; the UI renders
// "Gemini [weekly|5h] | Claude [weekly|5h]" and must never fall back to a single
// blended percentage.
import { antigravityQuotaWindows, quotaFamiliesFromWindows, antigravityQuotaFamilies } from '../lib/usage.js'

const results = []
const check = (name, ok, detail) => results.push({ name, ok, detail })

// Captured from POST https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary
const summary = {
  groups: [
    {
      displayName: 'Gemini Models',
      buckets: [
        { bucketId: 'gemini-weekly', displayName: 'Weekly Limit Remaining', window: 'weekly', resetTime: '2026-10-28T07:57:22Z', remainingFraction: 1 },
        { bucketId: 'gemini-5h', displayName: 'Five Hour Limit Remaining', window: '5h', resetTime: '2026-10-21T12:57:22Z', remainingFraction: 1 },
      ],
    },
    {
      displayName: 'Claude and GPT models',
      buckets: [
        { bucketId: '3p-weekly', displayName: 'Weekly Limit Remaining', window: 'weekly', resetTime: '2026-10-22T11:50:16Z', remainingFraction: 0.0025872 },
        { bucketId: '3p-5h', displayName: 'Five Hour Limit Remaining', window: '5h', resetTime: '2026-10-21T12:57:22Z', remainingFraction: 1 },
      ],
    },
  ],
}

const windows = antigravityQuotaWindows(summary)
check('four windows recognised', windows.length === 4, windows.map((w) => w.id).join(','))
check('ordered gemini-weekly, gemini-5h, claude-weekly, claude-5h',
  windows.map((w) => w.id).join(',') === 'gemini-weekly,gemini-5h,claude-weekly,claude-5h',
  windows.map((w) => w.id).join(','))
check('weekly and 5h are distinguishable', windows.every((w) => w.window === 'weekly' || w.window === '5h'))
check('every window carries a family', windows.every((w) => w.family === 'gemini' || w.family === 'claude'))

const byId = Object.fromEntries(windows.map((w) => [w.id, w]))
check('gemini weekly 0% used (100% remaining)', Math.abs(byId['gemini-weekly'].usedPercent - 0) < 0.01, String(byId['gemini-weekly'].usedPercent))
check('gemini 5h 0% used', Math.abs(byId['gemini-5h'].usedPercent - 0) < 0.01, String(byId['gemini-5h'].usedPercent))
check('claude weekly 99.74% used', Math.abs(byId['claude-weekly'].usedPercent - 99.74) < 0.01, String(byId['claude-weekly'].usedPercent))
check('claude 5h 0% used', Math.abs(byId['claude-5h'].usedPercent - 0) < 0.01, String(byId['claude-5h'].usedPercent))
check('claude keeps its own reset time', byId['claude-weekly'].resetAt === Date.parse('2026-10-22T11:50:16Z'), String(byId['claude-weekly'].resetAt))
check('gemini keeps its own reset time', byId['gemini-weekly'].resetAt === Date.parse('2026-10-28T07:57:22Z'), String(byId['gemini-weekly'].resetAt))

const families = quotaFamiliesFromWindows(windows)
check('two families reported', families.length === 2, families.map((f) => f.id).join(','))
check('gemini family exposes both windows', Boolean(families[0].weekly && families[0].fiveHour), JSON.stringify(families[0] && families[0].id))
check('family severity is the tightest window', families[1].usedPercent === 99.74, String(families[1] && families[1].usedPercent))
check('family labels are localised pairs', families[0].en === 'Gemini' && families[0].vi === 'Gemini', JSON.stringify({ en: families[0].en, vi: families[0].vi }))

// Legacy per-model payload (no window field): families still resolve, so an old
// cached response degrades to a family reading instead of nothing.
const legacy = {
  buckets: [
    { modelId: 'chat_20706', remainingFraction: 1 },
    { modelId: 'claude-opus-4-6-thinking', remainingFraction: 0.0025872, resetTime: '2026-10-22T11:50:16Z' },
    { modelId: 'claude-sonnet-4-6', remainingFraction: 0.0025872, resetTime: '2026-10-22T11:50:16Z' },
    { modelId: 'gemini-3.8-flash-tiered', remainingFraction: 0.9202035, resetTime: '2026-10-21T10:22:31Z' },
  ],
}
const legacyWindows = antigravityQuotaWindows(legacy)
check('legacy buckets still yield families', legacyWindows.length === 2, legacyWindows.map((w) => w.id).join(','))
check('legacy gemini value preserved', Math.abs(legacyWindows.find((w) => w.family === 'gemini').usedPercent - 7.98) < 0.01,
  String(legacyWindows.find((w) => w.family === 'gemini').usedPercent))
check('legacy helper still agrees', antigravityQuotaFamilies(legacy).length === 2)

const failed = results.filter((r) => !r.ok)
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  [' + r.detail + ']' : ''}`)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exitCode = failed.length ? 1 : 0
