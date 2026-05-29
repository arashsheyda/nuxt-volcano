import {
  agent,
  llmOpenAI,
  llmAnthropic,
  llmMistral,
  llmLlama,
  llmBedrock,
  llmVertexStudio,
  llmAzure,
  mcp,
  mcpStdio,
} from '@volcano.dev/agent'
import type {
  LLMHandle,
  MCPHandle,
  MCPAuthConfig,
  MCPStdioConfig,
  RetryConfig,
  AgentBuilder,
  AgentResults,
  Step,
  StepResult,
  StreamOptions,
  TokenMetadata,
  ToolDefinition,
  LLMToolResult,
  VolcanoErrorMeta,
} from '@volcano.dev/agent'
import { useRuntimeConfig } from '#imports'

export type {
  LLMHandle,
  MCPHandle,
  MCPAuthConfig,
  MCPStdioConfig,
  RetryConfig,
  AgentBuilder,
  AgentResults,
  Step,
  StepResult,
  StreamOptions,
  TokenMetadata,
  ToolDefinition,
  LLMToolResult,
  VolcanoErrorMeta,
}
export { agent, mcp, mcpStdio }

type ProviderName = 'openai' | 'anthropic' | 'mistral' | 'llama' | 'bedrock' | 'vertex' | 'azure'

const API_KEY_ENV_MAP: Record<string, string> = {
  openai: 'NUXT_VOLCANO_OPENAI_API_KEY',
  anthropic: 'NUXT_VOLCANO_ANTHROPIC_API_KEY',
  mistral: 'NUXT_VOLCANO_MISTRAL_API_KEY',
  vertex: 'NUXT_VOLCANO_VERTEX_API_KEY',
  azure: 'NUXT_VOLCANO_AZURE_API_KEY',
  bedrock: 'NUXT_VOLCANO_BEDROCK_ACCESS_KEY_ID',
}

function requireKey(provider: string, key: string | undefined): string {
  if (!key) {
    const envVar = API_KEY_ENV_MAP[provider] ?? `NUXT_VOLCANO_${provider.toUpperCase()}_API_KEY`
    throw new Error(`[nuxt-volcano] ${provider} API key is not configured. Set the ${envVar} environment variable.`)
  }
  return key
}

/**
 * Create an LLM handle from the module's runtime config.
 * Uses the configured default provider/model, or accepts overrides.
 */
export function useVolcanoLLM(overrides?: {
  provider?: ProviderName
  model?: string
  apiKey?: string
  baseURL?: string
}): LLMHandle {
  const config = useRuntimeConfig().volcano

  const provider = overrides?.provider || config.defaultProvider || 'openai'
  const model = overrides?.model || config.defaultModel

  switch (provider) {
    case 'openai':
      return llmOpenAI({
        apiKey: requireKey('openai', overrides?.apiKey || config.openaiApiKey),
        model: model || 'gpt-4o-mini',
        ...(overrides?.baseURL && { baseURL: overrides.baseURL }),
      })

    case 'anthropic':
      return llmAnthropic({
        apiKey: requireKey('anthropic', overrides?.apiKey || config.anthropicApiKey),
        model: model || 'claude-3-5-sonnet-20241022',
        ...(overrides?.baseURL && { baseURL: overrides.baseURL }),
      })

    case 'mistral':
      return llmMistral({
        apiKey: requireKey('mistral', overrides?.apiKey || config.mistralApiKey),
        model: model || 'mistral-small-latest',
        ...(overrides?.baseURL && { baseURL: overrides.baseURL }),
      })

    case 'llama':
      return llmLlama({
        model: model || 'llama3.2:3b',
        baseURL: overrides?.baseURL || 'http://127.0.0.1:11434',
        ...(overrides?.apiKey && { apiKey: overrides.apiKey }),
      })

    case 'bedrock':
      return llmBedrock({
        model: model || 'anthropic.claude-3-sonnet-20240229-v1:0',
        region: config.bedrockRegion || 'us-east-1',
        ...(config.bedrockAccessKeyId && {
          accessKeyId: config.bedrockAccessKeyId,
          secretAccessKey: config.bedrockSecretAccessKey,
        }),
      })

    case 'vertex':
      return llmVertexStudio({
        apiKey: requireKey('vertex', overrides?.apiKey || config.vertexApiKey),
        model: model || 'gemini-2.0-flash-exp',
        ...(overrides?.baseURL && { baseURL: overrides.baseURL }),
      })

    case 'azure':
      return llmAzure({
        apiKey: requireKey('azure', overrides?.apiKey || config.azureApiKey),
        model: model || 'gpt-4o-mini',
        endpoint: overrides?.baseURL || config.azureEndpoint,
      })

    default:
      throw new Error(`[nuxt-volcano] Unknown provider: "${provider}". Supported: openai, anthropic, mistral, llama, bedrock, vertex, azure.`)
  }
}

/**
 * Create a pre-configured Volcano agent using the module's runtime config.
 * Merges module-level defaults with any per-call overrides.
 *
 * Accepts all AgentOptions fields. Provider/model select the LLM;
 * everything else is forwarded directly to the SDK's `agent()`.
 */
export function useVolcanoAgent(overrides?: {
  provider?: ProviderName
  model?: string
  instructions?: string
  timeout?: number
  retry?: RetryConfig
  contextMaxChars?: number
  contextMaxToolResults?: number
  maxToolIterations?: number
  disableParallelToolExecution?: boolean
  hideProgress?: boolean
  name?: string
  description?: string
}): AgentBuilder {
  const config = useRuntimeConfig().volcano
  const llm = useVolcanoLLM({
    provider: overrides?.provider,
    model: overrides?.model,
  })

  return agent({
    llm,
    instructions: overrides?.instructions ?? config.instructions,
    timeout: overrides?.timeout ?? config.timeout ?? 60,
    retry: overrides?.retry ?? config.retry,
    contextMaxChars: overrides?.contextMaxChars ?? config.contextMaxChars,
    contextMaxToolResults: overrides?.contextMaxToolResults ?? config.contextMaxToolResults,
    maxToolIterations: overrides?.maxToolIterations ?? config.maxToolIterations,
    disableParallelToolExecution: overrides?.disableParallelToolExecution ?? config.disableParallelToolExecution,
    hideProgress: overrides?.hideProgress ?? config.hideProgress,
    name: overrides?.name,
    description: overrides?.description,
  })
}
