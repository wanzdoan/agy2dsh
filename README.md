# agy2dsh

A DeepSeek Harness plugin that turns two consumer AI subscriptions into ordinary DSH LLM
providers: **Google Antigravity** (`agy`, serving Gemini and Claude models) and
**ChatGPT/Codex**. It registers both with the host's `llm` service, refreshes their OAuth
tokens itself, spreads requests across the accounts you add, and reports the quota those
subscriptions actually meter. It is for people who already pay for Antigravity or ChatGPT and
would rather spend that allowance from DSH Desktop than buy API credits.

Package `agy2dsh`, version 0.8.0, MIT. The settings namespace is still `dsh-subscriptions` and
the HTTP routes are still under `/dsh-subscriptions/...`: that is deliberate, so an existing
install keeps its accounts, slots and preferences across the rename.

## Features

- **Two LLM providers.** `antigravity` models are resolved through `fetchAvailableModels` and
  filtered to the families the account is metered for (`claude-*`,
  `gemini-3.8-flash-{low,medium,high}`); `codex` rows carry the reasoning levels and context
  window the Codex catalog publishes. Both fall back to a bundled catalog.
- **Self-refreshing credentials.** Imported OAuth blobs are refreshed by the plugin — one
  refresh in flight per account, retries with backoff, clock-skew correction from the vendor's
  `Date` header. A rejected Google refresh token is retried once against a newer token read
  from the CLI's own store.
- **Multiple accounts per provider.** Each account is a slot with its own credential ref
  (`ANTIGRAVITY_OAUTH_1`, `CODEX_OAUTH_2`, ...), proxy, concurrency limit and label.
- **Rotation and failure handling.** Round-robin/least-used/sticky ordering, family-scoped
  cooldowns after 429s, quarantine with a warm-up probe, health scoring, and an optional
  bounded queue so a burst cannot become a wall of 429s.
- **Quota in the UI.** A pill on the session header, a Subscription Hub with per-window bars
  and reset countdowns, and an optional inline quota beside the message composer.
- **Quota from the authoritative source.** Antigravity numbers come from `agy` when the CLI is
  logged into the same account and from the Cloud Code HTTP summary otherwise; Codex numbers
  come from the ChatGPT usage endpoint.
- **Images.** Attachment references are materialised into inline image blocks before they reach
  a vendor serializer, and Codex accounts can serve the host's image generation service
  (`subscriptionImages`).
- **Codex reset credits** can be inspected and consumed from the host, behind a confirmation
  step with a cooldown.
- **Local operations surface.** Request history, a diagnostics dump, and a localhost-only
  dashboard at `/dsh-subscriptions/subscriptions`.
- **Bilingual UI**, and an optional passphrase-encrypted vault with export/import and scheduled
  sync to WebDAV, a Gist or S3.

## Requirements

| | |
| --- | --- |
| DSH Desktop | A build whose `@deepseek-ai/dsh-llm`, `dsh-credentials`, `dsh-settings` and `dsh-host-webserver` match `^0.1.7-rc.2 \|\| ^0.2.0-rc.1 \|\| ^0.2.0-rc.2`, with `@deepseek-ai/cordis ^4.0.1` and `@deepseek-ai/schemastery ^3.18.4`. |
| Node | None of your own: the host half runs inside DSH Desktop's Node runtime (the 2.x desktop app declares `node ^22.19.0 \|\| >=24.0.0`). |
| `agy` CLI | Only for Antigravity — "import from CLI" and the CLI quota source. Looked up via `DSH_AGY_PATH`, `AGY_PATH`, then `%LOCALAPPDATA%\agy\bin\agy.exe`, `%APPDATA%\agy\bin\agy(.exe)`, `%USERPROFILE%\AppData\Local\agy\bin\agy.exe`. |
| Codex CLI | Not required. If present, `~/.codex/auth.json` can be imported. |

## Install

`agy2dsh` is a profile-sourced bundle: DSH Desktop composes the host from the active profile's
manifest. Add it to that manifest (`package.json` in the profile directory, normally
`<DSH home>/profiles/desktop`) as a dependency **and** to `dsh.profile.bundles`:

```json
{
  "dependencies": {
    "agy2dsh": "github:wanzdoan/agy2dsh"
  },
  "dsh": {
    "profile": {
      "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "agy2dsh"]
    }
  }
}
```

Keep the bundle entries the profile already has: `dsh.profile.bundles` is what composes the
host, and a package missing from it is installed but never loaded.

Then reinstall the profile (the profile directory is a pnpm workspace, so this is the install
DSH Desktop runs over it) and **restart DSH Desktop**. The plugin entry, its HTTP routes and its
background timers are only loaded at startup, so a profile install without a restart leaves the
previous build in memory. The browser half is bundled into `lib/client.js` and served by the
host, so the same restart covers it.

## Connect an account

Open the pill on the session header for the **Subscription Hub**, or the plugin card under
Settings. Both have one tab per provider.

**Antigravity**

- **Import from CLI** copies the record `agy` already stored on this machine into the DSH
  credential store; nothing is written back to the CLI. Sources: the CLI token files
  (`~/.gemini/antigravity-cli/antigravity-oauth-token`, `~/.gemini/oauth_creds.json`,
  `~/.cli-proxy-api/antigravity.json`) and, on Windows, the Credential Manager entry
  `gemini:antigravity`. The blob keeps the client id found in the token and, for the known CLI
  client, the plugin's bundled public client secret, so the account can refresh itself without
  any further configuration.
- **Paste token** takes an OAuth refresh token.
- **Manual OAuth** needs your own Google OAuth client: set `antigravityClientId` (plus
  `antigravityClientSecret` for a confidential client) and register the redirect URI the plugin
  will use (`http://localhost:8085/oauth/callback` when `antigravityRedirectUri` is empty).
  Start it with `/login antigravity` in the composer. With `autoLoopback` on, a temporary server
  on that port catches the callback; turn it off to paste the redirected URL, or set
  `useWebCallback` to use the DSH Web origin instead.

**Codex**

- **Import from CLI** reads `~/.codex/auth.json`.
- **Paste token** accepts a refresh token; an API key is stored as an API-key-only blob and
  sent as-is, so it does not expire the way a session does.
- **Manual OAuth** uses the built-in Codex client id (`codexRedirectUri` empty =
  `http://localhost:1455/auth/callback`); a device-code flow is available for headless hosts.

**Import all** is the multi-account path. For Antigravity it scans the live Credential Manager
record and every per-account copy an account manager left under
`~/.gemini/account-vault/sessions/*.json`, deduplicates records that resolve to the same refresh
token, reuses the slots the provider already owns and gives each distinct account a new one. For
Codex it is a single import. From then on the plugin refreshes those accounts itself; you do not
have to run the vendor CLI again.

## Quota

Antigravity meters **two families**, each with a **weekly** and a **5-hour** window, so the
plugin reports four numbers per account: `Gemini [weekly|5h]` and `Claude [weekly|5h]`.

The **pill** shows a status dot, the provider, one chip per family (brand mark, family name, and
`[weekly|5h]` **remaining** percentages, weekly first) and `+N` when more than one account is
connected. `Gemini [94%|91%] | Claude [0%|100%]` means 94% of the Gemini weekly window and 91% of
its 5-hour window are left and the Claude 5-hour window is untouched. The nearest reset countdown
is not on the pill; it is on the Hub's per-window rows. Clicking the pill opens the Hub.

The **status dot** follows the Gemini 5-hour window: **60% or more remaining is green, below 60%
amber, below 20% red**. An account without a Gemini window (Codex, or an incomplete snapshot)
falls back to that provider's 5-hour window, then to its tightest window, so the dot never shows
green for an empty account. The composer indicator shows the lowest remaining window of the
active account in `percent` or `bar` mode.

Where the numbers come from:

- **Antigravity, CLI first.** `lib/agy-usage.js` runs
  `agy --print "/usage" --output-format json` and parses `command.data.groups[].buckets[]`
  (`remaining_fraction`, `reset_time`). It is used only when the binary exists **and** the
  account `agy` is logged into is the one being displayed: one process at a time, 60-second
  cache, 25-second timeout, never allowed to throw. Tagged `cli`.
- **Antigravity, HTTP fallback.** Otherwise the plugin calls `:retrieveUserQuotaSummary` with
  the account's Code Assist project, then `:retrieveUserQuota` when the summary does not serve
  the four windows. Tagged `api`.
- **Codex.** `GET https://chatgpt.com/backend-api/wham/usage`, reduced to its named windows
  (`primary_window` / `secondary_window`, shown as 5h and 7d).

The CLI is preferred because it is the only source that reproduces the Gemini figure the user
reads in their terminal. Measured in the same minute with the same token,
`PredictionService.RetrieveUserQuotaSummary` (gRPC and REST, production and daily hosts, with and
without `project`) answered `1.0` with a reset that slides forward with wall-clock time, while
`agy /usage` reported `0.9481` with a reset pinned in the past. Claude agrees on every path;
Gemini does not. The analysis and the protobuf contract the CLI embeds are in
[`docs/agy-usage-re.md`](docs/agy-usage-re.md).

`GET /dsh-subscriptions/status` reports which source answered as `active.usageSource`
(`cli` or `api`), and the tag is persisted with the snapshot. `DSH_SUBSCRIPTIONS_QUOTA_SOURCE=api`
forces the HTTP path. Usage is refreshed at most every two minutes and written into the
credential blob, so the Hub survives a restart with the last known windows.

## Configuration

Everything lives in the `dsh-subscriptions` settings namespace and is editable from the Settings
panel or through `GET`/`PUT /dsh-subscriptions/config`. All fields are volatile, so the settings
service accepts any write; secrets round-trip masked as `••••••` and are restored server-side.

**General**

| Field | Default | Meaning |
| --- | --- | --- |
| `language` | `en` | `en` or `vi`; applies to the panel and the pill. |
| `privacyMask` | `false` | Masks account emails and labels in the UI. |
| `composerQuota` | `off` | `off`, `percent` or `bar` quota next to the message composer. |
| `streamIdleTimeoutMs` | `180000` | Abort a stream that sends nothing for this long; `0` disables the cap. Timeouts never mark an account rate-limited. |
| `useWebCallback` | `false` | Use the DSH Web origin + `/dsh-subscriptions/oauth/callback` as `redirect_uri`. |
| `autoLoopback` | `true` | Catch the OAuth callback on the loopback port the vendor registered (Codex 1455, Antigravity 8085). |
| `hideDeprecatedModels` | `false` | Hide test/preview/beta/legacy ids from the model picker. |
| `masterKey` | `''` | Encrypt stored credentials at rest; falls back to `DSH_SUBSCRIPTIONS_MASTER_KEY`. |

**Antigravity** — `antigravityClientId` (`''`, needed only for a manual sign-in),
`antigravityClientSecret` (`''`, for a confidential client), `antigravityRedirectUri` (`''` =
the vendor loopback callback), `antigravityClientVersion` (`''` = built-in `1.18.3`, sent as the
user agent) and `antigravityModels` (`[]` = what the account publishes, filtered to the metered
families).

**Codex**

| Field | Default | Meaning |
| --- | --- | --- |
| `codexClientId` | `''` | Empty = the built-in public Codex client. |
| `codexRedirectUri` | `''` | Empty = `http://localhost:1455/auth/callback`. |
| `codexBaseUrl` | `''` | Empty = `https://chatgpt.com/backend-api/codex`. |
| `codexOriginator` | `''` | Originator header; empty = `codex_cli_rs`. |
| `codexClientVersion` | `''` | Version for the `/models` catalog gate; empty = `0.160.0`. |
| `codexVerbosity` | `''` | `low`, `medium`, `high`; empty = protocol default. |
| `codexFastMode` | `false` | Sends `service_tier: priority` with every request. |
| `codexModels` | `[]` | Custom catalog; empty = the catalog the backend returns. |

**Rotation and limits**

| Field | Default | Meaning |
| --- | --- | --- |
| `rotationStrategy` | `round-robin` | Account pick order; the panel offers round robin, least used and sticky until limited. Ordering also weighs auto-pacing risk, nearest reset, weight and health. |
| `switchAtRemaining` | `0.01` | Treat an account as exhausted at or below this (a fraction under 1, or an absolute value); `0` disables. |
| `cooldownMs` | `1800000` | Skip an account this long after a 429/quota failure. |
| `probeIntervalMin` | `15` | Background health-probe interval; `0` disables. |
| `enableQueue` | `true` | Bounded per-account queue, with `accountMaxConcurrency` (`1`, slots may override), `maxQueueSize` (`20`) and `queueTimeoutMs` (`30000`). |
| `drainBeforeReset` | `false` | Prefer accounts whose window resets soonest so expiring quota gets used; `drainSafetyPercent` (`5`) keeps a floor when a fresher account exists. |
| `autoPacing` | `true` | Burn-rate-aware ordering between accounts. |
| `enableSoftFailureSentinel` | `true` | Fail over when an HTTP 200 carries a capacity apology instead of content. |
| `expiryNotifyDays` | `7` | Show a subscription expiry in the header chip this many days ahead; `0` disables. |

**Per account (`slots[]`)** — `provider` and `index` fix the slot and its credential ref;
`label` defaults to the account email; `proxyUrl` routes everything for that account (including
token refresh and quota) through `http`/`https`/`socks5`; `maxConcurrency` defaults to `1`;
`expiresAt` feeds the expiry chip; `monthlyCost`, `tags`, `weight`, `isPro`, `vipOnly` and
`maxQueueSize` tune rotation accounting.

**Alerts**

| Field | Default | Meaning |
| --- | --- | --- |
| `notifyLimits` | `true` | Log a notice and emit `subscriptions.limit-notice` when a window crosses 70, 90 or 100% used. |
| `alertThresholds` | `[80, 90, 95]` | Thresholds for recorded alerts. |
| `webhookUrl` | `''` | JSON POST target for quota, quarantine and session-expiry alerts. |
| `enableToasts` | `true` | In-app toasts for quarantine and quota events. |

**Vault sync** — `vaultSyncEnabled` (`false`), `vaultSyncBackend` (`webdav`, or `gist` / `s3`),
`vaultSyncPassphrase` (`''`), `vaultSyncIntervalHours` (`24`, `0` disables the periodic pull) and
`vaultSyncAutoPush` (`true`). Targets: `vaultSyncWebdavUrl`/`Username`/`Password`;
`vaultSyncGistId`/`Token`/`BaseUrl` (`https://api.github.com`);
`vaultSyncS3Endpoint`/`Bucket`/`Key` (`dsh-subscriptions-vault.enc`)/`Region` (`us-east-1`)/
`AccessKey`/`SecretKey`.

Advanced knobs, not tabulated: `refreshAheadMs` (`300000`) and `refreshRetryMs` (`600000`) shape
the refresh heartbeat, `codexSystemPrefix` prepends a system prompt for Codex, and
`antigravityModels`/`codexModels` accept full catalog rows for ids the vendor does not publish.

## Language

English is the default. Choosing **Tiếng Việt** writes `language: "vi"` and switches every string
the plugin contributes: the pill, the Hub (account cards, window labels, buttons, status words,
notices), the composer indicator, the settings panel and its hints. Both dictionaries are
registered with the host's locale service (`MESSAGES.en`, `MESSAGES.vi`), so the change lands on
the next poll without a restart. Vendor strings — model ids, API error text — stay as they are.

## How it works

```
agy (CLI) ──► import-auth ──► DSH credential store: ANTIGRAVITY_OAUTH_n / CODEX_OAUTH_n
                                        │
vendor APIs ◄── vendors/*.js  ◄──  accounts.js (slots, cooldowns, quarantine, quota snapshot)
                                        │                    └──► agy-usage.js (CLI quota)
                                        ▼
                       adapter.js ──► ctx.llm.registerAdapter(['antigravity', 'codex'])
                                        │
              routes/*.js ──► /dsh-subscriptions/...  ──►  client.js (pill, hub, composer)
```

- `lib/index.js` is the entry point (`export const name = 'agy2dsh'`,
  `inject = ['llm', 'credentials', 'webServer', 'settings']`). It builds the settings snapshot,
  creates the account store and the adapter, registers the routes and owns the background
  effects: a one-minute refresh heartbeat, a two-minute quota loop, a health probe on
  `probeIntervalMin`, an hourly vault-sync check and a pending-OAuth sweep.
- `lib/accounts.js` is the credential and slot layer. Secrets never live in settings; blobs go
  through the credential service, and per-account cooldown, quarantine, quota samples and health
  are kept here (quarantines persist in `$DSH_HOME/subscriptions/quarantines.json`).
- `lib/vendors/{antigravity,codex}.js` implement the vendor side — authorize, exchange, refresh,
  list models, usage, streaming call. `lib/code-assist.js` holds the Cloud Code contract
  (identity headers, project discovery, quota summary); `lib/agy-usage.js` holds the CLI path.
- `lib/adapter.js` implements `LlmAdapter`: model resolution and capability tags, image
  materialisation, per-request account selection, retry and failover on 429, history recording.
- `lib/routes.js` and `lib/routes/*.js` expose `/dsh-subscriptions/{config,status,models,health,
  check,history,diagnostics,accounts,oauth,import-local,import-token,vault,...}`. Writes are
  same-origin only; the dashboard and its history are loopback only.
- `lib/client.js` mounts the browser surfaces: the pill on `conversation.session.header.actions`
  (order 15), the composer indicator on `conversation.input.right` (order 5), the card and
  settings panel on `plugins.item` / `plugins.bundle.config` / `plugins.row.config`, and the
  `/login` and `/logout` slash commands. It polls `/dsh-subscriptions/config` and renders the Hub
  through a portal so it cannot disturb the session header layout.

## Troubleshooting

**An account shows as not connected after a restart.**
Slots are settings, tokens are credentials. At startup the plugin re-adds a slot whenever a
credential for its ref exists. If the panel still says *Not connected*, confirm `agy2dsh` is
still in `dsh.profile.bundles` (a profile reinstall can drop it), then read `loggedIn` in
`GET /dsh-subscriptions/status`: it tells you whether a credential for that provider is
configured at all. If you enabled `masterKey` (or `DSH_SUBSCRIPTIONS_MASTER_KEY`), the same key
must be available to the host, or the account stays undecryptable and every call fails with an
explicit `encrypted at rest` error.

**Quota disagrees with `agy /usage`.**
Check `active.usageSource` in `/dsh-subscriptions/status`. `api` means the CLI was not used: the
binary was not found, `DSH_SUBSCRIPTIONS_QUOTA_SOURCE=api` is set, `agy` is logged into a
different account than the slot's email, or the subprocess timed out. Snapshots are cached for
two minutes, so wait one cycle after fixing the cause. The HTTP summary is also genuinely
different for Gemini — see [Quota](#quota).

**A provider is missing from the model picker.**
The adapter is registered only for providers with a readable credential, so an empty picker
usually means `loggedIn` is false for that provider: nothing was imported, or the blob cannot be
read. If `loggedIn` is true and the provider still never appears, another bundle in the profile
already registers that provider id — the plugin logs `syncAdapter skipping already-bound
providers` and leaves the existing provider alone. If models are listed but stale, press **Sync
models** on the account card; Antigravity keeps only `claude-*` and
`gemini-3.8-flash-{low,medium,high}` from the published catalog and falls back to the bundled
one when none are present.

**Requests fail with 429 or an account goes quiet.**
A 429 or quota error sets a cooldown (30 minutes by default) for the affected model family only;
other accounts keep serving. Lower `accountMaxConcurrency`, keep `enableQueue` on, or add a
second slot. Quarantine clears on a successful request, or on demand through
`POST /dsh-subscriptions/quarantine/probe` (pass `release: true` to release without probing).
State lives in `$DSH_HOME/subscriptions/quarantines.json` (`DSH_HOME` defaults to `~/.dsh`).

**Antigravity always falls back to HTTP, or import finds nothing.**
The lookup only accepts a path that exists: `DSH_AGY_PATH`, then `AGY_PATH`, then the
`%LOCALAPPDATA%` / `%APPDATA%` / `%USERPROFILE%` candidates above. Set `DSH_AGY_PATH` to the full
executable path when `agy` lives elsewhere — a wrapper script works if it accepts
`--print /usage --output-format json`. Import reads the CLI token files and, on Windows only, the
`gemini:antigravity` Credential Manager entry; on macOS and Linux only the files are scanned.

**Saving settings fails with a conflict.**
`PUT /dsh-subscriptions/config` is revision-checked: a stale revision returns
`409 configuration has been modified concurrently`, and a request without one returns `428`.
Let the panel reload (it re-reads the revision on its ~25-second poll) and save again instead of
keeping two settings panels open.

## Security and privacy

- **Credentials stay in the DSH credential store**, written through the host's credential
  service under `<PROVIDER>_OAUTH_<index>`. Settings hold only slot metadata; secret fields are
  redacted in `GET /dsh-subscriptions/config` and restored from the stored value before a write,
  so the browser never receives them.
- **Optional encryption at rest.** With `masterKey` (or `DSH_SUBSCRIPTIONS_MASTER_KEY`) the blob
  is encrypted before storage, and the plugin refuses to use an encrypted blob without the key
  rather than failing silently.
- **Quota data does not leave the machine.** It is read from Google Cloud Code and
  `chatgpt.com` with the account's own token and kept locally, next to the request history and
  quarantine state. There is no telemetry or analytics upload; `/dsh-subscriptions/telemetry`
  only summarises the local history for the UI.
- **Outbound traffic is what you enable.** Alerts POST to `webhookUrl` if you set one, vault sync
  uploads an encrypted archive to your backend, and `proxyUrl` sends that account's traffic
  through your proxy; `/dsh-subscriptions/update` asks the npm registry for the latest published
  version if it is called.
- **Local endpoints.** Config writes and account actions are same-origin only; the dashboard and
  its history are served only to loopback clients.

## License

MIT — see [LICENSE](LICENSE).

Using a consumer subscription through third-party tooling may violate the terms of service of the
provider that sells it. You are responsible for how you use your own accounts, and the project
comes with no warranty that any particular use is permitted. It is unaffiliated with Google,
OpenAI and DeepSeek, and endorsed by none of them.
