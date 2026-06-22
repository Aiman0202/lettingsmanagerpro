import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Plus, Upload, FileText, Users, Calendar, Mail, Phone, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function TenantDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [showIdForm, setShowIdForm] = useState(false)
  const [showFamilyForm, setShowFamilyForm] = useState(false)

  const { data: tenant } = useQuery({
    queryKey: ['tenant-detail', id],
    queryFn: async () => {
      const { data } = await supabase.from('tenants').select('*').eq('id', id!).single()
      return data
    },
  })

  const { data: idDocs } = useQuery({
    queryKey: ['tenant-id-docs', id],
    queryFn: async () => {
      const { data } = await supabase.from('tenant_id_documents').select('*').eq('tenant_id', id!).order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const { data: familyMembers } = useQuery({
    queryKey: ['tenant-family', id],
    queryFn: async () => {
      const { data } = await supabase.from('tenant_family_members').select('*').eq('tenant_id', id!).order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const { data: tenancies } = useQuery({
    queryKey: ['tenant-tenancies', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenancy_tenants')
        .select('*, tenancies(start_date, end_date, rent_amount, status, properties(address))')
        .eq('tenant_id', id!)
      return data ?? []
    },
  })

  if (!tenant) return <div className="p-6 text-gray-400">Loading…</div>
  const t = tenant as any

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/tenants">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.full_name}</h1>
          <p className="text-gray-500 text-sm">{t.email} · {t.phone ?? 'No phone'}</p>
        </div>
      </div>

      {/* Profile */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> Contact</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><span className="text-gray-500">Email:</span> {t.email}</p>
            <p><span className="text-gray-500">Phone:</span> {t.phone ?? '—'}</p>
            <p><span className="text-gray-500">DOB:</span> {t.date_of_birth ? formatDate(t.date_of_birth) : '—'}</p>
            <p><span className="text-gray-500">NI Number:</span> {t.ni_number ?? '—'}</p>
            <p><span className="text-gray-500">Emergency:</span> {t.emergency_contact ?? '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Family Members</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            {(familyMembers as any[] ?? []).length === 0 ? (
              <p className="text-gray-400">No family members recorded</p>
            ) : (familyMembers as any[] ?? []).map((fm: any) => (
              <div key={fm.id} className="border-b pb-2 last:border-0">
                <p className="font-medium">{fm.full_name} <Badge variant="outline" className="text-xs ml-1">{fm.relationship}</Badge></p>
                <p className="text-gray-500 text-xs">{fm.date_of_birth ? formatDate(fm.date_of_birth) : '—'} · {fm.phone ?? '—'}</p>
              </div>
            ))}
            <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setShowFamilyForm(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add Family Member
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> ID Documents</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            {(idDocs as any[] ?? []).length === 0 ? (
              <p className="text-gray-400">No ID documents uploaded</p>
            ) : (idDocs as any[] ?? []).map((doc: any) => (
              <div key={doc.id} className="border rounded p-2 flex justify-between items-center">
                <div>
                  <p className="font-medium text-xs">{doc.document_type.replace(/_/g, ' ').toUpperCase()}</p>
                  <p className="text-gray-400 text-xs">{doc.document_number ?? 'No number'}{doc.expiry_date ? ` · Expires ${formatDate(doc.expiry_date)}` : ''}</p>
                </div>
                {doc.file_path && (
                  <a href="#" className="text-blue-600 text-xs underline">View</a>
                )}
              </div>
            ))}
            <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setShowIdForm(true)}>
              <Upload className="h-3 w-3 mr-1" /> Add ID Document
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tenancy History */}
      <Card>
        <CardHeader><CardTitle>Tenancy History</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Property</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Rent/mo</TableHead><TableHead>Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {(tenancies as any[] ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-6">No tenancies</TableCell></TableRow>
            ) : (tenancies as any[] ?? []).map((tt: any) => (
              <TableRow key={tt.id}>
                <TableCell>{tt.tenancies?.properties?.address ?? '—'}</TableCell>
                <TableCell>{formatDate(tt.tenancies?.start_date)}</TableCell>
                <TableCell>{formatDate(tt.tenancies?.end_date)}</TableCell>
                <TableCell>£{tt.tenancies?.rent_amount?.toLocaleString()}</TableCell>
                <TableCell><Badge variant={tt.tenancies?.status === 'active' ? 'success' : 'secondary'}>{tt.tenancies?.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <IdDocumentDialog open={showIdForm} onClose={() => setShowIdForm(false)} tenantId={id!} />
      <FamilyMemberDialog open={showFamilyForm} onClose={() => setShowFamilyForm(false)} tenantId={id!} />
    </div>
  )
}

function IdDocumentDialog({ open, onClose, tenantId }: { open: boolean; onClose: () => void; tenantId: string }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ document_type: 'passport', document_number: '', issuing_country: '', issue_date: '', expiry_date: '', notes: '' })
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    let filePath = null
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `${tenantId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('tenant-id-documents').upload(path, file)
      if (!uploadErr) filePath = path
    }

    await supabase.from('tenant_id_documents').insert({
      tenant_id: tenantId,
      document_type: form.document_type,
      document_number: form.document_number || null,
      issuing_country: form.issuing_country || null,
      issue_date: form.issue_date || null,
      expiry_date: form.expiry_date || null,
      file_path: filePath,
      notes: form.notes || null,
    } as any)

    setSaving(false)
    qc.invalidateQueries({ queryKey: ['tenant-id-docs', tenantId] })
    onClose()
    setForm({ document_type: 'passport', document_number: '', issuing_country: '', issue_date: '', expiry_date: '', notes: '' })
    setFile(null)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader><DialogTitle>Add ID Document</DialogTitle></DialogHeader>
          <div className="p-6 space-y-3">
            <div className="space-y-1.5">
              <Label>Document Type</Label>
              <Select value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })}>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="right_to_rent">Right to Rent</option>
                <option value="biometric_residence_permit">Biometric Residence Permit</option>
                <option value="national_id">National ID</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Document Number</Label>
              <Input value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Issuing Country</Label><Input value={form.issuing_country} onChange={(e) => setForm({ ...form, issuing_country: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Issue Date</Label><Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Upload File (optional)</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} accept="image/*,.pdf" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Document'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FamilyMemberDialog({ open, onClose, tenantId }: { open: boolean; onClose: () => void; tenantId: string }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ full_name: '', relationship: 'spouse', date_of_birth: '', phone: '', notes: '' })
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('tenant_family_members').insert({
      tenant_id: tenantId,
      full_name: form.full_name,
      relationship: form.relationship,
      date_of_birth: form.date_of_birth || null,
      phone: form.phone || null,
      notes: form.notes || null,
    } as any)
    setSaving(false)
    qc.invalidateQueries({ queryKey: ['tenant-family', tenantId] })
    onClose()
    setForm({ full_name: '', relationship: 'spouse', date_of_birth: '', phone: '', notes: '' })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader><DialogTitle>Add Family Member</DialogTitle></DialogHeader>
          <div className="p-6 space-y-3">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Relationship</Label>
              <Select value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
                <option value="spouse">Spouse</option>
                <option value="partner">Partner</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Member'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
