'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Briefcase, Users, CheckSquare, UserCog } from 'lucide-react'

const tabs = [
  { href: '/',          label: 'Home',    icon: Home },
  { href: '/cases',     label: 'Cases',   icon: Briefcase },
  { href: '/clients',   label: 'Clients', icon: Users },
  { href: '/tasks',     label: 'Tasks',   icon: CheckSquare },
  { href: '/advocates', label: 'Team',    icon: UserCog },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-1px_3px_rgba(0,0,0,0.06)]">
      <div className="max-w-5xl mx-auto flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
