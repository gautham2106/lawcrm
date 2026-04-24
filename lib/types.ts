export type CaseStatus = 'active' | 'closed' | 'pending' | 'won' | 'lost'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TransactionType = 'payment' | 'fee' | 'expense' | 'refund'
export type NotificationType = 'info' | 'hearing' | 'payment' | 'task' | 'alert'

export interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Case {
  id: string
  case_number: string
  case_name: string
  client_id: string | null
  status: CaseStatus
  court: string | null
  judge: string | null
  filing_date: string | null
  description: string | null
  created_at: string
  updated_at: string
  // joined
  client?: Client
  hearings?: Hearing[]
  tasks?: Task[]
  fees?: Fee[]
}

export interface Hearing {
  id: string
  case_id: string
  date: string
  time: string | null
  court: string | null
  purpose: string | null
  notes: string | null
  created_at: string
  // joined
  case?: Case
}

export interface Task {
  id: string
  case_id: string | null
  title: string
  description: string | null
  done: boolean
  due_date: string | null
  priority: TaskPriority
  created_at: string
  updated_at: string
  // joined
  case?: Case
}

export interface Fee {
  id: string
  case_id: string
  agreed_amount: number
  paid_amount: number
  expected_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  case?: Case
}

export interface Transaction {
  id: string
  case_id: string
  fee_id: string | null
  amount: number
  type: TransactionType
  description: string | null
  date: string
  created_at: string
  // joined
  case?: Case
}

export interface Notification {
  id: string
  title: string
  message: string | null
  type: NotificationType
  is_read: boolean
  case_id: string | null
  created_at: string
  // joined
  case?: Case
}

export interface DashboardStats {
  activeCases: number
  todayHearings: number
  pendingTasks: number
  pendingFees: number
}
