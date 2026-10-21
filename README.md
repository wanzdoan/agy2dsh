# dsh-subscriptions

Use your **Antigravity** (Google Gemini 3.8 Flash and Claude models) and **ChatGPT Codex**
consumer subscriptions as DeepSeek Harness LLM providers.

The plugin registers both subscriptions as LLM providers, rotates across the accounts you add,
tracks quota per model family, and refreshes OAuth on its own — you do not need to run the vendor
CLI again after the first import.

## Supported providers

| Provider | Models | Auth |
| --- | --- | --- |
| `antigravity` | `gemini-3.8-flash-{high,medium,low}`, `claude-sonnet-4-6`, `claude-opus-4-6-thinking` | Google OAuth (CLI import or your own client) |
| `codex` | the Codex model list published by the ChatGPT backend | ChatGPT OAuth / refresh token |

Both providers accept image input on every model that supports vision; `read_image` and pasted
images are forwarded as inline image blocks.

## Install

```
dsh plugin install @goodandready/dsh-subscriptions
```

Then restart DeepSeek Harness so the host plugin is loaded.

## Connect an account

Open **Settings → Plugins → Subscription Hub**.

- **Import from CLI** reads the credentials the vendor CLI already stored on this machine
  (antigravity: Windows Credential Manager target `gemini:antigravity`; codex: `~/.codex/auth.json`).
  Nothing is written back to the CLI store.
- **Paste token** accepts a refresh token (antigravity) or a refresh token / API key (codex).
- **Sign in** starts the normal OAuth flow with your own client id, when you configured one.

Imported Antigravity accounts refresh themselves: the CLI's public installed-app client
id/secret pair (`AGY_CLI_CLIENT_ID`, `bundledClientSecret()`) is bundled so the refresh grant
Google requires can be performed without asking you for a secret. Access tokens live ~1 hour;
refresh tokens for this client are long-lived and are not rotated, so the account keeps working
indefinitely without running `agy`.

## Interface

- **Session header pill** — status dot, provider, one quota readout per model family
  (`Gemini … Claude …`) and the nearest reset countdown. Click it to open the Hub.
- **Subscription Hub** — accounts, live quota bars, verify / sync models / remove, import actions.
- **Composer quota** — optional inline usage next to the message composer.
- **Language** — `language` setting, `en` (default) or `vi`; the panel and the pill both follow it.

## Settings

| Key | Default | Meaning |
| --- | --- | --- |
| `language` | `en` | UI language (`en` / `vi`) |
| `rotationStrategy` | `round-robin` | `round-robin` / `least-used` / `sticky` |
| `switchAtRemaining` | `0` | Switch account before it is exhausted (% used) |
| `cooldownMs` | `1800000` | Failure cooldown |
| `streamIdleTimeoutMs` | `180000` | Abort a silent stream after this long; `0` disables |
| `antigravityClientVersion` | `''` | User-Agent version for Google; empty uses the built-in default |
| `privacyMask` | `false` | Mask emails in the UI |
| `composerQuota` | `off` | `off` / `percent` / `bar` |
| `notifyLimits` | `true` | Alert when a quota window passes 90% |

Antigravity's `retrieveUserQuota` is metered per model family, so the plugin reports **two**
windows — `gemini` and `claude` — each with its own reset time. A single percentage cannot
describe the account.

## Development

```
node --check lib/*.js                    # syntax
node verify-client.mjs                   # UI bundle boot + locale/slot smoke test
node verify-subscriptions.mjs            # adapter, rotation, quarantine
node verify-host.mjs                     # real dsh-llm normalizeModelInfo validation
node verify-images.mjs                   # attachment -> inline image pipeline
node verify-quota-families.mjs           # antigravity family quota grouping
node verify-refresh.mjs                  # live OAuth refresh (requires an imported account)
```

## License

MIT
