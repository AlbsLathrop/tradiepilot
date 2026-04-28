import { getRecentLeads } from '@/lib/notion'

export async function GET() {
  try {
    const leads = await getRecentLeads(100)

    return Response.json({
      leads: leads.map(lead => ({
        ...lead,
        tradieConfigId: 'joey-tradie',
      })),
      success: true,
    })
  } catch (error) {
    console.error('[GET /api/leads]', error)
    return Response.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}
