<template>
  <div class="flex flex-col">
    <!-- Hero -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold tracking-tight">
        Streaming Chat
      </h1>
      <p class="mt-2 text-volcano-text-muted">
        Real-time token streaming via SSE -- powered by
        <code class="rounded bg-volcano-surface px-1.5 py-0.5 text-xs text-volcano-accent">useVolcanoChat()</code>
      </p>
    </div>

    <!-- Messages -->
    <div class="mb-4 flex-1 space-y-3 overflow-y-auto">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="rounded-xl border px-4 py-3"
        :class="msg.role === 'user'
          ? 'border-volcano-border bg-volcano-user ml-12'
          : 'border-volcano-border bg-volcano-assistant mr-12'"
      >
        <div class="mb-1 flex items-center gap-2">
          <span
            class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
            :class="msg.role === 'user'
              ? 'bg-volcano-accent/20 text-volcano-accent'
              : 'bg-volcano-green/20 text-volcano-green'"
          >
            {{ msg.role === 'user' ? 'U' : 'A' }}
          </span>
          <span class="text-xs font-medium uppercase tracking-wider text-volcano-text-muted">
            {{ msg.role === 'user' ? 'You' : 'Agent' }}
          </span>
        </div>
        <div class="whitespace-pre-wrap text-sm leading-relaxed text-volcano-text">
          {{ msg.content }}<span
            v-if="msg.role === 'assistant' && isLoading && i === messages.length - 1"
            class="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-volcano-accent"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="messages.length === 0"
        class="flex flex-col items-center justify-center py-20 text-volcano-text-muted"
      >
        <span class="mb-3 text-4xl">🌋</span>
        <p class="text-sm">
          Send a message to start chatting with the agent.
        </p>
      </div>
    </div>

    <!-- Input bar -->
    <form
      class="flex items-center gap-3 rounded-xl border border-volcano-border bg-volcano-surface p-2"
      @submit.prevent="send()"
    >
      <input
        v-model="input"
        placeholder="Ask the agent something..."
        class="flex-1 bg-transparent px-3 py-2 text-sm text-volcano-text placeholder-volcano-text-muted outline-none"
      >
      <button
        v-if="!isLoading"
        type="submit"
        class="cursor-pointer rounded-lg bg-volcano-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-volcano-accent-hover"
      >
        Send
      </button>
      <button
        v-else
        type="button"
        class="cursor-pointer rounded-lg border border-volcano-border bg-volcano-surface-hover px-4 py-2 text-sm font-medium text-volcano-text transition hover:border-volcano-border-hover"
        @click="stop()"
      >
        Stop
      </button>
    </form>

    <!-- Error -->
    <div
      v-if="error"
      class="mt-3 rounded-xl border border-volcano-error/30 bg-volcano-error/10 px-4 py-3 text-sm text-volcano-error"
    >
      {{ error.message }}
    </div>
  </div>
</template>

<script setup>
const { messages, input, isLoading, error, send, stop } = useVolcanoChat({
  api: '/api/agent',
  stream: true,
})
</script>
