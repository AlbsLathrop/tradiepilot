import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:alberto@tradiepilot.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { title, body, url, tradieConfigId } = await req.json()

    const payload = JSON.stringify({ title, body, url })

    // TODO: look up subscription by tradieConfigId
    // For now, send to all subscriptions
    // const subscriptions = getSubscriptionsFromNotion(tradieConfigId)
    // for (const sub of subscriptions) {
    //   await webpush.sendNotification(sub, payload)
    // }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push send error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
