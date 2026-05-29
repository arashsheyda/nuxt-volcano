export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const prompt = body?.prompt

  if (!prompt || typeof prompt !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing prompt' })
  }

  const myAgent = useVolcanoAgent()

  const results = await myAgent
    .then({ prompt })
    .run()

  return {
    output: results[0]?.llmOutput ?? '',
    durationMs: results[0]?.durationMs,
  }
})
