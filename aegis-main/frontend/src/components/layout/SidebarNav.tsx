'use client'
import { LayoutDashboard, Map, AlertTriangle, Cpu, LifeBuoy, Home, FileText, Settings } from 'lucide-react'

interface SidebarNavProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function SidebarNav({ activeTab, setActiveTab }: SidebarNavProps) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'agents', label: 'Agents', icon: Cpu },
    { id: 'resources', label: 'Resources', icon: LifeBuoy },
    { id: 'shelters', label: 'Shelters', icon: Home },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="w-20 bg-[#090d16] border-r border-slate-800/80 flex flex-col items-center py-4 shrink-0 z-20 select-none">
      <nav className="flex-1 flex flex-col gap-2.5 w-full px-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full py-2.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative group ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-sans font-medium">{item.label}</span>

              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-cyan-400" />
              )}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
