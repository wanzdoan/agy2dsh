export function numberOrNull(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function windowPercent(obj, key) {
  if (!obj || typeof obj !== 'object') return null
  if (key === 'extra_usage' || (obj.monthly_limit != null && obj.used_credits != null)) return null
  return numberOrNull(
    obj.utilization ?? obj.used_percent ?? obj.usedPercent ?? obj.creditUsagePercent ?? obj.used_percentage,
  )
}

export function deepestUsedPercent(obj) {
  let max = null
  function walk(value, key, depth) {
    if (!value || typeof value !== 'object' || depth > 8) return
    const here = windowPercent(value, key)
    if (here != null) max = max == null ? here : Math.max(max, here)
    const remaining = numberOrNull(value.remainingFraction)
    if (remaining != null) {
      const used = (1 - remaining) * 100
      max = max == null ? used : Math.max(max, used)
    }
    const usedFrac = numberOrNull(value.usedFraction)
    if (usedFrac != null) {
      const used = usedFrac * 100
      max = max == null ? used : Math.max(max, used)
    }
    for (const [k, child] of Object.entries(value)) {
      if (child && typeof child === 'object') walk(child, k, depth + 1)
    }
  }
  walk(obj, '', 0)
  return max
}

export function asUsageSnapshot(percent) {
  const usedPercent = numberOrNull(percent)
  if (usedPercent == null) return null
  return { usedPercent }
}

export function parseResetAt(val) {
  if (val == null) return null
  if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
    return val < 1e11 ? Math.round(val * 1000) : Math.round(val)
  }
  if (typeof val === 'string' && val.trim()) {
    const s = val.trim()
    const n = Number(s)
    if (Number.isFinite(n) && n > 0) {
      return n < 1e11 ? Math.round(n * 1000) : Math.round(n)
    }
    const parsed = Date.parse(s)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  }
  return null
}

// Named limit windows reported by vendors (five_hour, seven_day, primary...).
// Label map is a data table: extend it when a vendor adds a window name.
const WINDOW_LABELS = {
  five_hour: { en: "5h", vi: "5 giờ" },
  seven_day: { en: "7d", vi: "7 ngày" },
  seven_day_oauth_apps: { en: "7d apps", vi: "7 ngày (apps)" },
  weekly_limit_7_days: { en: "7d", vi: "7 ngày" },
  primary: { en: "primary", vi: "chính" },
  secondary: { en: "secondary", vi: "phụ" },
  // codex: the vendor API returns primary_window/secondary_window - surfaced as 5h/7d in the UI
  primary_window: { en: "5h", vi: "5 giờ" },
  secondary_window: { en: "7d", vi: "7 ngày" },
  monthly: { en: "month", vi: "tháng" },
  credits: { en: "credits", vi: "tín dụng" },
  extra_usage: { en: "extra", vi: "phát sinh" },
  // antigravity: one quota bucket per model family
  gemini: { en: "Gemini", vi: "Gemini" },
  claude: { en: "Claude", vi: "Claude" },
}

export function windowLabel(id) {
  const known = WINDOW_LABELS[id]
  return known || { en: id, vi: id }
}

/**
 * Collapse Antigravity's `retrieveUserQuota` buckets into one window per model
 * family. Google reports a bucket per model id (`gemini-3.5-flash`,
 * `claude-sonnet-4-6`, plus internal `chat_*` rows) that all share a family
 * reset, so a single percentage cannot describe the account: Gemini and Claude
 * have separate allowances. The tightest bucket of a family is its binding
 * constraint.
 *
 * @param obj raw `retrieveUserQuota` payload
 * @returns `[{ id, en, vi, usedPercent, resetAt }]`, tightest first
 */
export function antigravityQuotaFamilies(obj) {
  const buckets = Array.isArray(obj && obj.buckets) ? obj.buckets : []
  const families = new Map()
  const members = new Map()
  for (const bucket of buckets) {
    if (!bucket || typeof bucket !== 'object') continue
    const modelId = String(bucket.modelId || bucket.model || '').trim()
    // `chat_*`/`tab_*` are internal completion surfaces, not user allowances.
    if (!modelId || /^(chat_|tab_)/.test(modelId)) continue
    const family = modelId.startsWith('claude') ? 'claude' : 'gemini'
    const remaining = numberOrNull(bucket.remainingFraction)
    const usedPercent = remaining != null
      ? (1 - remaining) * 100
      : numberOrNull(bucket.usedPercent ?? bucket.utilization ?? bucket.used_percentage)
    if (usedPercent == null) continue
    const list = members.get(family) || []
    if (!list.includes(modelId)) list.push(modelId)
    members.set(family, list)
    const resetAt = parseResetAt(bucket.resetTime ?? bucket.resetAt ?? bucket.reset_time)
    const current = families.get(family)
    if (!current || usedPercent > current.usedPercent || (usedPercent === current.usedPercent && resetAt && (!current.resetAt || resetAt < current.resetAt))) {
      families.set(family, {
        usedPercent: Math.min(100, Math.max(0, usedPercent)),
        ...(resetAt ? { resetAt } : {}),
      })
    } else if (resetAt && !current.resetAt) {
      current.resetAt = resetAt
    }
  }
  const order = ['gemini', 'claude']
  return [...families.entries()]
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]) || b[1].usedPercent - a[1].usedPercent)
    .map(([id, value]) => ({
      id,
      ...windowLabel(id),
      usedPercent: Math.round(value.usedPercent * 100) / 100,
      ...(value.resetAt ? { resetAt: value.resetAt } : {}),
      models: members.get(id) || [],
    }))
}

function resolveWindowId(value, key) {
  if (value && typeof value === 'object') {
    const semantic = value.modelId ?? value.model ?? value.window ?? value.name ?? value.id ?? value.scope
    if (typeof semantic === 'string' && semantic.trim() && !/^\d+$/.test(semantic.trim())) {
      return { id: semantic.trim(), isModelBucket: Boolean(value.modelId || value.model) }
    }
  }
  if (typeof key === 'string' && key.trim() && !/^\d+$/.test(key.trim())) {
    return { id: key.trim(), isModelBucket: false }
  }
  return null
}

// Walk vendor usage JSON; every node carrying a utilization-style number
// becomes a named window keyed by its semantic identifier or JSON key.
export function usageWindows(obj) {
  const out = []
  const seen = new Set()
  function walk(value, key, depth) {
    if (!value || typeof value !== 'object' || depth > 6) return
    const resolved = resolveWindowId(value, key)
    if (resolved && !seen.has(resolved.id)) {
      const pct = numberOrNull(
        value.utilization ?? value.used_percent ?? value.usedPercent ?? value.creditUsagePercent ?? value.used_percentage,
      )
      const frac = numberOrNull(value.remainingFraction)
      const ufrac = numberOrNull(value.usedFraction)
      let usedPercent = null
      if (pct != null) usedPercent = pct
      else if (frac != null) usedPercent = (1 - frac) * 100
      else if (ufrac != null) usedPercent = ufrac * 100

      if (usedPercent != null) {
        seen.add(resolved.id)
        const label = windowLabel(resolved.id)
        const rawReset = value.resetAt ?? value.reset_at ?? value.resetTime ?? value.resets_at ?? value.resetsAt ?? value.reset_time
        const resetAt = parseResetAt(rawReset)
        out.push({
          id: resolved.id,
          en: label.en,
          vi: label.vi,
          usedPercent,
          ...(resetAt ? { resetAt } : {}),
          isModelBucket: resolved.isModelBucket,
        })
      }
    }
    for (const [k, child] of Object.entries(value)) {
      if (child && typeof child === 'object') walk(child, k, depth + 1)
    }
  }
  walk(obj, '', 0)

  // Separate model buckets from standard named windows
  const standardWindows = out.filter((w) => !w.isModelBucket)
  const modelBuckets = out.filter((w) => w.isModelBucket)

  let keptModelBuckets = []
  if (modelBuckets.length) {
    // Only surface model buckets when usage > 0, keeping the tightest 1-2
    const active = modelBuckets.filter((w) => w.usedPercent > 0)
    if (active.length) {
      active.sort((a, b) => b.usedPercent - a.usedPercent)
      keptModelBuckets = active.slice(0, 2)
    }
  }

  const result = [...standardWindows, ...keptModelBuckets].map(({ isModelBucket: _, ...rest }) => rest)
  return result.length ? result : null
}
