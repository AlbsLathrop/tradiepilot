# Status Color Classes — TradiePilot
All in /lib/constants.ts → STATUS_COLORS

LEAD=gray | QUOTED/SCHEDULED=blue | IN PROGRESS=cyan
RUNNING LATE=orange | DAY DONE=purple | COMPLETE=green
INVOICED=yellow | PAID=emerald

Qualified=green | Disqualified=red | Pending Decline=orange
Declined=gray | Handed Off=blue

Usage: <StatusBadge status={job.status} /> from /components/ui/status-badge.tsx
