# agy2dsh

A DeepSeek Harness plugin that turns two consumer AI subscriptions into ordinary DSH LLM providers:
**Google Antigravity** (`agy`, serving Gemini and Claude models) and **ChatGPT/Codex**. It registers
both with the host's `llm` service, refreshes their OAuth tokens itself, spreads requests across the
accounts you add, and reports the quota those subscriptions actually meter. It is for people who
already pay for Antigravity or ChatGPT and would rather spend that allowance from DSH Desktop than
buy API credits.

Package `agy2dsh`, version 0.8.0, MIT. The settings namespace is still `dsh-subscriptions` and the
HTTP routes stay under `/dsh-subscriptions/...`: deliberate, so an existing install keeps its
accounts, slots and preferences across the rename.

## Features

- **Two LLM providers.** `antigravity` models come from `fetchAvailableModels`, filtered to the
  metered families (`claude-*`, `gemini-3.8-flash-{low,medium,high}`); `codex` rows carry the
  reasoning levels and context window the catalog publishes; both fall back to a bundled catalog.
- **Self-refreshing credentials.** One refresh in flight per account, backoff retries, clock-skew
  correction, and a retry against a newer token re-read from the CLI store on a rejected refresh.
- **Accounts and rotation.** Every account is a slot with its own credential ref
  (`ANTIGRAVITY_OAUTH_1`, `CODEX_OAUTH_2`, ...), proxy, concurrency limit and label; round-robin,
  least-used or sticky ordering, family-scoped cooldowns after 429s, quarantine with a warm-up probe.
- **Quota in the UI and from the right source.** A pill on the session header, a Subscription Hub
  with per-window bars and reset countdowns, an optional composer quota; Antigravity numbers come
  from `agy` when the CLI is logged into the same account and from the Cloud Code HTTP summary
  otherwise, Codex numbers from the ChatGPT usage endpoint.
- **Images, reset credits, operations.** `generate_image` draws pictures with the subscription's Google
  image model and shows them in the conversation (see [Image generation](#image-generation)), Codex
  accounts can serve the host's image generation service (`subscriptionImages`), Codex reset credits can
  be consumed behind a confirmation step, and the plugin keeps request history, diagnostics, a
  localhost-only dashboard and an optional encrypted vault (WebDAV/Gist/S3).

## Requirements

- **DSH Desktop** with `@deepseek-ai/dsh-llm`, `dsh-credentials`, `dsh-settings` and `dsh-host-webserver`
  at `^0.1.7-rc.2 || ^0.2.0-rc.1 || ^0.2.0-rc.2`, `@deepseek-ai/cordis ^4.0.1` and `schemastery ^3.18.4`.
  No Node install of your own: the host half runs in DSH Desktop's runtime (the 2.x app declares
  `node ^22.19.0 || >=24.0.0`).
- **`agy` CLI**, for Antigravity only — "import from CLI" and the CLI quota source. Looked up via
  `DSH_AGY_PATH`, `AGY_PATH`, then `%LOCALAPPDATA%\agy\bin\agy.exe`, `%APPDATA%\agy\bin\agy(.exe)`,
  `%USERPROFILE%\AppData\Local\agy\bin\agy.exe`.
- **Codex CLI is not required**; if present, `~/.codex/auth.json` can be imported.

## Install

`agy2dsh` is a profile-sourced bundle: DSH Desktop composes the host from the active profile's
manifest. Add it to that manifest (`package.json` in the profile directory, normally
`<DSH home>/profiles/desktop`) as a dependency **and** to `dsh.profile.bundles`:

```json
{
  "dependencies": { "agy2dsh": "github:wanzdoan/agy2dsh" },
  "dsh": { "profile": { "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "agy2dsh"] } }
}
```

Keep the bundle entries the profile already has: `dsh.profile.bundles` is what composes the host, and a
package missing from it is installed but never loaded. Then reinstall the profile (the profile directory
is a pnpm workspace, so this is the install DSH Desktop runs over it) and **restart DSH Desktop**. The
plugin entry, its routes and its background timers load at startup only, so an install without a restart
leaves the previous build in memory; the browser half ships in `lib/client.js` and needs the same restart.

## Connect an account

Open the pill on the session header for the **Subscription Hub**, or the plugin card under Settings.
Both have one tab per provider.

| Action | Antigravity | Codex |
| --- | --- | --- |
| Import from CLI | Reads the record `agy` already stored on this machine | Reads `~/.codex/auth.json` |
| Paste token | An OAuth refresh token | A refresh token, or an API key (stored API-key-only and sent as-is, so it never expires like a session) |
| Manual OAuth | Your own Google OAuth client (below) | Built-in Codex client, redirect `http://localhost:1455/auth/callback`; a device-code flow exists for headless hosts |

Import copies credentials into the DSH credential store and writes nothing back to the CLI. The Antigravity
sources are the CLI token files (`~/.gemini/antigravity-cli/antigravity-oauth-token`,
`~/.gemini/oauth_creds.json`, `~/.cli-proxy-api/antigravity.json`) and, on Windows, the Credential Manager
entry `gemini:antigravity`. The blob keeps the client id found in the token and, for the known CLI client,
the plugin's bundled public client secret, so the account refreshes itself without any setup. A manual
Antigravity sign-in instead needs `antigravityClientId` (plus `antigravityClientSecret` for a confidential
client) and a registered redirect URI — `http://localhost:8085/oauth/callback` when `antigravityRedirectUri`
is empty; start it with `/login antigravity`, and with `autoLoopback` on a temporary server on that port
catches the callback (otherwise paste the redirected URL or set `useWebCallback`).

**Import all from CLI** is the multi-account path: for Antigravity it scans the live Credential Manager
record and every per-account copy an account manager left under `~/.gemini/account-vault/sessions/*.json`,
deduplicates records that resolve to the same refresh token, reuses the slots the provider already owns
and gives each distinct account a new one. For Codex it is a single import. Afterwards the plugin
refreshes those accounts itself; you do not have to run the vendor CLI again.

## Quota

Antigravity meters **two families**, each with a **weekly** and a **5-hour** window, so the plugin reports
four numbers per account: `Gemini [weekly|5h]` and `Claude [weekly|5h]`. The **pill** shows a status dot,
the provider, one chip per family (brand mark, family name, `[weekly|5h]` **remaining** percentages,
weekly first) and `+N` when several accounts are connected: `Gemini [94%|91%] | Claude [0%|100%]` means
94% of the Gemini weekly window and 91% of its 5-hour window are left. The reset countdown sits on the
Hub's rows; clicking the pill opens the Hub.

The **status dot** follows the Gemini 5-hour window: **60% or more remaining is green, below 60% amber,
below 20% red**. Accounts without a Gemini window (Codex, or an incomplete snapshot) fall back to that
provider's 5-hour window, then to its tightest one. The composer indicator shows the lowest remaining
window of the active account in `percent` or `bar` mode.

The CLI is the preferred source: `lib/agy-usage.js` runs `agy --print "/usage" --output-format json` and
parses `command.data.groups[].buckets[]` (`remaining_fraction`, `reset_time`), but only when the binary
exists **and** the CLI is logged into the account being displayed — one process at a time, five-minute cache
(`cliQuotaTtlMs`), 20-second timeout (`cliQuotaTimeoutMs`), never throwing, and never interactive. Those
snapshots are tagged `cli`. Otherwise the plugin calls `:retrieveUserQuotaSummary` with the account's Code
Assist project, then `:retrieveUserQuota` when the summary lacks the four windows, and tags the result
`api`. Codex uses `GET https://chatgpt.com/backend-api/wham/usage`, reduced to its named windows
(`primary_window` / `secondary_window`, shown as 5h and 7d).

The probe is deliberately non-interactive. `agy` keeps its token in Windows Credential Manager and rewrites
that record with its own expired copy on every run, so it refreshes over the network at start-up; if that
refresh is slow or blocked, print mode would fall back to an interactive OAuth flow and open a browser login
page. Running it with `AGY_CLI_NONINTERACTIVE_HEADLESS=1` turns that case into a printed URL and an exit, and
a failed probe backs off (5 minutes, 15 after a login prompt) instead of retrying every two minutes.

The CLI wins because no cloud call reproduces its Gemini figure: in the same minute and with the same token,
`:retrieveUserQuotaSummary` (gRPC and REST, production and daily, with and without `project`) answered `1.0`
with a reset that slides forward with the clock, while `agy /usage` reported `0.9481` with a pinned reset.
Claude matches on every path — details in [`docs/agy-usage-re.md`](docs/agy-usage-re.md). Because the summary
is not a safe stand-in, a CLI reading is kept for up to 30 minutes while the probe is failing rather than
being replaced by a rosier number from the HTTP path.

`GET /dsh-subscriptions/status` reports which source answered as `active.usageSource` (`cli` or `api`) and
how the last probe went as `cliQuota` (`ok`, `reason`, `backoff`, `cachedAt`);
`DSH_SUBSCRIPTIONS_QUOTA_SOURCE=api` forces the HTTP path. Usage refreshes at most every two minutes into
the credential blob, so the Hub keeps the last known windows across a restart.

## Image generation

Antigravity ships a Google image model with the subscription, but only the vendor's own agent can use it: the
CLI hands image requests to a built-in `image-generator` subagent, so an LLM adapter that only speaks
`generateContent` never sees it and a model asked for a picture writes PIL code instead. The plugin closes
that gap with a real tool:

```
prompt: "a single ripe red apple on a white seamless background, studio product photo"
aspect_ratio: "1:1"        # 1:1, 2:3, 3:2, 3:4, 4:3, 9:16, 16:9
```

The tool resolves the image model id from `imageGenerationModelIds` in `FetchAvailableModels` (never
hardcoded, cached ten minutes, `imageModelId` overrides), POSTs `:generateContent` with
`responseModalities: ["TEXT","IMAGE"]`, saves the file to `<DSH home>/artifacts/agy2dsh/images` (`imageOutputDir`
moves it) and returns a text envelope plus an `ImageBlock` — the picture appears in the conversation and the
agent can inspect it on the next step, exactly like the host's own `read_image`.

Two quirks measured against a live account are handled: the image model id is not in the chat `models` catalog
(it only appears in `imageGenerationModelIds`), and the production host answered `429 RESOURCE_EXHAUSTED` for it
while the daily host served the same request — so the daily host is tried first, the host that worked is
remembered for ten minutes, and a 401/403 stops the retry because that token is rejected everywhere. Requests
bill against the subscription's Gemini quota (the same pool as chat); a 1024x1024 image cost about 1.5k tokens.
Details in [`docs/image-generation.md`](docs/image-generation.md).

`imageGeneration` (`true`) turns the tool off, and `/dsh-subscriptions/status` reports the detected model as
`image.model` — the settings panel shows it too, which is the quickest way to confirm the capability is live.

## Configuration

Everything lives in the `dsh-subscriptions` settings namespace and is editable from the Settings panel
or through `GET`/`PUT /dsh-subscriptions/config`. All fields are volatile, so the settings service
accepts any write; secrets round-trip masked as `••••••` and are restored server-side.

| General | Default | Meaning |
| --- | --- | --- |
| `language` | `en` | `en` or `vi`; applies to the panel and the pill. |
| `privacyMask` | `false` | Masks account emails and labels in the UI. |
| `composerQuota` | `off` | `off`, `percent` or `bar` quota next to the composer. |
| `usageTimeoutMs` | `15000` | Upper bound for one quota request, including the `agy` CLI probe. |
| `imageGeneration` | `true` | Expose the `generate_image` tool. |
| `imageModelId` | `''` | Image model override; empty uses the id the backend publishes per account. |
| `imageOutputDir` | `''` | Where generated images are saved; empty uses `<DSH home>/artifacts/agy2dsh/images`. |
| `imageTimeoutMs` | `120000` | Timeout for one image request. |
| `cliQuotaTtlMs` | `300000` | Reuse an `agy` quota reading this long before probing again; `0` probes every refresh. |
| `cliQuotaBackoffMs` | `300000` | After a failed `agy` probe, wait this long before retrying (a login prompt waits 15 minutes). |
| `cliQuotaTimeoutMs` | `20000` | Hard timeout for one `agy` probe; the process is killed at this point. |
| `streamIdleTimeoutMs` | `180000` | Abort a stream silent for this long; `0` disables. Timeouts never mark an account rate-limited. |
| `useWebCallback` | `false` | Use the DSH Web origin + `/dsh-subscriptions/oauth/callback` as `redirect_uri`. |
| `autoLoopback` | `true` | Catch the OAuth callback on the vendor's loopback port (Codex 1455, Antigravity 8085). |
| `masterKey` | `''` | Encrypt stored credentials at rest; falls back to `DSH_SUBSCRIPTIONS_MASTER_KEY`. |

| Rotation and limits | Default | Meaning |
| --- | --- | --- |
| `rotationStrategy` | `round-robin` | Account pick order; the panel offers round robin, least used and sticky until limited, and each choice maps onto a real comparator. Ordering also weighs auto-pacing risk, nearest reset, weight and health. |
| `switchAtRemaining` | `0.01` | Treat an account as exhausted at or below this (a fraction under 1, or an absolute value); `0` disables. |
| `cooldownMs` | `1800000` | Skip an account this long after a 429/quota failure. |
| `enableQueue` | `true` | Bounded per-account queue, with `accountMaxConcurrency` (`1`, slots may override), `maxQueueSize` (`20`) and `queueTimeoutMs` (`30000`). |
| `drainBeforeReset` | `false` | Prefer accounts whose window resets soonest so expiring quota gets used; `drainSafetyPercent` (`5`) keeps a floor when a fresher account exists. |
| `autoPacing` | `true` | Burn-rate-aware ordering between accounts; `enableSoftFailureSentinel` (`true`) fails over when an HTTP 200 carries a capacity apology. |

**Alerts.** `notifyLimits` (`true`) logs a notice and emits `subscriptions.limit-notice` when a window
crosses 70, 90 or 100% used; `alertThresholds` (`[80, 90, 95]`) sets the thresholds for recorded alerts,
`webhookUrl` (`''`) the JSON POST target for quota, quarantine and session-expiry alerts, and
`enableToasts` (`true`) in-app toasts.

**Provider fields.** Antigravity: `antigravityClientId` (`''`, only for a manual sign-in),
`antigravityClientSecret` (`''`, for a confidential client), `antigravityRedirectUri` (`''` = the vendor
loopback callback), `antigravityClientVersion` (`''` = built-in `1.18.3`) and `antigravityModels` (`[]` =
the published catalog, filtered to the metered families). Codex: `codexClientId` (`''` = built-in public
client), `codexRedirectUri` (`''` = `http://localhost:1455/auth/callback`), `codexBaseUrl` (`''` =
`https://chatgpt.com/backend-api/codex`), `codexOriginator` (`''` = `codex_cli_rs`), `codexClientVersion`
(`''` = `0.160.0`, the `/models` catalog gate), `codexVerbosity` (`''` or `low`/`medium`/`high`),
`codexFastMode` (`false`, sends `service_tier: priority`) and `codexModels` (`[]` = the backend catalog).

**Per account (`slots[]`).** `provider` and `index` fix the slot and its credential ref; `label` defaults
to the account email; `proxyUrl` routes everything for that account (including token refresh and quota)
through `http`/`https`/`socks5`; `maxConcurrency` defaults to `1`; `expiresAt` feeds the expiry chip; and
`monthlyCost`, `tags`, `weight`, `isPro`, `vipOnly`, `maxQueueSize` tune rotation accounting.

**Vault sync.** `vaultSyncEnabled` (`false`), `vaultSyncBackend` (`webdav`, `gist` or `s3`),
`vaultSyncPassphrase` (`''`), `vaultSyncIntervalHours` (`24`, `0` stops the pull) and `vaultSyncAutoPush`
(`true`); targets are `vaultSyncWebdavUrl`/`Username`/`Password`, `vaultSyncGistId`/`Token`/`BaseUrl` and
`vaultSyncS3Endpoint`/`Bucket`/`Key`/`Region`.

Advanced, not tabulated: `refreshAheadMs` (`300000`) and `refreshRetryMs` (`600000`) shape the refresh
heartbeat, `probeIntervalMin` (`15`) the health probe, `expiryNotifyDays` (`7`) the expiry chip,
`hideDeprecatedModels` (`false`) the model picker, and `codexSystemPrefix` prepends a system prompt.

## Language

English is the default. Choosing **Tiếng Việt** writes `language: "vi"` and switches every string the
plugin contributes: the pill, the Hub (account cards, window labels, buttons, status words, notices), the
composer indicator and the settings panel. Both dictionaries are registered with the host's locale service
(`MESSAGES.en`, `MESSAGES.vi`), so the change lands on the next poll without a restart; vendor strings such
as model ids and API error text stay as they are.

## How it works

- `lib/index.js` is the entry point (`export const name = 'agy2dsh'`,
  `inject = ['llm', 'credentials', 'webServer', 'settings']`). It builds the settings snapshot, creates the
  account store and the adapter, registers the routes (`/dsh-subscriptions/{config,status,models,health,
  check,history,diagnostics,accounts,oauth,import-local,import-token,vault,...}` — same-origin writes, a
  loopback-only dashboard), and owns the background effects: a one-minute refresh heartbeat, a two-minute
  quota loop, a health probe, an hourly vault-sync check and a pending-OAuth sweep.
- `lib/accounts.js` is the credential and slot layer: blobs go through the credential service (secrets never
  live in settings), and per-account cooldown, quarantine, quota samples and health are kept here
  (quarantines persist in `$DSH_HOME/subscriptions/quarantines.json`). `lib/vendors/{antigravity,codex}.js`
  implement the vendor side (authorize, exchange, refresh, list models, usage, streaming),
  `lib/code-assist.js` the Cloud Code contract, `lib/agy-usage.js` the CLI quota path.
- `lib/adapter.js` implements `LlmAdapter` (model resolution, capability tags, image materialisation,
  per-request account selection, retry and failover on 429, history), registered as
  `ctx.llm.registerAdapter(['antigravity', 'codex'], adapter)` once one provider has a credential.
- `lib/client.js` mounts the browser surfaces: the pill on `conversation.session.header.actions` (order 15),
  the composer indicator on `conversation.input.right` (order 5), the card and settings panel on
  `plugins.item` / `plugins.bundle.config` / `plugins.row.config`, and the `/login` and `/logout` slash
  commands. It polls `/dsh-subscriptions/config` and renders the Hub through a portal.

## Troubleshooting

**An account shows as not connected after a restart.** Slots are settings, tokens are credentials; at
startup the plugin re-adds a slot whenever a credential for its ref exists. If the panel still says *Not
connected*, confirm `agy2dsh` is still in `dsh.profile.bundles` (a profile reinstall can drop it), then read
`loggedIn` in `GET /dsh-subscriptions/status`. If you enabled `masterKey`, the same key must reach the host,
or every call fails with an `encrypted at rest` error.

**Quota disagrees with `agy /usage`.** Check `active.usageSource` and `cliQuota` in
`GET /dsh-subscriptions/status`. `api` means the CLI was not used: the binary was not found,
`DSH_SUBSCRIPTIONS_QUOTA_SOURCE=api` is set, `agy` is logged into a different account than the slot's
email, or the subprocess timed out. `cliQuota.reason` says which: `auth-required` (the CLI could not use
its stored credential and asked for a login), `timeout`, `unreadable` or `error`, together with the moment
it will be retried. A recent CLI reading is kept for up to 30 minutes during such an outage, so the pill
stops at the last honest number instead of the HTTP summary's rosier Gemini figure — the summary is also
genuinely different for Gemini (see [Quota](#quota)).

**A terminal window flashes on screen.** Something the plugin spawned opened a console. The host is a
GUI process, so any console program spawned without `windowsHide: true` gets its own console window for
as long as it runs. Fixed in 0.8.3 for the Credential Manager read (`lib/import-auth.js`), which runs
every few minutes; `test/no-window-flash.mjs` now fails if a new spawn site forgets the flag.

**A picture request turns into Python instead of an image.** Check `image` in `GET /dsh-subscriptions/status`.
No `model` means the tool is off (`imageGeneration`), no Antigravity account is signed in, or the catalog could
not be read (the tool then falls back to `gemini-3.1-flash-image`). If the model is listed and the agent still
writes PIL code, it was told to: say "use the generate_image tool" once, or check that a different plugin is
not masking the tool. There is no Imagen API key involved — the subscription token is enough.

**A browser window opens on the Antigravity login page.** It is `agy`, not the plugin: the CLI refreshes
its expired Credential Manager token at start-up and, when that refresh fails, would start an interactive
OAuth flow. Since 0.8.2 the probe runs with `AGY_CLI_NONINTERACTIVE_HEADLESS=1`, so the CLI prints
`Authentication required. Please visit the URL to log in: ...` and exits instead of opening a browser. If
you still want to fix the underlying state, run `agy` once interactively and sign in; the CLI will keep
rewriting its record with an expired copy, so the next probe refreshes again over the network.

**A provider is missing from the model picker.** The adapter is registered only for providers with a
readable credential, so an empty picker usually means `loggedIn` is false. If `loggedIn` is true and the
provider still never appears, another bundle in the profile already registers that provider id — the
plugin logs `syncAdapter skipping already-bound providers` and leaves the existing provider alone. If
models are listed but stale, press **Sync models** on the account card; Antigravity keeps only `claude-*`
and `gemini-3.8-flash-{low,medium,high}` from the published catalog and falls back to the bundled one.

**Requests fail with 429 or an account goes quiet.** A 429 or quota error sets a cooldown (30 minutes by
default) for the affected model family only; other accounts keep serving. Lower `accountMaxConcurrency`,
keep `enableQueue` on, or add a second slot. Quarantine clears on a successful request or through
`POST /dsh-subscriptions/quarantine/probe` (pass `release: true` to release without probing). State lives
in `$DSH_HOME/subscriptions/quarantines.json`.

**Antigravity always falls back to HTTP, or import finds nothing.** The lookup only accepts a path that
exists: `DSH_AGY_PATH`, then `AGY_PATH`, then the `%LOCALAPPDATA%` / `%APPDATA%` / `%USERPROFILE%` candidates
above. Set `DSH_AGY_PATH` to the full executable path when `agy` lives elsewhere — a wrapper script works if
it accepts `--print /usage --output-format json`. Import reads the CLI token files and, on Windows only, the
`gemini:antigravity` Credential Manager entry.

**Saving settings fails with a conflict.** `PUT /dsh-subscriptions/config` is revision-checked: a stale
revision returns `409 configuration has been modified concurrently`, and a request without one returns
`428`. Let the panel reload (it re-reads the revision on its ~25s poll) and save again instead of keeping
two settings panels open.

## Security and privacy

- **Credentials stay in the DSH credential store**, written under `<PROVIDER>_OAUTH_<index>`. Settings hold
  only slot metadata; secret fields are redacted in `GET /dsh-subscriptions/config` and restored from the
  stored value before a write, so the browser never receives them. With `masterKey` (or
  `DSH_SUBSCRIPTIONS_MASTER_KEY`) blobs are encrypted before storage, and an encrypted blob without its key
  is refused rather than silently broken.
- **Quota data does not leave the machine.** It is read from Google Cloud Code and `chatgpt.com` with the
  account's own token and kept locally with the request history and quarantine state. There is no
  telemetry or analytics upload; `/dsh-subscriptions/telemetry` only summarises the local history.
- **Outbound traffic is what you enable.** Alerts POST to `webhookUrl` if you set one, vault sync uploads
  an encrypted archive to your backend, `proxyUrl` sends that account's traffic through your proxy, and
  `/dsh-subscriptions/update` asks the npm registry for the latest version if called. Config writes and
  account actions are same-origin only; the dashboard and its history are loopback-only.

## License

MIT — see [LICENSE](LICENSE).

Using a consumer subscription through third-party tooling may violate the terms of service of the provider
that sells it. You are responsible for how you use your own accounts, and the project comes with no warranty
that any particular use is permitted. It is unaffiliated with Google, OpenAI and DeepSeek.