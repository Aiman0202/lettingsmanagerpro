import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Search, Users, Power, Trash2, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '@/lib/utils'
import { ColumnVisibility } from '@/components/ui/ColumnVisibility'
import { useColumnVisibility, type ColumnConfig } from '@/hooks/useColumnVisibility'
import { FormField } from '@/components/ui/FormField'
import { tenantSchema, zodErrors } from '@/schemas/forms'

type TenantFilter = 'all' | 'current' | 'past' | 'inactive'

const TENANT_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'phone', label: 'Phone', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'added', label: 'Added', defaultVisible: true },
]

export default function TenantsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [filter, setFilter] = useState<TenantFilter>('all')
  const { isVisible, toggle } = useColumnVisibility('tenants', TENANT_COLUMNS)

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants', search],
    queryFn: async () => {
      let q = supabase
        .from('tenants')
        .select(`
          *,
          tenancy_tenants(
            tenancy_id,
            tenancies(id, status, start_date, end_date, properties(address))
          )
        `)
        .order('full_name')
      if (search) q = q.ilike('full_name', `%${search}%`)
      const { data } = await q
      return data ?? []
    },
  })

  function getTenantStatus(t: any): 'current' | 'past' | 'inactive' {
    if (!t.is_active) return 'inactive'
    const tenancies = (t.tenancy_tenants ?? []).map((tt: any) => tt.tenancies).filter(Boolean)
    const hasCurrent = tenancies.some((tc: any) => tc?.status === 'active' || tc?.status === 'ending_soon')
    return hasCurrent ? 'current' : 'past'
  }

  const filteredTenants = (tenants ?? []).filter((t: any) => {
    const status = getTenantStatus(t)
    if (filter === 'all') return true
    return status === filter
  })

  const counts = {
    all: (tenants ?? []).length,
    current: (tenants ?? []).filter((t: any) => getTenantStatus(t) === 'current').length,
    past: (tenants ?? []).filter((t: any) => getTenantStatus(t) === 'past').length,
    inactive: (tenants ?? []).filter((t: any) => getTenantStatus(t) === 'inactive').length,
  }

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from('tenants') as any).update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from('tenants') as any).update({
        is_active: true,
        deactivated_at: null,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('tenants').delete().eq('id', id) },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  })

  const statusBadge = (status: string) => {
    if (status === 'current') return <Badge variant="success">Current</Badge>
    if (status === 'past') return <Badge variant="secondary">Past</Badge>
    return <Badge variant="destructive">Inactive</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-500 text-sm mt-1">{tenants?.length ?? 0} tenants</p>
        </div>
        <Button onClick={() => { setEditId(null); setShowForm(true) }}>
          <Plus className="h-4 w-4" /> Add Tenant
        </Button>
      </div>

      <Card className="no-print">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search tenants..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'all', label: 'All', count: counts.all },
                { key: 'current', label: 'Current', count: counts.current },
                { key: 'past', label: 'Past', count: counts.past },
                { key: 'inactive', label: 'Inactive', count: counts.inactive },
              ] as const).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
            <ColumnVisibility columns={TENANT_COLUMNS} onToggle={toggle} isVisible={isVisible} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {isVisible('name') && <TableHead>Name</TableHead>}
              {isVisible('email') && <TableHead>Email</TableHead>}
              {isVisible('phone') && <TableHead>Phone</TableHead>}
              {isVisible('status') && <TableHead>Status</TableHead>}
              {isVisible('added') && <TableHead className="hidden md:table-cell">Added</TableHead>}
              <TableHead className="no-print"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-gray-400">Loading…</TableCell></TableRow>
            ) : filteredTenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-400">No tenants found</p>
                </TableCell>
              </TableRow>
            ) : filteredTenants.map((t: any) => {
              const status = getTenantStatus(t)
              return (
                <TableRow key={t.id}>
                  {isVisible('name') && <TableCell className="font-medium">{t.full_name}</TableCell>}
                  {isVisible('email') && <TableCell>{t.email}</TableCell>}
                  {isVisible('phone') && <TableCell>{t.phone ?? '—'}</TableCell>}
                  {isVisible('status') && <TableCell>{statusBadge(status)}</TableCell>}
                  {isVisible('added') && <TableCell className="hidden md:table-cell">{formatDate(t.created_at)}</TableCell>}
                  <TableCell className="no-print">
                    <div className="flex items-center gap-2">
                      <Link to={`/tenants/${t.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => { setEditId(t.id); setShowForm(true) }}>Edit</Button>
                      {t.is_active ? (
                        <Button
                          variant="ghost" size="sm"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          title="Deactivate"
                          onClick={() => { if (confirm('Deactivate this tenant? Their records will be kept for history.')) deactivateMutation.mutate(t.id) }}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost" size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Activate"
                          onClick={() => activateMutation.mutate(t.id)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Permanently delete"
                        onClick={() => { if (confirm('Permanently delete this tenant? This cannot be undone and will remove all associated records.')) deleteMutation.mutate(t.id) }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>

      <TenantFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        editId={editId}
        onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['tenants'] }) }}
      />
    </div>
  )
}

function TenantFormDialog({ open, onClose, editId, onSaved }: {
  open: boolean; onClose: () => void; editId: string | null; onSaved: () => void
}) {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', dob: '', ni_number: '', emergency_contact: '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useQuery({
    queryKey: ['tenant-edit', editId],
    enabled: !!editId,
    queryFn: async () => {
      const { data } = await supabase.from('tenants').select('*').eq('id', editId!).single()
      if (data) setForm({
        full_name: data.full_name, email: data.email, phone: data.phone ?? '',
        dob: data.dob ?? '', ni_number: data.ni_number ?? '', emergency_contact: data.emergency_contact ?? '',
      })
      return data
    },
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const result = tenantSchema.safeParse(form)
    if (!result.success) {
      setErrors(zodErrors(result))
      return
    }
    setErrors({})
    setSaving(true)
    const payload = {
      full_name: form.full_name, email: form.email,
      phone: form.phone || null, dob: form.dob || null,
      ni_number: form.ni_number || null, emergency_contact: form.emergency_contact || null,
    }
    if (editId) {
      await (supabase.from('tenants') as any).update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId)
    } else {
      await (supabase.from('tenants') as any).insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Tenant' : 'Add Tenant'}</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Full Name" error={errors.full_name} required className="col-span-2">
                <Input value={form.full_name} onChange={(e) => { setForm({ ...form, full_name: e.target.value }); setErrors((p) => ({ ...p, full_name: '' })) }} />
              </FormField>
              <FormField label="Email" error={errors.email} required>
                <Input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors((p) => ({ ...p, email: '' })) }} />
              </FormField>
              <FormField label="Phone" error={errors.phone}>
                <Input value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors((p) => ({ ...p, phone: '' })) }} />
              </FormField>
              <FormField label="Date of Birth">
                <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </FormField>
              <FormField label="NI Number" error={errors.ni_number}>
                <Input value={form.ni_number} onChange={(e) => { setForm({ ...form, ni_number: e.target.value }); setErrors((p) => ({ ...p, ni_number: '' })) }} placeholder="AB123456C" />
              </FormField>
              <FormField label="Emergency Contact" className="col-span-2">
                <Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} placeholder="Name, relationship, phone" />
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Add Tenant'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
