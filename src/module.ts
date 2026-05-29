import { defineNuxtModule, addServerImportsDir, addImportsDir, createResolver } from '@nuxt/kit'
import { defu } from 'defu'
import type { RetryConfig } from '@volcano.dev/agent'

export interface ModuleOptions {
  /**
   * System-level instructions prepended to every agent prompt.
   * @default undefined
   */
  instructions?: string

  /**
   * Agent timeout in seconds. If the agent doesn't complete within this time, it will be aborted.
   * @default 60
   */
  timeout?: number

  /**
   * Retry configuration for failed LLM calls.
   * @see {@link RetryConfig}
   * @default undefined
   */
  retry?: RetryConfig

  /**
   * Maximum number of characters to include in context passed to the LLM.
   * @default 20480
   */
  contextMaxChars?: number

  /**
   * Maximum number of tool results to include in context.
   * @default 8
   */
  contextMaxToolResults?: number

  /**
   * Maximum number of tool call iterations before the agent stops.
   * @default 4
   */
  maxToolIterations?: number

  /**
   * When `true`, tool calls are executed sequentially instead of in parallel.
   * @default false
   */
  disableParallelToolExecution?: boolean

  /**
   * When `true`, suppresses progress output from the agent.
   * @default false
   */
  hideProgress?: boolean

  /**
   * Default LLM provider to use.
   * @default 'openai'
   * @example 'openai' | 'anthropic' | 'mistral' | 'llama' | 'bedrock' | 'vertex' | 'azure'
   */
  defaultProvider?: string

  /**
   * Default model to use with the configured provider.
   * Falls back to a sensible default per provider (e.g. `'gpt-4o-mini'` for OpenAI).
   * @default undefined
   */
  defaultModel?: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-volcano',
    configKey: 'volcano',
  },
  defaults: {
    timeout: 60,
    contextMaxChars: 20480,
    contextMaxToolResults: 8,
    maxToolIterations: 4,
    disableParallelToolExecution: false,
    hideProgress: false,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    const config = nuxt.options.runtimeConfig

    // Expose module options via runtime config (server-only, API keys stay safe)
    config.volcano = defu(config.volcano, {
      ...options,
      // API keys come from env variables via runtime config
      openaiApiKey: '',
      anthropicApiKey: '',
      mistralApiKey: '',
      bedrockAccessKeyId: '',
      bedrockSecretAccessKey: '',
      bedrockRegion: '',
      vertexApiKey: '',
      azureApiKey: '',
      azureEndpoint: '',
    })

    // Auto-import server composables
    addServerImportsDir(resolver.resolve('./runtime/server/utils'))

    // Auto-import client composables (useVolcanoChat)
    addImportsDir(resolver.resolve('./runtime/composables'))
  },
})
