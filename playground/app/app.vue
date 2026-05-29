<template>
  <Body class="bg-volcano-bg">
    <div class="flex min-h-screen flex-col text-volcano-text font-[Inter,system-ui,sans-serif]">
      <!-- Header -->
      <header class="border-b border-volcano-border">
        <div class="mx-auto max-w-3xl flex items-center justify-between px-6 py-4">
          <NuxtLink
            to="/"
            class="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span class="text-2xl">🌋</span>
            <span>nuxt-volcano</span>
          </NuxtLink>
          <nav class="flex gap-1">
            <NuxtLink
              to="/"
              class="rounded-lg px-3 py-1.5 text-sm text-volcano-text-muted transition hover:bg-volcano-surface hover:text-volcano-text"
              active-class="!bg-volcano-accent-glow !text-volcano-accent"
            >
              Simple
            </NuxtLink>
            <NuxtLink
              to="/chat"
              class="rounded-lg px-3 py-1.5 text-sm text-volcano-text-muted transition hover:bg-volcano-surface hover:text-volcano-text"
              active-class="!bg-volcano-accent-glow !text-volcano-accent"
            >
              Chat
            </NuxtLink>
          </nav>
        </div>
      </header>

      <!-- Main -->
      <main class="mx-auto max-w-3xl flex-1 px-6 py-10 h-screen">
        <NuxtPage />
      </main>

      <!-- Footer -->
      <footer class="border-t border-volcano-border">
        <div class="mx-auto max-w-3xl px-6 py-6 text-center text-xs text-volcano-text-muted">
          Built with
          <a
            href="https://volcano.dev"
            target="_blank"
            class="text-volcano-accent hover:underline"
          >Volcano Agent SDK</a>
          &amp;
          <a
            href="https://nuxt.com"
            target="_blank"
            class="text-volcano-accent hover:underline"
          >Nuxt</a>
        </div>
      </footer>
    </div>
  </Body>
</template>
