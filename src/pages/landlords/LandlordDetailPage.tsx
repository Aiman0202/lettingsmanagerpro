import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Plus, Building2, MapPin, Upload, Trash2, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function LandlordDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [showIdDocDialog, setShowIdDocDialog] = useState(false)
  const [editing, setEditing] = useState(false)

  const { data: landlord } = useQuery({
    queryKey: ['landlord', id],
    queryFn: async () => {
      const { data } = await supabase.from('landlords').select('*').eq('id', id!).single()
      return data as any
    },
  })

  const { data: idDocuments } = useQuery({
    queryKey: ['landlord-id-docs', id],
    queryFn: async () => {
      const { data } = await supabase.from('landlord_id_documents').select('*').eq('landlord_id', id!).order('created_at', { ascending: false })
      return (data as any[]) ?? []
    },
  })

  const { data: properties } = useQuery({
    queryKey: ['landlord-properties', id],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('*').eq('landlord_id', id!).order('created_at', { ascending: false })
      return (data as any[]) ?? []
    },
  })

  if (!landlord) return <div className="p-6 text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/landlords">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{landlord.full_name}</h1>
          <p className="text-gray-500 text-sm">{landlord.email} • {landlord.phone ?? 'No phone'}</p>
        </div>
        <Button variant="outline" className="ml-auto" onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Edit Details'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact & Address */}
        <Card>
          <CardHeader><CardTitle>Contact & Address</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {editing ? (
              <EditContactForm landlord={landlord} onCancel={() => setEditing(false)} onSuccess={() => { setEditing(false); qc.invalidateQueries({ queryKey: ['landlord', id] }) }} />
            ) : (
              <>
                {landlord.company_name && <div className="flex justify-between"><span className="text-gray-500">Company</span><span>{landlord.company_name}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{landlord.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{landlord.phone ?? '—'}</span></div>
                <div className="pt-2 border-t">
                  <p className="text-gray-500 mb-1">Address</p>
                  <p>{landlord.address_line1 ?? landlord.address ?? 'No address'}</p>
                  {landlord.address_line2 && <p>{landlord.address_line2}</p>}
                  {landlord.city && <p>{landlord.city}</p>}
                  {landlord.postcode && <p className="font-mono">{landlord.postcode}</p>}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader><CardTitle>Bank Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {editing ? (
              <EditBankForm landlord={landlord} onCancel={() => setEditing(false)} onSuccess={() => { setEditing(false); qc.invalidateQueries({ queryKey: ['landlord', id] }) }} />
            ) : (
              <>
                {landlord.bank_account_name ? (
                  <>
                    <div className="flex justify-between"><span className="text-gray-500">Account Name</span><span>{landlord.bank_account_name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Account Number</span><span className="font-mono">{landlord.bank_account_number}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Sort Code</span><span className="font-mono">{landlord.bank_sort_code}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Bank Name</span><span>{landlord.bank_name}</span></div>
                  </>
                ) : (
                  <p className="text-gray-400 text-center py-4">No bank details added</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ID Documents */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ID Documents ({(idDocuments ?? []).length})</CardTitle>
          <Button size="sm" onClick={() => setShowIdDocDialog(true)}>
            <Upload className="h-4 w-4 mr-1" /> Add Document
          </Button>
        </CardHeader>
        <CardContent>
          {(idDocuments ?? []).length === 0 ? (
            <p className="text-center text-gray-400 py-6">No ID documents uploaded</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(idDocuments as any[]).map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="capitalize">{doc.document_type.replace('_', ' ')}</TableCell>
                    <TableCell className="font-mono text-sm">{doc.document_number ?? '—'}</TableCell>
                    <TableCell>{doc.issue_date ? formatDate(doc.issue_date) : '—'}</TableCell>
                    <TableCell>{doc.expiry_date ? formatDate(doc.expiry_date) : '—'}</TableCell>
                    <TableCell>
                      {doc.file_path && (
                        <Button size="sm" variant="ghost" onClick={() => {
                          const url = supabase.storage.from('landlord-id-documents').getPublicUrl(doc.file_path).data.publicUrl
                          window.open(url, '_blank')
                        }}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={async () => {
                        if (doc.file_path) await supabase.storage.from('landlord-id-documents').remove([doc.file_path])
                        await supabase.from('landlord_id_documents').delete().eq('id', doc.id)
                        qc.invalidateQueries({ queryKey: ['landlord-id-docs', id] })
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Associated Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Associated Properties ({(properties ?? []).length})</CardTitle>
        </CardHeader>
        <CardContent>
          {(properties ?? []).length === 0 ? (
            <p className="text-center text-gray-400 py-6">No properties associated</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(properties as any[]).map((prop) => (
                <Link key={prop.id} to={`/properties/${prop.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <p className="font-medium text-gray-900">{prop.address}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />{prop.postcode}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant={prop.status === 'let' ? 'default' : prop.status === 'available' ? 'success' : 'destructive'} className="text-xs">
                          {prop.status}
                        </Badge>
                        <span className="text-xs text-gray-500 capitalize">{prop.type} • {prop.bedrooms} bed</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <IdDocumentDialog open={showIdDocDialog} onClose={() => setShowIdDocDialog(false)} landlordId={id!} />
    </div>
  )
}

function EditContactForm({ landlord, onCancel, onSuccess }: { landlord: any; onCancel: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    full_name: landlord.full_name,
    email: landlord.email,
    phone: landlord.phone ?? '',
    company_name: landlord.company_name ?? '',
    address_line1: landlord.address_line1 ?? '',
    address_line2: landlord.address_line2 ?? '',
    city: landlord.city ?? '',
    postcode: landlord.postcode ?? '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('landlords').update(form as any).eq('id', landlord.id)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Full Name</Label>
        <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
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
        <Label>Company</Label>
        <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Address Line 1</Label>
        <Input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Address Line 2</Label>
        <Input value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Postcode</Label>
          <Input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  )
}

function EditBankForm({ landlord, onCancel, onSuccess }: { landlord: any; onCancel: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    bank_account_name: landlord.bank_account_name ?? '',
    bank_account_number: landlord.bank_account_number ?? '',
    bank_sort_code: landlord.bank_sort_code ?? '',
    bank_name: landlord.bank_name ?? '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('landlords').update(form as any).eq('id', landlord.id)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label>Account Name</Label>
        <Input value={form.bank_account_name} onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Account Number</Label>
          <Input value={form.bank_account_number} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Sort Code</Label>
          <Input value={form.bank_sort_code} onChange={(e) => setForm({ ...form, bank_sort_code: e.target.value })} placeholder="XX-XX-XX" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Bank Name</Label>
        <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Bank Details</Button>
      </div>
    </form>
  )
}

function IdDocumentDialog({ open, onClose, landlordId }: { open: boolean; onClose: () => void; landlordId: string }) {
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
      const path = `${landlordId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('landlord-id-documents').upload(path, file)
      if (!uploadErr) filePath = path
    }

    await supabase.from('landlord_id_documents').insert({
      landlord_id: landlordId,
      document_type: form.document_type,
      document_number: form.document_number || null,
      issuing_country: form.issuing_country || null,
      issue_date: form.issue_date || null,
      expiry_date: form.expiry_date || null,
      file_path: filePath,
      notes: form.notes || null,
    } as any)

    setSaving(false)
    qc.invalidateQueries({ queryKey: ['landlord-id-docs', landlordId] })
    setForm({ document_type: 'passport', document_number: '', issuing_country: '', issue_date: '', expiry_date: '', notes: '' })
    setFile(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader><DialogTitle>Add ID Document</DialogTitle></DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Document Type</Label>
              <select value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })} className="w-full border rounded px-3 py-2">
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="national_id">National ID</option>
                <option value="biometric_residence_permit">Biometric Residence Permit</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Document Number</Label>
                <Input value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Issuing Country</Label>
                <Input value={form.issuing_country} onChange={(e) => setForm({ ...form, issuing_country: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Issue Date</Label>
                <Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Upload Document</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Document'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
