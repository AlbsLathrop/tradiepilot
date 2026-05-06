import { getServerSession } from 'next-auth/next'
import { getTradieConfigById } from '@/lib/notion'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tradieConfigId) {
      return Response.json(
        { error: 'Missing tradieConfigId in session' },
        { status: 400 }
      )
    }

    console.log('[tradie-config] Fetching config for:', session.user.tradieConfigId)

    const fullConfig = await getTradieConfigById(session.user.tradieConfigId)

    if (!fullConfig) {
      return Response.json(
        { error: 'Failed to retrieve tradie config' },
        { status: 500 }
      )
    }

    const config = {
      businessName: fullConfig.businessName,
      trade: fullConfig.tradeType,
      serviceArea: fullConfig.serviceArea,
      minJobValue: fullConfig.minJobValue,
      phone: fullConfig.phone,
      googleReviewUrl: fullConfig.googleReviewUrl,
    }

    console.log('[tradie-config] Config loaded:', config)

    return Response.json({ config })
  } catch (error) {
    console.error('[tradie-config] Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
