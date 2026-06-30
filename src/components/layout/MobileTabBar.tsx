import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Building2, ClipboardList, FilePen,
  MoreHorizontal, X, UserCheck, Users, Wrench, Calendar,
  PoundSterling, ShieldCheck, FolderOpen, Settings,
} from 'lucide-react'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface MobileTabBarProps {
  badges?: Record<string, number>
}

const tabs = [
  { label: 'Home', href: '/', icon: LayoutDashboard, end: true },
  { label: 'Properties', href: '/properties', icon: Building2, badgeKey: 'available-properties', end: false },
  { label: 'Tenancies', href: '/tenancies', icon: ClipboardList, badgeKey: 'ending-tenancies', end: false },
  { label: 'Agreements', href: '/agreements', icon: FilePen, end: false },
]

const moreItems = [
  { label: 'Landlords', href: '/landlords', icon: UserCheck },
  { label: 'Tenants', href: '/tenants', icon: Users },
  { label: 'Maintenance', href: '/maintenance', icon: Wrench, badgeKey: 'open-maintenance' },
  { label: 'Viewings', href: '/viewings', icon: Calendar },
  { label: 'Finance', href: '/finance', icon: PoundSterling },
  { label: 'Compliance', href: '/compliance', icon: ShieldCheck, badgeKey: 'expiring-compliance' },
  { label: 'Documents', href: '/documents', icon: FolderOpen },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function MobileTabBar({ badges }: MobileTabBarProps) {
  const [showMore, setShowMore] = useState(false)
  const navigate = useNavigate()
  const { tap } = useHapticFeedback()

  function getBadgeCount(key?: string): number {
    if (!key || !badges) return 0
    return badges[key] ?? 0
  }

  return (
    <>
      {/* Bottom Tab Bar — visible only on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden">
        <div
          className="flex items-center justify-around"
          style={{ paddingBottom: 'var(--sab)' }}
        >
          {tabs.map((tab) => {
            const badgeCount = getBadgeCount(tab.badgeKey)
            return (
              <NavLink
                key={tab.href}
                to={tab.href}
                end={tab.end}
                onClick={() => tap()}
                className={({ isActive }) =>
                  cn(
                    'relative flex flex-col items-center justify-center py-2 px-3 min-w-[56px] touch-manipulation transition-colors',
                    isActive ? 'text-blue-600' : 'text-gray-500',
                  )
                }
              >
                <div className="relative">
                  <tab.icon className="h-5 w-5" />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 inline-flex items-center justify-center h-4 min-w-[1rem] rounded-full px-1 text-[10px] font-bold bg-red-500 text-white">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
              </NavLink>
            )
          })}

          {/* More button */}
          <button
            onClick={() => { tap(); setShowMore(true) }}
            className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[56px] touch-manipulation text-gray-500"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Bottom Sheet */}
      {showMore && (
        <>
          <div className="more-sheet-overlay" onClick={() => setShowMore(false)} />
          <div className="more-sheet">
            {/* Handle bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Menu</h3>
              <button
                onClick={() => setShowMore(false)}
                className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100 touch-manipulation"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <nav className="py-2">
              {moreItems.map((item) => {
                const badgeCount = getBadgeCount(item.badgeKey)
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      setShowMore(false)
                      navigate(item.href)
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 touch-manipulation"
                  >
                    <item.icon className="h-5 w-5 text-gray-400" />
                    <span className="flex-1">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full px-1.5 text-xs font-bold bg-red-500 text-white">
                        {badgeCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
