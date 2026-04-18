# TradiePilot — Project Rules for Claude Code
> Read this file before writing any code. Follow all rules without exception.
## WHO THIS IS FOR
Alberto Lathrop (ADHD, direct comms only) + Benny (co-founder).
Show code immediately. No lengthy explanations before code.
When in doubt, build it. Ask after.

## STACK
- Next.js 14 App Router, TypeScript strict (no `any`)
- Tailwind CSS + shadcn/ui
- Notion API via @notionhq/client
- Vercel deployment
- Twilio for SMS
- Claude API claude-haiku-4-5-20251001

## DESIGN SYSTEM
Background: #111827 | Surface: #1F2937 | Accent: #06B6D4 | Text: #F9FAFB
Dark theme ONLY. Never light mode. Font: Inter.
Cards: rounded-xl bg-[#1F2937] border border-white/5
Inputs: rounded-lg bg-[#111827] border border-white/10
Badges: px-2 py-0.5 rounded-full text-xs font-medium uppercase

## ARCHITECTURE
- /app/(war-room)/admin/ → War Room
- /app/(tradie-app)/app/ → Tradie App
- /lib/notion.ts → ALL Notion calls. Never inline.
- /lib/twilio.ts → ALL SMS
- /lib/claude.ts → ALL Claude API
- /lib/constants.ts → All DB IDs, config, status maps
Server components default. 'use client' only for forms/interactive state.
Error boundaries on all async components. Skeleton loading for all data.

## NAMING
- Ben/Benny = co-founder admin (War Room). NEVER tradie example.
- Joey = tradie client avatar.
- Joey's customers = homeowners.
- Tradie Config ID = always without dashes.

## STATUS COLORS
SCHEDULED/QUOTED: blue | IN PROGRESS: cyan | RUNNING LATE: orange
DAY DONE: purple | COMPLETE: green | INVOICED: yellow | PAID: emerald
Qualified: green | Disqualified: red | Pending Decline: orange | Declined/COLD: gray

## TOKEN EFFICIENCY RULES
1. One session = one feature. Commit before starting next.
2. Reference specific files: "in /lib/notion.ts add..." not "look at the project and..."
3. Use /clear between unrelated tasks.
4. Use Haiku model (in Claude settings) for: boilerplate, types, constants, simple components.
5. Use Sonnet for: complex logic, architecture, API integrations, debugging.
6. Read skills docs before starting: /docs/skills/notion-api.md | /docs/skills/orbit-sms.md
7. Never ask Claude Code to scan the whole project. Point to specific files.
8. Commit working code before asking for changes.
9. Describe the output you want, not the steps to get there.
10. If a task needs >20 tool calls, break it into 2 sessions.

## NOTION FIELD PATTERNS (from /docs/skills/notion-api.md)
Rich text: array → [0]?.plain_text ?? ''
Status: .select?.name
Phone: .phone_number
Checkbox: .checkbox (boolean)
Date: .date?.start

## DO NOT
- Never hardcode API keys
- Never use light mode
- Never call Notion API in page components (use /lib/notion.ts)
- Never add 'use client' unless necessary
- Never use `any` type
- Never use Ben as a tradie client example
