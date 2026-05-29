import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  volcano: {
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o-mini',
  },
})
