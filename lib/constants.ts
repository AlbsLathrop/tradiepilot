export const NOTION_DB = {
  JOBS:       'e96a412b635a415cbdcd02343f55b7f3',
  LEADS:      '3ca5ac231a1741478b9dad5344c738df',
  CONFIG:     'ff9248a4dd244ad9a0761281967750ea',
  FIXER:      '79e6a2d873134d058ce802a353b28a89',
  CLIENTS:    '91982626168e4fa3861114ae60745407',
  COMMS:      'fe9fbe9b3f9d45ca824998d17c543b64',
  DECISIONS:  '2262be03aa244ff08b67fc211abfaa52',
  VARIATIONS: '62a665f162b243fbbf65d6d37fbd2913',
} as const

export const TRADIE_IDS = {
  BENS_STONEWORK: '33c187ef12be8188a893f373a404cbbb',
  JOES_PAINTING:  '33d187ef12be81f39409c4ea79e3550f',
} as const

export const JOB_STATUSES = [
  'LEAD','QUOTED','SCHEDULED','IN PROGRESS',
  'RUNNING LATE','DAY DONE','COMPLETE','INVOICED','PAID'
] as const

export type JobStatus = typeof JOB_STATUSES[number]

export const STATUS_COLORS: Record<string, string> = {
  'LEAD':           'bg-gray-500/20 text-gray-400',
  'QUOTED':         'bg-blue-500/20 text-blue-400',
  'SCHEDULED':      'bg-blue-500/20 text-blue-400',
  'IN PROGRESS':    'bg-cyan-500/20 text-cyan-400',
  'RUNNING LATE':   'bg-orange-500/20 text-orange-400',
  'DAY DONE':       'bg-purple-500/20 text-purple-400',
  'COMPLETE':       'bg-green-500/20 text-green-400',
  'INVOICED':       'bg-yellow-500/20 text-yellow-400',
  'PAID':           'bg-emerald-500/20 text-emerald-400',
  'Qualified':      'bg-green-500/20 text-green-400',
  'Disqualified':   'bg-red-500/20 text-red-400',
  'Pending Decline':'bg-orange-500/20 text-orange-400',
  'Declined':       'bg-gray-500/20 text-gray-400',
  'Handed Off':     'bg-blue-500/20 text-blue-400',
  'Waiting':        'bg-gray-500/20 text-gray-400',
  'NEW':            'bg-gray-500/20 text-gray-400',
  'WON':            'bg-green-500/20 text-green-400',
  'COLD':           'bg-gray-500/20 text-gray-400',
}

export const ORBIT_MESSAGES: Record<string, string> = {
  'SCHEDULED':    'Hi {name}, your job is confirmed and locked in. We will see you on the day. Have a great one! - TradiePilot',
  'IN PROGRESS':  'Hi {name}, just letting you know the team has started on your job today. Have a great one! - TradiePilot',
  'RUNNING LATE': 'Hi {name}, heads up - the team is running a little late. They are on their way. Thanks for your patience! - TradiePilot',
  'DAY DONE':     'Hi {name}, that is a wrap for today. The team has finished up on site. Have a good evening! - TradiePilot',
  'COMPLETE':     'Hi {name}, your job is now complete. Thanks so much for choosing us. Have a great one! - TradiePilot',
  'INVOICED':     'Hi {name}, your invoice has been sent through. Reach out if you have any questions. Thanks! - TradiePilot',
}