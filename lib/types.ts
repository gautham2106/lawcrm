export type CaseStatus = 'active' | 'closed' | 'pending' | 'won' | 'lost'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskType = 'task' | 'meeting'
export type TransactionType = 'payment' | 'fee' | 'expense' | 'refund'
export type NotificationType = 'info' | 'hearing' | 'payment' | 'task' | 'alert'
export type UserRole = 'admin' | 'staff'

export interface Firm {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  advocate_name: string | null
  firm_id: string | null
  is_super_admin: boolean
  created_at: string
  updated_at: string
  // joined
  firm?: Firm
}

export interface Client {
  id: string
  firm_id: string | null
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
  firm_id: string | null
  case_number: string
  case_name: string
  client_id: string | null
  status: CaseStatus
  stage: string | null
  advocate_name: string | null
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
  firm_id: string | null
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
  firm_id: string | null
  case_id: string | null
  title: string
  description: string | null
  done: boolean
  due_date: string | null
  priority: TaskPriority
  task_type: TaskType
  meeting_location: string | null
  meeting_with: string | null
  advocate_name: string | null
  created_at: string
  updated_at: string
  // joined
  case?: Case
}

export interface Fee {
  id: string
  firm_id: string | null
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
  firm_id: string | null
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
  firm_id: string | null
  title: string
  message: string | null
  type: NotificationType
  is_read: boolean
  case_id: string | null
  created_at: string
  // joined
  case?: Case
}

export interface CaseNote {
  id: string
  case_id: string
  content: string
  author_name: string | null
  created_at: string
  updated_at: string
}

export interface CaseDocument {
  id: string
  case_id: string
  name: string
  storage_path: string | null
  url: string | null
  tag: string | null
  notes: string | null
  file_size: number | null
  created_at: string
  // joined
  annotations?: DocumentAnnotation[]
}

export interface DocumentAnnotation {
  id: string
  document_id: string
  page_number: number
  note: string
  created_at: string
}

export interface FirmSettings {
  id: string
  firm_id: string | null
  key: string
  value: string[]
  updated_at: string
}

export interface DashboardStats {
  activeCases: number
  todayHearings: number
  pendingTasks: number
  pendingFees: number
}
