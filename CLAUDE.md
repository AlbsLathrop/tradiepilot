# TradiePilot
**For:** Alberto (ADHD, direct) + Benny. **Show code first.** Build → ask.

## STACK
Next.js 14 App Router | TS strict | Tailwind + shadcn/ui | Notion (@notionhq/client) | Twilio SMS | Claude API (haiku-4-5) | Vercel

## DESIGN
| Element | Spec |
|---------|------|
| BG | #111827 |
| Surface | #1F2937 |
| Accent | #06B6D4 |
| Text | #F9FAFB |
| Cards | rounded-xl bg-[#1F2937] border-white/5 |
| Inputs | rounded-lg bg-[#111827] border-white/10 |
| Badges | px-2 py-0.5 rounded-full text-xs uppercase |
| Theme | Dark only |
| Font | Inter |

## ROUTING
| Path | Purpose |
|------|---------|
| `/app/(war-room)/admin/` | War Room |
| `/app/(tradie-app)/app/` | Tradie App |

## MODULES
| File | Purpose |
|------|---------|
| `/lib/notion.ts` | All Notion calls (never inline) |
| `/lib/twilio.ts` | All SMS |
| `/lib/claude.ts` | All Claude API |
| `/lib/constants.ts` | DB IDs, config, status maps |

## STATUS COLORS
| Status | Color |
|--------|-------|
| SCHEDULED/QUOTED | blue |
| IN PROGRESS | cyan |
| RUNNING LATE | orange |
| DAY DONE | purple |
| COMPLETE | green |
| INVOICED | yellow |
| PAID | emerald |
| Qualified | green |
| Disqualified | red |
| Pending Decline | orange |
| Declined/COLD | gray |

## NAMING
- Ben/Benny → War Room admin (never tradie example)
- Joey → tradie avatar, Joey's customers = homeowners
- Config IDs: no dashes

## NOTION PATTERNS
| Field | Extract |
|-------|---------|
| Rich text | `[0]?.plain_text ?? ''` |
| Status | `.select?.name` |
| Phone | `.phone_number` |
| Checkbox | `.checkbox` (bool) |
| Date | `.date?.start` |

## COMPONENTS
- Server by default. `use client` only: forms/interactive
- Error boundaries on async
- Skeleton loading for data

## RULES
1. One session = one feature → commit before next
2. Reference specific files (not "scan project")
3. `/clear` between unrelated tasks
4. **Haiku:** boilerplate, types, constants, simple components
5. **Sonnet:** complex logic, architecture, API, debugging
6. Describe output, not steps
7. \>20 tool calls? Split into 2 sessions
8. Commit before asking changes
9. Never: hardcode keys, light mode, Notion in pages, `use client` unless needed, `any` type, Ben as example
