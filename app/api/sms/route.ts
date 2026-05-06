import { NextRequest, NextResponse } from 'next/server'
import { validateRequired } from '@/lib/sanitize'

export async function POST(req: NextRequest) {
  try {
    const { to, message } = await req.json()

    const validationError = validateRequired({ to, message }, ['to', 'message'])
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    const result = await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    })

    return NextResponse.json({ success: true, messageSid: result.sid })
  } catch (error: any) {
    console.error('[POST /api/sms] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to send SMS' },
      { status: 500 }
    )
  }
}
