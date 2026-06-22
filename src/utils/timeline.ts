import { supabase } from '@/lib/supabase'

export interface TimelineEvent {
  id: string
  date: string
  type: 'tenancy_started' | 'tenancy_ended' | 'tenant_added' | 'compliance_added' |
        'compliance_expiring' | 'maintenance_request' | 'maintenance_completed' |
        'rent_received' | 'rent_overdue' | 'expense' | 'landlord_payout' | 'document' |
        'ticket_enquiry' | 'ticket_notice' | 'ticket_issue' | 'ticket_action_item' |
        'checklist_completed' | 'inspection_performed' | 'termination_recorded' |
        'renewal' | 'amendment' | 'tenancy_created' |
        'audit_property_created' | 'audit_property_updated' | 'audit_property_deactivated' |
        'audit_photo_uploaded' | 'audit_compliance_added' | 'audit_ticket_created'
  category: 'tenancies' | 'compliance' | 'maintenance' | 'finance' | 'documents' | 'tickets' | 'lifecycle' | 'audit'
  description: string
  amount: number | null
  metadata?: Record<string, any>
}

export interface PropertyFinancialSummary {
  totalRentReceived: number
  totalMaintenanceCosts: number
  totalExpenses: number
  totalLandlordPayouts: number
  netBalance: number
  openTickets: number
  urgentTickets: number
}

export async function fetchPropertyTimeline(propertyId: string): Promise<{ events: TimelineEvent[]; summary: PropertyFinancialSummary }> {
  const events: TimelineEvent[] = []

  // Fetch property to get landlord_id
  const { data: property } = await supabase
    .from('properties')
    .select('id, landlord_id, address')
    .eq('id', propertyId)
    .single()

  if (!property) return { events: [], summary: emptySummary() }

  const landlordId = (property as any).landlord_id

  // Parallel fetches
  const [tenanciesRes, complianceRes, maintenanceRes, expensesRes, documentsRes, ticketsRes, auditRes] = await Promise.all([
    supabase.from('tenancies').select('id, start_date, end_date, rent_amount, status, created_at').eq('property_id', propertyId),
    supabase.from('property_compliance').select('id, type, expiry_date, created_at').eq('property_id', propertyId),
    supabase.from('maintenance_requests').select('id, title, created_at, status, priority, maintenance_jobs(id, cost, completed_date)').eq('property_id', propertyId),
    supabase.from('expenses').select('id, category, amount, date, description').eq('property_id', propertyId),
    supabase.from('documents').select('id, name, uploaded_at, category').eq('entity_type', 'property').eq('entity_id', propertyId),
    supabase.from('property_tickets').select('id, type, subtype, title, description, priority, status, due_date, created_at, updated_at').eq('property_id', propertyId).order('created_at', { ascending: false }),
    supabase.from('audit_log').select('id, action, resource, resource_id, details, created_at').eq('resource', 'property').eq('resource_id', propertyId).order('created_at', { ascending: false }),
  ])

  // Process tenancies
  for (const t of (tenanciesRes.data as any[]) ?? []) {
    events.push({
      id: `tenancy-start-${t.id}`,
      date: t.start_date,
      type: 'tenancy_started',
      category: 'tenancies',
      description: `Tenancy started — £${t.rent_amount?.toLocaleString()}/month`,
      amount: t.rent_amount,
    })
    if (t.status === 'expired' || new Date(t.end_date) < new Date()) {
      events.push({
        id: `tenancy-end-${t.id}`,
        date: t.end_date,
        type: 'tenancy_ended',
        category: 'tenancies',
        description: 'Tenancy ended',
        amount: null,
      })
    }

    // Fetch rent transactions for this tenancy
    const { data: rentTxns } = await supabase
      .from('rent_transactions')
      .select('id, amount, due_date, paid_date, status')
      .eq('tenancy_id', t.id)

    for (const rt of (rentTxns as any[]) ?? []) {
      if (rt.status === 'paid' && rt.paid_date) {
        events.push({
          id: `rent-paid-${rt.id}`,
          date: rt.paid_date,
          type: 'rent_received',
          category: 'finance',
          description: 'Rent received',
          amount: rt.amount,
        })
      } else if (rt.status === 'overdue') {
        events.push({
          id: `rent-overdue-${rt.id}`,
          date: rt.due_date,
          type: 'rent_overdue',
          category: 'finance',
          description: 'Rent overdue',
          amount: rt.amount,
        })
      }
    }
  }

  // Process compliance
  for (const c of (complianceRes.data as any[]) ?? []) {
    events.push({
      id: `compliance-added-${c.id}`,
      date: c.created_at,
      type: 'compliance_added',
      category: 'compliance',
      description: `${c.type.replace(/_/g, ' ').toUpperCase()} certificate added — expires ${new Date(c.expiry_date).toLocaleDateString('en-GB')}`,
      amount: null,
    })
  }

  // Process maintenance
  for (const m of (maintenanceRes.data as any[]) ?? []) {
    events.push({
      id: `maintenance-${m.id}`,
      date: m.created_at,
      type: 'maintenance_request',
      category: 'maintenance',
      description: `Maintenance: ${m.title} (${m.priority})`,
      amount: null,
    })
    for (const job of (m.maintenance_jobs as any[]) ?? []) {
      if (job.completed_date) {
        events.push({
          id: `job-completed-${job.id}`,
          date: job.completed_date,
          type: 'maintenance_completed',
          category: 'maintenance',
          description: `Job completed — ${m.title}`,
          amount: job.cost ?? null,
        })
      }
    }
  }

  // Process expenses
  for (const e of (expensesRes.data as any[]) ?? []) {
    events.push({
      id: `expense-${e.id}`,
      date: e.date,
      type: 'expense',
      category: 'finance',
      description: `Expense: ${e.category}${e.description ? ` — ${e.description}` : ''}`,
      amount: e.amount,
    })
  }

  // Process documents
  for (const d of (documentsRes.data as any[]) ?? []) {
    events.push({
      id: `document-${d.id}`,
      date: d.uploaded_at,
      type: 'document',
      category: 'documents',
      description: `Document uploaded: ${d.name} (${d.category})`,
      amount: null,
    })
  }

  // Process tickets
  for (const t of (ticketsRes.data as any[]) ?? []) {
    const typeLabel = t.type === 'action_item' ? 'action' : t.type
    const dueText = t.due_date ? ` (due: ${new Date(t.due_date).toLocaleDateString('en-GB')})` : ''
    const ticketType = `ticket_${t.type}` as TimelineEvent['type']
    events.push({
      id: `ticket-${t.id}`,
      date: t.created_at,
      type: ticketType,
      category: 'tickets',
      description: `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)}: ${t.title}${dueText}`,
      amount: null,
      metadata: { ticketId: t.id, status: t.status, priority: t.priority, type: t.type, subtype: t.subtype },
    })
  }

  // Process landlord statements if we have a landlord
  if (landlordId) {
    const { data: statements } = await supabase
      .from('landlord_statements')
      .select('id, period_start, period_end, net_payout, paid_at')
      .eq('landlord_id', landlordId)
      .not('paid_at', 'is', null)

    for (const s of (statements as any[]) ?? []) {
      events.push({
        id: `payout-${s.id}`,
        date: s.paid_at,
        type: 'landlord_payout',
        category: 'finance',
        description: `Landlord payout — period ${new Date(s.period_start).toLocaleDateString('en-GB')} to ${new Date(s.period_end).toLocaleDateString('en-GB')}`,
        amount: s.net_payout,
      })
    }
  }

  // Process audit log entries
  for (const a of (auditRes.data as any[]) ?? []) {
    const actionType = `audit_${a.action}` as TimelineEvent['type']
    const detail = a.details as Record<string, any> | null
    let desc = ''
    switch (a.action) {
      case 'created':
        desc = `Property created${detail?.reference_number ? ` — ${detail.reference_number}` : ''}`
        break
      case 'updated':
        desc = `Property updated${detail?.address ? ` — ${detail.address}` : ''}`
        break
      case 'deactivated':
        desc = 'Property deactivated'
        break
      case 'photo_uploaded':
        desc = `${detail?.count ?? 1} photo(s) uploaded`
        break
      case 'compliance_added':
        desc = `Compliance certificate added — ${detail?.type?.replace(/_/g, ' ') ?? ''}`
        break
      case 'ticket_created':
        desc = `Ticket created — ${detail?.title ?? ''} (${detail?.priority ?? ''})`
        break
      default:
        desc = a.action.replace(/_/g, ' ')
    }
    events.push({
      id: `audit-${a.id}`,
      date: a.created_at,
      type: actionType,
      category: 'audit',
      description: desc,
      amount: null,
      metadata: detail ?? undefined,
    })
  }

  // Sort by date descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Build financial summary
  const summary: PropertyFinancialSummary = {
    totalRentReceived: events.filter(e => e.type === 'rent_received').reduce((sum, e) => sum + (e.amount ?? 0), 0),
    totalMaintenanceCosts: events.filter(e => e.type === 'maintenance_completed').reduce((sum, e) => sum + (e.amount ?? 0), 0),
    totalExpenses: events.filter(e => e.type === 'expense').reduce((sum, e) => sum + (e.amount ?? 0), 0),
    totalLandlordPayouts: events.filter(e => e.type === 'landlord_payout').reduce((sum, e) => sum + (e.amount ?? 0), 0),
    netBalance: 0,
    openTickets: events.filter(e => e.category === 'tickets' && ['open', 'in_progress'].includes(e.metadata?.status)).length,
    urgentTickets: events.filter(e => e.category === 'tickets' && e.metadata?.priority === 'urgent' && ['open', 'in_progress'].includes(e.metadata?.status)).length,
  }
  summary.netBalance = summary.totalRentReceived - summary.totalMaintenanceCosts - summary.totalExpenses - summary.totalLandlordPayouts

  return { events, summary }
}

function emptySummary(): PropertyFinancialSummary {
  return {
    totalRentReceived: 0,
    totalMaintenanceCosts: 0,
    totalExpenses: 0,
    totalLandlordPayouts: 0,
    netBalance: 0,
    openTickets: 0,
    urgentTickets: 0,
  }
}

export async function fetchTenancyTimeline(tenancyId: string): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = []

  // Fetch tenancy details
  const { data: tenancy } = await supabase
    .from('tenancies')
    .select('id, start_date, end_date, rent_amount, created_at, status')
    .eq('id', tenancyId)
    .single()

  if (!tenancy) return events
  const t = tenancy as any

  // Tenancy created
  events.push({
    id: `tenancy-created-${t.id}`,
    date: t.created_at,
    type: 'tenancy_created',
    category: 'lifecycle',
    description: 'Tenancy created',
    amount: t.rent_amount,
  })

  // Checklists (move-in / move-out)
  const { data: checklists } = await supabase
    .from('tenancy_checklists')
    .select('id, type, created_at')
    .eq('tenancy_id', tenancyId)

  for (const c of (checklists as any[]) ?? []) {
    events.push({
      id: `checklist-${c.id}`,
      date: c.created_at,
      type: 'checklist_completed',
      category: 'lifecycle',
      description: `${c.type === 'move_in' ? 'Move-in' : 'Move-out'} checklist completed`,
      amount: null,
    })
  }

  // Inspections
  const { data: inspections } = await supabase
    .from('tenancy_inspections')
    .select('id, type, inspection_date, inspector_name, overall_condition')
    .eq('tenancy_id', tenancyId)

  for (const insp of (inspections as any[]) ?? []) {
    events.push({
      id: `inspection-${insp.id}`,
      date: insp.inspection_date,
      type: 'inspection_performed',
      category: 'lifecycle',
      description: `${insp.type.replace('_', '-')} inspection by ${insp.inspector_name} — ${insp.overall_condition}`,
      amount: null,
    })
  }

  // Terminations
  const { data: terminations } = await supabase
    .from('tenancy_terminations')
    .select('id, notice_date, effective_date, reason_category')
    .eq('tenancy_id', tenancyId)

  for (const term of (terminations as any[]) ?? []) {
    events.push({
      id: `termination-${term.id}`,
      date: term.notice_date,
      type: 'termination_recorded',
      category: 'lifecycle',
      description: `Termination recorded — ${term.reason_category} (effective ${term.effective_date})`,
      amount: null,
    })
  }

  // Renewals
  const { data: renewals } = await supabase
    .from('tenancy_renewals')
    .select('id, new_end_date, new_rent, created_at')
    .eq('tenancy_id', tenancyId)

  for (const ren of (renewals as any[]) ?? []) {
    events.push({
      id: `renewal-${ren.id}`,
      date: ren.created_at,
      type: 'renewal',
      category: 'lifecycle',
            description: `Tenancy renewed — end date ${ren.new_end_date}, £${ren.new_rent?.toLocaleString()}/month`,
            amount: ren.new_rent,
    })
  }

  // Status transitions
  const { data: statusLog } = await supabase
    .from('tenancy_status_log')
    .select('id, from_status, to_status, reason, created_at')
    .eq('tenancy_id', tenancyId)

  for (const sl of (statusLog as any[]) ?? []) {
    events.push({
      id: `status-${sl.id}`,
      date: sl.created_at,
      type: 'tenancy_created',
      category: 'lifecycle',
      description: `Status changed from ${sl.from_status ?? 'N/A'} to ${sl.to_status}${sl.reason ? ` — ${sl.reason.split('—')[0]}` : ''}`,
      amount: null,
    })
  }

  // Sort by date descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return events
}
