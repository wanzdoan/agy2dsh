# How `agy /usage` gets its numbers

Static + black-box analysis of `C:\Users\Administrator\AppData\Local\agy\bin\agy.exe`
(202,906,776 bytes, PE x64, Go), 2026-10-21. Purpose: decide what the plugin should use as
the authoritative quota source.

## What the binary is

- Single Go executable; it embeds both a CLI and a gRPC **language server** plus cloud clients.
- Four proto packages are compiled in: `google.internal.cloud.code.v1internal`,
  `google.internal.cloud.code`, `google.internal.compute`,
  `google.internal.identity.signedoutstate.v1`.
- Cloud services reachable from it:
  - `google.internal.cloud.code.v1internal.CloudCode` — 47 methods, e.g. `LoadCodeAssist`,
    `ListCloudAICompanionProjects`, `FetchCodeCustomizationState`, `RecordCodeAssistMetrics`.
  - `google.internal.cloud.code.v1internal.PredictionService` — `GenerateContent`,
    `CountTokens`, `FetchAvailableModels`, **`RetrieveUserQuota`**,
    **`RetrieveUserQuotaSummary`**.
  - `google.internal.cloud.code.v1internal.JetskiService` — Antigravity-specific calls
    (`FetchUserInfo`, `RegisterInteraction`, `CheckUrlDenylist`, …).
  - `exa.language_server_pb.LanguageServerService` — 353 local RPCs, and it has its **own**
    `RetrieveUserQuotaSummary`, next to `GetUserStatus`, `GetUserAnalyticsSummary`,
    `FetchUserInfo`, `GetLoadCodeAssist`.
- Hosts: `https://cloudcode-pa.googleapis.com` (prod) and
  `https://daily-cloudcode-pa.googleapis.com` (daily). `https://aicode.googleapis.com` and
  `https://paydeveloper.googleapis.com` exist but do not serve the quota methods.

## The quota contract (from the embedded descriptors)

```
RetrieveUserQuotaSummaryRequest { string project = 1; }

QuotaSummaryBucket  { string bucket_id, string display_name, string description,
                      string window, double remaining_fraction, remaining_amount,
                      bool disabled, google.protobuf.Timestamp reset_time }
QuotaSummaryGroup   { string display_name, string description,
                      repeated QuotaSummaryBucket buckets }
RetrieveUserQuotaSummaryResponse { repeated QuotaSummaryGroup groups, string description }
```

Bucket ids in practice: `gemini-weekly`, `gemini-5h`, `3p-weekly`, `3p-5h` (`3p` = Claude/GPT).
`window` is literally `weekly` or `5h`, and `remaining_fraction` is **what is left**, not used.

Both gRPC and REST reach the same data:

```bash
# gRPC (what the CLI does): 5-byte frame [0x00][len BE32][protobuf]
POST /google.internal.cloud.code.v1internal.PredictionService/RetrieveUserQuotaSummary
content-type: application/grpc, te: trailers, authorization: Bearer <token>

# REST transcode, what the plugin used first
POST https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuotaSummary
{"project":"<optional>"}
```

## The measurement that decided the design

Same minute, same access token, account `user@example.com`:

| source | gemini-weekly | gemini-5h | 3p-weekly | 3p-5h |
| --- | --- | --- | --- | --- |
| `agy --print "/usage"` | **0.9481**, reset 26/10 04:12Z | **0.9194**, reset 21/10 10:22Z | 0.0025872 | 1.0 |
| REST `:retrieveUserQuotaSummary` `{}` | 1.0, reset 28/10 08:57Z | 1.0 | 0.0025872 | 1.0 |
| REST `:retrieveUserQuotaSummary` `{project:"aicode-consumers"}` | 1.0 | 1.0 | 0.0025872 | 1.0 |
| gRPC `PredictionService/RetrieveUserQuotaSummary` `{}` | 1.0 | 1.0 | 0.0025872 | 1.0 |
| gRPC `PredictionService/RetrieveUserQuotaSummary` `{project}` | 1.0 | 1.0 | 0.0025872 | 1.0 |
| gRPC `RetrieveUserQuota` (per model) | every gemini model 1.0 | 1.0 | 0.0025872 | 1.0 |
| gRPC daily host, same calls | **group missing entirely** | — | 0.0025872 | 1.0 |

Claude agrees everywhere; **Gemini never does**. Two further observations:

- The Gemini values the CLI prints **change while nobody uses the account** (0.9396 at 15:15 →
  0.9481 at 15:54) and their `reset_time` stays pinned at `2026-10-26T04:12:55Z`, i.e. the
  window is anchored in the past and the remaining fraction grows as old usage ages out.
- The cloud keeps answering `1.0` with a `reset_time` that slides forward with wall-clock time
  (`08:31` at 15:31, `08:57` at 15:57) — a freshly-opened window, not the consumed one.

Interpretation (inference, not proven): `/usage` is served from the CLI's **own ledger** — the
language server's `RetrieveUserQuotaSummary` (`exa.language_server_pb`) — which reconciles the
quota the desktop app records per turn (`RecordCascadeUsage`, `GetUserAnalyticsSummary`) rather
than re-reading `PredictionService`. It still touches the network (offline it fails with
"Authentication required" because the OAuth refresh cannot run), but the Gemini figures it
prints are not reconstructible from any cloud quota call reachable with the user's token.

## What the plugin does because of this

1. `lib/agy-usage.js` runs `agy --print "/usage" --output-format json` and parses
   `command.data.groups[].buckets[]` — the exact numbers the user sees. It is only used when
   `agy` is logged into the same account being displayed, cached for five minutes
   (`cliQuotaTtlMs`), capped at 20 s (`cliQuotaTimeoutMs`), never allowed to throw, and never
   allowed to become interactive.
2. `lib/accounts.js` prefers that snapshot for antigravity and tags it `source: 'cli'`;
   everything else falls through to the HTTP summary, tagged `source: 'api'`. The tag is
   persisted with the snapshot and exposed as `active.usageSource` in `/dsh-subscriptions/status`,
   together with `cliQuota` (last probe outcome and backoff).
3. The HTTP fallback now sends `RetrieveUserQuotaSummaryRequest { project }` with the account's
   Code Assist project, matching the proto, so a managed account stays on its own pool.
4. `DSH_SUBSCRIPTIONS_QUOTA_SOURCE=api` forces the HTTP path when the CLI is unwanted.

## Authentication, and why the probe must be headless

The CLI keeps its OAuth token in Windows Credential Manager (`gemini:antigravity`, payload
`{ token: { access_token, token_type, refresh_token, expiry, expires_in }, auth_method, id_token }`)
and authenticates in print mode through `ChainedAuth -> keyringAuth`. Two measured facts shape the
probe:

1. **The stored record is always stale.** The CLI rewrites it on every run with its own expired
   copy, so `keyringAuth` logs `expired=true` and refreshes over the network at start-up. Writing a
   fresh token into that record from outside was tried (`CredWrite` with the same
   `CREDENTIAL` layout: `uint` sizes, `FILETIME` LastWritten) and verified — the CLI replaced it
   with the expired copy within three minutes. There is no setting to stop it.
2. **A failed start-up refresh turns interactive.** `printmode.go`:

   ```
   Print mode: not authenticated, trying silent auth
   keyringAuth: loaded token, expiry=... expired=true
   token refresh failed due to network error: ... 127.0.0.1:9 ...
   Print mode: silent auth failed
   Print mode: triggering interactive OAuth      -> opens accounts.google.com in a browser, blocks
   ```

   A refused proxy port and a 10-second keyring timeout each triggered it while the plugin was
   refreshing quota in the background.

`AGY_CLI_NONINTERACTIVE_HEADLESS=1` is the switch that keeps this headless: the same failure then
prints `Authentication required. Please visit the URL to log in: https://accounts.google.com/...` on
stderr and exits immediately. Google does not rotate the refresh token for this client (the refresh
response carries no `refresh_token`), so the plugin's own refresh and the CLI's do not invalidate
each other.

## Re-verifying

```bash
node test/cli-quota.mjs        # CLI snapshot vs raw payload, prints the pill
node test/cli-guard.mjs        # headless flag, login-prompt detection, cache and backoff
node tools/grpcprobe.mjs cloudcode-pa.googleapis.com PredictionService RetrieveUserQuotaSummary
node tools/grpcprobe.mjs daily-cloudcode-pa.googleapis.com PredictionService RetrieveUserQuotaSummary
```

To reproduce the login-prompt path by hand, force the refresh to fail and watch the CLI log:

```powershell
$env:HTTPS_PROXY='http://127.0.0.1:9'; $env:AGY_CLI_NONINTERACTIVE_HEADLESS='1'
agy --print "/usage" --output-format json   # prints the login URL, exits, no browser
```

`tools/grpcprobe.mjs` takes `[host] [Service] [Method] [protoHexBody]` and decodes the protobuf reply
generically; `tools/scanservices.mjs` enumerates every embedded service and gRPC path;
`tools/scanstrings.mjs` greps printable strings in the binary.
