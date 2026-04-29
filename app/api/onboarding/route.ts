import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { sanitizeString, validateRequired, validateEmail, validatePhoneNumber, validateNumber } from '@/lib/sanitize'
import { getClientIp, rateLimit } from '@/lib/ratelimit'
import { logAuthFailure, logRateLimitExceeded, logValidationError } from '@/lib/logger'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)

  const { success } = rateLimit(ip, 5, 60000)
  if (!success) {
    logRateLimitExceeded('/api/onboarding', ip)
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.WEBHOOK_SECRET
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    logAuthFailure('/api/onboarding', ip, 'missing or invalid webhook secret')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      tradieConfigId,
      businessName,
      ownerName,
      tradeType,
      serviceArea,
      minJobValue,
      twilioNumber,
      tone,
      hoursStart,
      hoursEnd,
      email,
    } = body

    const validationError = validateRequired(body, [
      'tradieConfigId',
      'businessName',
      'ownerName',
      'tradeType',
    ])
    if (validationError) {
      logValidationError('/api/onboarding', ip, 'required', validationError)
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    if (!validateEmail(email)) {
      logValidationError('/api/onboarding', ip, 'email', 'Invalid email format')
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (twilioNumber && !validatePhoneNumber(twilioNumber)) {
      logValidationError('/api/onboarding', ip, 'twilioNumber', 'Invalid phone number')
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      )
    }

    if (!validateNumber(minJobValue, 0, 1000000)) {
      logValidationError('/api/onboarding', ip, 'minJobValue', 'Invalid job value')
      return NextResponse.json(
        { error: 'Invalid minimum job value' },
        { status: 400 }
      )
    }

    const cleanTradieConfigId = sanitizeString(tradieConfigId, 100)
    const cleanBusinessName = sanitizeString(businessName, 200)
    const cleanOwnerName = sanitizeString(ownerName, 200)
    const cleanTradeType = sanitizeString(tradeType, 100)
    const cleanServiceArea = sanitizeString(serviceArea, 500)
    const cleanTone = sanitizeString(tone, 50)
    const cleanHoursStart = sanitizeString(hoursStart, 10)
    const cleanHoursEnd = sanitizeString(hoursEnd, 10)

    await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_TRADIE_CONFIG_DB_ID!,
      },
      properties: {
        'Tradie Config ID': {
          title: [{ text: { content: cleanTradieConfigId } }],
        },
        'Business Name': {
          rich_text: [{ text: { content: cleanBusinessName } }],
        },
        'Owner Name': {
          rich_text: [{ text: { content: cleanOwnerName } }],
        },
        'Trade Type': {
          rich_text: [{ text: { content: cleanTradeType } }],
        },
        'Service Area': {
          rich_text: [{ text: { content: cleanServiceArea } }],
        },
        'Min Job Value': { number: minJobValue ?? 0 },
        'Twilio Number': { phone_number: twilioNumber ?? '' },
        'Tone': { select: { name: cleanTone || 'Professional' } },
        'Hours Start': {
          rich_text: [{ text: { content: cleanHoursStart || '7:00' } }],
        },
        'Hours End': {
          rich_text: [{ text: { content: cleanHoursEnd || '17:00' } }],
        },
        'Email': { email: email },
        'Status': { select: { name: 'ACTIVE' } },
      },
    })

    return NextResponse.json({
      success: true,
      tradieConfigId: cleanTradieConfigId,
    })
  } catch (error: any) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
