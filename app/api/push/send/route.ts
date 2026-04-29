import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { sanitizeString, validateRequired } from '@/lib/sanitize'
import { getClientIp, rateLimit } from '@/lib/ratelimit'
import { logAuthFailure, logRateLimitExceeded, logValidationError } from '@/lib/logger'

webpush.setVapidDetails(
  'mailto:alberto@tradiepilot.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)

  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.WEBHOOK_SECRET
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    logAuthFailure('/api/push/send', ip, 'missing or invalid webhook secret')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { success } = rateLimit(ip, 10, 60000)
  if (!success) {
    logRateLimitExceeded('/api/push/send', ip)
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { title, body: bodyText, url, tradieConfigId } = body

    const validationError = validateRequired(body, ['title', 'body', 'tradieConfigId'])
    if (validationError) {
      logValidationError('/api/push/send', ip, 'required', validationError)
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    if (typeof title !== 'string' || typeof bodyText !== 'string') {
      logValidationError('/api/push/send', ip, 'type', 'Invalid title or body type')
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const cleanTitle = sanitizeString(title, 100)
    const cleanBody = sanitizeString(bodyText, 500)
    const cleanUrl = typeof url === 'string' ? sanitizeString(url, 500) : ''

    const payload = JSON.stringify({ title: cleanTitle, body: cleanBody, url: cleanUrl })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
