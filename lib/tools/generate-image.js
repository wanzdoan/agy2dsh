// The `generate_image` tool: text-to-image through the subscription's Google
// image model.
//
// The tool object is built by hand against the host's registry contract
// (`{ name, description, parameters: <JSON Schema>, output: { schema, render },
// execute }`) instead of importing `@deepseek-ai/dsh-tools`: the plugin is
// installed under the profile, where that package is not a resolvable bare
// specifier, and the registry only consumes the already-converted shape that
// `defineTool` would have produced.
//
// The description below is part of the prompt every agent sees, so it says
// outright that this - not code - is the way to produce a picture.
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  ASPECT_RATIOS,
  assertImageWithinLimits,
  generateImage,
  imageDimensions,
  resolveImageDir,
  resolveImageModelId,
} from '../image-gen.js'

export const GENERATE_IMAGE_TOOL = 'generate_image'

const IMAGE_VALUE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['attachmentId', 'mediaType', 'bytes', 'width', 'height'],
  properties: {
    attachmentId: { type: 'string' },
    mediaType: { type: 'string', enum: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] },
    bytes: { type: 'integer' },
    width: { type: 'integer' },
    height: { type: 'integer' },
    name: { type: 'string' },
  },
}

export const GENERATE_IMAGE_PARAMETERS = {
  type: 'object',
  additionalProperties: false,
  required: ['prompt'],
  properties: {
    prompt: {
      type: 'string',
      description: 'What to draw. Be specific: subject, style, lighting, colours, framing, mood.',
    },
    aspect_ratio: {
      type: 'string',
      enum: ASPECT_RATIOS,
      description: 'Output shape. Default 1:1. Use 16:9 for scenery or wallpapers, 9:16 for phone wallpapers, 2:3 or 3:4 for portraits.',
    },
  },
}

export const GENERATE_IMAGE_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['path', 'prompt', 'model', 'image'],
  properties: {
    path: { type: 'string', description: 'Absolute path of the saved file (empty when it could not be written).' },
    prompt: { type: 'string' },
    model: { type: 'string' },
    image: IMAGE_VALUE_SCHEMA,
  },
}

/**
 * Validate model-supplied arguments against GENERATE_IMAGE_PARAMETERS.
 * @param {any} args
 * @returns {string[]} human-readable violations (empty when valid)
 */
export function validateGenerateImageArgs(args) {
  const violations = []
  const value = args && typeof args === 'object' ? args : {}
  const prompt = value.prompt
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    violations.push('prompt is required and must be a non-empty string')
  } else if (prompt.length > 8000) {
    violations.push('prompt is too long (8000 characters maximum)')
  }
  if (value.aspect_ratio !== undefined && value.aspect_ratio !== null) {
    if (typeof value.aspect_ratio !== 'string' || !ASPECT_RATIOS.includes(value.aspect_ratio)) {
      violations.push(`aspect_ratio must be one of ${ASPECT_RATIOS.join(', ')}`)
    }
  }
  return violations
}

/** Model-facing envelope next to the image block. */
export function formatImageGeneration(value) {
  const size = value.width && value.height ? `, ${value.width}x${value.height} px` : ''
  const saved = value.path ? `\n<path>${value.path}</path>` : ''
  return `<image_generated>
<model>${value.model}</model>
<type>${value.mediaType}</type>
<content>${value.bytes} bytes${size}</content>
<prompt>${value.prompt}</prompt>${saved}
</image_generated>`
}

/** The two content blocks: text envelope + the image itself, so the agent sees it. */
export function imageGenerationContent(value) {
  return [
    { type: 'text', text: formatImageGeneration(value) },
    {
      type: 'image',
      attachment: {
        attachmentId: value.attachmentId,
        mediaType: value.mediaType,
        bytes: value.bytes,
        width: value.width,
        height: value.height,
        ...(value.name === undefined ? {} : { name: value.name }),
      },
    },
  ]
}

function stamp(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

function extensionFor(mediaType) {
  switch (mediaType) {
    case 'image/jpeg': return '.jpg'
    case 'image/webp': return '.webp'
    case 'image/gif': return '.gif'
    default: return '.png'
  }
}

/**
 * Build the tool definition.
 * @param {{
 *   getConfig: () => any,
 *   getSession: (options: { signal?: AbortSignal }) => Promise<{ accessToken: string, projectId?: string, ref?: string, fetchImpl?: Function }>,
 *   getAttachments: () => any,
 *   logger?: any,
 * }} deps
 */
export function createGenerateImageTool(deps) {
  return {
    name: GENERATE_IMAGE_TOOL,
    description:
      'Create an AI-generated image from a text prompt with the Google image model included in the subscription, ' +
      'and return the picture itself. Use this tool whenever the user asks for a picture, illustration, logo, icon, ' +
      'poster, photo, wallpaper, character, scene or any other visual, including edits to a previous result. ' +
      'Write a detailed prompt (subject, style, lighting, colours, composition). Never draw, render or synthesise an ' +
      'image with code (PIL, ImageMagick, canvas, SVG) unless the user explicitly asks for programmatic drawing: ' +
      'this tool produces a real model-generated picture, code does not. ' +
      'When presenting the generated image in Markdown, always use standard Markdown syntax: ![description](path) without angle brackets, using the exact path returned.',
    parameters: GENERATE_IMAGE_PARAMETERS,
    output: {
      schema: GENERATE_IMAGE_OUTPUT_SCHEMA,
      render: (_args, value) => imageGenerationContent({
        path: value.path,
        prompt: value.prompt,
        model: value.model,
        attachmentId: value.image.attachmentId,
        mediaType: value.image.mediaType,
        bytes: value.image.bytes,
        width: value.image.width,
        height: value.image.height,
        name: value.image.name,
      }),
      presentationMeta: (_args, value) => ({ path: value.path }),
    },
    async execute(args, exec) {
      const violations = validateGenerateImageArgs(args)
      if (violations.length > 0) {
        const err = /** @type {Error & { code?: string }} */ (new Error(violations.join('; ')))
        err.code = 'TOOL_ARGS'
        throw err
      }
      const cfg = deps.getConfig() || {}
      if (cfg.imageGeneration === false) {
        throw new Error('image generation is disabled in the Subscriptions settings (imageGeneration)')
      }
      const prompt = String(args.prompt).trim()

      const attachments = deps.getAttachments()
      if (!attachments || typeof attachments.saveImage !== 'function') {
        throw new Error('no attachment service is mounted, so a generated image cannot be shown')
      }

      const session = await deps.getSession({ signal: exec && exec.signal })
      const model = await resolveImageModelId({
        token: session.accessToken,
        projectId: session.projectId,
        fetchImpl: session.fetchImpl,
        ref: session.ref,
        override: cfg.imageModelId,
      })
      const result = await generateImage({
        token: session.accessToken,
        projectId: session.projectId,
        fetchImpl: session.fetchImpl,
        prompt,
        aspectRatio: args.aspect_ratio,
        model,
        timeoutMs: cfg.imageTimeoutMs,
        signal: exec && exec.signal,
      })

      const dimensions = imageDimensions(result.data) || { width: 0, height: 0 }
      assertImageWithinLimits(
        { data: result.data, mediaType: result.mediaType, width: dimensions.width, height: dimensions.height },
        (attachments && attachments.imageLimits) || {},
      )

      const name = `image-${stamp()}-${Math.random().toString(36).slice(2, 8)}${extensionFor(result.mediaType)}`
      let path = ''
      try {
        let wsCwd = ''
        if (deps.getCwd) {
          try { wsCwd = await deps.getCwd(exec) } catch { /* ignore */ }
        }
        if (!wsCwd && exec && exec.agent) {
          try {
            const workingDirectory = (deps.ctx && typeof deps.ctx.get === 'function') ? deps.ctx.get('workingDirectory') : null
            if (workingDirectory && typeof workingDirectory.ensure === 'function') {
              wsCwd = await workingDirectory.ensure(exec.agent, exec.signal)
            }
          } catch { /* ignore */ }
        }
        const dir = resolveImageDir(cfg.imageOutputDir, wsCwd)
        await mkdir(dir, { recursive: true })
        path = join(dir, name)
        await writeFile(path, result.data)
      } catch (err) {
        // The picture matters more than the file copy: the attachment still
        // carries it. Say why there is no path instead of failing the request.
        path = ''
        if (deps.logger && deps.logger.warn) {
          deps.logger.warn('[dsh-subscriptions] could not save generated image: ' + String((err && err.message) || err))
        }
      }

      const ref = await storeImage(attachments, result, name)
      return {
        path,
        prompt,
        model,
        image: {
          attachmentId: ref.attachmentId,
          mediaType: ref.mediaType || result.mediaType,
          bytes: Math.round(Number(ref.bytes) || result.data.length),
          width: Math.round(Number(ref.width) || dimensions.width || 0),
          height: Math.round(Number(ref.height) || dimensions.height || 0),
          name,
        },
      }
    },
  }
}

/**
 * Store the image, translating the host's refusal codes into something the model
 * can act on instead of a raw storage error.
 */
async function storeImage(attachments, result, name) {
  try {
    return await attachments.saveImage({ data: result.data, mediaType: result.mediaType, name })
  } catch (error) {
    const code = String((error && error.code) || '')
    const limits = (attachments && attachments.imageLimits) || {}
    if (code === 'IMAGE_DIMENSION_TOO_LARGE') {
      throw new Error(`the generated image is larger than the ${limits.maxImageDimension}px side limit; ask for a smaller aspect ratio`)
    }
    if (code === 'IMAGE_TOO_MANY_PIXELS') {
      throw new Error(`the generated image exceeds the ${limits.maxImagePixels}-pixel limit; ask for a smaller aspect ratio`)
    }
    if (code === 'IMAGE_TOO_LARGE') {
      throw new Error(`the generated image is too large to store (${result.data.length} bytes); ask for a simpler picture`)
    }
    if (code === 'UNSUPPORTED_IMAGE_TYPE') {
      throw new Error(`the deployment does not store ${result.mediaType} images`)
    }
    throw error
  }
}

/**
 * Register the tool when the host exposes a tool registry. Returns the tool name
 * on success and '' when the registry is absent (an older host).
 * @param {any} ctx plugin context
 * @param {{ getConfig: Function, getSession: Function, getAttachments?: Function, logger?: any }} deps
 */
export function applyGenerateImageTool(ctx, deps) {
  const tools = (ctx && (ctx.tools || (typeof ctx.get === 'function' ? ctx.get('tools') : null))) || null
  if (!tools || typeof tools.register !== 'function') return ''
  const getAttachments = deps.getAttachments
    || (() => (typeof ctx.get === 'function' ? ctx.get('attachments') : null))
  tools.register(createGenerateImageTool({ ...deps, ctx, getAttachments }))
  return GENERATE_IMAGE_TOOL
}
