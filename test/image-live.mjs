// Live: generate a real image through the subscription session and through the
// registered tool (with a stub attachment store), then verify the file on disk.
// Costs one image request against the account's Gemini quota.
import { readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadLocalCliBlob } from '../lib/import-auth.js'
import * as vendor from '../lib/vendors/antigravity.js'
import { generateImage, imageDimensions, resolveImageModelId, sniffImageMediaType } from '../lib/image-gen.js'
import { createGenerateImageTool, imageGenerationContent, formatImageGeneration } from '../lib/tools/generate-image.js'

const blob = await loadLocalCliBlob('antigravity', { fresh: true })
const refreshed = await vendor.refresh(
  { clientId: blob.clientId, clientSecret: blob.clientSecret },
  blob,
  fetch,
)
const session = {
  accessToken: refreshed.accessToken,
  projectId: refreshed.projectId || blob.projectId || '',
  ref: 'ANTIGRAVITY_OAUTH_1',
  fetchImpl: fetch,
}
console.log('account:', blob.email || '(no email)')

const model = await resolveImageModelId({
  token: session.accessToken,
  projectId: session.projectId,
  fetchImpl: session.fetchImpl,
  ref: session.ref,
})
console.log('image model (from imageGenerationModelIds):', model)

const started = Date.now()
const image = await generateImage({
  token: session.accessToken,
  projectId: session.projectId,
  fetchImpl: session.fetchImpl,
  model,
  prompt: 'a single ripe red apple on a white seamless background, studio product photo, soft shadow',
  aspectRatio: '1:1',
})
const size = imageDimensions(image.data)
console.log(`generated in ${Date.now() - started} ms via ${image.host.split('/')[2]}`)
console.log(`bytes: ${image.data.length} · sniffed: ${sniffImageMediaType(image.data)} · declared: ${image.mediaType} · ${size ? size.width + 'x' + size.height : 'size unknown'} px`)
if (image.text) console.log('accompanying text:', image.text.slice(0, 200))

let ok = true
const expect = (label, cond) => { console.log((cond ? 'PASS ' : 'FAIL ') + label); if (!cond) ok = false }
expect('an image came back', image.data.length > 1000)
expect('it is a real image the sniffers agree on', !!sniffImageMediaType(image.data) && sniffImageMediaType(image.data) === image.mediaType)
expect('dimensions were readable', !!size && size.width > 0 && size.height > 0)

// The tool path: same code the host calls, with a temp output dir and a stub
// attachment store that mirrors the host's saveImage contract.
const store = []
const attachments = {
  imageLimits: { mediaTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], maxImageBytes: 10 * 1024 * 1024, maxImageDimension: 8192, maxImagePixels: 40_000_000 },
  async saveImage({ data, mediaType, name }) {
    const dims = imageDimensions(data) || { width: 0, height: 0 }
    const ref = { attachmentId: 'att_test_' + (store.length + 1), mediaType, bytes: data.length, width: dims.width, height: dims.height, name }
    store.push(ref)
    return ref
  },
}
const tool = createGenerateImageTool({
  getConfig: () => ({ imageGeneration: true, imageOutputDir: join(tmpdir(), 'agy2dsh-image-live'), imageTimeoutMs: 180000 }),
  getSession: async () => session,
  getAttachments: () => attachments,
})
const value = await tool.execute({ prompt: 'a small blue ceramic cup on a wooden table, natural light', aspect_ratio: '16:9' }, {})
console.log('\ntool value:', JSON.stringify({ ...value, image: { ...value.image, attachmentId: value.image.attachmentId } }))
expect('tool returned an attachment id', typeof value.image.attachmentId === 'string' && value.image.attachmentId.length > 0)
expect('tool reported pixel dimensions', value.image.width > 0 && value.image.height > 0)
expect('tool honoured the 16:9 request (wider than tall)', value.image.width > value.image.height)
expect('tool saved the file', !!value.path && statSync(value.path).size === value.image.bytes)
if (value.path) {
  const onDisk = readFileSync(value.path)
  expect('saved file is the image itself', sniffImageMediaType(onDisk) === value.image.mediaType)
  console.log('saved to:', value.path)
}

const blocks = imageGenerationContent({ ...value, ...value.image })
expect('render yields a text block and an image block', blocks.length === 2 && blocks[0].type === 'text' && blocks[1].type === 'image')
expect('the image block carries the durable ref', blocks[1].attachment.attachmentId === value.image.attachmentId)
expect('the model-facing envelope names the file', formatImageGeneration({ ...value, ...value.image }).includes('<path>'))

console.log(ok ? '\nPASS live image generation' : '\nFAIL live image generation')
process.exitCode = ok ? 0 : 1
