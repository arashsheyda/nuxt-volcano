import { ref, shallowRef, readonly, triggerRef } from '#imports'
import type { Ref } from '#imports'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface UseVolcanoChatOptions {
  /**
   * API endpoint to send prompts to.
   * @default '/api/agent'
   */
  api?: string

  /**
   * Enable SSE streaming for real-time token display.
   * Requires a server endpoint using `defineVolcanoStreamHandler()`.
   * @default false
   */
  stream?: boolean

  /**
   * Initial system-level messages to prepend.
   */
  initialMessages?: ChatMessage[]

  /**
   * Callback fired on each streamed token.
   */
  onToken?: (token: string) => void

  /**
   * Callback fired when a response completes.
   */
  onFinish?: (message: ChatMessage) => void

  /**
   * Callback fired on error.
   */
  onError?: (error: Error) => void

  /**
   * Additional body fields to send with every request.
   */
  body?: Record<string, unknown>

  /**
   * Additional headers to send with every request.
   */
  headers?: Record<string, string>
}

export function useVolcanoChat(options: UseVolcanoChatOptions = {}) {
  const {
    api = '/api/agent',
    stream = false,
    initialMessages = [],
    onToken,
    onFinish,
    onError,
    body: extraBody,
    headers: extraHeaders,
  } = options

  // Use shallowRef for messages to avoid deep reactivity on large arrays
  const messages = shallowRef([...initialMessages])
  const input = ref('')
  const isLoading = ref(false)
  const error: Ref<Error | null> = ref(null)

  let abortController: AbortController | null = null

  function updateLastMessage(content: string) {
    const msgs = messages.value
    msgs[msgs.length - 1] = { role: 'assistant', content }
    triggerRef(messages)
  }

  async function send(content?: string) {
    const prompt = content ?? input.value
    if (!prompt.trim()) return

    const userMessage: ChatMessage = { role: 'user', content: prompt }
    messages.value = [...messages.value, userMessage, { role: 'assistant', content: '' }]
    input.value = ''
    isLoading.value = true
    error.value = null

    abortController = new AbortController()

    try {
      let finalContent: string
      if (stream) {
        finalContent = await handleStream(prompt, abortController.signal)
      }
      else {
        finalContent = await handleFetch(prompt, abortController.signal)
      }
      onFinish?.({ role: 'assistant', content: finalContent })
    }
    catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return
      const e = err instanceof Error ? err : new Error(String(err))
      error.value = e
      onError?.(e)
      updateLastMessage(`Error: ${e.message}`)
    }
    finally {
      isLoading.value = false
      abortController = null
    }
  }

  async function handleFetch(prompt: string, signal: AbortSignal): Promise<string> {
    const response = await $fetch<{ output: string }>(api, {
      method: 'POST',
      body: { prompt, ...extraBody },
      headers: extraHeaders,
      signal,
    })

    const content = response.output ?? ''
    updateLastMessage(content)
    return content
  }

  async function handleStream(prompt: string, signal: AbortSignal): Promise<string> {
    const response = await fetch(api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...extraHeaders,
      },
      body: JSON.stringify({ prompt, ...extraBody }),
      signal,
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''
    let accumulated = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          if (parsed.error) {
            throw new Error(parsed.error)
          }
          if (parsed.token) {
            accumulated += parsed.token
            onToken?.(parsed.token)
            updateLastMessage(accumulated)
          }
        }
        catch (e) {
          if (e instanceof Error && e.message !== data) throw e
          // Plain text fallback
          accumulated += data
          onToken?.(data)
          updateLastMessage(accumulated)
        }
      }
    }

    return accumulated
  }

  function stop() {
    abortController?.abort()
    isLoading.value = false
  }

  function clear() {
    messages.value = [...initialMessages]
    error.value = null
  }

  function setMessages(newMessages: ChatMessage[]) {
    messages.value = [...newMessages]
  }

  return {
    messages: readonly(messages) as Readonly<Ref<ChatMessage[]>>,
    input,
    isLoading: readonly(isLoading),
    error: readonly(error) as Readonly<Ref<Error | null>>,
    send,
    stop,
    clear,
    setMessages,
  }
}
