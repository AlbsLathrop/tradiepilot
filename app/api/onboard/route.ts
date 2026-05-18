import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import Anthropic from '@anthropic-ai/sdk'
import { client as twilioClient } from '@/lib/twilio'
import { NOTION_DB } from '@/lib/constants'
import { sanitizeString, validateEmail, validatePhoneNumber, validateRequired } from '@/lib/sanitize'
import { getClientIp, rateLimit } from '@/lib/ratelimit'

export const dynamic = 'force-dynamic'

const notion = new Client({ auth: process.env.NOTION_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface OnboardRequest {
  businessName: string
  tradieNname: string
  tradeType: string
  email: string
  phone: string
  serviceArea: string
  servicesOffered: string
  minJobValue: number
}

interface OnboardResponse {
  success: boolean
  tradieId?: string
  notionPageId?: string
  twilioNumber?: string
  message: string
  error?: string
}

/**
 * Generate a Tradie ID slug from business name
 * e.g. "Ben's Stonework" -> "bens-stonework"
 */
function generateTradieId(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars except spaces
    .trim()
    .replace(/\s+/g, '-') // Spaces to hyphens
}

/**
 * Step 1: Create Notion Tradie Config page
 */
async function createNotionTradieConfig(data: OnboardRequest, tradieId: string) {
  try {
    const page = await notion.pages.create({
      parent: { database_id: NOTION_DB.CONFIG },
      properties: {
        'Business Name': {
          title: [{ text: { content: data.businessName } }],
        },
        'Tradie Name': {
          rich_text: [{ text: { content: data.tradieNname } }],
        },
        'Email': {
          email: data.email,
        },
        'Phone': {
          phone_number: data.phone,
        },
        'Service Area': {
          rich_text: [{ text: { content: data.serviceArea } }],
        },
        'Services Offered': {
          rich_text: [{ text: { content: `${data.tradeType} — ${data.servicesOffered}` } }],
        },
        'Min Job Value (AUD)': {
          number: data.minJobValue,
        },
        'Tradie ID': {
          rich_text: [{ text: { content: tradieId } }],
        },
        'Active': {
          checkbox: true,
        },
        'Date Onboarded': {
          date: { start: new Date().toISOString().split('T')[0] },
        },
        'Package': {
          select: { name: 'Starter' },
        },
      },
    })

    return { pageId: page.id }
  } catch (error) {
    console.error('[onboard] Error creating Notion page:', error)
    throw new Error('Failed to create Notion tradie config')
  }
}

/**
 * Step 2: Purchase Twilio phone number
 */
async function purchaseTwilioNumber() {
  try {
    // Search for available Australian numbers
    const available = await twilioClient.availablePhoneNumbers('AU')
      .local
      .list({ limit: 1 })

    if (!available || available.length === 0) {
      console.warn('[onboard] No available Twilio numbers found')
      return { number: null, error: 'No numbers available' }
    }

    // Purchase the first available number
    const purchased = await twilioClient.incomingPhoneNumbers
      .create({ phoneNumber: available[0].phoneNumber })

    return { number: purchased.phoneNumber }
  } catch (error) {
    console.error('[onboard] Twilio purchase error:', error)
    return { number: null, error: String(error) }
  }
}

/**
 * Step 3: Update Notion with Twilio number
 */
async function updateNotionWithTwilioNumber(pageId: string, twilioNumber: string | null) {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Twilio Number': {
          rich_text: [{ text: { content: twilioNumber || 'PENDING - manual setup needed' } }],
        },
      },
    })
  } catch (error) {
    console.error('[onboard] Error updating Twilio number in Notion:', error)
  }
}

/**
 * Step 4: Generate LUNA prompt via Claude Sonnet
 */
async function generateLunaPrompt(data: OnboardRequest): Promise<string> {
  try {
    const systemPrompt = `You are generating a customized AI agent prompt for an Australian tradie business.
Generate a LUNA lead qualification prompt for:
- Business: ${data.businessName}
- Trade: ${data.tradeType}
- Area: ${data.serviceArea}
- Services: ${data.servicesOffered}
- Min job value: $${data.minJobValue}

The prompt should instruct LUNA to:
1. Respond warmly and professionally to inbound leads in Australian English (casual but professional)
2. Qualify leads by checking if job is in their service area and meets minimum value
3. Collect: job description, location, timeline, budget
4. Disqualify politely if under minimum value or outside area
5. Book a quote if qualified

Return ONLY the prompt text, no preamble.`

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: systemPrompt,
        },
      ],
    })

    const lunaPrompt = message.content[0].type === 'text' ? message.content[0].text : ''
    return lunaPrompt
  } catch (error) {
    console.error('[onboard] Error generating LUNA prompt:', error)
    throw new Error('Failed to generate LUNA prompt')
  }
}

/**
 * Step 5: Update Notion with LUNA prompt
 */
async function updateNotionWithLunaPrompt(pageId: string, lunaPrompt: string) {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        'LUNA Prompt': {
          rich_text: [{ text: { content: lunaPrompt } }],
        },
      },
    })
  } catch (error) {
    console.error('[onboard] Error updating LUNA prompt in Notion:', error)
  }
}

/**
 * Step 6: Send welcome SMS
 */
async function sendWelcomeSMS(to: string, tradieName: string, email: string) {
  try {
    const fromNumber = process.env.TWILIO_PHONE_NUMBER || '+61468072974'
    const message = `Hi ${tradieName}! 🎉 Your TradieFlow account is live.

Login: tradiepilot.vercel.app
Email: ${email}

Your AI assistant LUNA is ready to handle leads 24/7. Reply to this number anytime if you need help. — TradieFlow Team`

    await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to,
    })

    return { success: true }
  } catch (error) {
    console.error('[onboard] Error sending SMS:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Step 7: Send welcome email via Resend (if API key exists)
 */
async function sendWelcomeEmail(
  email: string,
  businessName: string,
  tradieName: string,
  serviceArea: string,
  servicesOffered: string
) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.log('[onboard] Skipping email: RESEND_API_KEY not configured')
    return { success: true, skipped: true }
  }

  try {
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #111827; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; }
    .cta { background: #F97316; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 12px; }
    .details { background: white; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #F97316; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your TradieFlow Account is Ready!</h1>
    </div>
    <div class="content">
      <p>Hi ${tradieName},</p>
      <p>Welcome to TradieFlow! Your account is now live and ready to start managing leads automatically.</p>

      <div class="details">
        <strong>Your Account Details:</strong>
        <ul style="margin-top: 12px;">
          <li><strong>Business:</strong> ${businessName}</li>
          <li><strong>Service Area:</strong> ${serviceArea}</li>
          <li><strong>Services:</strong> ${servicesOffered}</li>
        </ul>
      </div>

      <h3>What's Next?</h3>
      <p><strong>LUNA is already active</strong> and will handle your leads 24/7. When leads come in, LUNA will:</p>
      <ul>
        <li>Qualify leads based on your service area and minimum job value</li>
        <li>Collect job details and timeline</li>
        <li>Book quotes automatically for qualified leads</li>
        <li>Send you SMS updates</li>
      </ul>

      <a href="https://tradiepilot.vercel.app" class="cta">Login to Dashboard</a>

      <p style="margin-top: 20px; color: #666; font-size: 14px;">
        <strong>Need Help?</strong> Reply to this email anytime and we'll get back to you.
      </p>

      <p style="margin-top: 20px; color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 12px;">
        © TradieFlow. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'TradieFlow <hello@tradiepilot.vercel.app>',
        to: email,
        subject: 'Your TradieFlow account is ready 🚀',
        html: htmlBody,
      }),
    })

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`)
    }

    return { success: true }
  } catch (error) {
    console.error('[onboard] Error sending email via Resend:', error)
    // Don't block the flow if email fails
    return { success: false, error: String(error) }
  }
}

/**
 * Main onboard endpoint
 */
export async function POST(req: NextRequest): Promise<NextResponse<OnboardResponse>> {
  const ip = getClientIp(req.headers)

  // Rate limit: 5 requests per minute per IP
  const { success } = rateLimit(ip, 5, 60000)
  if (!success) {
    console.warn('[onboard] Rate limit exceeded:', ip)
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = (await req.json()) as OnboardRequest

    // Validate required fields
    const validationError = validateRequired(body, [
      'businessName',
      'tradieNname',
      'tradeType',
      'email',
      'phone',
      'serviceArea',
      'servicesOffered',
      'minJobValue',
    ])

    if (validationError) {
      return NextResponse.json(
        { success: false, message: validationError },
        { status: 400 }
      )
    }

    // Validate email and phone
    if (!validateEmail(body.email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      )
    }

    if (!validatePhoneNumber(body.phone)) {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number' },
        { status: 400 }
      )
    }

    if (typeof body.minJobValue !== 'number' || body.minJobValue < 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid minimum job value' },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitized = {
      businessName: sanitizeString(body.businessName, 200),
      tradieNname: sanitizeString(body.tradieNname, 200),
      tradeType: sanitizeString(body.tradeType, 100),
      email: body.email.toLowerCase().trim(),
      phone: body.phone,
      serviceArea: sanitizeString(body.serviceArea, 500),
      servicesOffered: sanitizeString(body.servicesOffered, 1000),
      minJobValue: body.minJobValue,
    }

    // Generate Tradie ID
    const tradieId = generateTradieId(sanitized.businessName)

    // STEP 1: Create Notion Tradie Config page
    console.log('[onboard] Creating Notion tradie config:', { tradieId })
    const notionResult = await createNotionTradieConfig(sanitized, tradieId)

    // STEP 2: Purchase Twilio number (non-blocking)
    console.log('[onboard] Purchasing Twilio number...')
    const twilioResult = await purchaseTwilioNumber()
    if (twilioResult.error) {
      console.warn('[onboard] Twilio purchase failed:', twilioResult.error)
    }

    // STEP 3: Update Notion with Twilio number
    await updateNotionWithTwilioNumber(notionResult.pageId, twilioResult.number)

    // STEP 4: Generate LUNA prompt
    console.log('[onboard] Generating LUNA prompt...')
    const lunaPrompt = await generateLunaPrompt(sanitized)

    // STEP 5: Update Notion with LUNA prompt
    await updateNotionWithLunaPrompt(notionResult.pageId, lunaPrompt)

    // STEP 6: Send welcome SMS
    console.log('[onboard] Sending welcome SMS...')
    const smsResult = await sendWelcomeSMS(sanitized.phone, sanitized.tradieNname, sanitized.email)
    if (!smsResult.success) {
      console.warn('[onboard] SMS sending failed:', smsResult.error)
    }

    // STEP 7: Send welcome email (optional, doesn't block)
    console.log('[onboard] Sending welcome email...')
    await sendWelcomeEmail(
      sanitized.email,
      sanitized.businessName,
      sanitized.tradieNname,
      sanitized.serviceArea,
      sanitized.servicesOffered
    )

    // Success response
    console.log('[onboard] Onboarding completed successfully:', { tradieId, pageId: notionResult.pageId })
    return NextResponse.json(
      {
        success: true,
        tradieId,
        notionPageId: notionResult.pageId,
        twilioNumber: twilioResult.number,
        message: 'Account created successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[onboard] Fatal error:', errorMessage)
    return NextResponse.json(
      {
        success: false,
        message: 'Something went wrong during onboarding. Please try again.',
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
