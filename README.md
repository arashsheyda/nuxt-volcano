<p align="center">
  <a href="https://volcano.dev">
    <img src="https://www.volcano.dev/volcano__icn.png" alt="Volcano" width="80" />
  </a>
</p>

<h1 align="center">nuxt-volcano</h1>

<p align="center">
Nuxt module for the <a href="https://www.volcano.dev/">Volcano Agent SDK</a> — build AI agents that combine LLM reasoning with real-world actions via MCP tools.
</p>

## Features

- 🔒 **Server-side only**: API keys stay safe in runtime config
- 🔌 **Auto-imports**: `useVolcanoAgent()`, `useVolcanoLLM()`, `agent()`, and `mcp()` available in server routes
- 💬 **Client composable**: `useVolcanoChat()` for building chat UIs with streaming support
- 🌊 **SSE streaming**: `defineVolcanoStreamHandler()` streams tokens to the browser in real-time
- 🤖 **Multi-provider**: OpenAI, Anthropic, Mistral, Llama, Bedrock, Vertex, Azure
- ⚡ **Zero config**: set an API key env var and go

## Quick Setup

Install the module:

```bash
npx nuxi module add nuxt-volcano
```

Add to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['nuxt-volcano'],
  volcano: {
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
  },
})
```

Set your API key via environment variable:

```bash
NUXT_VOLCANO_OPENAI_API_KEY=sk-...
```

## Usage

### Server API Route

```ts
// server/api/agent.post.ts
export default defineEventHandler(async (event) => {
  const { prompt } = await readBody(event)

  const myAgent = useVolcanoAgent()

  const results = await myAgent
    .then({ prompt })
    .run()

  return { output: results[0]?.llmOutput }
})
```

### With MCP Tools

```ts
// server/api/research.post.ts
export default defineEventHandler(async (event) => {
  const { prompt } = await readBody(event)

  const myAgent = useVolcanoAgent()
  const webTools = mcp('http://localhost:3211/mcp')

  const results = await myAgent
    .then({ prompt, mcps: [webTools] })
    .then({ prompt: 'Summarize the findings.' })
    .run()

  return { output: results.at(-1)?.llmOutput }
})
```

### Using a Different Provider Per-Request

```ts
const agent = useVolcanoAgent({ provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' })
```

### Direct LLM Access

```ts
const llm = useVolcanoLLM({ provider: 'openai', model: 'gpt-4o' })
const response = await llm.gen('Hello!')
```

## Client-Side

### `useVolcanoChat()` Chat UI Composable

A Vue composable for building chat interfaces with optional SSE streaming:

```vue
<script setup>
const { messages, input, isLoading, error, send, stop, clear } = useVolcanoChat({
  api: '/api/chat',
  stream: true, // Enable real-time token streaming
  onToken: (token) => console.log(token),
  onFinish: (msg) => console.log('Done:', msg.content),
})
</script>

<template>
  <div v-for="msg in messages" :key="msg.content">
    <strong>{{ msg.role }}:</strong> {{ msg.content }}
  </div>
  <form @submit.prevent="send()">
    <input v-model="input" placeholder="Type a message..." />
    <button v-if="!isLoading" type="submit">Send</button>
    <button v-else type="button" @click="stop()">Stop</button>
  </form>
</template>
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `api` | `string` | `'/api/agent'` | Server endpoint URL |
| `stream` | `boolean` | `false` | Enable SSE token streaming |
| `initialMessages` | `ChatMessage[]` | `[]` | Pre-populate chat history |
| `body` | `object` | -- | Extra fields sent with every request |
| `headers` | `object` | -- | Extra headers sent with every request |
| `onToken` | `(token: string) => void` | -- | Callback per streamed token |
| `onFinish` | `(msg: ChatMessage) => void` | -- | Callback when response completes |
| `onError` | `(err: Error) => void` | -- | Callback on error |

#### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `messages` | `Ref<ChatMessage[]>` | Reactive message history |
| `input` | `Ref<string>` | Bound to your text input |
| `isLoading` | `Ref<boolean>` | True while waiting for a response |
| `error` | `Ref<Error \| null>` | Last error, if any |
| `send(content?)` | `(string?) => Promise` | Send a message (uses `input` if no arg) |
| `stop()` | `() => void` | Abort the current request |
| `clear()` | `() => void` | Reset messages to initial state |
| `setMessages()` | `(msgs) => void` | Replace message history |

### `defineVolcanoStreamHandler()` SSE Server Endpoint

A server utility that creates an endpoint supporting both JSON and SSE streaming.
Automatically detects the `Accept: text/event-stream` header:

```ts
// server/api/chat.post.ts
export default defineVolcanoStreamHandler({
  async handler(event, { prompt, onToken }) {
    const myAgent = useVolcanoAgent()
    const results = await myAgent
      .then({ prompt, onToken })
      .run()
    return results[0]?.llmOutput ?? ''
  },
})
```

- **With `stream: true`** on the client → SSE response, tokens arrive in real-time
- **Without streaming** (regular `$fetch`) → JSON response `{ output: "..." }`

## Configuration

### Module Options (`nuxt.config.ts`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultProvider` | `string` | `'openai'` | Default LLM provider |
| `defaultModel` | `string` | -- | Default model identifier |
| `instructions` | `string` | -- | Global system instructions |
| `timeout` | `number` | `60` | Default step timeout (seconds) |
| `retry` | `RetryConfig` | -- | Retry configuration |
| `contextMaxChars` | `number` | `20480` | Context size limit |
| `contextMaxToolResults` | `number` | `8` | Tool results in context |
| `maxToolIterations` | `number` | `4` | Max tool calls per step |
| `disableParallelToolExecution` | `boolean` | `false` | Force sequential tool execution |
| `hideProgress` | `boolean` | `false` | Suppress progress output |

### Environment Variables

API keys are set via `NUXT_VOLCANO_*` environment variables:

| Variable | Provider |
|----------|----------|
| `NUXT_VOLCANO_OPENAI_API_KEY` | OpenAI |
| `NUXT_VOLCANO_ANTHROPIC_API_KEY` | Anthropic |
| `NUXT_VOLCANO_MISTRAL_API_KEY` | Mistral |
| `NUXT_VOLCANO_VERTEX_API_KEY` | Google Vertex |
| `NUXT_VOLCANO_AZURE_API_KEY` | Azure AI |
| `NUXT_VOLCANO_AZURE_ENDPOINT` | Azure AI endpoint |
| `NUXT_VOLCANO_BEDROCK_ACCESS_KEY_ID` | AWS Bedrock |
| `NUXT_VOLCANO_BEDROCK_SECRET_ACCESS_KEY` | AWS Bedrock |
| `NUXT_VOLCANO_BEDROCK_REGION` | AWS Bedrock region |

## Development

```bash
# Install dependencies
pnpm install

# Develop with the playground
pnpm dev

# Run tests
pnpm test

# Build the module
pnpm prepack
```
