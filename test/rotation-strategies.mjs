// The settings panel stores the strategy names a human picks; the picker has to
// honour them. Regression guard for "choosing Least used / Sticky did nothing".
import { normalizeRotationStrategy, pickAccount } from '../lib/rotate.js'

const failures = []
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`)
}

/* 1. alias mapping */
check('round-robin stays round-robin', normalizeRotationStrategy('round-robin'), 'round-robin')
check('least-used maps to least-loaded', normalizeRotationStrategy('least-used'), 'least-loaded')
check('least loaded (spaced) maps to least-loaded', normalizeRotationStrategy('Least Loaded'), 'least-loaded')
check('least-loaded stays least-loaded', normalizeRotationStrategy('least-loaded'), 'least-loaded')
check('sticky maps to priority', normalizeRotationStrategy('sticky'), 'priority')
check('sticky_until_limited maps to priority', normalizeRotationStrategy('sticky_until_limited'), 'priority')
check('priority stays priority', normalizeRotationStrategy('priority'), 'priority')
check('unknown falls back to round-robin', normalizeRotationStrategy('nonsense'), 'round-robin')
check('empty falls back to round-robin', normalizeRotationStrategy(undefined), 'round-robin')

/* 2. behaviour: "least used" must prefer the account with more quota left */
const account = (ref, remainingPercent) => ({
  ref,
  id: ref,
  hasToken: true,
  provider: 'antigravity',
  quota: { remainingPercent, resetAt: Date.now() + 3600_000 },
  usagePercent: 100 - remainingPercent,
  healthScore: 100,
})

const now = Date.now()
const pool = [account('low', 12), account('high', 88)]

const byLeastUsed = pickAccount(pool, now, { rotationStrategy: 'least-used' })
check('least-used picks the account with more remaining', byLeastUsed && byLeastUsed.ref, 'high')

const byLeastLoaded = pickAccount(pool, now, { rotationStrategy: 'least-loaded' })
check('least-loaded agrees with least-used', byLeastLoaded && byLeastLoaded.ref, 'high')

const byPriority = pickAccount(pool, now, { rotationStrategy: 'sticky', switchAtRemaining: 0 })
check('sticky keeps a deterministic choice instead of throwing', Boolean(byPriority && byPriority.ref), true)

if (failures.length) {
  console.log(`\n${failures.length} failure(s)`)
  for (const line of failures) console.log('  ' + line)
  process.exit(1)
}
console.log('\nall rotation strategy checks passed')
