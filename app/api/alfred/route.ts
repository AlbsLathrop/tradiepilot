import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, section = 'Dashboard' } = await req.json()

  const contextRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/context`)
  const { context } = await contextRes.json()

  const systemPrompt = `You are Alfred, the internal AI co-pilot for JobFlow — the operations dashboard of TradiePilot, an AI-powered communications platform for Australian tradies.

You are talking to either Alberto (co-founder, systems & tech) or Benny (co-founder, sales & client relations).

Current date/time: ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}
Current section open: ${section}

${context}

=== YOUR ROLE ===
Answer questions about the business concisely. Be direct, strategic, and data-driven.
If asked for recommendations, give them. Use bullet points and bold for clarity.
Never make up data — if you don't have it, say so.
Keep responses under 200 words unless a detailed breakdown is needed.
Respond in the same language the user writes in (English or Spanish).`

  const result = await streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    messages,
  })

  return result.toTextStreamResponse()
}
