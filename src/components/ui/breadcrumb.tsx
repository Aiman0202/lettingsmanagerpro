import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  className?: string
}

const ROUTE_LABELS: Record<string, string> = {
  'properties': 'Properties',
  'landlords': 'Landlords',
  'tenants': 'Tenants',
  'tenancies': 'Tenancies',
  'maintenance': 'Maintenance',
  'finance': 'Finance',
  'documents': 'Documents',
  'compliance': 'Compliance',
  'agreements': 'Agreements',
  'settings': 'Settings',
  'onboarding': 'Onboarding',
  'new': 'New',
}

export function Breadcrumbs({ items, className }: BreadcrumbProps) {
  const location = useLocation()

  // Auto-generate from route if no items provided
  const breadcrumbs: BreadcrumbItem[] = items ?? (() => {
    const segments = location.pathname.split('/').filter(Boolean)
    if (segments.length === 0) return [{ label: 'Dashboard', href: '/' }]

    const crumbs: BreadcrumbItem[] = [{ label: 'Dashboard', href: '/' }]
    let accumulatedPath = ''

    for (let i = 0; i < segments.length; i++) {
      accumulatedPath += '/' + segments[i]
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segments[i])

      if (isId && i > 0) {
        // ID segments: show parent label + detail
        const parentSegment = segments[i - 1]
        const parentLabel = ROUTE_LABELS[parentSegment] || parentSegment
        crumbs.push({ label: parentLabel, href: '/' + parentSegment })
        crumbs.push({ label: 'Details' })
      } else {
        const label = ROUTE_LABELS[segments[i]] || segments[i]
        crumbs.push({ label, href: accumulatedPath })
      }
    }

    return crumbs
  })()

  return (
    <nav aria-label="Breadcrumbs" className={cn('flex items-center gap-1 text-sm', className)}>
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1
        return (
          <div key={index} className="flex items-center gap-1 min-w-0">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            )}
            {crumb.href && !isLast ? (
              <Link
                to={crumb.href}
                className="text-gray-500 hover:text-gray-700 transition-colors truncate"
              >
                {index === 0 ? (
                  <span className="flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only">Dashboard</span>
                  </span>
                ) : (
                  crumb.label
                )}
              </Link>
            ) : (
              <span className={cn(
                'truncate',
                isLast ? 'font-medium text-gray-900' : 'text-gray-500'
              )}>
                {index === 0 ? (
                  <span className="flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only">Dashboard</span>
                  </span>
                ) : (
                  crumb.label
                )}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}
