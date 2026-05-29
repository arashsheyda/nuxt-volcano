export default defineVolcanoStreamHandler({
  async handler(_event, { prompt, onToken }) {
    const myAgent = useVolcanoAgent()

    const results = await myAgent
      .then({ prompt, onToken })
      .run()

    return results[0]?.llmOutput ?? ''
  },
})
