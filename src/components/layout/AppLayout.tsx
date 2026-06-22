import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Building2, Users, UserCheck, FileText, Wrench,
  PoundSterling, FolderOpen, FilePen, Settings, LogOut, ChevronLeft,
  ChevronRight, Bell, Menu, X, ClipboardList, ShieldCheck, Sparkles,
  Activity,
} from 'lucide-react'
import { Breadcrumbs } from '@/components/ui/breadcrumb'
import { NotificationsDropdown } from '@/components/NotificationsDropdown'
import { GlobalSearch } from '@/components/GlobalSearch'
import { ActivityFeed } from '@/components/ActivityFeed'

const navGroups = [
  {
    label: 'Core',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard, badgeKey: null as string | null },
      { label: 'Properties', href: '/properties', icon: Building2, badgeKey: 'available-properties' },
      { label: 'Tenancies', href: '/tenancies', icon: ClipboardList, badgeKey: 'ending-tenancies' },
      { label: 'Onboarding', href: '/onboarding', icon: Sparkles, badgeKey: null },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Landlords', href: '/landlords', icon: UserCheck, badgeKey: null },
      { label: 'Tenants', href: '/tenants', icon: Users, badgeKey: null },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Maintenance', href: '/maintenance', icon: Wrench, badgeKey: 'open-maintenance' },
      { label: 'Finance', href: '/finance', icon: PoundSterling, badgeKey: null },
      { label: 'Compliance', href: '/compliance', icon: ShieldCheck, badgeKey: 'expiring-compliance' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { label: 'Documents', href: '/documents', icon: FolderOpen, badgeKey: null },
      { label: 'Agreements', href: '/agreements', icon: FilePen, badgeKey: null },
      { label: 'Settings', href: '/settings', icon: Settings, badgeKey: null },
    ],
  },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showActivity, setShowActivity] = useState(false)

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings-header'],
    queryFn: async () => {
      const { data } = await supabase.from('company_settings').select('company_name, logo_storage_path').single()
      return data as any
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  const companyLogoUrl = companySettings?.logo_storage_path
    ? supabase.storage.from('company-assets').getPublicUrl(companySettings.logo_storage_path).data.publicUrl
    : null
  const companyName = companySettings?.company_name ?? 'LettingsPro'

  const { data: badges } = useQuery({
    queryKey: ['nav-badges'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const in30 = new Date(); in30.setDate(in30.getDate() + 30)
      const in60 = new Date(); in60.setDate(in60.getDate() + 60)

      const [availableProps, openMaint, expiringComp, endingTen] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('maintenance_requests').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        supabase.from('property_compliance').select('*', { count: 'exact', head: true }).lte('expiry_date', in30.toISOString().split('T')[0]),
        supabase.from('tenancies').select('*', { count: 'exact', head: true }).eq('status', 'active').lte('end_date', in60.toISOString().split('T')[0]).gte('end_date', today),
      ])

      return {
        'available-properties': availableProps.count ?? 0,
        'open-maintenance': openMaint.count ?? 0,
        'expiring-compliance': expiringComp.count ?? 0,
        'ending-tenancies': endingTen.count ?? 0,
      }
    },
    staleTime: 1000 * 60 * 2,
  })

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-white transition-all duration-300 lg:relative lg:translate-x-0',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 border-b border-slate-700">
          {!collapsed && (
            <div className="flex items-center gap-2">
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt="Logo" className="h-8 w-auto" />
              ) : (
                <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
                  {companyName.charAt(0)}
                </div>
              )}
              <span className="text-lg font-bold text-white truncate">{companyName}</span>
            </div>
          )}
          {collapsed && companyLogoUrl && (
            <img src={companyLogoUrl} alt="Logo" className="h-8 w-8 mx-auto" />
          )}
          {collapsed && !companyLogoUrl && (
            <div className="h-8 w-8 bg-blue-600 rounded mx-auto flex items-center justify-center text-white font-bold text-sm">
              {companyName.charAt(0)}
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center h-8 w-8 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors ml-auto"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex items-center justify-center h-8 w-8 rounded-md text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 sm:py-4 px-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const badgeCount = item.badgeKey ? (badges?.[item.badgeKey as keyof typeof badges] ?? 0) : 0
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 sm:py-2 text-sm font-medium transition-colors touch-manipulation',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                        collapsed && 'justify-center px-2',
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{item.label}</span>
                        {badgeCount > 0 && (
                          <span className={cn(
                            'inline-flex items-center justify-center h-5 min-w-[1.25rem] rounded-full px-1.5 text-xs font-bold shrink-0',
                            item.badgeKey === 'expiring-compliance' ? 'bg-red-500 text-white' :
                            item.badgeKey === 'open-maintenance' ? 'bg-orange-500 text-white' :
                            item.badgeKey === 'ending-tenancies' ? 'bg-amber-500 text-white' :
                            'bg-green-500 text-white'
                          )}>
                            {badgeCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-700 p-4">
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? 'Staff'}</p>
              <p className="text-xs text-slate-400 capitalize">{profile?.role ?? ''}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={cn(
              'flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full rounded-md px-2 py-1.5 hover:bg-slate-700',
              collapsed && 'justify-center',
            )}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-14 sm:h-16 items-center justify-between border-b border-gray-200 bg-white px-3 sm:px-4 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden flex items-center justify-center h-9 w-9 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 touch-manipulation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:block flex-1 ml-2">
            <Breadcrumbs />
          </div>
          <div className="hidden md:block w-64 ml-2">
            <GlobalSearch />
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setShowActivity(!showActivity)}
              className={`flex items-center justify-center h-9 w-9 rounded-md transition-colors touch-manipulation ${
                showActivity ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Activity feed"
            >
              <Activity className="h-5 w-5" />
            </button>
            <NotificationsDropdown />
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(profile?.full_name ?? 'U').charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700 truncate max-w-[150px]">{profile?.full_name ?? 'Staff'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Activity feed overlay */}
      {showActivity && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setShowActivity(false)} />
          <ActivityFeed onClose={() => setShowActivity(false)} />
        </>
      )}
    </div>
  )
}
