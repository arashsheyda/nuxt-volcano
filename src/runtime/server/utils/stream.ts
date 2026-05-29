import type { EventHandler, H3Event } from 'h3'
import { defineEventHandler, createError, getHeader, readBody, setResponseHeader } from '#imports'

interface VolcanoStreamOptions {
  /**
   * Build and run a Volcano agent, using the provided callbacks to stream tokens.
   * Return the final result string (or void if streaming handles everything).
   */
  handler: (event: H3Event, options: {
    prompt: string
    onToken: (token: string) => void
  }) => Promise<string | undefined>

  /**
   * Custom body validation / prompt extraction.
   * Return the prompt string or throw an error.
   * @default extracts `body.prompt` as a string
   */
  extractPrompt?: (event: H3Event) => Promise<string>
}

/**
 * Define a Nitro event handler that runs a Volcano agent and streams tokens via SSE.
 *
 * Supports both JSON and SSE responses based on the `Accept` header:
 * - `Accept: text/event-stream` → SSE stream with `data: {"token":"..."}` frames
 * - Otherwise → JSON `{ output: "..." }`
 *
 * Usage:
 * ```ts
 * // server/api/chat.post.ts
 * export default defineVolcanoStreamHandler({
 *   async handler(event, { prompt, onToken }) {
 *     const agent = useVolcanoAgent()
 *     const results = await agent
 *       .then({ prompt, onToken })
 *       .run()
 *     return results[0]?.llmOutput ?? ''
 *   }
 * })
 * ```
 */
export function defineVolcanoStreamHandler(options: VolcanoStreamOptions): EventHandler {
  return defineEventHandler(async (event: H3Event) => {
    let prompt: string

    if (options.extractPrompt) {
      prompt = await options.extractPrompt(event)
    }
    else {
      const body = await readBody(event)
      prompt = body?.prompt
      if (!prompt || typeof prompt !== 'string') {
        throw createError({ statusCode: 400, statusMessage: 'Missing or invalid "prompt" field in request body' })
      }
    }

    // Check if client wants streaming
    const acceptHeader = getHeader(event, 'accept') ?? ''
    const wantsStream = acceptHeader.includes('text/event-stream')

    if (!wantsStream) {
      // Non-streaming: run and return JSON
      let accumulated = ''
      const result = await options.handler(event, {
        prompt,
        onToken: (token) => { accumulated += token },
      })
      return { output: result ?? accumulated }
    }

    // SSE streaming
    setResponseHeader(event, 'content-type', 'text/event-stream')
    setResponseHeader(event, 'cache-control', 'no-cache')
    setResponseHeader(event, 'connection', 'keep-alive')

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await options.handler(event, {
            prompt,
            onToken: (token) => {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
            },
          })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        }
        catch (err) {
          const message = err instanceof Error ? err.message : 'Internal error'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`))
        }
        finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  })
}
