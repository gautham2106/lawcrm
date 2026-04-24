import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#eee8da] flex items-center justify-center mb-4">
        <Icon size={26} className="text-[#8a8278]" />
      </div>
      <p className="font-semibold text-[#4a4540] mb-1">{title}</p>
      {description && <p className="text-sm text-[#8a8278] mb-4">{description}</p>}
      {action}
    </div>
  )
}
