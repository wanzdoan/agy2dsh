# Text-to-image on an Antigravity subscription

How `agy2dsh` turns "draw me X" into a real model-generated picture, and why the adapter alone could not.

## Why the adapter could not do it

Image generation on Antigravity is not a chat model. The CLI implements it as a **built-in subagent**:

- `third_party/jetski/cortex/customizations/builtin/agents/image_generator.go` (source path embedded in
  `agy.exe`, a 202 MB Go binary).
- Gated by the feature flag **`enable-image-generator-subagent`**, next to
  `enable-browser-subagent-webview`, in the same config surface as
  `enable-continue-after-injection`.
- The release notes compiled into the binary describe it:

  > "Changed how the agent generates images: it now hands image requests to a built-in `image-generator`
  > subagent, which writes the prompt, checks each result with up to three attempts, and saves the images to
  > the conversation's artifacts, so image generation appears as a subagent run in the conversation"

An LLM adapter (`generateContent` in, text/tool-calls out) never reaches that layer, and `agy agents` lists no
addressable agent for it. So a model asked for a picture falls back to the only path it has: writing PIL code.

## What the backend actually offers

`FetchAvailableModels` — the call the plugin already makes for the model picker — carries a field the catalog
normalizer was dropping:

```jsonc
{
  "models": { /* gemini-3.8-flash-high, claude-sonnet-4-6, ... */ },
  "imageGenerationModelIds": ["gemini-3.1-flash-image"],   // <- never in `models`
  "webSearchModelIds": ["gemini-3.1-flash-lite"],
  "commitMessageModelIds": ["gemini-3.5-flash-lite"],
  "tieredModelIds": { "flash": ["gemini-3.8-flash-tiered"], ... }
}
```

That id is served by the ordinary generate endpoint:

```
POST https://daily-cloudcode-pa.googleapis.com/v1internal:generateContent
{
  "project": "<code assist project>",
  "model": "gemini-3.1-flash-image",
  "userAgent": "antigravity",
  "request": {
    "session_id": "<uuid>",
    "contents": [{ "role": "user", "parts": [{ "text": "<prompt>" }] }],
    "generationConfig": { "responseModalities": ["TEXT","IMAGE"],
                          "imageConfig": { "aspectRatio": "16:9" } }
  }
}
```

Response (2026-10-21, live):

```jsonc
{
  "response": {
    "candidates": [{
      "content": { "parts": [
        { "thoughtSignature": "..." },
        { "inlineData": { "mimeType": "image/jpeg", "data": "<base64>" } }
      ] },
      "finishReason": "STOP"
    }],
    "usageMetadata": { "promptTokenCount": 13, "candidatesTokenCount": 1522, "totalTokenCount": 1535 }
  },
  "traceId": "...", "metadata": {}
}
```

Measured results:

| request | result |
| --- | --- |
| `1:1`, "a red apple ..." | JPEG 1024x1024, 426 KB, 16.9 s |
| `16:9`, "a blue ceramic cup ..." | JPEG 1376x768, 773 KB |
| same body on `cloudcode-pa.googleapis.com` (prod) | **429 RESOURCE_EXHAUSTED** |
| same body on `daily-cloudcode-pa.googleapis.com` | 200 |

So: the daily host is the one that serves image models for a consumer account, the aspect ratio is honoured, and
the cost is ~1.5k tokens against the same Gemini quota the chat windows meter.

## How the plugin implements it

`lib/image-gen.js` (protocol) and `lib/tools/generate-image.js` (tool):

1. **Model id** — `resolveImageModelId()` reads `imageGenerationModelIds` through
   `postAssist('fetchAvailableModels')`, caches it per credential ref for ten minutes, and falls back to the
   verified `gemini-3.1-flash-image` when the catalog call fails. `imageModelId` overrides everything.
2. **Request** — `buildImageEnvelope()` mirrors the streaming envelope the adapter already sends
   (`{ project, model, user_agent, request }`) so image requests travel the same authenticated path.
3. **Hosts** — `generateImage()` tries the remembered host first, then the other; a 429/5xx moves on, a 401/403
   stops (the token is bad everywhere), and the host that answered is remembered for ten minutes.
4. **Parsing** — `parseImageResponse()` walks `candidates[0].content.parts`, skips `thoughtSignature`, collects
   text, takes the first `inlineData`/`inline_data`, and sniffs the media type from the bytes instead of
   trusting the label. A reply with no image raises a message naming `finishReason`/`promptFeedback`.
5. **Delivery** — the tool writes the file, calls `attachments.saveImage({ data, mediaType, name })` and returns
   `{ path, prompt, model, image: { attachmentId, mediaType, bytes, width, height, name } }`. `output.render`
   turns that into `[{ type: 'text', text: '<image_generated>...' }, { type: 'image', attachment }]` — the same
   two-block shape the host's `read_image` produces, so the GUI shows the picture and the agent sees it next step.
6. **Limits** — `assertImageWithinLimits()` checks the deployment's `attachments.imageLimits` (accepted media
   types, byte cap, side cap, pixel cap) before storing, and `imageDimensions()` reads PNG/JPEG/WebP/GIF headers
   without an image library.

The tool object is hand-built (JSON Schema `parameters`, `output { schema, render, presentationMeta }`) rather
than produced by `@deepseek-ai/dsh-tools`'s `defineTool`, because the plugin is installed under the profile where
that package is not a resolvable bare specifier. `test/tool-shape.mjs` runs the hand-built shape through the
host's own `assertObjectJsonSchema`, `assertSupportedJsonSchema` and `validateJsonSchemaValue`, which is what
`ToolRuntime.register()` and its result path call.

## Re-verifying

```bash
node test/image-gen.mjs     # 51 offline checks: discovery, envelope, parsing, host fallback, limits
node test/tool-shape.mjs    # 31 checks against the host's validators (skips when the host isn't installed)
node test/image-live.mjs    # generates two real images and runs the tool path
```

`GET /dsh-subscriptions/status` exposes `image: { enabled, model }`; the settings panel shows the same value
under **Image generation**.
