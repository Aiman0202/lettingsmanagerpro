import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/contexts/ToastContext'
import { handleApiError } from '@/utils/validation'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  PoundSterling, Plus, AlertTriangle, Phone, Mail, FileText, MessageSquare,
  BellRing, Handshake, CheckCircle, ChevronLeft, Clock, Calendar, ArrowUpRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'

// ============================================================
// CONSTANTS
// ============================================================

const ACTION_TYPES = [
  { value: 'phone_call', label: 'Phone Call', icon: Phone, color: 'text-blue-600 bg-blue-50' },
  { value: 'email', label: 'Email', icon: Mail, color: 'text-purple-600 bg-purple-50' },
  { value: 'letter', label: 'Letter Sent', icon: FileText, color: 'text-amber-600 bg-amber-50' },
  { value: 'sms', label: 'SMS / Text', icon: MessageSquare, color: 'text-green-600 bg-green-50' },
  { value: 'visit', label: 'Property Visit', icon: BellRing, color: 'text-orange-600 bg-orange-50' },
  { value: 'section_8_notice', label: 'Section 8 Notice', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  { value: 'section_21_notice', label: 'Section 21 Notice', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  { value: 'payment_plan_agreed', label: 'Payment Plan Agreed', icon: Handshake, color: 'text-teal-600 bg-teal-50' },
  { value: 'payment_received', label: 'Payment Received', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  { value: 'other', label: 'Other', icon: FileText, color: 'text-gray-600 bg-gray-50' },
]

const ACTION_LABELS: Record<string, string> = Object.fromEntries(
  ACTION_TYPES.map(a => [a.value, a.label])
)

const STATUS_LABELS: Record<string, { label: string; variant: any }> = {
  active: { label: 'Active', variant: 'outline' },
  arrears: { label: 'In Arrears', variant: 'destructive' },
  payment_plan: { label: 'Payment Plan', variant: 'warning' },
  legal_proceedings: { label: 'Legal', variant: 'destructive' },
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ArrearsPage() {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [showLogAction, setShowLogAction] = useState(false)
  const [selectedTenancy, setSelectedTenancy] = useState<any>(null)
  const [detailTenancy, setDetailTenancy] = useState<any>(null)
  const [filterText, setFilterText] = useState('')

  // All rent transactions (overdue + pending that are past due)
  const { data: overdueData, isLoading } = useQuery({
    queryKey: ['arrears-overdue'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      // Get overdue AND pending-but-past-due transactions
      const { data } = await supabase
        .from('rent_transactions')
        .select('*, tenancies!inner(id, property_id, landlord_id, status, properties(address, postcode), landlords(full_name, email, phone))')
        .in('status', ['overdue', 'pending'])
        .lte('due_date', today)
        .order('due_date', { ascending: true })
        .limit(200)
      return (data ?? []) as any[]
    },
  })

  // Last action per tenancy
  const { data: lastActions } = useQuery({
    queryKey: ['arrears-last-actions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('arrears_actions')
        .select('*')
        .order('action_date', { ascending: false })
        .limit(200)
      return data ?? []
    },
    enabled: true,
  })

  // Group by tenancy
  const grouped = useMemo(() => {
    if (!overdueData) return []
    const map = new Map<string, { tenancy: any; transactions: any[]; total: number; worstDaysAgo: number }>()
    for (const t of overdueData) {
      const tid = t.tenancy_id
      if (!map.has(tid)) {
        map.set(tid, { tenancy: t.tenancies, transactions: [], total: 0, worstDaysAgo: 0 })
      }
      const g = map.get(tid)!
      g.transactions.push(t)
      g.total += t.amount
      const d = daysAgo(t.due_date)
      if (d > g.worstDaysAgo) g.worstDaysAgo = d
    }
    return Array.from(map.values())
      .filter(g => {
        if (!filterText) return true
        const addr = (g.tenancy?.properties?.address ?? '').toLowerCase()
        const ll = (g.tenancy?.landlords?.full_name ?? '').toLowerCase()
        const q = filterText.toLowerCase()
        return addr.includes(q) || ll.includes(q)
      })
      .sort((a, b) => b.total - a.total)
  }, [overdueData, filterText])

  // Get last action for a tenancy
  function getLastAction(tenancyId: string) {
    return (lastActions ?? []).find((a: any) => a.tenancy_id === tenancyId)
  }

  const totalArrears = grouped.reduce((s, g) => s + g.total, 0)
  const tenanciesInArrears = grouped.length

  // Query tenant names for detail modal
  const { data: tenantNames } = useQuery({
    queryKey: ['arrears-tenants', detailTenancy?.tenancy?.id],
    queryFn: async () => {
      if (!detailTenancy?.tenancy?.id) return []
      const { data } = await supabase
        .from('tenancy_tenants')
        .select('tenants(full_name, email, phone)')
        .eq('tenancy_id', detailTenancy.tenancy.id)
      return (data ?? []).map((t: any) => t.tenants).filter(Boolean)
    },
    enabled: !!detailTenancy?.tenancy?.id,
  })

  // Actions timeline for detail modal
  const { data: detailActions } = useQuery({
    queryKey: ['arrears-detail-actions', detailTenancy?.tenancy?.id],
    queryFn: async () => {
      if (!detailTenancy?.tenancy?.id) return []
      const { data } = await supabase
        .from('arrears_actions')
        .select('*')
        .eq('tenancy_id', detailTenancy.tenancy.id)
        .order('action_date', { ascending: false })
      return data ?? []
    },
    enabled: !!detailTenancy?.tenancy?.id,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/finance"><Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Arrears</h1>
          <p className="text-gray-500 text-sm mt-1">Track overdue rent and manage recovery actions</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <PoundSterling className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Arrears</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalArrears)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tenancies in Arrears</p>
              <p className="text-xl font-bold text-amber-600">{tenanciesInArrears}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Follow-ups Due Today</p>
              <p className="text-xl font-bold text-blue-600">
                {(lastActions ?? []).filter((a: any) => a.follow_up_date === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by property address or landlord…"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Arrears Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Landlord</TableHead>
              <TableHead className="text-right">Arrears</TableHead>
              <TableHead>Overdue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Action</TableHead>
              <TableHead>Next Follow-up</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">Loading…</TableCell></TableRow>
            ) : grouped.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">
                {filterText ? 'No matching arrears' : 'No tenants in arrears — everything is up to date'}
              </TableCell></TableRow>
            ) : grouped.map(g => {
              const lastAction = getLastAction(g.tenancy?.id)
              const status = g.tenancy?.status ?? 'active'
              const statusInfo = STATUS_LABELS[status] ?? { label: status, variant: 'outline' }
              return (
                <TableRow key={g.tenancy?.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setDetailTenancy(g)}>
                  <TableCell>
                    <p className="font-medium text-gray-900">{g.tenancy?.properties?.address ?? '—'}</p>
                    <p className="text-xs text-gray-400">{g.tenancy?.properties?.postcode}</p>
                  </TableCell>
                  <TableCell className="text-sm">{g.tenancy?.landlords?.full_name ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-red-600">{formatCurrency(g.total)}</span>
                    <p className="text-xs text-gray-400">{g.transactions.length} payment(s)</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-red-600 font-medium">{g.worstDaysAgo}d ago</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {lastAction ? (
                      <div>
                        <span>{ACTION_LABELS[lastAction.action_type] ?? lastAction.action_type}</span>
                        <p className="text-xs text-gray-400">{formatDate(lastAction.action_date)}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">No actions yet</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {lastAction?.follow_up_date ? (
                      <span className={new Date(lastAction.follow_up_date) <= new Date() ? 'text-red-600 font-medium' : 'text-gray-500'}>
                        {formatDate(lastAction.follow_up_date)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); setSelectedTenancy(g.tenancy); setShowLogAction(true); }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Log Action
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Log Action Dialog */}
      <LogActionDialog
        open={showLogAction}
        onClose={() => setShowLogAction(false)}
        tenancy={selectedTenancy}
        onSaved={() => {
          setShowLogAction(false)
          qc.invalidateQueries({ queryKey: ['arrears-last-actions'] })
          qc.invalidateQueries({ queryKey: ['arrears-detail-actions'] })
        }}
      />

      {/* Detail Modal */}
      <DetailModal
        data={detailTenancy}
        onClose={() => setDetailTenancy(null)}
        tenantNames={tenantNames ?? []}
        actions={detailActions ?? []}
      />
    </div>
  )
}

// ============================================================
// LOG ACTION DIALOG
// ============================================================

function LogActionDialog({ open, onClose, tenancy, onSaved }: {
  open: boolean; onClose: () => void; tenancy: any; onSaved: () => void
}) {
  const { success, error: showError } = useToast()
  const [form, setForm] = useState({ action_type: 'phone_call', action_date: new Date().toISOString().split('T')[0], notes: '', follow_up_date: '' })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      // Insert action
      const { error } = await supabase.from('arrears_actions').insert({
        tenancy_id: tenancy?.id,
        action_type: form.action_type,
        action_date: form.action_date,
        notes: form.notes || null,
        follow_up_date: form.follow_up_date || null,
      } as any)

      if (error) throw error

      // Update tenancy status based on action type
      if (['section_8_notice', 'section_21_notice'].includes(form.action_type)) {
        await (supabase.from('tenancies') as any).update({ status: 'legal_proceedings' }).eq('id', tenancy?.id)
      } else if (form.action_type === 'payment_plan_agreed') {
        await (supabase.from('tenancies') as any).update({ status: 'payment_plan' }).eq('id', tenancy?.id)
      } else if (tenancy?.status === 'active' || tenancy?.status === 'draft') {
        await (supabase.from('tenancies') as any).update({ status: 'arrears' }).eq('id', tenancy?.id)
      }

      success('Action logged', `${ACTION_LABELS[form.action_type]} recorded`)
      onSaved()
    } catch (err) {
      showError('Failed', handleApiError(err, 'log action'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-md">
        <DialogHeader><DialogTitle>Log Arrears Action</DialogTitle></DialogHeader>
        <div className="p-6 space-y-4">
          {tenancy && (
            <div className="border rounded p-3 bg-gray-50 text-sm">
              <p className="font-medium">{tenancy?.properties?.address ?? '—'}</p>
              <p className="text-xs text-gray-500">{tenancy?.landlords?.full_name ?? '—'}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Action Type *</Label>
            <Select value={form.action_type} onChange={e => setForm({ ...form, action_type: e.target.value })}>
              {ACTION_TYPES.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Action Date</Label>
              <Input type="date" value={form.action_date} onChange={e => setForm({ ...form, action_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Follow-up Date</Label>
              <Input type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="What happened? What was agreed?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Log Action'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// DETAIL MODAL
// ============================================================

function DetailModal({ data, onClose, tenantNames, actions }: {
  data: any; onClose: () => void; tenantNames: any[]; actions: any[]
}) {
  if (!data) return null

  return (
    <Dialog open={!!data} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" /> Arrears Detail
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-6">
          {/* Property & Landlord */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Property</p>
              <p className="font-medium">{data.tenancy?.properties?.address ?? '—'}</p>
              <p className="text-xs text-gray-400">{data.tenancy?.properties?.postcode}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Landlord</p>
              <p className="font-medium">{data.tenancy?.landlords?.full_name ?? '—'}</p>
              {data.tenancy?.landlords?.email && <p className="text-xs text-blue-600">{data.tenancy.landlords.email}</p>}
              {data.tenancy?.landlords?.phone && <p className="text-xs text-gray-500">{data.tenancy.landlords.phone}</p>}
            </div>
          </div>

          {/* Tenants */}
          {tenantNames.length > 0 && (
            <div className="border rounded p-3">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Tenants</p>
              <div className="space-y-1">
                {tenantNames.map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{t.full_name}</span>
                    <span className="text-xs text-gray-400">{t.email}{t.phone ? ` · ${t.phone}` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Transactions */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
              Overdue Payments ({data.transactions.length})
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(t.due_date)}</TableCell>
                    <TableCell>
                      <span className="text-red-600 font-medium">{daysAgo(t.due_date)}d</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(t.amount)}</TableCell>
                    <TableCell><Badge variant={t.status === 'overdue' ? 'destructive' : 'outline'}>{t.status}</Badge></TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(data.total)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Action Timeline */}
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-3">
              Action Timeline ({actions.length})
            </p>
            {actions.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No actions recorded yet</p>
            ) : (
              <div className="space-y-0 relative pl-6 border-l-2 border-gray-200">
                {actions.map((a: any) => {
                  const typeInfo = ACTION_TYPES.find(at => at.value === a.action_type)
                  const Icon = typeInfo?.icon ?? FileText
                  return (
                    <div key={a.id} className="relative pb-4 last:pb-0">
                      <div className={`absolute -left-[calc(0.75rem+3px)] top-0 h-6 w-6 rounded-full flex items-center justify-center ${typeInfo?.color ?? 'bg-gray-100'}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{typeInfo?.label ?? a.action_type}</span>
                          <span className="text-xs text-gray-400">{formatDate(a.action_date)}</span>
                        </div>
                        {a.notes && <p className="text-sm text-gray-600 mt-1">{a.notes}</p>}
                        {a.follow_up_date && (
                          <p className="text-xs text-blue-600 mt-1">Follow-up: {formatDate(a.follow_up_date)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="pt-2 border-t flex gap-3">
            <Link to={`/tenancies/${data.tenancy?.id}`}>
              <Button variant="outline" size="sm"><ArrowUpRight className="h-3 w-3 mr-1" /> View Tenancy</Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
