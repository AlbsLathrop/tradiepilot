# Twilio Patterns — TradiePilot
Sender: +61468072974 | Test: +61402163749 (Alberto only)

## SEND SMS
const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
await client.messages.create({ from: process.env.TWILIO_PHONE!, to, body })

## INBOUND WEBHOOK (app/api/luna/inbound/route.ts)
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const from = formData.get('From') as string
  const body = formData.get('Body') as string
  const params = Object.fromEntries(formData.entries()) as Record<string,string>
  const valid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    req.headers.get('x-twilio-signature') ?? '',
    process.env.NEXTAUTH_URL + '/api/luna/inbound',
    params
  )
  if (!valid && process.env.NODE_ENV === 'production') {
    return new Response('Forbidden', { status: 403 })
  }
  return new Response('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' }
  })
}

## ORBIT statuses that trigger SMS
['SCHEDULED','IN PROGRESS','RUNNING LATE','DAY DONE','COMPLETE','INVOICED']
Templates in /lib/constants.ts → ORBIT_MESSAGES
