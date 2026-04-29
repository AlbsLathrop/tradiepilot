import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import Anthropic from '@anthropic-ai/sdk'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MILESTONE_DB_ID = process.env.NOTION_MILESTONE_LOG_DB_ID!

// Map action → Milestone Type
const ACTION_TO_MILESTONE: Record<string, string> = {
  'STARTING TODAY': 'JOB_STARTED',
  'ON THE WAY': 'JOB_STARTED',
  'RUNNING LATE': 'ISSUE_FOUND',
  'PHASE DONE': 'PHASE_COMPLETE',
  'NEED DECISION': 'ISSUE_FOUND',
  'DAY DONE': 'PHASE_COMPLETE',
  'JOB COMPLETE': 'JOB_COMPLETE',
  'VARIATION REQUEST': 'VARIATION_APPROVED',
}

export async function POST(req: NextRequest) {
  const { action, jobId, clientName, suburb, tradieConfigId } = await req.json()

  try {
    const sydneyHour = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' })
    ).getHours()

    // Check dark hours (before 7am or at/after 8pm)
    if (sydneyHour < 7 || sydneyHour >= 20) {
      // Still log to Milestone Log but DON'T send any outbound actions
      const prompt = `You are ALFRED, an AI assistant for Australian tradies.
Joey (the tradie) just tapped: "${action}" for the job: ${clientName} in ${suburb}.

Write a SHORT, practical milestone log entry (1-2 sentences max).
Be specific and professional. Use Australian English.

Just write the description, no preamble.`

      const claudeRes = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }]
      })

      const description = claudeRes.content[0].type === 'text'
        ? claudeRes.content[0].text.trim()
        : `Joey tapped: ${action}`

      await notion.pages.create({
        parent: { database_id: MILESTONE_DB_ID },
        properties: {
          'Title': {
            title: [{ text: { content: `${action} — ${clientName}` } }]
          },
          'Job ID': {
            rich_text: [{ text: { content: jobId } }]
          },
          'Description': {
            rich_text: [{ text: { content: description } }]
          },
          'Milestone Type': {
            select: { name: ACTION_TO_MILESTONE[action] ?? 'PHASE_COMPLETE' }
          },
          'Logged By': {
            select: { name: 'Joey' }
          },
          'Client Notified': {
            checkbox: false
          }
        }
      })

      return NextResponse.json({
        success: true,
        description: '(Logged - dark hours, no notifications sent)',
        warning: `Dark hours active (${sydneyHour}:00 Sydney time). Action logged but no SMS/calls sent. Will show in Job Log.`,
        darkHours: true
      })
    }

    // STEP 1: Ask Claude to write a milestone description
    const prompt = `You are ALFRED, an AI assistant for Australian tradies.
Joey (the tradie) just tapped: "${action}" for the job: ${clientName} in ${suburb}.

Write a SHORT, practical milestone log entry (1-2 sentences max).
Be specific and professional. Use Australian English.
Examples:
- "STARTING TODAY" → "Joey commenced work on site today."
- "PHASE DONE" → "Current phase completed. Moving to next stage."
- "RUNNING LATE" → "Joey running behind schedule today. Client may need to be notified."
- "JOB COMPLETE" → "Job marked complete by Joey. Ready for invoice."

Just write the description, no preamble.`

    const claudeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }]
    })

    const description = claudeRes.content[0].type === 'text'
      ? claudeRes.content[0].text.trim()
      : `Joey tapped: ${action}`

    // STEP 2: Write to Milestone Log in Notion
    await notion.pages.create({
      parent: { database_id: MILESTONE_DB_ID },
      properties: {
        'Title': {
          title: [{ text: { content: `${action} — ${clientName}` } }]
        },
        'Job ID': {
          rich_text: [{ text: { content: jobId } }]
        },
        'Description': {
          rich_text: [{ text: { content: description } }]
        },
        'Milestone Type': {
          select: { name: ACTION_TO_MILESTONE[action] ?? 'PHASE_COMPLETE' }
        },
        'Logged By': {
          select: { name: 'Joey' }
        },
        'Client Notified': {
          checkbox: false
        }
      }
    })

    return NextResponse.json({ success: true, description, darkHours: false })
  } catch (error: any) {
    console.error('Action error:', error?.message)
    return NextResponse.json({
      success: false,
      error: error?.message
    }, { status: 500 })
  }
}
