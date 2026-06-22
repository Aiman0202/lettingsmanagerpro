import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '@/lib/utils'
import { ColumnVisibility } from '@/components/ui/ColumnVisibility'
import { useColumnVisibility, type ColumnConfig } from '@/hooks/useColumnVisibility'
import { FormField } from '@/components/ui/FormField'
import { maintenanceSchema, zodErrors } from '@/schemas/forms'

const priorityVariant: Record<string, any> = {
  low: 'secondary', medium: 'outline', high: 'warning', urgent: 'destructive',
}
const statusVariant: Record<string, any> = {
  open: 'destructive', in_progress: 'warning', resolved: 'success', closed: 'secondary',
}

const MAINTENANCE_COLUMNS: ColumnConfig[] = [
  { key: 'title', label: 'Title', defaultVisible: true },
  { key: 'property', label: 'Property', defaultVisible: true },
  { key: 'priority', label: 'Priority', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'reported', label: 'Reported', defaultVisible: true },
]

export default function MaintenancePage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showContractors, setShowContractors] = useState(false)
  const { isVisible, toggle } = useColumnVisibility('maintenance', MAINTENANCE_COLUMNS)

  const { data: requests, isLoading } = useQuery({
    queryKey: ['maintenance', search, statusFilter, priorityFilter],
    queryFn: async () => {
      let q = supabase
        .from('maintenance_requests')
        .select('*, properties(address)')
        .order('created_at', { ascending: false })
      if (statusFilter) q = q.eq('status', statusFilter)
      if (priorityFilter) q = q.eq('priority', priorityFilter)
      const { data } = await q
      return data ?? []
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-500 text-sm mt-1">{requests?.length ?? 0} requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowContractors(true)}>Contractors</Button>
          <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> New Request</Button>
        </div>
      </div>

      <Card className="no-print">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search requests..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-40">
              <option value="">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
            <ColumnVisibility columns={MAINTENANCE_COLUMNS} onToggle={toggle} isVisible={isVisible} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {isVisible('title') && <TableHead>Title</TableHead>}
              {isVisible('property') && <TableHead>Property</TableHead>}
              {isVisible('priority') && <TableHead>Priority</TableHead>}
              {isVisible('status') && <TableHead>Status</TableHead>}
              {isVisible('reported') && <TableHead>Reported</TableHead>}
              <TableHead className="no-print"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400">Loading…</TableCell></TableRow>
            ) : (requests ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Wrench className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-400">No maintenance requests</p>
                </TableCell>
              </TableRow>
            ) : (requests ?? []).map((r: any) => (
              <TableRow key={r.id}>
                {isVisible('title') && <TableCell className="font-medium">{r.title}</TableCell>}
                {isVisible('property') && <TableCell>{r.properties?.address ?? '—'}</TableCell>}
                {isVisible('priority') && <TableCell><Badge variant={priorityVariant[r.priority]}>{r.priority}</Badge></TableCell>}
                {isVisible('status') && <TableCell><Badge variant={statusVariant[r.status]}>{r.status.replace(/_/g, ' ')}</Badge></TableCell>}
                {isVisible('reported') && <TableCell>{formatDate(r.created_at)}</TableCell>}
                <TableCell className="no-print">
                  <Link to={`/maintenance/${r.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <MaintenanceFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['maintenance'] }) }}
      />
      <ContractorsDialog open={showContractors} onClose={() => setShowContractors(false)} />
    </div>
  )
}

function MaintenanceFormDialog({ open, onClose, onSaved }: {
  open: boolean; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({
    property_id: '', title: '', description: '', priority: 'medium', status: 'open',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: properties } = useQuery({
    queryKey: ['properties-dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('id, address').order('address')
      return data ?? []
    },
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const result = maintenanceSchema.safeParse(form)
    if (!result.success) {
      setErrors(zodErrors(result))
      return
    }
    setErrors({})
    setSaving(true)
    await supabase.from('maintenance_requests').insert({
      property_id: form.property_id,
      title: form.title,
      description: form.description || null,
      priority: form.priority as any,
      status: form.status as any,
    })
    setSaving(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader><DialogTitle>New Maintenance Request</DialogTitle></DialogHeader>
          <div className="p-6 space-y-4">
            <FormField label="Property" error={errors.property_id} required>
              <Select value={form.property_id} onChange={(e) => { setForm({ ...form, property_id: e.target.value }); setErrors((p) => ({ ...p, property_id: '' })) }}>
                <option value="">Select property…</option>
                {(properties ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.address}</option>)}
              </Select>
            </FormField>
            <FormField label="Title" error={errors.title} required>
              <Input value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); setErrors((p) => ({ ...p, title: '' })) }} />
            </FormField>
            <FormField label="Description">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Priority">
                <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </FormField>
              <FormField label="Status">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                </Select>
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create Request'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ContractorsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', trade: '', email: '', phone: '', insurance_expiry: '' })
  const [saving, setSaving] = useState(false)

  const { data: contractors } = useQuery({
    queryKey: ['contractors'],
    queryFn: async () => {
      const { data } = await supabase.from('contractors').select('*').order('name')
      return data ?? []
    },
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('contractors').insert({
      name: form.name, trade: form.trade,
      email: form.email || null, phone: form.phone || null,
      insurance_expiry: form.insurance_expiry || null,
    })
    setSaving(false)
    qc.invalidateQueries({ queryKey: ['contractors'] })
    setShowAdd(false)
    setForm({ name: '', trade: '', email: '', phone: '', insurance_expiry: '' })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contractors</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          {!showAdd ? (
            <>
              <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add Contractor</Button>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Insurance Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(contractors ?? []).length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-6">No contractors</TableCell></TableRow>
                  ) : (contractors ?? []).map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.trade}</TableCell>
                      <TableCell>{c.phone ?? '—'}</TableCell>
                      <TableCell>{formatDate(c.insurance_expiry)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Trade *</Label>
                  <Input value={form.trade} onChange={(e) => setForm({ ...form, trade: e.target.value })} required placeholder="Plumber, Electrician…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Insurance Expiry</Label>
                  <Input type="date" value={form.insurance_expiry} onChange={(e) => setForm({ ...form, insurance_expiry: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Back</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add'}</Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
