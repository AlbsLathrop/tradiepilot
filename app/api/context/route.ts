import { NextResponse } from 'next/server'

export async function GET() {
  const context = `
=== LIVE BUSINESS DATA ===

PIPELINE:
- Rob K. (Rob's Plumbing) — CONTACTED — $2,500 MRR — 8 days in stage — Referral — Agent: CHASE
- Dave P. (Dave's Electrical) — QUOTE SENT — $3,200 MRR — 3 days — Google — Agent: LUNA
- Smith Bros (Painting) — QUOTE SENT — $1,800 MRR — 12 days — Cold — Agent: LUNA
- Harris Tiling — BOOKED — $2,800 MRR — 5 days — Referral — Agent: LUNA
- Lisa M. (Cleaning) — LEAD — $1,200 MRR — 0 days — Instagram — Agent: LUNA
- John T. (HVAC) — CONTACTED — $3,800 MRR — 2 days — Google — Agent: CHASE
- Morrison Plumbing — ACTIVE — $4,500 MRR — 45 days — Referral — Agent: ORBIT
- Elite Electrical — ACTIVE — $5,200 MRR — 62 days — Instagram — Agent: ORBIT

CLIENTS (Active):
- Morrison Plumbing — Plumbing — $4,500 MRR — Health: 88/100 — Agent: ORBIT
- Elite Electrical — Electrical — $5,200 MRR — Health: 92/100 — Agent: ORBIT
- Harris Tiling — Tiling — $2,800 MRR — Health: 74/100 — Agent: ORBIT
- Smith Bros Painting — Painting — $1,800 MRR — Health: 61/100 — Agent: ANCHOR
- Dave's Electrical — Electrical — $3,200 MRR — Health: 55/100 — (onboarding)

Total Active MRR: $17,500/month
Total Pipeline MRR at risk: $13,300

AGENTS STATUS:
- LUNA (Lead Response) — ONLINE — 18 tasks today — 94% success — 2.1m avg response
  Current: Qualifying 3 new leads from Instagram
- CHASE (Follow-up) — ONLINE — 12 tasks today — 89% success — 3.4m avg response
  Current: Following up with Rob K. — quote pending
- ORBIT (Job Comms) — ONLINE — 22 tasks today — 96% success — 1.8m avg response
  Current: Sending job completion updates to 5 clients
- ANCHOR (Invoice & Pay) — ONLINE — 8 tasks today — 100% success — 5.2m avg response
  Current: Processing 2 invoices and payment reminders
- FIXER (Support) — ONLINE — 5 tasks today — 92% success — 4.1m avg response
  Current: Handling support ticket from Dave P.

RECENT ACTIVITY (last 24h):
- LUNA: Lead qualified — MRR $2,500 (2 mins ago)
- ORBIT: Job update sent to Morrison Plumbing (8 mins ago)
- ANCHOR: Invoice #INV-2481 paid by Elite Electrical (15 mins ago)
- CHASE: Follow-up SMS sent to 4 warm leads (22 mins ago)
- LUNA: Lead disqualified — out of service area (28 mins ago)
- ORBIT: Job update sent to Harris Tiling (35 mins ago)
- FIXER: Support ticket resolved — client happy (42 mins ago)
- ANCHOR: Payment reminder sent to Smith Bros (51 mins ago)

TASKS:
Alberto today: Review LUNA metrics (In Progress), Fix API latency (Todo), Set up Supabase Realtime (Todo)
Benny today: Call Rob K. — quote follow-up (Todo), Onboard Morrison Plumbing (In Progress), Close Dave P. deal (Todo)

METRICS:
Weekly revenue: $12,450 | Last week: $11,500 (+8.2%)
Total active MRR: $17,500 | Active clients: 5
Pipeline leads: 8 | Leads this week: 3
Closures this month: 12 | Close rate: 48%
Agent tasks completed today: 65 total
`

  return NextResponse.json({ context })
}
