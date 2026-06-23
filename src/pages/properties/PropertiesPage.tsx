import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { logAudit } from '@/lib/audit'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Building2, MapPin, Eye, Power, CheckCircle, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '@/lib/utils'
import { generateNextReference } from '@/utils/references'
import { useToast } from '@/contexts/ToastContext'
import { handleApiError } from '@/utils/validation'
import { ResponsiveTable, MobileCards, MobileCard, MobileCardRow } from '@/components/ui/responsive-table'
import { ColumnVisibility } from '@/components/ui/ColumnVisibility'
import { useColumnVisibility, type ColumnConfig } from '@/hooks/useColumnVisibility'
import { FormField } from '@/components/ui/FormField'
import { propertySchema, zodErrors } from '@/schemas/forms'
import { calculateReadinessScore, readinessColor, readinessLabel, type ReadinessResult } from '@/utils/compliance-score'

type PropertyStatus = 'available' | 'let' | 'maintenance' | 'inactive'

const statusVariant: Record<PropertyStatus, 'success' | 'default' | 'destructive' | 'secondary'> = {
  available: 'success',
  let: 'default',
  maintenance: 'destructive',
  inactive: 'secondary',
}

const PROPERTY_COLUMNS: ColumnConfig[] = [
  { key: 'ref', label: 'Ref', defaultVisible: true },
  { key: 'address', label: 'Address', defaultVisible: true },
  { key: 'type', label: 'Type', defaultVisible: true },
  { key: 'beds', label: 'Beds', defaultVisible: true },
  { key: 'landlord', label: 'Landlord', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'readiness', label: 'Readiness', defaultVisible: true },
  { key: 'added', label: 'Added', defaultVisible: true },
]

export default function PropertiesPage() {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const { isVisible, toggle } = useColumnVisibility('properties', PROPERTY_COLUMNS)

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties', search, statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('properties')
        .select('*, landlords(full_name), property_photos(id, storage_path, is_primary), property_compliance(type, expiry_date)')
        .order('created_at', { ascending: false })

      if (statusFilter) q = q.eq('status', statusFilter)
      if (search) {
        q = q.or(`reference_number.ilike.%${search}%,address.ilike.%${search}%`)
      }

      const { data } = await q
      const properties = data ?? []

      // Generate signed URLs for primary photos
      for (const prop of properties as any[]) {
        const photos = prop.property_photos ?? []
        const primaryPhoto = photos.find((ph: any) => ph.is_primary) ?? photos[0]
        if (primaryPhoto) {
          const { data: urlData } = await supabase.storage.from('property-photos').createSignedUrl(primaryPhoto.storage_path, 3600)
          primaryPhoto.signedUrl = urlData?.signedUrl ?? null
        }
      }

      return properties
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('properties').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] })
      logAudit({ action: 'deactivated', resource: 'property' })
      success('Property deleted', 'The property has been successfully removed')
    },
    onError: (err) => {
      showError('Delete failed', handleApiError(err, 'delete property'))
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PropertyStatus }) => {
      const { error } = await (supabase.from('properties') as any).update({
        status,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties'] })
      success('Status updated', 'Property status has been updated')
    },
    onError: (err) => {
      showError('Update failed', handleApiError(err, 'update property status'))
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500 text-sm mt-1">{properties?.length ?? 0} properties</p>
        </div>
        <Button onClick={() => { setEditId(null); setShowForm(true) }}>
          <Plus className="h-4 w-4" /> Add Property
        </Button>
      </div>

      <Card className="no-print">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-44">
              <option value="">All statuses</option>
              <option value="available">Available</option>
              <option value="let">Let</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </Select>
            <ColumnVisibility columns={PROPERTY_COLUMNS} onToggle={toggle} isVisible={isVisible} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <ResponsiveTable>
          <Table>
            <TableHeader>
              <TableRow>
                {isVisible('ref') && <TableHead className="hidden sm:table-cell">Ref</TableHead>}
                {isVisible('address') && <TableHead>Address</TableHead>}
                {isVisible('type') && <TableHead className="hidden sm:table-cell">Type</TableHead>}
                {isVisible('beds') && <TableHead className="hidden sm:table-cell">Beds</TableHead>}
                {isVisible('landlord') && <TableHead className="hidden md:table-cell">Landlord</TableHead>}
                {isVisible('status') && <TableHead>Status</TableHead>}
                {isVisible('readiness') && <TableHead className="hidden lg:table-cell">Readiness</TableHead>}
                {isVisible('added') && <TableHead className="hidden lg:table-cell">Added</TableHead>}
                <TableHead className="no-print"></TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-10">Loading…</TableCell>
              </TableRow>
            ) : (properties ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-10">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  No properties found
                </TableCell>
              </TableRow>
            ) : (properties ?? []).map((p: any) => {
              const primaryPhoto = (p.property_photos ?? []).find((ph: any) => ph.is_primary) ?? (p.property_photos ?? [])[0]
              const photoUrl = primaryPhoto?.signedUrl ?? null
              return (
              <TableRow key={p.id}>
                {isVisible('ref') && <TableCell className="hidden sm:table-cell text-xs font-mono text-gray-500">{p.reference_number}</TableCell>}
                {isVisible('address') && <TableCell>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Property" className="h-10 w-14 sm:h-12 sm:w-16 object-cover rounded border shrink-0" />
                    ) : (
                      <div className="h-10 w-14 sm:h-12 sm:w-16 bg-gray-100 rounded border flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-gray-300" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{p.address}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{p.postcode}</span>
                      </p>
                    </div>
                  </div>
                </TableCell>}
                {isVisible('type') && <TableCell className="hidden sm:table-cell capitalize">{p.type}</TableCell>}
                {isVisible('beds') && <TableCell className="hidden sm:table-cell">{p.bedrooms ?? '—'}</TableCell>}
                {isVisible('landlord') && <TableCell className="hidden md:table-cell truncate max-w-[150px]">{p.landlords?.full_name ?? '—'}</TableCell>}
                {isVisible('status') && <TableCell>
                  <Badge variant={statusVariant[p.status as PropertyStatus] ?? 'secondary'}>
                    {p.status}
                  </Badge>
                </TableCell>}
                {isVisible('readiness') && <TableCell className="hidden lg:table-cell">
                  {(() => {
                    const result = calculateReadinessScore((p.property_compliance ?? []).map((c: any) => ({ type: c.type, expiry_date: c.expiry_date })))
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${readinessColor(result.status)}`} title={result.items.map((i) => `${i.type}: ${i.state}${i.daysUntilExpiry !== undefined ? ` (${i.daysUntilExpiry}d)` : ''}`).join(', ')}>
                        <ShieldCheck className="h-3 w-3" /> {readinessLabel(result.status)}
                      </span>
                    )
                  })()}
                </TableCell>}
                {isVisible('added') && <TableCell>{formatDate(p.created_at)}</TableCell>}
                <TableCell className="no-print">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Link to={`/properties/${p.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden sm:inline-flex"
                      onClick={() => { setEditId(p.id); setShowForm(true) }}
                    >
                      Edit
                    </Button>
                    {p.status !== 'available' && p.status !== 'let' && (
                      <Button
                        variant="ghost" size="sm"
                        className="hidden sm:inline-flex text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Make Available"
                        onClick={() => updateStatusMutation.mutate({ id: p.id, status: 'available' })}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    )}
                    {p.status === 'available' && (
                      <Button
                        variant="ghost" size="sm"
                        className="hidden sm:inline-flex text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Mark as Let"
                        onClick={() => updateStatusMutation.mutate({ id: p.id, status: 'let' })}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {p.status !== 'inactive' ? (
                      <Button
                        variant="ghost" size="sm"
                        className="hidden sm:inline-flex text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        title="Deactivate"
                        onClick={() => { if (confirm('Deactivate this property? It will be hidden from active listings.')) updateStatusMutation.mutate({ id: p.id, status: 'inactive' }) }}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost" size="sm"
                        className="hidden sm:inline-flex text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Activate"
                        onClick={() => updateStatusMutation.mutate({ id: p.id, status: 'available' })}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden sm:inline-flex text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (confirm('Permanently delete this property? This cannot be undone.')) deleteMutation.mutate(p.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ResponsiveTable>
      
      {/* Mobile card view */}
      <MobileCards className="p-4 sm:hidden">
        {(properties ?? []).length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            No properties found
          </div>
        ) : (properties ?? []).map((p: any) => {
          const primaryPhoto = (p.property_photos ?? []).find((ph: any) => ph.is_primary) ?? (p.property_photos ?? [])[0]
          const photoUrl = primaryPhoto?.signedUrl ?? null
          return (
            <MobileCard key={p.id}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Property" className="h-12 w-16 object-cover rounded border shrink-0" />
                  ) : (
                    <div className="h-12 w-16 bg-gray-100 rounded border flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-gray-300" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{p.address}</p>
                    <p className="text-xs text-gray-500">{p.postcode}</p>
                  </div>
                </div>
                <Badge variant={statusVariant[p.status as PropertyStatus] ?? 'secondary'}>
                  {p.status}
                </Badge>
              </div>
              <MobileCardRow label="Type" value={<span className="capitalize">{p.type}</span>} />
              <MobileCardRow label="Bedrooms" value={p.bedrooms ?? '—'} />
              <MobileCardRow label="Landlord" value={p.landlords?.full_name ?? '—'} />
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Link to={`/properties/${p.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">View</Button>
                </Link>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditId(p.id); setShowForm(true) }}>Edit</Button>
                <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { if (confirm('Delete this property?')) deleteMutation.mutate(p.id) }}>Delete</Button>
              </div>
            </MobileCard>
          )
        })}
      </MobileCards>
      </Card>

      <PropertyFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        editId={editId}
        onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['properties'] }) }}
      />
    </div>
  )
}

function PropertyFormDialog({ open, onClose, editId, onSaved }: {
  open: boolean; onClose: () => void; editId: string | null; onSaved: () => void
}) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [form, setForm] = useState({
    address: '', postcode: '', type: 'flat', bedrooms: '', bathrooms: '',
    status: 'available' as PropertyStatus, description: '', epc_rating: '', landlord_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: landlords } = useQuery({
    queryKey: ['landlords-list'],
    queryFn: async () => {
      const { data } = await supabase.from('landlords').select('id, full_name').order('full_name')
      return data ?? []
    },
  })

  const { data: existing } = useQuery({
    queryKey: ['property', editId],
    enabled: !!editId,
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('*').eq('id', editId!).single()
      return data
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      setForm({
        address: existing.address ?? '',
        postcode: existing.postcode ?? '',
        type: existing.type ?? 'flat',
        bedrooms: String(existing.bedrooms ?? ''),
        bathrooms: String(existing.bathrooms ?? ''),
        status: existing.status ?? 'available',
        description: existing.description ?? '',
        epc_rating: existing.epc_rating ?? '',
        landlord_id: existing.landlord_id ?? '',
      })
    }
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const result = propertySchema.safeParse(form)
    if (!result.success) {
      setErrors(zodErrors(result))
      return
    }
    setErrors({})
    setSaving(true)
    
    try {
      const payload = {
        address: form.address,
        postcode: form.postcode,
        type: form.type,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        status: form.status,
        description: form.description || null,
        epc_rating: form.epc_rating || null,
        landlord_id: form.landlord_id || null,
      }

      if (editId) {
        const { error } = await (supabase.from('properties') as any).update(payload).eq('id', editId)
        if (error) throw error
        logAudit({ action: 'updated', resource: 'property', resourceId: editId, details: { address: form.address } })
        success('Property updated', `${form.address} has been successfully updated`)
      } else {
        // Generate reference number before insert
        const ref = await generateNextReference('PRP', 'properties')
        const { error } = await (supabase.from('properties') as any).insert({ ...payload, reference_number: ref })
        if (error) throw error
        logAudit({ action: 'created', resource: 'property', details: { address: form.address, reference_number: ref } })
        success('Property added', `${form.address} (${ref}) has been successfully added`)
      }
      
      setSaving(false)
      onSaved()
    } catch (err) {
      setSaving(false)
      showError('Save failed', handleApiError(err, editId ? 'update property' : 'add property'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Property' : 'Add Property'}</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Address" error={errors.address} required className="col-span-2">
                <Input value={form.address} onChange={(e) => { setForm({ ...form, address: e.target.value }); setErrors((p) => ({ ...p, address: '' })) }} />
              </FormField>
              <FormField label="Postcode" error={errors.postcode} required>
                <Input value={form.postcode} onChange={(e) => { setForm({ ...form, postcode: e.target.value }); setErrors((p) => ({ ...p, postcode: '' })) }} />
              </FormField>
              <FormField label="Type">
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="flat">Flat</option>
                  <option value="house">House</option>
                  <option value="studio">Studio</option>
                  <option value="room">Room</option>
                  <option value="commercial">Commercial</option>
                </Select>
              </FormField>
              <FormField label="Bedrooms">
                <Input type="number" min="0" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} />
              </FormField>
              <FormField label="Bathrooms">
                <Input type="number" min="0" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} />
              </FormField>
              <FormField label="Status">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PropertyStatus })}>
                  <option value="available">Available</option>
                  <option value="let">Let</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </FormField>
              <FormField label="EPC Rating">
                <Select value={form.epc_rating} onChange={(e) => setForm({ ...form, epc_rating: e.target.value })}>
                  <option value="">Unknown</option>
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Landlord" className="col-span-2">
                <Select value={form.landlord_id} onChange={(e) => setForm({ ...form, landlord_id: e.target.value })}>
                  <option value="">Unassigned</option>
                  {(landlords ?? []).map((l: any) => (
                    <option key={l.id} value={l.id}>{l.full_name}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Description" className="col-span-2">
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Add Property'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
