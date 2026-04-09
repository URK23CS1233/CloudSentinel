import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  BellRing,
  ShieldAlert,
  Activity,
  Cpu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/alerts', label: 'Alerts', icon: BellRing },
  { to: '/rules', label: 'Rules', icon: ShieldAlert },
]

export default function Sidebar() {
  return (
    <aside className="w-60 min-h-screen flex flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[hsl(var(--border))]">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
          <Cpu size={16} className="text-[hsl(var(--primary-foreground))]" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-[hsl(var(--foreground))]">CloudSentinel</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest">Monitor</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--muted-foreground))] px-3 pt-2 pb-1">
          Navigation
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.3)]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[hsl(var(--border))]">
        <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] pulse-dot inline-block" />
          <Activity size={12} />
          <span>Live monitoring</span>
        </div>
      </div>
    </aside>
  )
}
