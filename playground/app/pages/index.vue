<template>
  <div>
    <!-- Hero -->
    <div class="mb-10 text-center">
      <h1 class="text-3xl font-bold tracking-tight">
        Simple Agent
      </h1>
      <p class="mt-2 text-volcano-text-muted">
        Send a prompt, get a response. No streaming -- just a single server round-trip.
      </p>
    </div>

    <!-- Input -->
    <form
      class="space-y-4"
      @submit.prevent="askAgent"
    >
      <div class="relative">
        <input
          v-model="prompt"
          placeholder="Ask the agent something..."
          class="w-full rounded-xl border border-volcano-border bg-volcano-surface px-4 py-3 text-sm text-volcano-text placeholder-volcano-text-muted outline-none transition focus:border-volcano-accent focus:ring-1 focus:ring-volcano-accent"
        >
      </div>
      <button
        type="submit"
        :disabled="loading"
        class="w-full cursor-pointer rounded-xl bg-volcano-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-volcano-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ loading ? 'Thinking...' : 'Send Prompt' }}
      </button>
    </form>

    <!-- Result -->
    <div
      v-if="result"
      class="mt-8 rounded-xl border border-volcano-border bg-volcano-surface p-5"
    >
      <div class="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-volcano-text-muted">
        <span class="inline-block h-2 w-2 rounded-full bg-volcano-green" />
        Response
      </div>
      <div class="whitespace-pre-wrap text-sm leading-relaxed text-volcano-text">
        {{ result }}
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="mt-4 rounded-xl border border-volcano-error/30 bg-volcano-error/10 px-4 py-3 text-sm text-volcano-error"
    >
      {{ error }}
    </div>
  </div>
</template>

<script setup>
const prompt = ref('Say hello in one short sentence.')
const result = ref('')
const loading = ref(false)
const error = ref('')

async function askAgent() {
  loading.value = true
  result.value = ''
  error.value = ''
  try {
    const data = await $fetch('/api/simple', {
      method: 'POST',
      body: { prompt: prompt.value },
    })
    result.value = data.output
  }
  catch (e) {
    error.value = e.message
  }
  finally {
    loading.value = false
  }
}
</script>
