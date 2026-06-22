import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { fetchPropertyTimeline, type TimelineEvent } from '@/utils/timeline'
import { formatCurrency, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  ClipboardList, UserPlus, ShieldCheck, AlertTriangle, Wrench, CheckCircle,
  PoundSterling, Receipt, Banknote, FileText, Activity,
  MessageSquare, FileWarning, AlertCircle, CheckSquare,
  Building2, Camera, PenLine, TicketCheck, PlusCircle,
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, any> = {
  tenancy_started: ClipboardList,
  tenancy_ended: ClipboardList,
  tenant_added: UserPlus,
  compliance_added: ShieldCheck,
  compliance_expiring: AlertTriangle,
  maintenance_request: Wrench,
  maintenance_completed: CheckCircle,
  rent_received: PoundSterling,
  rent_overdue: AlertTriangle,
  expense: Receipt,
  landlord_payout: Banknote,
  document: FileText,
  ticket_enquiry: MessageSquare,
  ticket_notice: FileWarning,
  ticket_issue: AlertCircle,
  ticket_action_item: CheckSquare,
  audit_property_created: Building2,
  audit_property_updated: PenLine,
  audit_property_deactivated: AlertCircle,
  audit_photo_uploaded: Camera,
  audit_compliance_added: ShieldCheck,
  audit_ticket_created: TicketCheck,
}

const CATEGORY_COLORS: Record<string, string> = {
  tenancy_started: 'text-blue-600 bg-blue-50',
  tenancy_ended: 'text-gray-500 bg-gray-50',
  tenant_added: 'text-blue-600 bg-blue-50',
  compliance_added: 'text-green-600 bg-green-50',
  compliance_expiring: 'text-amber-600 bg-amber-50',
  maintenance_request: 'text-orange-600 bg-orange-50',
  maintenance_completed: 'text-green-600 bg-green-50',
  rent_received: 'text-green-600 bg-green-50',
  rent_overdue: 'text-red-600 bg-red-50',
  expense: 'text-red-600 bg-red-50',
  landlord_payout: 'text-purple-600 bg-purple-50',
  document: 'text-gray-500 bg-gray-50',
  ticket_enquiry: 'text-blue-600 bg-blue-50',
  ticket_notice: 'text-amber-600 bg-amber-50',
  ticket_issue: 'text-red-600 bg-red-50',
  ticket_action_item: 'text-purple-600 bg-purple-50',
  audit_property_created: 'text-blue-600 bg-blue-50',
  audit_property_updated: 'text-gray-600 bg-gray-50',
  audit_property_deactivated: 'text-red-500 bg-red-50',
  audit_photo_uploaded: 'text-indigo-600 bg-indigo-50',
  audit_compliance_added: 'text-green-600 bg-green-50',
  audit_ticket_created: 'text-amber-600 bg-amber-50',
}

const FILTER_CATEGORIES = [
  { key: 'tenancies', label: 'Tenancies' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'finance', label: 'Finance' },
  { key: 'documents', label: 'Documents' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'audit', label: 'Activity Log' },
] as const

export default function PropertyTimeline({ propertyId }: { propertyId: string }) {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['property-timeline', propertyId],
    queryFn: () => fetchPropertyTimeline(propertyId),
  })

  const events = useMemo(() => {
    if (!data?.events) return []
    if (activeFilters.size === 0) return data.events
    return data.events.filter((e) => activeFilters.has(e.category))
  }, [data, activeFilters])

  function toggleFilter(cat: string) {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-400">
          <Activity className="h-6 w-6 mx-auto mb-2 animate-pulse" />
          Loading timeline…
        </CardContent>
      </Card>
    )
  }

  if (!data || data.events.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-gray-400">
          <Activity className="h-6 w-6 mx-auto mb-2" />
          No activity recorded for this property yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Financial summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <SummaryCard label="Rent Received" value={data.summary.totalRentReceived} color="text-green-600" />
        <SummaryCard label="Maintenance" value={data.summary.totalMaintenanceCosts} color="text-red-600" />
        <SummaryCard label="Expenses" value={data.summary.totalExpenses} color="text-red-600" />
        <SummaryCard label="Landlord Payouts" value={data.summary.totalLandlordPayouts} color="text-purple-600" />
        <SummaryCard label="Net Balance" value={data.summary.netBalance} color={data.summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'} />
        <SummaryCard label="Open Tickets" value={data.summary.openTickets} color="text-blue-600" />
        <SummaryCard label="Urgent" value={data.summary.urgentTickets} color="text-red-600" />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveFilters(new Set())}
          className={`px-3 py-1 text-xs rounded-full border ${activeFilters.size === 0 ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
        >
          All
        </button>
        {FILTER_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => toggleFilter(cat.key)}
            className={`px-3 py-1 text-xs rounded-full border ${activeFilters.has(cat.key) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" /> Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative border-l-2 border-gray-100 pl-6 space-y-5">
            {events.map((event) => {
              const Icon = CATEGORY_ICONS[event.type] ?? FileText
              const colorClass = CATEGORY_COLORS[event.type] ?? 'text-gray-500 bg-gray-50'
              return (
                <div key={event.id} className="relative">
                  {/* Icon dot */}
                  <div className={`absolute -left-8 top-0.5 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs text-gray-400 font-mono">
                      {formatDate(event.date)}
                    </span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {event.type.replace(/_/g, ' ')}
                    </Badge>
                    {event.amount !== null && (
                      <span className={`text-sm font-semibold ${event.amount > 0 && (event.type === 'rent_received' || event.type === 'landlord_payout') ? 'text-green-600' : 'text-red-600'}`}>
                        {event.type === 'landlord_payout' || event.type === 'expense' || event.type === 'maintenance_completed' ? '-' : '+'}
                        {formatCurrency(event.amount)}
                      </span>
                    )}
                    {event.type.startsWith('ticket_') && (
                      <>
                        <Badge variant={getPriorityBadgeVariant(event.metadata?.priority)} className="text-xs">
                          {event.metadata?.priority}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(event.metadata?.status)} className="text-xs">
                          {event.metadata?.status}
                        </Badge>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{event.description}</p>
                  {event.type.startsWith('ticket_') && (
                    <TicketActions
                      ticketId={event.metadata?.ticketId}
                      status={event.metadata?.status}
                      onStatusChange={() => qc.invalidateQueries({ queryKey: ['property-timeline', propertyId] })}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
    </div>
  )
}

function getPriorityBadgeVariant(priority: string): 'default' | 'destructive' | 'outline' | 'secondary' {
  switch (priority) {
    case 'urgent': return 'destructive'
    case 'high': return 'default'
    case 'medium': return 'outline'
    case 'low': return 'secondary'
    default: return 'outline'
  }
}

function getStatusBadgeVariant(status: string): 'default' | 'destructive' | 'outline' | 'secondary' {
  switch (status) {
    case 'open': return 'default'
    case 'in_progress': return 'secondary'
    case 'resolved': return 'outline'
    case 'closed': return 'outline'
    default: return 'outline'
  }
}

function TicketActions({ ticketId, status, onStatusChange }: { ticketId: string; status: string; onStatusChange: () => void }) {
  async function updateStatus(newStatus: string) {
    await (supabase.from('property_tickets') as any).update({
      status: newStatus,
      resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', ticketId)
    onStatusChange()
  }

  if (status === 'resolved' || status === 'closed') return null

  return (
    <div className="mt-2 flex gap-2">
      {status === 'open' && (
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateStatus('in_progress')}>
          Start
        </Button>
      )}
      {status !== 'resolved' && (
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => updateStatus('resolved')}>
          Resolve
        </Button>
      )}
    </div>
  )
}
