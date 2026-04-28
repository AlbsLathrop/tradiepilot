import { NextRequest, NextResponse } from 'next/server'

const subscriptions: Array<any> = []

export async function POST(req: NextRequest) {
  try {
    const subscription = await req.json()
    subscriptions.push(subscription)
    // TODO: store in Notion Tradie Config
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({ count: subscriptions.length })
}
