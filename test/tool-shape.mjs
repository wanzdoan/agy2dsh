// The generate_image tool against the host's own registry contract.
//
// The plugin builds the tool object by hand (see lib/tools/generate-image.js), so
// this test feeds the schemas to the real validators from the installed
// `@deepseek-ai/dsh-tools` when that package can be found on this machine, and
// otherwise only checks the invariants it can check offline.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  GENERATE_IMAGE_TOOL,
  GENERATE_IMAGE_PARAMETERS,
  GENERATE_IMAGE_OUTPUT_SCHEMA,
  applyGenerateImageTool,
  createGenerateImageTool,
  formatImageGeneration,
  imageGenerationContent,
  validateGenerateImageArgs,
} from '../lib/tools/generate-image.js'

let pass = 0
let fail = 0
let skipped = 0
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS ', name) } else { fail++; console.log('FAIL ', name, detail === undefined ? '' : '- ' + detail) }
}
function skip(name, why) { skipped++; console.log('SKIP ', name, '-', why) }

const stubs = {
  getConfig: () => ({ imageGeneration: true }),
  getSession: async () => ({ accessToken: 't', projectId: 'p', ref: 'r', fetchImpl: async () => { throw new Error('no network in this test') } }),
  getAttachments: () => null,
}
const tool = createGenerateImageTool(stubs)

// --- shape the registry requires -------------------------------------------
check('tool is named generate_image', tool.name === GENERATE_IMAGE_TOOL && tool.name === 'generate_image')
check('description tells the model not to draw with code', /Never draw/.test(tool.description) && /PIL/.test(tool.description))
check('parameters are object JSON Schema with a required prompt',
  tool.parameters.type === 'object'
  && tool.parameters.properties.prompt.type === 'string'
  && JSON.stringify(tool.parameters.required) === '["prompt"]'
  && tool.parameters.additionalProperties === false)
check('aspect_ratio is an enum, not free text', Array.isArray(tool.parameters.properties.aspect_ratio.enum))
check('output declares schema, render and presentationMeta',
  !!tool.output && !!tool.output.schema && typeof tool.output.render === 'function' && typeof tool.output.presentationMeta === 'function')
check('output schema requires the four value fields',
  JSON.stringify(tool.output.schema.required) === '["path","prompt","model","image"]')
check('image schema requires the durable attachment fields',
  JSON.stringify(tool.output.schema.properties.image.required) === '["attachmentId","mediaType","bytes","width","height"]')
check('execute is a function', typeof tool.execute === 'function')

// --- argument validation ---------------------------------------------------
check('accepts a plain prompt', validateGenerateImageArgs({ prompt: 'a cat' }).length === 0)
check('rejects a missing prompt', validateGenerateImageArgs({}).length === 1)
check('rejects an empty prompt', validateGenerateImageArgs({ prompt: '   ' }).length === 1)
check('rejects a non-string prompt', validateGenerateImageArgs({ prompt: 42 }).length === 1)
check('rejects an over-long prompt', validateGenerateImageArgs({ prompt: 'x'.repeat(8001) }).length === 1)
check('rejects an unknown aspect ratio', validateGenerateImageArgs({ prompt: 'a', aspect_ratio: '7:3' }).length === 1)
check('accepts a known aspect ratio', validateGenerateImageArgs({ prompt: 'a', aspect_ratio: '16:9' }).length === 0)

let argError = ''
try { await tool.execute({ prompt: '' }, {}) } catch (err) { argError = String(err.message) }
check('execute refuses invalid arguments before doing any work', /prompt is required/.test(argError), argError)

// --- render ---------------------------------------------------------------
const value = {
  path: 'C:/tmp/image-1.jpg',
  prompt: 'a red apple',
  model: 'gemini-3.1-flash-image',
  image: { attachmentId: 'att_1', mediaType: 'image/jpeg', bytes: 435097, width: 1408, height: 768, name: 'image-1.jpg' },
}
const blocks = tool.output.render({ prompt: 'a red apple' }, value)
check('render returns a text envelope and an image block', blocks.length === 2 && blocks[0].type === 'text' && blocks[1].type === 'image')
check('the image block carries the durable reference', blocks[1].attachment.attachmentId === 'att_1' && blocks[1].attachment.width === 1408)
check('the envelope is plain JSON (survives a snapshot)', JSON.stringify(JSON.parse(JSON.stringify(blocks))) === JSON.stringify(blocks))
check('the envelope names the file and the model', /image-1\.jpg/.test(blocks[0].text) && /gemini-3\.1-flash-image/.test(blocks[0].text))
check('presentationMeta exposes the path', tool.output.presentationMeta({}, value).path === 'C:/tmp/image-1.jpg')
check('formatImageGeneration tolerates a missing path', /<image_generated>/.test(formatImageGeneration({ ...value, path: '' })))
check('imageGenerationContent is the same shape as render', JSON.stringify(imageGenerationContent({ ...value, ...value.image })) === JSON.stringify(blocks))

// --- registration ---------------------------------------------------------
const registered = []
const fakeCtx = { tools: { register: (definition) => registered.push(definition) } }
const name = applyGenerateImageTool(fakeCtx, stubs)
check('registers into a host tool registry', name === 'generate_image' && registered.length === 1)
check('registered definition is the same tool', registered[0].name === 'generate_image' && typeof registered[0].execute === 'function')
check('a host without a registry is a no-op', applyGenerateImageTool({}, stubs) === '' && applyGenerateImageTool({ tools: {} }, stubs) === '')

// --- real host validators (best effort) -----------------------------------
const appCandidates = [
  process.env.DSH_TOOLS_PATH,
  process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Programs', 'DSH Desktop', 'resources', 'app', 'node_modules', '@deepseek-ai', 'dsh-tools', 'lib', 'index.js'),
].filter(Boolean)
const hostPath = appCandidates.find((candidate) => existsSync(candidate))
if (!hostPath) {
  skip('host schema validators', 'the installed @deepseek-ai/dsh-tools was not found on this machine')
} else {
  const host = await import(pathToFileURL(hostPath).href)
  let schemaError = ''
  try {
    host.assertObjectJsonSchema(GENERATE_IMAGE_PARAMETERS)
    host.assertSupportedJsonSchema(GENERATE_IMAGE_OUTPUT_SCHEMA)
    host.assertObjectJsonSchema(GENERATE_IMAGE_OUTPUT_SCHEMA)
  } catch (err) { schemaError = String(err.message) }
  check('the host accepts both schemas', schemaError === '', schemaError)

  const valueViolations = host.validateJsonSchemaValue(GENERATE_IMAGE_OUTPUT_SCHEMA, value, 'value')
  check('the host accepts the returned value', valueViolations.length === 0, valueViolations.join('; '))
  const badViolations = host.validateJsonSchemaValue(GENERATE_IMAGE_OUTPUT_SCHEMA, { path: '', prompt: 'x', model: 'm' }, 'value')
  check('the host rejects a value missing the image', badViolations.length > 0)
  const argViolations = host.validateJsonSchemaValue(GENERATE_IMAGE_PARAMETERS, { prompt: 'a cat', aspect_ratio: '16:9' }, 'args')
  check('the host accepts valid arguments', argViolations.length === 0, argViolations.join('; '))
  const badArgs = host.validateJsonSchemaValue(GENERATE_IMAGE_PARAMETERS, { aspect_ratio: '16:9' }, 'args')
  check('the host rejects arguments without a prompt', badArgs.length > 0)
}

console.log(`\n${pass}/${pass + fail} passed${skipped ? `, ${skipped} skipped` : ''}`)
process.exitCode = fail === 0 ? 0 : 1
