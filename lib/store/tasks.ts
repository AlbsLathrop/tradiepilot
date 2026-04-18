import { create } from 'zustand'

export type TaskCategory = 'Marketing' | 'Sales' | 'Systems' | 'Ops' | 'Finance' | 'Product'
export type TaskStatus = 'Todo' | 'In Progress' | 'Done'
export type TaskPriority = 'TODAY' | 'THIS_WEEK' | 'BACKLOG'

export interface Task {
  id: string
  userId: 'Alberto' | 'Benny'
  title: string
  description?: string
  category: TaskCategory
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  linkedClient?: string
  linkedLead?: string
  createdAt: string
}

interface TasksStore {
  tasks: Task[]
  addTask: (task: Task) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  deleteTask: (taskId: string) => void
  moveTask: (taskId: string, newPriority: TaskPriority) => void
  getTodayStreak: (userId: 'Alberto' | 'Benny') => number
}

const categoryColors = {
  Marketing: '#a855f7',
  Sales: '#3b82f6',
  Systems: '#f5c518',
  Ops: '#22c55e',
  Finance: '#f97316',
  Product: '#06b6d4',
}

const initialTasks: Task[] = [
  // Alberto - TODAY
  {
    id: '1',
    userId: 'Alberto',
    title: 'Review LUNA performance metrics',
    description: 'Check if lead qualification accuracy improved this week',
    category: 'Systems',
    status: 'In Progress',
    priority: 'TODAY',
    dueDate: '2026-04-19',
    createdAt: '2026-04-19',
  },
  {
    id: '2',
    userId: 'Alberto',
    title: 'Fix API latency issue on /context route',
    description: 'Alfred response time > 2s, optimize Supabase query',
    category: 'Systems',
    status: 'Todo',
    priority: 'TODAY',
    dueDate: '2026-04-19',
    createdAt: '2026-04-19',
  },
  {
    id: '3',
    userId: 'Alberto',
    title: 'Set up Supabase Realtime subscriptions',
    description: 'Enable activity_log, notifications, leads updates',
    category: 'Systems',
    status: 'Todo',
    priority: 'TODAY',
    dueDate: '2026-04-19',
    createdAt: '2026-04-19',
  },
  // Alberto - THIS WEEK
  {
    id: '4',
    userId: 'Alberto',
    title: 'Implement Alfred streaming response',
    description: 'Use Vercel AI SDK for token streaming',
    category: 'Systems',
    status: 'Todo',
    priority: 'THIS_WEEK',
    createdAt: '2026-04-18',
  },
  {
    id: '5',
    userId: 'Alberto',
    title: 'Deploy JobFlow to Vercel staging',
    category: 'Systems',
    status: 'Todo',
    priority: 'THIS_WEEK',
    createdAt: '2026-04-18',
  },
  // Alberto - BACKLOG
  {
    id: '6',
    userId: 'Alberto',
    title: 'Build Metrics dashboard charts',
    description: 'Revenue, funnel, agent performance, MRR growth',
    category: 'Product',
    status: 'Todo',
    priority: 'BACKLOG',
    createdAt: '2026-04-15',
  },
  {
    id: '7',
    userId: 'Alberto',
    title: 'Implement weekly planner section',
    category: 'Product',
    status: 'Todo',
    priority: 'BACKLOG',
    createdAt: '2026-04-15',
  },
  // Benny - TODAY
  {
    id: '8',
    userId: 'Benny',
    title: 'Call Rob K. - quote follow-up',
    description: 'Check if he received quote, address concerns',
    category: 'Sales',
    status: 'Todo',
    priority: 'TODAY',
    dueDate: '2026-04-19',
    linkedLead: 'Rob K.',
    createdAt: '2026-04-19',
  },
  {
    id: '9',
    userId: 'Benny',
    title: 'Onboard Morrison Plumbing',
    description: 'Send welcome pack, set up job tracking, confirm schedule',
    category: 'Sales',
    status: 'In Progress',
    priority: 'TODAY',
    dueDate: '2026-04-19',
    linkedClient: 'Morrison Plumbing',
    createdAt: '2026-04-19',
  },
  {
    id: '10',
    userId: 'Benny',
    title: 'Close Dave P. deal',
    description: 'Get signed agreement, first payment',
    category: 'Sales',
    status: 'Todo',
    priority: 'TODAY',
    dueDate: '2026-04-19',
    linkedLead: 'Dave P.',
    createdAt: '2026-04-19',
  },
  // Benny - THIS WEEK
  {
    id: '11',
    userId: 'Benny',
    title: 'Record sales playbook video',
    description: 'How to qualify leads and set expectations',
    category: 'Marketing',
    status: 'Todo',
    priority: 'THIS_WEEK',
    createdAt: '2026-04-17',
  },
  {
    id: '12',
    userId: 'Benny',
    title: 'Weekly client health check calls',
    description: 'Call 5 at-risk clients (health score < 70)',
    category: 'Ops',
    status: 'Todo',
    priority: 'THIS_WEEK',
    createdAt: '2026-04-17',
  },
  // Benny - BACKLOG
  {
    id: '13',
    userId: 'Benny',
    title: 'Develop premium tier offering',
    description: 'Higher MRR, dedicated support, custom reports',
    category: 'Product',
    status: 'Todo',
    priority: 'BACKLOG',
    createdAt: '2026-04-10',
  },
]

export const useTasksStore = create<TasksStore>((set, get) => ({
  tasks: initialTasks,
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task)),
    })),
  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    })),
  moveTask: (taskId, newPriority) =>
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, priority: newPriority } : task)),
    })),
  getTodayStreak: (userId) => {
    const tasks = get().tasks.filter((t) => t.userId === userId && t.priority === 'TODAY')
    return tasks.filter((t) => t.status === 'Done').length === tasks.length ? 1 : 0
  },
}))

export { categoryColors }
