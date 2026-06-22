import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { Bell, X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

interface Alert {
  id: string
  type: 'tenancy_ending' | 'compliance_expiring' | 'overdue_rent' | 'missing_checklist'
  title: string
  description: string
  href: string
  date: string
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const { data: alerts } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const in30 = new Date(); in30.setDate(in30.getDate() + 30)

      const items: Alert[] = []

      // Tenancies ending soon
      const { data: endingTenancies } = await supabase
        .from('tenancies')
        .select('id, end_date, properties(address, postcode)')
        .eq('status', 'active')
        .lte('end_date', in30.toISOString().split('T')[0])
        .gte('end_date', today)
        .limit(5)
      for (const t of (endingTenancies ?? [])) {
        items.push({
          id: `end-${t.id}`,
          type: 'tenancy_ending',
          title: 'Tenancy ending soon',
          description: `${(t as any).properties?.address ?? 'Property'} ends ${formatDate(t.end_date)}`,
          href: `/tenancies/${t.id}`,
          date: t.end_date,
        })
      }

      // Compliance expiring
      const { data: expiringComp } = await supabase
        .from('property_compliance')
        .select('id, type, expiry_date, properties(address)')
        .lte('expiry_date', in30.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })
        .limit(5)
      for (const c of (expiringComp ?? [])) {
        items.push({
          id: `comp-${c.id}`,
          type: 'compliance_expiring',
          title: `${(c as any).type?.replace(/_/g, ' ')} expiring`,
          description: `${(c as any).properties?.address ?? 'Property'} expires ${formatDate((c as any).expiry_date)}`,
          href: '/compliance',
          date: (c as any).expiry_date,
        })
      }

      // Overdue rent
      const { data: overdueRent } = await supabase
        .from('rent_transactions')
        .select('id, amount, due_date, tenancies(properties(address))')
        .eq('status', 'overdue')
        .lte('due_date', today)
        .limit(5)
      for (const r of (overdueRent ?? [])) {
        items.push({
          id: `rent-${r.id}`,
          type: 'overdue_rent',
          title: `Overdue rent: £${r.amount}`,
          description: `${(r as any).tenancies?.properties?.address ?? 'Property'} — due ${formatDate(r.due_date)}`,
          href: '/finance',
          date: r.due_date,
        })
      }

      return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    },
    staleTime: 1000 * 60 * 2,
  })

  const count = alerts?.length ?? 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center h-9 w-9 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors touch-manipulation"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[1.25rem] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No notifications</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {(alerts ?? []).map((alert) => (
                  <Link
                    key={alert.id}
                    to={alert.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className={cn(
                      'h-2 w-2 rounded-full mt-1.5 shrink-0',
                      alert.type === 'overdue_rent' ? 'bg-red-500' :
                      alert.type === 'compliance_expiring' ? 'bg-orange-500' :
                      alert.type === 'tenancy_ending' ? 'bg-amber-500' : 'bg-blue-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                      <p className="text-xs text-gray-500 truncate">{alert.description}</p>
                    </div>
                    <ExternalLink className="h-3 w-3 text-gray-300 shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
