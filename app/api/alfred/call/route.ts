import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import Anthropic from '@anthropic-ai/sdk'
import twilio from 'twilio'
import { sanitizeString, validateRequired, validatePhoneNumber } from '@/lib/sanitize'
import { getClientIp, rateLimit } from '@/lib/ratelimit'
import { logRateLimitExceeded, logValidationError } from '@/lib/logger'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER!

function isValidAustralianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '')
  return /^(\+61|0)[2-9]\d{8}$/.test(cleaned)
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)

  const { success } = rateLimit(ip, 20, 60000)
  if (!success) {
    logRateLimitExceeded('/api/alfred/call', ip)
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const { jobId, clientName, clientPhone, suburb, callType, tradieConfigId, tradieName = 'your business' } = await req.json()

  const validationError = validateRequired({ jobId, clientName, clientPhone }, ['jobId', 'clientName', 'clientPhone'])
  if (validationError) {
    logValidationError('/api/alfred/call', ip, 'required', validationError)
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  if (!isValidAustralianPhone(clientPhone)) {
    logValidationError('/api/alfred/call', ip, 'clientPhone', 'Invalid Australian phone number')
    return NextResponse.json(
      { error: 'Invalid phone number' },
      { status: 400 }
    )
  }

  try {
    // STEP 1: Claude writes the call script
    const scriptRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are ALFRED, calling on behalf of ${tradieName} (Australian tradie).
Write a SHORT, natural voicemail/call script for this situation:

Client: ${clientName}
Job: ${suburb}
Call type: ${callType || 'general update'}

Rules:
- Max 3 sentences
- Friendly, professional Australian tone
- End with: "Give ${tradieName} a call back on this number if you need anything. Cheers."
- NO robotic language — sound like a real person calling
- Don't say "I am an AI"

Just write the script, no labels or preamble.`
      }]
    })

    const script = scriptRes.content[0].type === 'text'
      ? scriptRes.content[0].text.trim()
      : `Hey ${clientName}, it's ${tradieName}'s team calling about your job in ${suburb}.
         Just wanted to touch base. Give ${tradieName} a call back if you need anything. Cheers.`

    // STEP 2: Make the call via Twilio with TTS
    const call = await twilioClient.calls.create({
      to: clientPhone,
      from: TWILIO_NUMBER,
      twiml: `<Response>
        <Say voice="Polly.Matthew-Neural" language="en-AU">
          ${script.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </Say>
        <Pause length="1"/>
        <Say voice="Polly.Matthew-Neural" language="en-AU">
          You can call back on this number anytime. Cheers.
        </Say>
      </Response>`,
    })

    // STEP 3: Log to Milestone Log
    if (process.env.NOTION_MILESTONE_LOG_DB_ID) {
      await notion.pages.create({
        parent: { database_id: process.env.NOTION_MILESTONE_LOG_DB_ID },
        properties: {
          'Title': {
            title: [{ text: { content: `Call made — ${clientName}` } }]
          },
          'Job ID': {
            rich_text: [{ text: { content: jobId ?? '' } }]
          },
          'Description': {
            rich_text: [{ text: { content:
              `ALFRED called ${clientName} (${clientPhone}). Script: "${script}"`
            } }]
          },
          'Milestone Type': { select: { name: 'PHASE_COMPLETE' } },
          'Logged By': { select: { name: 'ALFRED' } },
          'Client Notified': { checkbox: true }
        }
      }).catch(() => {}) // non-fatal
    }

    return NextResponse.json({
      success: true,
      callSid: call.sid,
      script
    })

  } catch (error: any) {
    console.error('Call error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
