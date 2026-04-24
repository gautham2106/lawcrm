import { CaseStatus, TaskPriority } from '@/lib/types'

const statusConfig: Record<CaseStatus, { label: string; className: string }> = {
  active:  { label: 'Active',   className: 'bg-emerald-100 text-emerald-800' },
  pending: { label: 'Pending',  className: 'bg-amber-100 text-amber-800' },
  closed:  { label: 'Closed',   className: 'bg-gray-200 text-gray-600' },
  won:     { label: 'Won',      className: 'bg-blue-100 text-blue-800' },
  lost:    { label: 'Lost',     className: 'bg-red-100 text-red-800' },
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  high:   { label: 'High',   className: 'bg-red-100 text-red-700' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700' },
  low:    { label: 'Low',    className: 'bg-gray-100 text-gray-600' },
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const { label, className } = statusConfig[status] ?? statusConfig.active
  return (
    <span className={`badge ${className}`}>{label}</span>
  )
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const { label, className } = priorityConfig[priority] ?? priorityConfig.medium
  return (
    <span className={`badge ${className}`}>{label}</span>
  )
}
