import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, ChevronDown, ChevronRight, Save, UserPlus, CheckCircle, Users, FileText, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react'
import { generateRentSchedule } from '@/utils/finance'
import { generateAgreementForTenancy } from '@/utils/agreements'
import { formatCurrency } from '@/lib/utils'
import ChecklistFormDialog from '@/components/ChecklistFormDialog'
import { generateNextReference } from '@/utils/references'
import { calculateReadinessScore, readinessLabel } from '@/utils/compliance-score'

export default function TenancyCreatePage() {
  const navigate = useNavigate()
  const [sections, setSections] = useState({ property: true, tenants: true, terms: true, automation: true })
  const [form, setForm] = useState({
    property_id: '', landlord_id: '', tenant_ids: [] as string[], lead_tenant_id: '',
    start_date: '', end_date: '', rent_amount: '', deposit_amount: '',
    deposit_scheme: '', description: '', status: 'active', council_id: '',
    auto_rent_schedule: true, auto_agreement: true, mark_property_let: false,
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [results, setResults] = useState<{ rentCount?: number; agreementId?: string | null } | null>(null)
  const [showQuickAddTenant, setShowQuickAddTenant] = useState(false)
  const [createdTenancyId, setCreatedTenancyId] = useState<string | null>(null)
  const [showMoveInChecklist, setShowMoveInChecklist] = useState(false)

  const { data: properties } = useQuery({
    queryKey: ['properties-dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('id, address, landlord_id, status').order('address')
      return data ?? []
    },
  })
  const { data: landlords } = useQuery({
    queryKey: ['landlords-dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('landlords').select('id, full_name, bank_account_name, bank_account_number, bank_sort_code, bank_name, address_line1, city, postcode').order('full_name')
      return data ?? []
    },
  })
  const { data: tenants } = useQuery({
    queryKey: ['tenants-dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('tenants').select('id, full_name, email').order('full_name')
      return data ?? []
    },
  })
  const { data: councils } = useQuery({
    queryKey: ['councils-dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('local_authorities').select('id, name').order('name')
      return data ?? []
    },
  })

  // Auto-populate landlord when property is selected
  function onPropertyChange(propertyId: string) {
    const prop = (properties as any[])?.find((p) => p.id === propertyId)
    setForm((f) => ({ ...f, property_id: propertyId, landlord_id: prop?.landlord_id ?? f.landlord_id }))
  }

  function toggleTenant(id: string) {
    setForm((f) => {
      const ids = f.tenant_ids.includes(id) ? f.tenant_ids.filter((x) => x !== id) : [...f.tenant_ids, id]
      return { ...f, tenant_ids: ids, lead_tenant_id: ids.length > 0 ? ids[0] : '' }
    })
  }

  const annualRent = form.rent_amount ? parseFloat(form.rent_amount) * 12 : 0

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setResults(null)
    setSaveError(null)

    // 0. Check for active tenancy conflict on the selected property
    if (form.property_id && (form.status === 'active' || form.status === 'ending_soon')) {
      const { data: existing } = await supabase
        .from('tenancies')
        .select('id, reference_number')
        .eq('property_id', form.property_id)
        .in('status', ['active', 'ending_soon'])
        .maybeSingle()
      if (existing) {
        setSaveError(
          `This property already has an active tenancy (${ (existing as any).reference_number ?? 'unknown ref' }). End or expire it before creating a new one.`
        )
        setSaving(false)
        return
      }

      // 0b. Compliance readiness check
      const { data: propCompliance } = await supabase
        .from('property_compliance')
        .select('type, expiry_date')
        .eq('property_id', form.property_id)
      const readiness = calculateReadinessScore((propCompliance ?? []).map((c: any) => ({ type: c.type, expiry_date: c.expiry_date })))
      if (readiness.status === 'not_ready') {
        const gaps = readiness.items.filter((i) => i.state === 'missing' || i.state === 'expired').map((i) => i.type.replace('_', ' ')).join(', ')
        setSaveError(
          `Property is not compliance-ready. Missing or expired: ${gaps}. Please update compliance before creating an active tenancy.`
        )
        setSaving(false)
        return
      }
    }

    // 1. Pre-generate reference number
    const ref = await generateNextReference('TNC', 'tenancies')

    // 2. Create tenancy
    const { data: newTenancy, error } = await (supabase
      .from('tenancies') as any)
      .insert({
        property_id: form.property_id,
        landlord_id: form.landlord_id,
        council_id: form.council_id || null,
        start_date: form.start_date,
        end_date: form.end_date,
        rent_amount: parseFloat(form.rent_amount),
        deposit_amount: parseFloat(form.deposit_amount || '0'),
        deposit_scheme: form.deposit_scheme || null,
        description: form.description || null,
        status: form.status,
        reference_number: ref,
      })
      .select('id')
      .single()

    if (error || !newTenancy) {
      setSaveError('Failed to create tenancy: ' + (error?.message ?? 'Unknown error'))
      setSaving(false)
      return
    }

    const tenancyId = (newTenancy as any).id

    // 2. Link tenants
    if (form.tenant_ids.length > 0) {
      await supabase.from('tenancy_tenants').insert(
        form.tenant_ids.map((tid) => ({
          tenancy_id: tenancyId,
          tenant_id: tid,
          is_lead: tid === form.lead_tenant_id,
        })) as any,
      )
    }

    // 3. Auto-generate rent schedule
    let rentCount = 0
    if (form.auto_rent_schedule) {
      rentCount = await generateRentSchedule(tenancyId, form.start_date, form.end_date, parseFloat(form.rent_amount))
    }

    // 4. Auto-generate agreement
    let agreementId: string | null = null
    if (form.auto_agreement) {
      agreementId = await generateAgreementForTenancy(tenancyId)
    }

    // 5. Mark property as let
    if (form.mark_property_let && form.property_id) {
      await (supabase.from('properties') as any).update({ status: 'let' }).eq('id', form.property_id)
    }

    setResults({ rentCount, agreementId })
    setCreatedTenancyId(tenancyId)
    setSaving(false)
  }

  function toggleSection(key: keyof typeof sections) {
    setSections((s) => ({ ...s, [key]: !s[key] }))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/tenancies">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Tenancy</h1>
          <p className="text-gray-500 text-sm">Create a tenancy with optional automation</p>
        </div>
      </div>

      {results && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium text-green-800">Tenancy created successfully!</p>
              {results.rentCount !== undefined && results.rentCount > 0 && (
                <p className="text-green-700">{results.rentCount} rent transactions generated.</p>
              )}
              {results.agreementId && (
                <p className="text-green-700">
                  Agreement generated.{' '}
                  <Link to="/agreements" className="underline font-medium">View agreements →</Link>
                </p>
              )}
              <Button size="sm" className="mt-2" onClick={() => navigate('/tenancies')}>
                Back to Tenancies
              </Button>
              <Button size="sm" variant="outline" className="mt-2 ml-2" onClick={() => setShowMoveInChecklist(true)}>
                <CheckCircle className="h-4 w-4 mr-1" /> Complete Move-In Checklist
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Section 1 — Property & Landlord */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('property')}>
            <CardTitle className="flex items-center gap-2">
              {sections.property ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              1. Property & Landlord
            </CardTitle>
          </CardHeader>
          {sections.property && (
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Property *</Label>
                <Select value={form.property_id} onChange={(e) => onPropertyChange(e.target.value)} required>
                  <option value="">Select property…</option>
                  {(properties as any[])?.map((p) => (
                    <option key={p.id} value={p.id}>{p.address} {p.status === 'available' ? '(Available)' : ''}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Landlord *</Label>
                <Select value={form.landlord_id} onChange={(e) => setForm({ ...form, landlord_id: e.target.value })} required>
                  <option value="">Select landlord…</option>
                  {(landlords as any[])?.map((l) => (
                    <option key={l.id} value={l.id}>{l.full_name}</option>
                  ))}
                </Select>
              </div>
              {form.landlord_id && (() => {
                const landlord = (landlords as any[])?.find((l) => l.id === form.landlord_id)
                if (!landlord) return null
                return (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                    <p className="text-sm font-semibold text-blue-900">Landlord Details (for Agreement)</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-blue-700">Name:</span> {landlord.full_name}</div>
                      {landlord.bank_account_name && <div><span className="text-blue-700">Bank:</span> {landlord.bank_account_name}</div>}
                      {landlord.bank_account_number && <div><span className="text-blue-700">Account:</span> <span className="font-mono">{landlord.bank_account_number}</span></div>}
                      {landlord.bank_sort_code && <div><span className="text-blue-700">Sort Code:</span> <span className="font-mono">{landlord.bank_sort_code}</span></div>}
                      {landlord.bank_name && <div><span className="text-blue-700">Bank Name:</span> {landlord.bank_name}</div>}
                      {landlord.address_line1 && <div className="col-span-2"><span className="text-blue-700">Address:</span> {landlord.address_line1}{landlord.city ? `, ${landlord.city}` : ''}{landlord.postcode ? ` ${landlord.postcode}` : ''}</div>}
                    </div>
                  </div>
                )
              })()}
              {form.property_id && (properties as any[])?.find((p) => p.id === form.property_id)?.status === 'available' && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                  This property is currently "Available". Check the automation section to mark it as "Let" on save.
                </p>
              )}
            </CardContent>
          )}
        </Card>

        {/* Section 2 — Tenants */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('tenants')}>
            <CardTitle className="flex items-center gap-2">
              {sections.tenants ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              2. Tenants
            </CardTitle>
          </CardHeader>
          {sections.tenants && (
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{form.tenant_ids.length} tenant(s) selected</p>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowQuickAddTenant(true)}>
                  <UserPlus className="h-4 w-4" /> Add New Tenant
                </Button>
              </div>
              <div className="border border-gray-200 rounded-md p-3 max-h-60 overflow-y-auto space-y-2">
                {(tenants as any[])?.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={form.tenant_ids.includes(t.id)}
                      onChange={() => toggleTenant(t.id)}
                      className="rounded"
                    />
                    <span className="flex-1">{t.full_name}</span>
                    <span className="text-gray-400 text-xs">{t.email}</span>
                    {form.tenant_ids.includes(t.id) && (
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="lead_tenant"
                          checked={form.lead_tenant_id === t.id}
                          onChange={() => setForm({ ...form, lead_tenant_id: t.id })}
                        />
                        Lead
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section 3 — Terms */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('terms')}>
            <CardTitle className="flex items-center gap-2">
              {sections.terms ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              3. Tenancy Terms
            </CardTitle>
          </CardHeader>
          {sections.terms && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Date *</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date *</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Monthly Rent (£) *</Label>
                  <Input type="number" step="0.01" value={form.rent_amount} onChange={(e) => setForm({ ...form, rent_amount: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Annual Total</Label>
                  <div className="h-9 flex items-center px-3 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-600">
                    {formatCurrency(annualRent)}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Deposit (£)</Label>
                  <Input type="number" step="0.01" value={form.deposit_amount} onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Deposit Scheme</Label>
                  <Select value={form.deposit_scheme} onChange={(e) => setForm({ ...form, deposit_scheme: e.target.value })}>
                    <option value="">None</option>
                    <option value="TDS">TDS</option>
                    <option value="DPS">DPS</option>
                    <option value="MyDeposits">MyDeposits</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Council / Local Authority</Label>
                <select
                  value={form.council_id}
                  onChange={(e) => setForm({ ...form, council_id: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select council (optional)</option>
                  {(councils ?? []).map((council: any) => (
                    <option key={council.id} value={council.id}>
                      {council.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">Required for HMO/licensing compliance</p>
              </div>
              <div className="space-y-1.5">
                <Label>Tenancy Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Special terms, arrangements, or notes about this tenancy..."
                />
                <p className="text-xs text-gray-500">Optional. This description will be available as a merge field in agreement templates.</p>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Section 4 — Automation */}
        <Card>
          <CardHeader className="cursor-pointer" onClick={() => toggleSection('automation')}>
            <CardTitle className="flex items-center gap-2">
              {sections.automation ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              4. Post-Save Automation
            </CardTitle>
          </CardHeader>
          {sections.automation && (
            <CardContent className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.auto_rent_schedule} onChange={(e) => setForm({ ...form, auto_rent_schedule: e.target.checked })} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Auto-generate monthly rent schedule</p>
                  <p className="text-xs text-gray-500">Creates pending rent transaction rows for each month of the tenancy</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.auto_agreement} onChange={(e) => setForm({ ...form, auto_agreement: e.target.checked })} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Auto-generate tenancy agreement</p>
                  <p className="text-xs text-gray-500">Uses the default agreement template with merged tenancy data</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={form.mark_property_let} onChange={(e) => setForm({ ...form, mark_property_let: e.target.checked })} className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Mark property as "Let"</p>
                  <p className="text-xs text-gray-500">Updates the property status from "Available" to "Let"</p>
                </div>
              </label>
            </CardContent>
          )}
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/tenancies')}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? 'Creating…' : 'Create Tenancy'}
          </Button>
        </div>
      </form>

      <QuickAddTenantDialog
        open={showQuickAddTenant}
        onClose={() => setShowQuickAddTenant(false)}
        onAdded={(id, name) => {
          setForm((f) => ({ ...f, tenant_ids: [...f.tenant_ids, id], lead_tenant_id: f.lead_tenant_id || id }))
          setShowQuickAddTenant(false)
        }}
      />

      {createdTenancyId && (
        <ChecklistFormDialog
          open={showMoveInChecklist}
          onClose={() => setShowMoveInChecklist(false)}
          tenancyId={createdTenancyId}
          checklistType="move_in"
        />
      )}
    </div>
  )
}

function QuickAddTenantDialog({ open, onClose, onAdded }: {
  open: boolean; onClose: () => void; onAdded: (id: string, name: string) => void
}) {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', date_of_birth: '', ni_number: '', emergency_contact: '',
  })
  const [idDocs, setIdDocs] = useState<Array<{
    document_type: string; document_number: string; issuing_country: string; issue_date: string; expiry_date: string;
    file: File | null;
  }>>([])
  const [familyMembers, setFamilyMembers] = useState<Array<{
    full_name: string; relationship: string; date_of_birth: string; phone: string;
  }>>([])
  const [expandedSections, setExpandedSections] = useState({ basic: true, id_docs: false, family: false })
  const [saving, setSaving] = useState(false)

  function toggleSection(key: keyof typeof expandedSections) {
    setExpandedSections((s) => ({ ...s, [key]: !s[key] }))
  }

  function addIdDoc() {
    setIdDocs((d) => [...d, { document_type: 'passport', document_number: '', issuing_country: '', issue_date: '', expiry_date: '', file: null }])
  }
  function removeIdDoc(i: number) {
    setIdDocs((d) => d.filter((_, idx) => idx !== i))
  }
  function updateIdDoc(i: number, field: string, value: any) {
    setIdDocs((d) => d.map((doc, idx) => idx === i ? { ...doc, [field]: value } : doc))
  }

  function addFamilyMember() {
    setFamilyMembers((f) => [...f, { full_name: '', relationship: 'spouse', date_of_birth: '', phone: '' }])
  }
  function removeFamilyMember(i: number) {
    setFamilyMembers((f) => f.filter((_, idx) => idx !== i))
  }
  function updateFamilyMember(i: number, field: string, value: any) {
    setFamilyMembers((f) => f.map((fm, idx) => idx === i ? { ...fm, [field]: value } : fm))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    // 1. Create tenant
    const { data, error } = await supabase
      .from('tenants')
      .insert({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        date_of_birth: form.date_of_birth || null,
        ni_number: form.ni_number || null,
        emergency_contact: form.emergency_contact || null,
      } as any)
      .select('id, full_name')
      .single()

    if (error) {
      alert('Failed to add tenant: ' + error.message)
      setSaving(false)
      return
    }

    const tenantId = (data as any).id

    // 2. Save ID documents
    for (const doc of idDocs) {
      let filePath = null
      if (doc.file) {
        const ext = doc.file.name.split('.').pop()
        const path = `${tenantId}/${Date.now()}.${ext}`
        await supabase.storage.from('tenant-id-documents').upload(path, doc.file)
        filePath = path
      }
      await supabase.from('tenant_id_documents').insert({
        tenant_id: tenantId,
        document_type: doc.document_type,
        document_number: doc.document_number || null,
        issuing_country: doc.issuing_country || null,
        issue_date: doc.issue_date || null,
        expiry_date: doc.expiry_date || null,
        file_path: filePath,
      } as any)
    }

    // 3. Save family members
    for (const fm of familyMembers) {
      if (fm.full_name.trim()) {
        await supabase.from('tenant_family_members').insert({
          tenant_id: tenantId,
          full_name: fm.full_name,
          relationship: fm.relationship,
          date_of_birth: fm.date_of_birth || null,
          phone: fm.phone || null,
        } as any)
      }
    }

    onAdded(tenantId, (data as any).full_name)
    setForm({ full_name: '', email: '', phone: '', date_of_birth: '', ni_number: '', emergency_contact: '' })
    setIdDocs([])
    setFamilyMembers([])
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>Add New Tenant</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            {/* Basic Info */}
            <div className="border rounded-lg">
              <button type="button" className="w-full flex items-center justify-between p-3" onClick={() => toggleSection('basic')}>
                <span className="font-medium text-sm">Basic Information</span>
                {expandedSections.basic ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {expandedSections.basic && (
                <div className="p-3 pt-0 space-y-3 border-t">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
                    <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
                    <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>NI Number</Label><Input value={form.ni_number} onChange={(e) => setForm({ ...form, ni_number: e.target.value })} /></div>
                    <div className="space-y-1.5"><Label>Emergency Contact</Label><Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} /></div>
                  </div>
                </div>
              )}
            </div>

            {/* ID Documents */}
            <div className="border rounded-lg">
              <div className="flex items-center justify-between p-3">
                <button type="button" className="flex items-center gap-2" onClick={() => toggleSection('id_docs')}>
                  <FileText className="h-4 w-4" />
                  <span className="font-medium text-sm">ID Documents ({idDocs.length})</span>
                </button>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={addIdDoc}>Add</Button>
                  {expandedSections.id_docs ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </div>
              {expandedSections.id_docs && idDocs.length > 0 && (
                <div className="p-3 pt-0 space-y-3 border-t">
                  {idDocs.map((doc, i) => (
                    <div key={i} className="border rounded p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500">Document #{i + 1}</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeIdDoc(i)} className="h-6 w-6 p-0 text-red-500"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={doc.document_type} onChange={(e) => updateIdDoc(i, 'document_type', e.target.value)}>
                          <option value="passport">Passport</option>
                          <option value="driving_license">Driving License</option>
                          <option value="right_to_rent">Right to Rent</option>
                          <option value="biometric_residence_permit">BRP</option>
                          <option value="national_id">National ID</option>
                          <option value="other">Other</option>
                        </Select>
                        <Input placeholder="Document number" value={doc.document_number} onChange={(e) => updateIdDoc(i, 'document_number', e.target.value)} />
                        <Input placeholder="Issuing country" value={doc.issuing_country} onChange={(e) => updateIdDoc(i, 'issuing_country', e.target.value)} />
                        <Input type="date" value={doc.issue_date} onChange={(e) => updateIdDoc(i, 'issue_date', e.target.value)} placeholder="Issue date" />
                        <Input type="date" value={doc.expiry_date} onChange={(e) => updateIdDoc(i, 'expiry_date', e.target.value)} placeholder="Expiry date" />
                        <Input type="file" onChange={(e) => updateIdDoc(i, 'file', e.target.files?.[0] ?? null)} accept="image/*,.pdf" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Family Members */}
            <div className="border rounded-lg">
              <div className="flex items-center justify-between p-3">
                <button type="button" className="flex items-center gap-2" onClick={() => toggleSection('family')}>
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-sm">Family Members ({familyMembers.length})</span>
                </button>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={addFamilyMember}>Add</Button>
                  {expandedSections.family ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </div>
              {expandedSections.family && familyMembers.length > 0 && (
                <div className="p-3 pt-0 space-y-3 border-t">
                  {familyMembers.map((fm, i) => (
                    <div key={i} className="border rounded p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500">Member #{i + 1}</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeFamilyMember(i)} className="h-6 w-6 p-0 text-red-500"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Full name" value={fm.full_name} onChange={(e) => updateFamilyMember(i, 'full_name', e.target.value)} />
                        <Select value={fm.relationship} onChange={(e) => updateFamilyMember(i, 'relationship', e.target.value)}>
                          <option value="spouse">Spouse</option>
                          <option value="partner">Partner</option>
                          <option value="child">Child</option>
                          <option value="parent">Parent</option>
                          <option value="sibling">Sibling</option>
                          <option value="other">Other</option>
                        </Select>
                        <Input type="date" value={fm.date_of_birth} onChange={(e) => updateFamilyMember(i, 'date_of_birth', e.target.value)} placeholder="Date of birth" />
                        <Input placeholder="Phone" value={fm.phone} onChange={(e) => updateFamilyMember(i, 'phone', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Tenant'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
