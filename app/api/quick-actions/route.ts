import { NextRequest, NextResponse } from 'next/server'
import { sendSMS } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, jobId, clientName, clientPhone, businessName, service } = body

    if (action === 'SHARE_STATUS') {
      if (!clientPhone) {
        return NextResponse.json(
          { error: 'Client phone number not available' },
          { status: 400 }
        )
      }

      const jobIdNoDashes = jobId.replace(/-/g, '')
      const statusUrl = `https://tradiepilot.vercel.app/status/${jobIdNoDashes}`
      const message = `Hi ${clientName}, here's a live update on your ${service} job: ${statusUrl} — ${businessName}`

      await sendSMS(clientPhone, message)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[quick-actions] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    )
  }
}
