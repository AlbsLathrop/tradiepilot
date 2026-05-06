import { getServerSession } from 'next-auth/next'
import { getTradieConfigById } from '@/lib/notion'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.tradieConfigId) {
      return Response.json(
        { error: 'Not authenticated or missing tradieConfigId' },
        { status: 401 }
      )
    }

    console.log('[tradie-config] Fetching config:', {
      tradieConfigId: session.user.tradieConfigId,
    })

    const config = await getTradieConfigById(session.user.tradieConfigId)

    if (!config) {
      return Response.json(
        { error: 'Config not found' },
        { status: 404 }
      )
    }

    return Response.json({ config })
  } catch (error) {
    console.error('[tradie-config] Error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
