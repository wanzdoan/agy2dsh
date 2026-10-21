// Every console program this plugin spawns must be spawned with `windowsHide: true`.
//
// The host is a GUI process with no console of its own, so spawning PowerShell or
// `agy` without that flag makes Windows allocate a console window for the child:
// the user sees a black terminal flash for as long as the child runs (~300 ms for
// the Credential Manager read). It used to happen on every background quota cycle.
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const libDir = join(here, '..', 'lib')

const SPAWNERS = ['execFileSync', 'execFile', 'spawnSync', 'spawn', 'execSync', 'exec']
// `re.exec(` / `pattern.exec(` are RegExp calls, not process spawns.
const CALL = new RegExp(`(?<![.\\w])(?:${SPAWNERS.join('|')})\\s*\\(`, 'g')

let pass = 0
let fail = 0
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS ', name) } else { fail++; console.log('FAIL ', name, detail ? '- ' + detail : '') }
}

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(full))
    else if (entry.name.endsWith('.js')) out.push(full)
  }
  return out
}

/** Text of the balanced (...) group that starts at `open`. */
function parenBody(text, open) {
  let depth = 0
  for (let i = open; i < text.length; i++) {
    const ch = text[i]
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth === 0) return text.slice(open + 1, i)
    }
  }
  return text.slice(open + 1)
}

/** Does the options object assigned to `name` in this file set windowsHide? */
function optionsObjectHides(text, name) {
  const decl = new RegExp(`\\b(?:const|let|var)\\s+${name}\\s*=\\s*\\{`, 'g')
  for (let m = decl.exec(text); m; m = decl.exec(text)) {
    const brace = text.indexOf('{', m.index)
    const body = parenBody(text.replace(/^/, ''), brace + 1)
    if (/windowsHide\s*:\s*true/.test(body.slice(0, 400))) return true
  }
  return false
}

const files = await walk(libDir)
check('found the plugin sources', files.length > 5, `${files.length} files`)

let spawns = 0
const violations = []
const filesWithHiddenSpawn = new Set()

for (const file of files) {
  const text = await readFile(file, 'utf8')
  const rel = relative(join(here, '..'), file).replace(/\\/g, '/')
  for (let m = CALL.exec(text); m; m = CALL.exec(text)) {
    const name = m[0].slice(0, -1).trim()
    const open = m.index + m[0].length - 1
    const args = parenBody(text, open)
    // Skip the module-level import list and any call that is not a real spawn.
    if (!/['"`]/.test(args) && !/\b\w+\s*,/.test(args)) continue
    if (SPAWNERS.includes(name) && /^['"`]node:(child_process|url|path|fs)/.test(args.trim())) continue
    spawns++
    const line = text.slice(0, m.index).split('\n').length
    if (/windowsHide\s*:\s*true/.test(args)) { filesWithHiddenSpawn.add(rel); continue }
    const identifiers = [...args.matchAll(/(?:^|,)\s*([A-Za-z_$][\w$]*)\s*(?=,|$)/g)].map((x) => x[1])
    if (identifiers.some((id) => optionsObjectHides(text, id))) { filesWithHiddenSpawn.add(rel); continue }
    violations.push(`${rel}:${line} ${name}(...)`)
  }
}

check('found the known spawn sites', spawns >= 3, `${spawns} calls`)
check('every spawn hides its console window', violations.length === 0, violations.join(', '))
check('the Credential Manager read (import-auth.js) is one of them', filesWithHiddenSpawn.has('lib/import-auth.js'))
check('the CLI quota probe (agy-usage.js) is one of them', filesWithHiddenSpawn.has('lib/agy-usage.js'))

// The regression that started this: a PowerShell spawn with pipe stdio and no
// windowsHide creates a console window in a GUI host.
const importAuth = await readFile(join(libDir, 'import-auth.js'), 'utf8')
const psCall = importAuth.slice(importAuth.indexOf("execFileSync('powershell.exe'"))
check('powershell spawn passes windowsHide',
  /windowsHide\s*:\s*true/.test(psCall.slice(0, 400)))

console.log(`\n${pass}/${pass + fail} passed`)
process.exitCode = fail === 0 ? 0 : 1
