import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: [
    '../src/module',
  ],

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/tailwind.css'],

  compatibilityDate: 'latest',

  vite: {
    plugins: [tailwindcss()],
  },

  volcano: {
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
    hideProgress: true,
  },
})
