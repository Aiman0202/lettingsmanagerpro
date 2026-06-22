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
import { Plus, Search, UserCheck, Power, Trash2, Eye, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '@/lib/utils'
import { ColumnVisibility } from '@/components/ui/ColumnVisibility'
import { useColumnVisibility, type ColumnConfig } from '@/hooks/useColumnVisibility'
import { FormField } from '@/components/ui/FormField'
import { landlordSchema, zodErrors } from '@/schemas/forms'

type LandlordFilter = 'all' | 'active' | 'inactive'

const LANDLORD_COLUMNS: ColumnConfig[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'phone', label: 'Phone', defaultVisible: true },
  { key: 'properties', label: 'Properties', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'added', label: 'Added', defaultVisible: true },
]

export default function LandlordsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [filter, setFilter] = useState<LandlordFilter>('all')
  const { isVisible, toggle } = useColumnVisibility('landlords', LANDLORD_COLUMNS)

  const { data: landlords, isLoading } = useQuery({
    queryKey: ['landlords', search],
    queryFn: async () => {
      let q = supabase
        .from('landlords')
        .select('*, properties(count)')
        .order('full_name')
      if (search) q = q.ilike('full_name', `%${search}%`)
      const { data } = await q
      return data ?? []
    },
  })

  const filteredLandlords = (landlords ?? []).filter((l: any) => {
    if (filter === 'all') return true
    if (filter === 'active') return l.is_active !== false
    return l.is_active === false
  })

  const counts = {
    all: (landlords ?? []).length,
    active: (landlords ?? []).filter((l: any) => l.is_active !== false).length,
    inactive: (landlords ?? []).filter((l: any) => l.is_active === false).length,
  }

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from('landlords') as any).update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['landlords'] }),
  })

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from('landlords') as any).update({
        is_active: true,
        deactivated_at: null,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['landlords'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('landlords').delete().eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['landlords'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landlords</h1>
          <p className="text-gray-500 text-sm mt-1">{landlords?.length ?? 0} landlords</p>
        </div>
        <Button onClick={() => { setEditId(null); setShowForm(true) }}>
          <Plus className="h-4 w-4" /> Add Landlord
        </Button>
      </div>

      <Card className="no-print">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search landlords..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {([
                { key: 'all', label: 'All', count: counts.all },
                { key: 'active', label: 'Active', count: counts.active },
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
            <ColumnVisibility columns={LANDLORD_COLUMNS} onToggle={toggle} isVisible={isVisible} />
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
              {isVisible('properties') && <TableHead className="hidden md:table-cell">Properties</TableHead>}
              {isVisible('status') && <TableHead>Status</TableHead>}
              {isVisible('added') && <TableHead className="hidden lg:table-cell">Added</TableHead>}
              <TableHead className="no-print"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-400">Loading…</TableCell></TableRow>
            ) : filteredLandlords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <UserCheck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-400">No landlords found</p>
                </TableCell>
              </TableRow>
            ) : filteredLandlords.map((l: any) => {
              const propCount = (l.properties as any[])?.length ?? 0
              const isActive = l.is_active !== false
              return (
                <TableRow key={l.id}>
                  {isVisible('name') && <TableCell className="font-medium">{l.full_name}</TableCell>}
                  {isVisible('email') && <TableCell>{l.email}</TableCell>}
                  {isVisible('phone') && <TableCell>{l.phone ?? '—'}</TableCell>}
                  {isVisible('properties') && <TableCell className="hidden md:table-cell">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      {propCount}
                    </span>
                  </TableCell>}
                  {isVisible('status') && <TableCell>
                    <Badge variant={isActive ? 'success' : 'secondary'}>
                      {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>}
                  {isVisible('added') && <TableCell className="hidden lg:table-cell">{formatDate(l.created_at)}</TableCell>}
                  <TableCell className="no-print">
                    <div className="flex items-center gap-2">
                      <Link to={`/landlords/${l.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <Button variant="ghost" size="sm" onClick={() => { setEditId(l.id); setShowForm(true) }}>Edit</Button>
                      {isActive ? (
                        <Button
                          variant="ghost" size="sm"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          title="Deactivate"
                          onClick={() => { if (confirm('Deactivate this landlord? Their records will be kept for history.')) deactivateMutation.mutate(l.id) }}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost" size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Activate"
                          onClick={() => activateMutation.mutate(l.id)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost" size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Permanently delete"
                        onClick={() => { if (confirm('Permanently delete this landlord? This cannot be undone and will remove all associated records.')) deleteMutation.mutate(l.id) }}
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

      <LandlordFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        editId={editId}
        onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['landlords'] }) }}
      />
    </div>
  )
}

function LandlordFormDialog({ open, onClose, editId, onSaved }: {
  open: boolean; onClose: () => void; editId: string | null; onSaved: () => void
}) {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', company_name: '', address: '', bank_details: '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useQuery({
    queryKey: ['landlord-edit', editId],
    enabled: !!editId,
    queryFn: async () => {
      const { data } = await supabase.from('landlords').select('*').eq('id', editId!).single()
      if (data) setForm({ full_name: data.full_name, email: data.email, phone: data.phone ?? '', company_name: data.company_name ?? '', address: data.address ?? '', bank_details: data.bank_details ?? '' })
      return data
    },
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const result = landlordSchema.safeParse(form)
    if (!result.success) {
      setErrors(zodErrors(result))
      return
    }
    setErrors({})
    setSaving(true)
    const payload = {
      full_name: form.full_name, email: form.email,
      phone: form.phone || null, company_name: form.company_name || null,
      address: form.address || null, bank_details: form.bank_details || null,
    }
    if (editId) {
      await (supabase.from('landlords') as any).update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editId)
    } else {
      await (supabase.from('landlords') as any).insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Landlord' : 'Add Landlord'}</DialogTitle>
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
              <FormField label="Company Name" className="col-span-2">
                <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
              </FormField>
              <FormField label="Address" className="col-span-2">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </FormField>
              <FormField label="Bank Details" className="col-span-2">
                <Input value={form.bank_details} onChange={(e) => setForm({ ...form, bank_details: e.target.value })} placeholder="Sort code / Account number" />
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Add Landlord'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
