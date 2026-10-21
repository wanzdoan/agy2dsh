// Image generation: model discovery, request shape, response parsing, host
// fallback, size limits and the dimensions reader. Offline - no network, no
// quota - except where a fake fetch stands in for the backend.
import {
  IMAGE_MODEL_FALLBACK,
  IMAGE_HOSTS,
  pickImageModelId,
  resolveImageModelId,
  resetImageCaches,
  buildImageRequest,
  buildImageEnvelope,
  imageGenerationConfig,
  parseImageResponse,
  sniffImageMediaType,
  imageDimensions,
  hostOrder,
  generateImage,
  resolveImageDir,
  assertImageWithinLimits,
} from '../lib/image-gen.js'

let pass = 0
let fail = 0
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS ', name) } else { fail++; console.log('FAIL ', name, detail === undefined ? '' : '- ' + detail) }
}

// A 4x2 PNG and a 1408x768 JPEG header, enough for the sniffers.
const PNG = Buffer.from('89504e470d0a1a0a0000000d494844520000000400000002', 'hex')
const JPEG = Buffer.concat([
  Buffer.from('ffd8ffe000104a464946', 'hex'),
  Buffer.from('00000000000000000000', 'hex'),
  Buffer.from('ffc000110803000580', 'hex'), // SOF0: 768 high, 1408 wide
  Buffer.alloc(24),
])

// --- model discovery -------------------------------------------------------
check('reads id from imageGenerationModelIds', pickImageModelId({ imageGenerationModelIds: ['gemini-3.1-flash-image'] }) === 'gemini-3.1-flash-image')
check('strips the models/ prefix', pickImageModelId({ imageGenerationModelIds: ['models/gemini-3.1-flash-image'] }) === 'gemini-3.1-flash-image')
check('skips empty entries', pickImageModelId({ imageGenerationModelIds: ['', '  ', 'imagen-4.0'] }) === 'imagen-4.0')
check('ignores a chat-only catalog', pickImageModelId({ models: { 'gemini-3.8-flash-high': {} } }) === '')
check('tolerates a missing field', pickImageModelId({}) === '' && pickImageModelId(null) === '')
check('tolerates a non-array field', pickImageModelId({ imageGenerationModelIds: 'gemini-3.1-flash-image' }) === '')
check('falls back to the verified id', IMAGE_MODEL_FALLBACK === 'gemini-3.1-flash-image')

resetImageCaches()
const catalogFetch = async () => new Response(JSON.stringify({ imageGenerationModelIds: ['gemini-9-image'] }), { status: 200 })
const resolved = await resolveImageModelId({ token: 't', fetchImpl: catalogFetch, ref: 'ANTIGRAVITY_OAUTH_1' })
check('resolves the published id', resolved === 'gemini-9-image', resolved)
let catalogCalls = 0
const countingFetch = async () => { catalogCalls++; return new Response(JSON.stringify({ imageGenerationModelIds: ['gemini-9-image'] }), { status: 200 }) }
await resolveImageModelId({ token: 't', fetchImpl: countingFetch, ref: 'ANTIGRAVITY_OAUTH_1' })
check('caches the id per account', catalogCalls === 0, `${catalogCalls} extra calls`)
const overrideFetch = async () => { throw new Error('must not be called') }
check('config override skips the catalog', (await resolveImageModelId({ token: 't', fetchImpl: overrideFetch, override: 'imagen-x' })) === 'imagen-x')
const brokenFetch = async () => { throw new TypeError('offline') }
resetImageCaches()
check('offline catalog falls back', (await resolveImageModelId({ token: 't', fetchImpl: brokenFetch, ref: 'r2' })) === IMAGE_MODEL_FALLBACK)

// --- request shape ---------------------------------------------------------
const req = buildImageRequest({ prompt: '  a red apple  ', aspectRatio: '16:9' })
check('prompt is trimmed', req.contents[0].parts[0].text === 'a red apple')
check('asks for text and image', JSON.stringify(req.generationConfig.responseModalities) === '["TEXT","IMAGE"]')
check('passes a known aspect ratio', req.generationConfig.imageConfig.aspectRatio === '16:9')
check('drops an unknown aspect ratio', imageGenerationConfig({ aspectRatio: '7:3' }).imageConfig === undefined)
check('tolerates a missing aspect ratio', imageGenerationConfig({}).imageConfig === undefined)
let emptyThrew = false
try { buildImageRequest({ prompt: '   ' }) } catch { emptyThrew = true }
check('rejects an empty prompt', emptyThrew)

const envelope = buildImageEnvelope({ projectId: 'proj-1', model: 'gemini-3.1-flash-image', prompt: 'cat' })
check('envelope carries model and request', envelope.model === 'gemini-3.1-flash-image' && !!envelope.request)
check('envelope carries the project', envelope.project === 'proj-1')
check('envelope has a session id', typeof envelope.request.session_id === 'string' && envelope.request.session_id.length > 0)
check('envelope omits an empty project', buildImageEnvelope({ model: 'm', prompt: 'x' }).project === undefined)

// --- response parsing ------------------------------------------------------
const okBody = {
  response: {
    candidates: [{
      content: { parts: [{ thoughtSignature: 'sig' }, { inlineData: { mimeType: 'image/jpeg', data: JPEG.toString('base64') } }] },
      finishReason: 'STOP',
    }],
    usageMetadata: { candidatesTokenCount: 1522 },
  },
  traceId: 't',
}
const parsed = parseImageResponse(okBody)
check('finds inlineData next to other parts', parsed.data.length === JPEG.length)
check('sniffs the real media type', parsed.mediaType === 'image/jpeg', parsed.mediaType)
check('accepts a bare (unenveloped) reply', parseImageResponse({ candidates: okBody.response.candidates }).data.length === JPEG.length)
check('accepts snake_case inline_data', parseImageResponse({ candidates: [{ content: { parts: [{ inline_data: { mime_type: 'image/png', data: PNG.toString('base64') } }] } }] }).mediaType === 'image/png')
check('returns accompanying text', parseImageResponse({ candidates: [{ content: { parts: [{ text: 'here you go' }, { inlineData: { data: PNG.toString('base64') } }] } }] }).text === 'here you go')

let noImage = ''
try { parseImageResponse({ response: { candidates: [{ finishReason: 'SAFETY' }] } }) } catch (err) { noImage = String(err.message) }
check('explains a blocked reply', /no image/.test(noImage) && /SAFETY/.test(noImage), noImage)
let emptyImage = ''
try { parseImageResponse({ candidates: [{ content: { parts: [{ inlineData: { data: '' } }] } }] }) } catch (err) { emptyImage = String(err.message) }
check('explains an empty image', /no image/.test(emptyImage), emptyImage)

// --- media sniffing and dimensions ----------------------------------------
check('sniffs png', sniffImageMediaType(PNG) === 'image/png')
check('sniffs jpeg', sniffImageMediaType(JPEG) === 'image/jpeg')
check('sniffs gif', sniffImageMediaType(Buffer.from('474946383961', 'hex')) === 'image/gif')
check('sniffs webp', sniffImageMediaType(Buffer.from('524946460000000057454250', 'hex')) === 'image/webp')
check('rejects non-images', sniffImageMediaType(Buffer.from('hello world, not an image')) === undefined)
check('reads png dimensions', JSON.stringify(imageDimensions(PNG)) === JSON.stringify({ width: 4, height: 2 }), JSON.stringify(imageDimensions(PNG)))
const jpegSize = imageDimensions(JPEG)
check('reads jpeg dimensions', jpegSize && jpegSize.width === 1408 && jpegSize.height === 768, JSON.stringify(jpegSize))
check('dimensions of junk are undefined', imageDimensions(Buffer.from('nope')) === undefined)

// --- host fallback ---------------------------------------------------------
resetImageCaches()
const seenHosts = []
const fallbackFetch = async (url) => {
  seenHosts.push(String(url).split('/')[2])
  if (String(url).includes('daily-')) {
    return new Response(JSON.stringify({ error: { code: 429, status: 'RESOURCE_EXHAUSTED' } }), { status: 429 })
  }
  return new Response(JSON.stringify(okBody), { status: 200 })
}
const generated = await generateImage({ token: 't', prompt: 'cat', fetchImpl: fallbackFetch })
check('retries the other host after 429', generated.host === IMAGE_HOSTS[1], generated.host)
check('tried both hosts in order', seenHosts.length === 2 && seenHosts[0].startsWith('daily-'), seenHosts.join(','))
check('remembers the working host', hostOrder()[0] === IMAGE_HOSTS[1])
check('returns the image bytes', generated.data.length === JPEG.length && generated.mediaType === 'image/jpeg')
check('reports the model used', generated.model === IMAGE_MODEL_FALLBACK)

resetImageCaches()
const bothDown = async () => new Response('{"error":{"code":500}}', { status: 500 })
let downMessage = ''
try { await generateImage({ token: 't', prompt: 'cat', fetchImpl: bothDown }) } catch (err) { downMessage = String(err.message) }
check('reports every host when all fail', /image generation failed/.test(downMessage) && (downMessage.match(/HTTP 500/g) || []).length === 2, downMessage)

resetImageCaches()
let authCalls = 0
const authFail = async () => { authCalls++; return new Response('nope', { status: 401 }) }
await generateImage({ token: 't', prompt: 'cat', fetchImpl: authFail }).catch(() => {})
check('does not retry a rejected token on the other host', authCalls === 1, `${authCalls} calls`)

resetImageCaches()
const throwingFetch = async () => { throw new TypeError('getaddrinfo ENOTFOUND') }
let netMessage = ''
try { await generateImage({ token: 't', prompt: 'cat', fetchImpl: throwingFetch }) } catch (err) { netMessage = String(err.message) }
check('surfaces a network failure clearly', /ENOTFOUND/.test(netMessage) || /failed/.test(netMessage), netMessage)

// --- limits and output dir -------------------------------------------------
check('accepts an image inside the limits', (() => {
  try { assertImageWithinLimits({ data: JPEG, mediaType: 'image/jpeg', width: 1408, height: 768 }, { maxImageBytes: 5_000_000, maxImageDimension: 4096, maxImagePixels: 20_000_000 }); return true } catch { return false }
})())
const limitCases = [
  ['too many bytes', { maxImageBytes: 10 }],
  ['unsupported media type', { mediaTypes: ['image/png'] }],
  ['side too large', { maxImageDimension: 512 }],
  ['too many pixels', { maxImagePixels: 100 }],
]
for (const [label, limits] of limitCases) {
  let threw = ''
  try { assertImageWithinLimits({ data: JPEG, mediaType: 'image/jpeg', width: 1408, height: 768 }, limits) } catch (err) { threw = String(err.message) }
  check('refuses an image that is ' + label, threw.length > 0, threw)
}
check('honours an explicit output directory', resolveImageDir('D:/pics') === 'D:/pics')
const defaultDir = resolveImageDir('')
check('defaults under the DSH home', /agy2dsh[\\/]images$/.test(defaultDir), defaultDir)

console.log(`\n${pass}/${pass + fail} passed`)
process.exitCode = fail === 0 ? 0 : 1
