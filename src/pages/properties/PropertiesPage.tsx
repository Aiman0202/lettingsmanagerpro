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
import { Plus, Search, Building2, MapPin, Eye, Power, CheckCircle, ArrowUpRight, ShieldCheck, ChevronDown, ChevronRight, Home, PoundSterling, Globe } from 'lucide-react'
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
                  <select
                    value={p.status}
                    onChange={(e) => updateStatusMutation.mutate({ id: p.id, status: e.target.value as PropertyStatus })}
                    className={`text-xs font-medium rounded-full px-2 py-0.5 border cursor-pointer ${
                      p.status === 'available' ? 'bg-green-50 text-green-700 border-green-200' :
                      p.status === 'let' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      p.status === 'maintenance' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    <option value="available">available</option>
                    <option value="let">let</option>
                    <option value="maintenance">maintenance</option>
                    <option value="inactive">inactive</option>
                  </select>
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
                  <div className="flex items-center gap-1">
                    <Link to={`/properties/${p.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditId(p.id); setShowForm(true) }}
                    >
                      Edit
                    </Button>
                    {p.status !== 'available' && p.status !== 'let' && (
                      <Button
                        variant="ghost" size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Make Available"
                        onClick={() => updateStatusMutation.mutate({ id: p.id, status: 'available' })}
                      >
                        <ArrowUpRight className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Available</span>
                      </Button>
                    )}
                    {p.status === 'available' && (
                      <Button
                        variant="ghost" size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Mark as Let"
                        onClick={() => updateStatusMutation.mutate({ id: p.id, status: 'let' })}
                      >
                        <CheckCircle className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Let</span>
                      </Button>
                    )}
                    {p.status !== 'inactive' ? (
                      <Button
                        variant="ghost" size="sm"
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                        title="Deactivate"
                        onClick={() => { if (confirm('Deactivate this property? It will be hidden from active listings.')) updateStatusMutation.mutate({ id: p.id, status: 'inactive' }) }}
                      >
                        <Power className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Deactivate</span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost" size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Activate"
                        onClick={() => updateStatusMutation.mutate({ id: p.id, status: 'available' })}
                      >
                        <Power className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Activate</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
    // Basic Info
    address: '', postcode: '', type: 'flat', bedrooms: '', bathrooms: '',
    status: 'available' as PropertyStatus, description: '', epc_rating: '', landlord_id: '',
    utility_note: '', inventory_note: '',
    // Key Features
    furnished_status: '', property_subtype: '', floor_number: '', total_floors: '',
    lift_access: false, has_garden: false, garden_type: '', has_balcony: false,
    has_terrace: false, has_patio: false, has_parking: false, parking_type: '',
    parking_spaces: 0, heating_type: '', hot_water_type: '', has_double_glazing: false,
    reception_rooms: 1, kitchen_type: '', broadband_type: '', appliances_included: [] as string[],
    has_smart_home: false, smart_home_features: '',
    // Location
    nearest_station: '', station_distance_minutes: '', council_tax_band: '',
    // Financial
    monthly_rent: '', deposit_amount: '', minimum_term_months: 12, available_from: '',
    // Descriptions
    short_description: '', key_features: [] as string[],
    // Media
    floor_plan_url: '', virtual_tour_url: '', video_tour_url: '',
    // Compliance
    hmo_license_required: false, hmo_license_number: '', hmo_license_expiry: '',
    // Management
    management_type: '', management_fee_percentage: '', keys_held: false, keys_count: 0,
    emergency_contact_name: '', emergency_contact_phone: '',
    // Website
    show_on_website: true, featured_property: false, seo_title: '', seo_meta_description: '',
  })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    features: false,
    location: false,
    financial: false,
    descriptions: false,
    media: false,
    compliance: false,
    management: false,
    website: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

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
      return data as any
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      setForm({
        // Basic
        address: existing.address ?? '',
        postcode: existing.postcode ?? '',
        type: existing.type ?? 'flat',
        bedrooms: String(existing.bedrooms ?? ''),
        bathrooms: String(existing.bathrooms ?? ''),
        status: existing.status ?? 'available',
        description: existing.description ?? '',
        epc_rating: existing.epc_rating ?? '',
        landlord_id: existing.landlord_id ?? '',
        utility_note: existing.utility_note ?? '',
        inventory_note: existing.inventory_note ?? '',
        // Features
        furnished_status: existing.furnished_status ?? '',
        property_subtype: existing.property_subtype ?? '',
        floor_number: String(existing.floor_number ?? ''),
        total_floors: String(existing.total_floors ?? ''),
        lift_access: existing.lift_access ?? false,
        has_garden: existing.has_garden ?? false,
        garden_type: existing.garden_type ?? '',
        has_balcony: existing.has_balcony ?? false,
        has_terrace: existing.has_terrace ?? false,
        has_patio: existing.has_patio ?? false,
        has_parking: existing.has_parking ?? false,
        parking_type: existing.parking_type ?? '',
        parking_spaces: existing.parking_spaces ?? 0,
        heating_type: existing.heating_type ?? '',
        hot_water_type: existing.hot_water_type ?? '',
        has_double_glazing: existing.has_double_glazing ?? false,
        reception_rooms: existing.reception_rooms ?? 1,
        kitchen_type: existing.kitchen_type ?? '',
        broadband_type: existing.broadband_type ?? '',
        appliances_included: existing.appliances_included ?? [],
        has_smart_home: existing.has_smart_home ?? false,
        smart_home_features: existing.smart_home_features ?? '',
        // Location
        nearest_station: existing.nearest_station ?? '',
        station_distance_minutes: String(existing.station_distance_minutes ?? ''),
        council_tax_band: existing.council_tax_band ?? '',
        // Financial
        monthly_rent: String(existing.monthly_rent ?? ''),
        deposit_amount: String(existing.deposit_amount ?? ''),
        minimum_term_months: existing.minimum_term_months ?? 12,
        available_from: existing.available_from ?? '',
        // Descriptions
        short_description: existing.short_description ?? '',
        key_features: existing.key_features ?? [],
        // Media
        floor_plan_url: existing.floor_plan_url ?? '',
        virtual_tour_url: existing.virtual_tour_url ?? '',
        video_tour_url: existing.video_tour_url ?? '',
        // Compliance
        hmo_license_required: existing.hmo_license_required ?? false,
        hmo_license_number: existing.hmo_license_number ?? '',
        hmo_license_expiry: existing.hmo_license_expiry ?? '',
        // Management
        management_type: existing.management_type ?? '',
        management_fee_percentage: String(existing.management_fee_percentage ?? ''),
        keys_held: existing.keys_held ?? false,
        keys_count: existing.keys_count ?? 0,
        emergency_contact_name: existing.emergency_contact_name ?? '',
        emergency_contact_phone: existing.emergency_contact_phone ?? '',
        // Website
        show_on_website: existing.show_on_website ?? true,
        featured_property: existing.featured_property ?? false,
        seo_title: existing.seo_title ?? '',
        seo_meta_description: existing.seo_meta_description ?? '',
      })
    }
  }, [existing])

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
        // Basic Info
        address: form.address,
        postcode: form.postcode,
        type: form.type,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        status: form.status,
        description: form.description || null,
        epc_rating: form.epc_rating || null,
        landlord_id: form.landlord_id || null,
        utility_note: form.utility_note || null,
        inventory_note: form.inventory_note || null,
        // Property Features
        furnished_status: form.furnished_status || null,
        property_subtype: form.property_subtype || null,
        floor_number: form.floor_number ? parseInt(form.floor_number) : null,
        total_floors: form.total_floors ? parseInt(form.total_floors) : null,
        lift_access: form.lift_access,
        has_garden: form.has_garden,
        garden_type: form.garden_type || null,
        has_balcony: form.has_balcony,
        has_terrace: form.has_terrace,
        has_patio: form.has_patio,
        has_parking: form.has_parking,
        parking_type: form.parking_type || null,
        parking_spaces: form.parking_spaces || 0,
        heating_type: form.heating_type || null,
        hot_water_type: form.hot_water_type || null,
        has_double_glazing: form.has_double_glazing,
        reception_rooms: form.reception_rooms || 1,
        kitchen_type: form.kitchen_type || null,
        broadband_type: form.broadband_type || null,
        appliances_included: form.appliances_included || [],
        has_smart_home: form.has_smart_home,
        smart_home_features: form.smart_home_features || null,
        // Location
        nearest_station: form.nearest_station || null,
        station_distance_minutes: form.station_distance_minutes ? parseInt(form.station_distance_minutes) : null,
        council_tax_band: form.council_tax_band || null,
        // Financial
        monthly_rent: form.monthly_rent ? parseFloat(form.monthly_rent) : null,
        deposit_amount: form.deposit_amount ? parseFloat(form.deposit_amount) : null,
        minimum_term_months: form.minimum_term_months || 12,
        available_from: form.available_from || null,
        // Descriptions
        short_description: form.short_description || null,
        key_features: form.key_features || [],
        // Media
        floor_plan_url: form.floor_plan_url || null,
        virtual_tour_url: form.virtual_tour_url || null,
        video_tour_url: form.video_tour_url || null,
        // Compliance
        hmo_license_required: form.hmo_license_required,
        hmo_license_number: form.hmo_license_number || null,
        hmo_license_expiry: form.hmo_license_expiry || null,
        // Management
        management_type: form.management_type || null,
        management_fee_percentage: form.management_fee_percentage ? parseFloat(form.management_fee_percentage) : null,
        keys_held: form.keys_held,
        keys_count: form.keys_count || 0,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        // Website
        show_on_website: form.show_on_website,
        featured_property: form.featured_property,
        seo_title: form.seo_title || null,
        seo_meta_description: form.seo_meta_description || null,
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
      <DialogContent onClose={onClose} className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Property' : 'Add Property'}</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            {/* Basic Information */}
            <div className="border rounded-lg">
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('basic')}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </div>
                {expandedSections.basic ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
              {expandedSections.basic && (
                <div className="p-4 border-t grid grid-cols-2 gap-4">
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
                  <FormField label="Utility Note" className="col-span-2">
                    <Textarea 
                      value={form.utility_note} 
                      onChange={(e) => setForm({ ...form, utility_note: e.target.value })} 
                      rows={3}
                      placeholder="Gas meter: 12345678, Electric meter: 87654321, Water: Thames Water..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Utility meter numbers, providers, or special arrangements</p>
                  </FormField>
                  <FormField label="Inventory Note" className="col-span-2">
                    <Textarea 
                      value={form.inventory_note} 
                      onChange={(e) => setForm({ ...form, inventory_note: e.target.value })} 
                      rows={3}
                      placeholder="All furniture is brand new, white goods included..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Special notes about inventory items or condition</p>
                  </FormField>
                </div>
              )}
            </div>

            {/* Property Features */}
            <div className="border rounded-lg">
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('features')}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Home className="h-5 w-5" />
                  Property Features
                </div>
                {expandedSections.features ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
              {expandedSections.features && (
                <div className="p-4 border-t grid grid-cols-2 gap-4">
                  <FormField label="Property Subtype">
                    <Input value={form.property_subtype} onChange={(e) => setForm({ ...form, property_subtype: e.target.value })} placeholder="e.g., Maisonette, Terraced" />
                  </FormField>
                  <FormField label="Furnished Status">
                    <Select value={form.furnished_status} onChange={(e) => setForm({ ...form, furnished_status: e.target.value })}>
                      <option value="">Select...</option>
                      <option value="furnished">Furnished</option>
                      <option value="part_furnished">Part Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </Select>
                  </FormField>
                  <FormField label="Floor Number">
                    <Input type="number" value={form.floor_number} onChange={(e) => setForm({ ...form, floor_number: e.target.value })} />
                  </FormField>
                  <FormField label="Total Floors">
                    <Input type="number" value={form.total_floors} onChange={(e) => setForm({ ...form, total_floors: e.target.value })} />
                  </FormField>
                  <FormField label="Heating Type">
                    <Select value={form.heating_type} onChange={(e) => setForm({ ...form, heating_type: e.target.value })}>
                      <option value="">Select...</option>
                      <option value="gas_central">Gas Central</option>
                      <option value="electric">Electric</option>
                      <option value="underfloor">Underfloor</option>
                      <option value="oil">Oil</option>
                    </Select>
                  </FormField>
                  <FormField label="Reception Rooms">
                    <Input type="number" min="1" value={form.reception_rooms} onChange={(e) => setForm({ ...form, reception_rooms: e.target.value })} />
                  </FormField>
                  <div className="col-span-2 flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={form.lift_access} onChange={(e) => setForm({ ...form, lift_access: e.target.checked })} />
                      <span>Lift Access</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={form.has_garden} onChange={(e) => setForm({ ...form, has_garden: e.target.checked })} />
                      <span>Has Garden</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={form.has_parking} onChange={(e) => setForm({ ...form, has_parking: e.target.checked })} />
                      <span>Has Parking</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={form.has_double_glazing} onChange={(e) => setForm({ ...form, has_double_glazing: e.target.checked })} />
                      <span>Double Glazing</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Details */}
            <div className="border rounded-lg">
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('financial')}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <PoundSterling className="h-5 w-5" />
                  Financial Details
                </div>
                {expandedSections.financial ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
              {expandedSections.financial && (
                <div className="p-4 border-t grid grid-cols-2 gap-4">
                  <FormField label="Monthly Rent (£)">
                    <Input type="number" step="0.01" value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })} />
                  </FormField>
                  <FormField label="Deposit Amount (£)">
                    <Input type="number" step="0.01" value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })} />
                  </FormField>
                  <FormField label="Council Tax Band">
                    <Select value={form.council_tax_band} onChange={(e) => setForm({ ...form, council_tax_band: e.target.value })}>
                      <option value="">Select...</option>
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((band) => (
                        <option key={band} value={band}>{band}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Minimum Term (months)">
                    <Input type="number" min="1" value={form.minimum_term_months} onChange={(e) => setForm({ ...form, minimum_term_months: parseInt(e.target.value) })} />
                  </FormField>
                  <FormField label="Available From" className="col-span-2">
                    <Input type="date" value={form.available_from} onChange={(e) => setForm({ ...form, available_from: e.target.value })} />
                  </FormField>
                </div>
              )}
            </div>

            {/* Location & Area */}
            <div className="border rounded-lg">
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('location')}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <MapPin className="h-5 w-5" />
                  Location & Area
                </div>
                {expandedSections.location ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
              {expandedSections.location && (
                <div className="p-4 border-t grid grid-cols-2 gap-4">
                  <FormField label="Nearest Station">
                    <Input value={form.nearest_station} onChange={(e) => setForm({ ...form, nearest_station: e.target.value })} />
                  </FormField>
                  <FormField label="Distance (minutes)">
                    <Input type="number" value={form.station_distance_minutes} onChange={(e) => setForm({ ...form, station_distance_minutes: e.target.value })} />
                  </FormField>
                </div>
              )}
            </div>

            {/* Website Display */}
            <div className="border rounded-lg">
              <div 
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleSection('website')}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Globe className="h-5 w-5" />
                  Website Display Settings
                </div>
                {expandedSections.website ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
              </div>
              {expandedSections.website && (
                <div className="p-4 border-t space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.show_on_website} onChange={(e) => setForm({ ...form, show_on_website: e.target.checked })} />
                    <span>Show on Website</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.featured_property} onChange={(e) => setForm({ ...form, featured_property: e.target.checked })} />
                    <span>Featured Property</span>
                  </label>
                  <FormField label="SEO Title">
                    <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} />
                  </FormField>
                  <FormField label="Meta Description">
                    <Textarea value={form.seo_meta_description} onChange={(e) => setForm({ ...form, seo_meta_description: e.target.value })} rows={2} />
                  </FormField>
                </div>
              )}
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
