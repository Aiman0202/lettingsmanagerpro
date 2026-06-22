import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { X, Building2, ClipboardList, ShieldCheck, Wrench, FileText, Users, UserCheck, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const RESOURCE_ICONS: Record<string, React.ElementType> = {
  property: Building2,
  tenancy: ClipboardList,
  compliance: ShieldCheck,
  maintenance: Wrench,
  document: FileText,
  tenant: Users,
  landlord: UserCheck,
}

const RESOURCE_ROUTES: Record<string, string> = {
  property: '/properties',
  tenancy: '/tenancies',
  compliance: '/compliance',
  maintenance: '/maintenance',
}

function getHref(resource: string, resourceId: string | null): string | null {
  const base = RESOURCE_ROUTES[resource]
  if (!base) return null
  if (resourceId && (resource === 'property' || resource === 'tenancy')) {
    return `${base}/${resourceId}`
  }
  return base
}

interface ActivityFeedProps {
  onClose: () => void
}

export function ActivityFeed({ onClose }: ActivityFeedProps) {
  const { data: logs } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: async () => {
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25)
      return data ?? []
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white border-l border-gray-200 shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue-600" />
          Recent Activity
        </h2>
        <button
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto">
        {(logs ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No recent activity</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {(logs ?? []).map((entry: any) => {
              const Icon = RESOURCE_ICONS[entry.resource] ?? Activity
              const href = getHref(entry.resource, entry.resource_id)
              const timeAgo = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })

              const content = (
                <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium capitalize">{entry.action.replace(/_/g, ' ')}</span>
                      {' '}
                      <span className="text-gray-500">{entry.resource}</span>
                    </p>
                    {entry.details && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {typeof entry.details === 'object'
                          ? Object.entries(entry.details).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(', ')
                          : String(entry.details)}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo}</p>
                  </div>
                </div>
              )

              return (
                <li key={entry.id}>
                  {href ? (
                    <Link to={href} className="block">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
