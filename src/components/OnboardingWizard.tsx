import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/contexts/ToastContext'
import { handleApiError } from '@/utils/validation'
import { generateRentSchedule } from '@/utils/finance'
import { generateAgreementForTenancy } from '@/utils/agreements'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateNextReference } from '@/utils/references'
import {
  Building2, UserCheck, Users, Calendar, PoundSterling,
  CheckCircle, ChevronLeft, ChevronRight, Sparkles, FileCheck,
  ArrowRight, Home, Plus, Trash2, Upload, X, Download, ShieldCheck,
  Camera, FileText, Eye,
} from 'lucide-react'

// ============================================================
// CONSTANTS
// ============================================================

const PHASE1_STEPS = ['Landlord', 'Property', 'Photos', 'Compliance', 'Review']
const PHASE2_STEPS = ['Property & Landlord', 'Tenants', 'Terms', 'Agreement', 'Signatures', 'Review']

const DEPOSIT_SCHEMES = ['', 'TDS', 'DPS', 'MyDeposits']
const PROPERTY_TYPES = ['flat', 'house', 'studio', 'room', 'commercial']
const COMPLIANCE_TYPES = [
  { value: 'gas_safe', label: 'Gas Safe Certificate' },
  { value: 'eicr', label: 'EICR (Electrical)' },
  { value: 'epc', label: 'EPC' },
  { value: 'fire_risk', label: 'Fire Risk Assessment' },
  { value: 'legionella', label: 'Legionella Risk' },
  { value: 'other', label: 'Other' },
]

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { success, error: showError } = useToast()

  // --- Phase tracking ---
  const [phase, setPhase] = useState<'property' | 'tenancy' | 'done'>('property')
  const [p1Step, setP1Step] = useState(0)
  const [p2Step, setP2Step] = useState(0)

  // --- Phase 1: Landlord form ---
  const [landlordForm, setLandlordForm] = useState({
    mode: 'select' as 'select' | 'create',
    id: '',
    full_name: '', email: '', phone: '',
    address_line1: '', address_line2: '', city: '', postcode: '',
    bank_name: '', bank_account_name: '', bank_account_number: '', bank_sort_code: '',
  })
  const [landlordCreated, setLandlordCreated] = useState(false)

  // --- Phase 1: Property form ---
  const [propertyForm, setPropertyForm] = useState({
    mode: 'select' as 'select' | 'create',
    id: '',
    address: '', postcode: '', type: 'flat', bedrooms: '', bathrooms: '',
    epc_rating: '', description: '',
  })
  const [propertyCreated, setPropertyCreated] = useState(false)

  // --- Phase 1: Photos ---
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photosUploaded, setPhotosUploaded] = useState(false)
  const photoRef = useRef<HTMLInputElement>(null)

  // --- Phase 1: Compliance ---
  const [complianceItems, setComplianceItems] = useState<{
    type: string; expiry_date: string; file: File | null; uploaded: boolean
  }[]>([])
  const [complianceDone, setComplianceDone] = useState(false)

  // --- Phase 2: Tenants ---
  const [tenantIds, setTenantIds] = useState<string[]>([])
  const [leadTenantId, setLeadTenantId] = useState('')
  const [showQuickTenant, setShowQuickTenant] = useState(false)
  const [tenantForm, setTenantForm] = useState({ full_name: '', email: '', phone: '' })
  const [quickTenantList, setQuickTenantList] = useState<any[]>([])

  // --- Phase 2: Terms ---
  const [terms, setTerms] = useState({
    start_date: '', end_date: '', rent_amount: '', deposit_amount: '', deposit_scheme: '',
  })

  // --- Phase 2: Agreement ---
  const [agreementGenerated, setAgreementGenerated] = useState(false)

  // --- Phase 2: Signatures placeholder ---
  const [sigReady, setSigReady] = useState(false)

  // --- Shared ---
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<any>(null)

  // ============================================================
  // QUERIES
  // ============================================================

  const { data: properties } = useQuery({
    queryKey: ['wizard-properties'],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('id, address, postcode, type, bedrooms, landlord_id, status').order('address')
      return data ?? []
    },
  })

  const { data: landlords } = useQuery({
    queryKey: ['wizard-landlords'],
    queryFn: async () => {
      const { data } = await supabase.from('landlords').select('*').order('full_name')
      return data ?? []
    },
  })

  const { data: tenants } = useQuery({
    queryKey: ['wizard-tenants'],
    queryFn: async () => {
      const { data } = await supabase.from('tenants').select('id, full_name, email').order('full_name')
      return data ?? []
    },
  })

  // ============================================================
  // PHASE 1 — LANDLORD
  // ============================================================

  async function handleCreateLandlord() {
    setSaving(true)
    try {
      const payload = {
        full_name: landlordForm.full_name,
        email: landlordForm.email || null,
        phone: landlordForm.phone || null,
        address_line1: landlordForm.address_line1 || null,
        address_line2: landlordForm.address_line2 || null,
        city: landlordForm.city || null,
        postcode: landlordForm.postcode || null,
        bank_name: landlordForm.bank_name || null,
        bank_account_name: landlordForm.bank_account_name || null,
        bank_account_number: landlordForm.bank_account_number || null,
        bank_sort_code: landlordForm.bank_sort_code || null,
      }
      const { data, error } = await (supabase.from('landlords') as any).insert(payload).select('id').single()
      if (error) throw error
      const newId = (data as any).id
      setLandlordForm(f => ({ ...f, id: newId, mode: 'select' }))
      setLandlordCreated(true)
      qc.invalidateQueries({ queryKey: ['wizard-landlords'] })
      success('Landlord created', `${landlordForm.full_name} has been saved`)
      setP1Step(1)
    } catch (err) {
      showError('Failed', handleApiError(err, 'create landlord'))
    } finally {
      setSaving(false)
    }
  }

  function canProceedPhase1(step: number): boolean {
    switch (step) {
      case 0: // Landlord
        if (landlordForm.mode === 'select') return !!landlordForm.id
        return !!landlordForm.full_name.trim() && !!landlordForm.email.trim()
      case 1: // Property
        if (propertyForm.mode === 'select') return !!propertyForm.id
        return !!propertyForm.address.trim() && !!propertyForm.postcode.trim()
      case 2: return true // Photos optional
      case 3: return true // Compliance optional
      default: return true
    }
  }

  // ============================================================
  // PHASE 1 — PROPERTY
  // ============================================================

  async function handleCreateProperty() {
    setSaving(true)
    try {
      const ref = await generateNextReference('PRP', 'properties')
      const payload = {
        address: propertyForm.address,
        postcode: propertyForm.postcode,
        type: propertyForm.type,
        bedrooms: propertyForm.bedrooms ? parseInt(propertyForm.bedrooms) : null,
        bathrooms: propertyForm.bathrooms ? parseInt(propertyForm.bathrooms) : null,
        epc_rating: propertyForm.epc_rating || null,
        description: propertyForm.description || null,
        status: 'available' as const,
        landlord_id: landlordForm.id || null,
        reference_number: ref,
      }
      const { data, error } = await (supabase.from('properties') as any).insert(payload).select('id').single()
      if (error) throw error
      const newId = (data as any).id
      setPropertyForm(f => ({ ...f, id: newId, mode: 'select' }))
      setPropertyCreated(true)
      qc.invalidateQueries({ queryKey: ['wizard-properties'] })
      success('Property created', `${propertyForm.address} (${ref}) saved`)
      setP1Step(2)
    } catch (err) {
      showError('Failed', handleApiError(err, 'create property'))
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // PHASE 1 — PHOTOS
  // ============================================================

  async function handleUploadPhotos() {
    if (photoFiles.length === 0) { setP1Step(3); return }
    setSaving(true)
    try {
      const propId = propertyForm.id
      const isFirst = !(await supabase.from('property_photos').select('id').eq('property_id', propId).limit(1)).data?.length
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i]
        const ext = file.name.split('.').pop()
        const path = `${propId}/${Date.now()}-${i}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('property-photos').upload(path, file)
        if (!uploadErr) {
          await supabase.from('property_photos').insert({
            property_id: propId, storage_path: path, is_primary: isFirst && i === 0,
          } as any)
        }
      }
      setPhotosUploaded(true)
      qc.invalidateQueries({ queryKey: ['property-photos', propId] })
      success('Photos uploaded', `${photoFiles.length} photo(s) saved`)
      setP1Step(3)
    } catch (err) {
      showError('Upload failed', handleApiError(err, 'upload photos'))
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // PHASE 1 — COMPLIANCE
  // ============================================================

  function addComplianceItem() {
    setComplianceItems([...complianceItems, { type: 'gas_safe', expiry_date: '', file: null, uploaded: false }])
  }

  function removeComplianceItem(idx: number) {
    setComplianceItems(complianceItems.filter((_, i) => i !== idx))
  }

  async function handleUploadCompliance() {
    const items = complianceItems.filter(c => c.expiry_date)
    if (items.length === 0) { setComplianceDone(true); setP1Step(4); return }
    setSaving(true)
    try {
      const propId = propertyForm.id
      for (const item of items) {
        let documentId: string | null = null
        if (item.file) {
          const ext = item.file.name.split('.').pop()
          const path = `compliance/${propId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          await supabase.storage.from('documents').upload(path, item.file)
          const { data: doc } = await (supabase.from('documents') as any).insert({
            name: `${item.type.replace(/_/g, ' ').toUpperCase()} Certificate`,
            storage_path: path, entity_type: 'property', entity_id: propId,
            category: 'Compliance', size_bytes: item.file.size,
          } as any).select('id').single()
          documentId = (doc as any)?.id ?? null
        }
        await supabase.from('property_compliance').insert({
          property_id: propId, type: item.type as any,
          expiry_date: item.expiry_date, document_id: documentId,
        } as any)
      }
      setComplianceDone(true)
      qc.invalidateQueries({ queryKey: ['compliance', propId] })
      success('Certificates saved', `${items.length} compliance record(s) added`)
      setP1Step(4)
    } catch (err) {
      showError('Failed', handleApiError(err, 'save compliance'))
    } finally {
      setSaving(false)
    }
  }

  // ============================================================
  // PHASE 2 — TENANTS
  // ============================================================

  async function addQuickTenant() {
    if (!tenantForm.full_name.trim()) return
    const { data, error } = await (supabase.from('tenants') as any)
      .insert({ full_name: tenantForm.full_name, email: tenantForm.email || null, phone: tenantForm.phone || null } as any)
      .select('id, full_name').single()
    if (!error && data) {
      const t = data as any
      setQuickTenantList([...quickTenantList, t])
      setTenantIds([...tenantIds, t.id])
      if (!leadTenantId) setLeadTenantId(t.id)
      setTenantForm({ full_name: '', email: '', phone: '' })
      setShowQuickTenant(false)
    }
  }

  function canProceedPhase2(step: number): boolean {
    switch (step) {
      case 0: return !!propertyForm.id && !!landlordForm.id
      case 1: return tenantIds.length > 0
      case 2: return !!terms.start_date && !!terms.end_date && !!terms.rent_amount
      case 3: return agreementGenerated
      case 4: return sigReady
      default: return true
    }
  }

  // ============================================================
  // PHASE 2 — AGREEMENT + FINALIZE
  // ============================================================

  async function handleGenerateAgreement() {
    setSaving(true)
    try {
      // 1. Create tenancy
      const ref = await generateNextReference('TNC', 'tenancies')
      const { data: newTenancy, error } = await (supabase.from('tenancies') as any)
        .insert({
          property_id: propertyForm.id,
          landlord_id: landlordForm.id,
          start_date: terms.start_date,
          end_date: terms.end_date,
          rent_amount: parseFloat(terms.rent_amount),
          deposit_amount: parseFloat(terms.deposit_amount || '0'),
          deposit_scheme: terms.deposit_scheme || null,
          status: 'active',
          reference_number: ref,
        }).select('id').single()

      if (error || !newTenancy) throw error || new Error('Failed to create tenancy')
      const tenancyId = (newTenancy as any).id

      // 2. Link tenants
      if (tenantIds.length > 0) {
        await supabase.from('tenancy_tenants').insert(
          tenantIds.map(tid => ({ tenancy_id: tenancyId, tenant_id: tid, is_lead: tid === leadTenantId })) as any
        )
      }

      // 3. Generate rent schedule
      const rentCount = await generateRentSchedule(tenancyId, terms.start_date, terms.end_date, parseFloat(terms.rent_amount))

      // 4. Generate agreement (single default AST template)
      let agreementId: string | null = null
      agreementId = await generateAgreementForTenancy(tenancyId)

      // 5. Mark property as let
      await (supabase.from('properties') as any).update({ status: 'let' }).eq('id', propertyForm.id)

      qc.invalidateQueries({ queryKey: ['tenancies'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setAgreementGenerated(true)
      setResult({ tenancyId, rentCount, agreementId })
      setP2Step(4)
      success('Agreement generated', 'Tenancy and agreement created successfully')
    } catch (err) {
      showError('Failed', handleApiError(err, 'generate agreement'))
    } finally {
      setSaving(false)
    }
  }

  async function handleFinalize() {
    setPhase('done')
    success('Onboarding complete!', 'Property, landlord, tenancy, and agreement are all set up')
  }

  // ============================================================
  // NAVIGATION HELPERS
  // ============================================================

  function handleNextP1() {
    if (p1Step === 0 && landlordForm.mode === 'create' && !landlordCreated) {
      handleCreateLandlord()
      return
    }
    if (p1Step === 1 && propertyForm.mode === 'create' && !propertyCreated) {
      handleCreateProperty()
      return
    }
    if (p1Step === 2) { handleUploadPhotos(); return }
    if (p1Step === 3) { handleUploadCompliance(); return }
    setP1Step(p1Step + 1)
  }

  function handlePhase1Complete() {
    setPhase('tenancy')
    setP2Step(0)
  }

  const allTenants = [...(tenants ?? []), ...quickTenantList]
  const annualRent = terms.rent_amount ? parseFloat(terms.rent_amount) * 12 : 0

  // Auto-populate landlord when property selected (if exists)
  useEffect(() => {
    if (propertyForm.id && propertyForm.mode === 'select') {
      const prop = (properties as any[])?.find((p: any) => p.id === propertyForm.id)
      if (prop?.landlord_id && !landlordForm.id) {
        setLandlordForm(f => ({ ...f, id: prop.landlord_id }))
      }
    }
  }, [propertyForm.id])

  // ============================================================
  // DONE SCREEN
  // ============================================================

  if (phase === 'done' && result) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-green-800">All Set!</h2>
              <p className="text-sm text-green-600 mt-1">Property, tenancy & agreement created</p>
            </div>
            <div className="space-y-2 text-sm text-green-700">
              {result.rentCount > 0 && <p>{result.rentCount} rent transactions generated</p>}
              {result.agreementId && <p>Tenancy agreement generated</p>}
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to={`/tenancies/${result.tenancyId}`}><Button>View Tenancy</Button></Link>
              <Link to={`/properties/${propertyForm.id}`}><Button variant="outline">View Property</Button></Link>
              <Link to="/tenancies"><Button variant="outline">All Tenancies</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/"><Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {phase === 'property' ? 'New Property & Landlord Setup' : 'New Tenancy Setup'}
          </h1>
          <p className="text-gray-500 text-sm">
            {phase === 'property' ? 'Phase 1 of 2 — Add landlord, property, and documents' : 'Phase 2 of 2 — Create tenancy and agreement'}
          </p>
        </div>
        {phase === 'tenancy' && (
          <Badge variant="success" className="ml-auto">Phase 2</Badge>
        )}
      </div>

      {/* Phase indicator */}
      <div className="flex gap-3">
        <button
          onClick={() => phase === 'tenancy' ? setPhase('property') : null}
          className={`flex-1 p-3 rounded-lg border-2 text-left transition-colors ${
            phase === 'property'
              ? 'border-blue-600 bg-blue-50'
              : phase === 'tenancy'
              ? 'border-green-200 bg-green-50 cursor-pointer hover:border-green-400'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
              phase === 'property' ? 'bg-blue-600 text-white' : 'bg-green-100 text-green-700'
            }`}>1</div>
            <div>
              <p className="font-semibold text-sm">Property & Landlord</p>
              <p className="text-xs text-gray-500">{phase === 'tenancy' ? '✓ Complete' : phase === 'property' ? 'In progress' : 'Pending'}</p>
            </div>
            {phase === 'tenancy' && <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />}
          </div>
        </button>
        <div className={`flex-1 p-3 rounded-lg border-2 text-left transition-colors ${
          phase === 'tenancy' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 opacity-60'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
              phase === 'tenancy' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>2</div>
            <div>
              <p className="font-semibold text-sm">Tenancy & Agreement</p>
              <p className="text-xs text-gray-500">{phase === 'tenancy' ? 'In progress' : 'Locked'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PHASE 1 — PROPERTY & LANDLORD SETUP                           */}
      {/* ============================================================ */}
      {phase === 'property' && (
        <>
          {/* P1 Progress */}
          <div className="flex items-center gap-1">
            {PHASE1_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => i < p1Step ? setP1Step(i) : null}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    i < p1Step ? 'bg-blue-100 text-blue-700 cursor-pointer' :
                    i === p1Step ? 'bg-blue-600 text-white' :
                    'bg-gray-100 text-gray-500'
                  }`}
                >
                  {i < p1Step ? <CheckCircle className="h-3 w-3" /> : <span className="h-3 w-3 flex items-center justify-center text-xs">{i + 1}</span>}
                  <span className="hidden sm:inline">{s}</span>
                </button>
                {i < 4 && <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />}
              </div>
            ))}
          </div>

          {/* P1 Step 0: Landlord */}
          {p1Step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" /> Step 1: Landlord Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={landlordForm.mode === 'select' ? 'default' : 'outline'} size="sm" onClick={() => setLandlordForm({ ...landlordForm, mode: 'select' })}>Select existing</Button>
                  <Button variant={landlordForm.mode === 'create' ? 'default' : 'outline'} size="sm" onClick={() => setLandlordForm({ ...landlordForm, mode: 'create' })}>Create new</Button>
                </div>

                {landlordForm.mode === 'select' ? (
                  <div className="space-y-1.5">
                    <Label>Select Landlord *</Label>
                    <Select value={landlordForm.id} onChange={e => setLandlordForm({ ...landlordForm, id: e.target.value })}>
                      <option value="">Choose a landlord…</option>
                      {(landlords as any[])?.map((l: any) => (
                        <option key={l.id} value={l.id}>{l.full_name} — {l.email}</option>
                      ))}
                    </Select>
                    <p className="text-xs text-gray-500">
                      <Link to="/landlords/new" className="text-blue-600 underline">Add landlord on separate page?</Link>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label>Full Name *</Label>
                        <Input value={landlordForm.full_name} onChange={e => setLandlordForm({ ...landlordForm, full_name: e.target.value })} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email *</Label>
                        <Input type="email" value={landlordForm.email} onChange={e => setLandlordForm({ ...landlordForm, email: e.target.value })} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone</Label>
                        <Input value={landlordForm.phone} onChange={e => setLandlordForm({ ...landlordForm, phone: e.target.value })} />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 uppercase pt-2 border-t">Address</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 col-span-2">
                        <Label>Address Line 1</Label>
                        <Input value={landlordForm.address_line1} onChange={e => setLandlordForm({ ...landlordForm, address_line1: e.target.value })} />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label>Address Line 2</Label>
                        <Input value={landlordForm.address_line2} onChange={e => setLandlordForm({ ...landlordForm, address_line2: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>City</Label>
                        <Input value={landlordForm.city} onChange={e => setLandlordForm({ ...landlordForm, city: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Postcode</Label>
                        <Input value={landlordForm.postcode} onChange={e => setLandlordForm({ ...landlordForm, postcode: e.target.value })} />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-500 uppercase pt-2 border-t">Bank Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Bank Name</Label>
                        <Input value={landlordForm.bank_name} onChange={e => setLandlordForm({ ...landlordForm, bank_name: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Account Name</Label>
                        <Input value={landlordForm.bank_account_name} onChange={e => setLandlordForm({ ...landlordForm, bank_account_name: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Account Number</Label>
                        <Input value={landlordForm.bank_account_number} onChange={e => setLandlordForm({ ...landlordForm, bank_account_number: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Sort Code</Label>
                        <Input value={landlordForm.bank_sort_code} onChange={e => setLandlordForm({ ...landlordForm, bank_sort_code: e.target.value })} />
                      </div>
                    </div>
                    {landlordCreated && (
                      <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Landlord saved</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* P1 Step 1: Property */}
          {p1Step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> Step 2: Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button variant={propertyForm.mode === 'select' ? 'default' : 'outline'} size="sm" onClick={() => setPropertyForm({ ...propertyForm, mode: 'select' })}>Select existing</Button>
                  <Button variant={propertyForm.mode === 'create' ? 'default' : 'outline'} size="sm" onClick={() => setPropertyForm({ ...propertyForm, mode: 'create' })}>Create new</Button>
                </div>

                {propertyForm.mode === 'select' ? (
                  <div className="space-y-1.5">
                    <Label>Select Property *</Label>
                    <Select value={propertyForm.id} onChange={e => setPropertyForm({ ...propertyForm, id: e.target.value })}>
                      <option value="">Choose a property…</option>
                      {(properties as any[])?.filter((p: any) => p.status === 'available').map((p: any) => (
                        <option key={p.id} value={p.id}>{p.address}, {p.postcode}</option>
                      ))}
                    </Select>
                    <p className="text-xs text-gray-500">Only showing available properties.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <Label>Address *</Label>
                        <Input value={propertyForm.address} onChange={e => setPropertyForm({ ...propertyForm, address: e.target.value })} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Postcode *</Label>
                        <Input value={propertyForm.postcode} onChange={e => setPropertyForm({ ...propertyForm, postcode: e.target.value })} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Type</Label>
                        <Select value={propertyForm.type} onChange={e => setPropertyForm({ ...propertyForm, type: e.target.value })}>
                          {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Bedrooms</Label>
                        <Input type="number" min="0" value={propertyForm.bedrooms} onChange={e => setPropertyForm({ ...propertyForm, bedrooms: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Bathrooms</Label>
                        <Input type="number" min="0" value={propertyForm.bathrooms} onChange={e => setPropertyForm({ ...propertyForm, bathrooms: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>EPC Rating</Label>
                        <Select value={propertyForm.epc_rating} onChange={e => setPropertyForm({ ...propertyForm, epc_rating: e.target.value })}>
                          <option value="">Unknown</option>
                          {['A','B','C','D','E','F','G'].map(r => <option key={r} value={r}>{r}</option>)}
                        </Select>
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label>Description</Label>
                        <Textarea value={propertyForm.description} onChange={e => setPropertyForm({ ...propertyForm, description: e.target.value })} rows={2} />
                      </div>
                    </div>
                    {propertyCreated && (
                      <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Property saved</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* P1 Step 2: Photos */}
          {p1Step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5" /> Step 3: Property Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500">Upload photos of the property. The first photo will be set as primary.</p>
                <div className="space-y-2">
                  <input
                    ref={photoRef}
                    type="file" multiple accept="image/*"
                    onChange={e => setPhotoFiles(Array.from(e.target.files ?? []))}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {photoFiles.length > 0 && (
                    <div className="border rounded p-3">
                      <p className="text-sm font-medium">{photoFiles.length} photo(s) selected:</p>
                      <ul className="text-xs text-gray-600 mt-1 space-y-1">
                        {photoFiles.map((f, i) => (
                          <li key={i} className="flex items-center justify-between">
                            <span>{f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setPhotoFiles(photoFiles.filter((_, j) => j !== i))}>
                              <X className="h-3 w-3" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => { setP1Step(3); }}>Skip — No photos</Button>
                </div>
                {photosUploaded && (
                  <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Photos uploaded</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* P1 Step 3: Compliance */}
          {p1Step === 3 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Step 4: Compliance Certificates</CardTitle>
                <Button size="sm" variant="outline" onClick={addComplianceItem}><Plus className="h-4 w-4 mr-1" /> Add</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {complianceItems.length === 0 && (
                  <p className="text-sm text-gray-400">No certificates added yet. Add Gas Safe, EICR, EPC, etc.</p>
                )}
                {complianceItems.map((item, idx) => (
                  <div key={idx} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Certificate #{idx + 1}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => removeComplianceItem(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={item.type} onChange={e => {
                          const copy = [...complianceItems]; copy[idx].type = e.target.value; setComplianceItems(copy)
                        }}>
                          {COMPLIANCE_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Expiry Date *</Label>
                        <Input type="date" value={item.expiry_date} onChange={e => {
                          const copy = [...complianceItems]; copy[idx].expiry_date = e.target.value; setComplianceItems(copy)
                        }} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Document (optional)</Label>
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => {
                        const copy = [...complianceItems]; copy[idx].file = e.target.files?.[0] ?? null; setComplianceItems(copy)
                      }} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700" />
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => { setComplianceDone(true); setP1Step(4); }}>Skip — No certificates</Button>
                {complianceDone && (
                  <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Certificates saved</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* P1 Step 4: Review */}
          {p1Step === 4 && (
            <Card>
              <CardHeader><CardTitle>Step 5: Review & Continue</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Landlord</p>
                    <p className="font-medium">
                      {landlordForm.mode === 'select'
                        ? (landlords as any[])?.find((l: any) => l.id === landlordForm.id)?.full_name ?? '—'
                        : landlordForm.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Property</p>
                    <p className="font-medium">
                      {propertyForm.mode === 'select'
                        ? (properties as any[])?.find((p: any) => p.id === propertyForm.id)?.address ?? '—'
                        : propertyForm.address}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Photos</p>
                    <p className="font-medium">{photoFiles.length > 0 ? `${photoFiles.length} uploaded` : 'None'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Certificates</p>
                    <p className="font-medium">{complianceItems.filter(c => c.expiry_date).length > 0 ? `${complianceItems.filter(c => c.expiry_date).length} added` : 'None'}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button onClick={handlePhase1Complete} className="w-full" size="lg">
                    Continue to Phase 2 — Tenancy & Agreement <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* P1 Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => p1Step > 0 ? setP1Step(p1Step - 1) : navigate('/')}>
              <ChevronLeft className="h-4 w-4 mr-1" /> {p1Step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {p1Step < 4 && (
              <Button onClick={handleNextP1} disabled={!canProceedPhase1(p1Step) || saving}>
                {saving ? 'Saving…' : 'Next'} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* PHASE 2 — TENANCY & AGREEMENT                                 */}
      {/* ============================================================ */}
      {phase === 'tenancy' && (
        <>
          {/* P2 Progress */}
          <div className="flex items-center gap-1">
            {PHASE2_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => i < p2Step ? setP2Step(i) : null}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    i < p2Step ? 'bg-blue-100 text-blue-700 cursor-pointer' :
                    i === p2Step ? 'bg-blue-600 text-white' :
                    'bg-gray-100 text-gray-500'
                  }`}
                >
                  {i < p2Step ? <CheckCircle className="h-3 w-3" /> : <span className="h-3 w-3 flex items-center justify-center text-xs">{i + 1}</span>}
                  <span className="hidden sm:inline">{s}</span>
                </button>
                {i < 5 && <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />}
              </div>
            ))}
          </div>

          {/* P2 Step 0: Property & Landlord confirmation */}
          {p2Step === 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Step 1: Property & Landlord</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="border rounded p-3">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Property</p>
                    <p className="font-medium">{propertyForm.address || (properties as any[])?.find((p: any) => p.id === propertyForm.id)?.address}</p>
                    <p className="text-xs text-gray-500">{propertyForm.postcode || (properties as any[])?.find((p: any) => p.id === propertyForm.id)?.postcode}</p>
                  </div>
                  <div className="border rounded p-3">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Landlord</p>
                    <p className="font-medium">{landlordForm.full_name || (landlords as any[])?.find((l: any) => l.id === landlordForm.id)?.full_name}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Or choose different ones:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Select Property</Label>
                      <Select value={propertyForm.id} onChange={e => setPropertyForm({ ...propertyForm, id: e.target.value })}>
                        <option value="">Choose...</option>
                        {(properties as any[])?.filter((p: any) => p.status === 'available').map((p: any) => (
                          <option key={p.id} value={p.id}>{p.address}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Select Landlord</Label>
                      <Select value={landlordForm.id} onChange={e => setLandlordForm({ ...landlordForm, id: e.target.value })}>
                        <option value="">Choose...</option>
                        {(landlords as any[])?.map((l: any) => (
                          <option key={l.id} value={l.id}>{l.full_name}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* P2 Step 1: Tenants */}
          {p2Step === 1 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Step 2: Select Tenants</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowQuickTenant(!showQuickTenant)}>
                  <Plus className="h-4 w-4 mr-1" /> Quick Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showQuickTenant && (
                  <div className="border rounded p-3 space-y-2 bg-gray-50">
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="Full name *" value={tenantForm.full_name} onChange={e => setTenantForm({ ...tenantForm, full_name: e.target.value })} />
                      <Input placeholder="Email" value={tenantForm.email} onChange={e => setTenantForm({ ...tenantForm, email: e.target.value })} />
                      <Input placeholder="Phone" value={tenantForm.phone} onChange={e => setTenantForm({ ...tenantForm, phone: e.target.value })} />
                    </div>
                    <Button size="sm" onClick={addQuickTenant}><Plus className="h-3 w-3 mr-1" /> Add & Select</Button>
                  </div>
                )}
                {allTenants.length === 0 ? (
                  <p className="text-sm text-gray-400">No tenants in database. Use Quick Add above.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(allTenants as any[]).map((t: any) => (
                      <label key={t.id} className="flex items-center gap-3 text-sm p-2 rounded hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={tenantIds.includes(t.id)} onChange={() => {
                          const ids = tenantIds.includes(t.id) ? tenantIds.filter(x => x !== t.id) : [...tenantIds, t.id]
                          setTenantIds(ids)
                          setLeadTenantId(ids.length > 0 ? (leadTenantId && ids.includes(leadTenantId) ? leadTenantId : ids[0]) : '')
                        }} className="rounded" />
                        <span className="flex-1">{t.full_name}</span>
                        <span className="text-xs text-gray-400">{t.email}</span>
                        {tenantIds.includes(t.id) && (
                          <label className="flex items-center gap-1 text-xs">
                            <input type="radio" name="lead" checked={leadTenantId === t.id} onChange={() => setLeadTenantId(t.id)} /> Lead
                          </label>
                        )}
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500">{tenantIds.length} tenant(s) selected</p>
              </CardContent>
            </Card>
          )}

          {/* P2 Step 2: Terms */}
          {p2Step === 2 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Step 3: Tenancy Terms</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Start Date *</Label><Input type="date" value={terms.start_date} onChange={e => setTerms({ ...terms, start_date: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>End Date *</Label><Input type="date" value={terms.end_date} onChange={e => setTerms({ ...terms, end_date: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Monthly Rent (£) *</Label><Input type="number" step="0.01" value={terms.rent_amount} onChange={e => setTerms({ ...terms, rent_amount: e.target.value })} /></div>
                  <div className="space-y-1.5">
                    <Label>Annual Total</Label>
                    <div className="h-9 flex items-center px-3 rounded-md bg-gray-50 border text-sm">{formatCurrency(annualRent)}</div>
                  </div>
                  <div className="space-y-1.5"><Label>Deposit (£)</Label><Input type="number" step="0.01" value={terms.deposit_amount} onChange={e => setTerms({ ...terms, deposit_amount: e.target.value })} /></div>
                  <div className="space-y-1.5">
                    <Label>Deposit Scheme</Label>
                    <Select value={terms.deposit_scheme} onChange={e => setTerms({ ...terms, deposit_scheme: e.target.value })}>
                      {DEPOSIT_SCHEMES.map(s => <option key={s} value={s}>{s || 'None'}</option>)}
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* P2 Step 3: Agreement */}
          {p2Step === 3 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Step 4: Tenancy Agreement</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500">
                  The agreement will be generated with all tenant, landlord, property, and terms data merged in.
                  Compliance certificates associated with this property will be appended automatically.
                </p>
                {!agreementGenerated ? (
                  <Button onClick={handleGenerateAgreement} disabled={saving}>
                    {saving ? 'Generating…' : 'Generate Tenancy & Agreement'}
                  </Button>
                ) : (
                  <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Tenancy & agreement generated</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* P2 Step 4: Signatures */}
          {p2Step === 4 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5" /> Step 5: Signatures</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500">
                  Signatures can be captured now using a signature pad or touch/mouse, or later from the Agreements page.
                </p>
                <div className="flex gap-3">
                  {result?.agreementId && (
                    <Link to={`/agreements`}>
                      <Button variant="outline"><Eye className="h-4 w-4 mr-1" /> Open Agreement to Sign</Button>
                    </Link>
                  )}
                  <Button variant="outline" onClick={() => { setSigReady(true); setP2Step(5); }}>
                    Skip for now <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                {sigReady && (
                  <p className="text-sm text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Ready to continue</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* P2 Step 5: Review */}
          {p2Step === 5 && (
            <Card>
              <CardHeader><CardTitle>Step 6: Review & Complete</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Property</p>
                    <p className="font-medium">{(properties as any[])?.find((p: any) => p.id === propertyForm.id)?.address ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Landlord</p>
                    <p className="font-medium">{(landlords as any[])?.find((l: any) => l.id === landlordForm.id)?.full_name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Tenants</p>
                    <p className="font-medium">{tenantIds.map(id => allTenants.find((t: any) => t.id === id)?.full_name).filter(Boolean).join(', ') || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Terms</p>
                    <p className="font-medium">{terms.start_date} – {terms.end_date} | {formatCurrency(parseFloat(terms.rent_amount || '0'))}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Agreement</p>
                    <p className="font-medium">{result?.agreementId ? 'Generated ✓' : 'None'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Signatures</p>
                    <p className="font-medium">{sigReady ? 'Ready to sign' : 'Pending'}</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button onClick={handleFinalize} className="w-full" size="lg">
                    <Sparkles className="h-4 w-4 mr-2" /> Complete Onboarding
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* P2 Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => p2Step > 0 ? setP2Step(p2Step - 1) : setPhase('property')}>
              <ChevronLeft className="h-4 w-4 mr-1" /> {p2Step === 0 ? 'Back to Phase 1' : 'Back'}
            </Button>
            {p2Step < 5 && p2Step !== 3 && (
              <Button onClick={() => setP2Step(p2Step + 1)} disabled={!canProceedPhase2(p2Step)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
