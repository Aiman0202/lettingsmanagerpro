import { useState, useRef, useEffect } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useToast } from '@/contexts/ToastContext'
import { handleApiError } from '@/utils/validation'
import { logAudit } from '@/lib/audit'
import { X, Download } from 'lucide-react'

export default function ComplianceFormDialog({ open, onClose, propertyId, onSaved, editRecord }: {
  open: boolean; onClose: () => void; propertyId: string; onSaved?: () => void
  editRecord?: any
}) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [form, setForm] = useState({ type: 'gas_safe', expiry_date: '', notes: '' })
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyId)
  const fileRef = useRef<HTMLInputElement>(null)

  // Fetch properties dropdown when no propertyId provided (e.g. from Compliance page)
  const { data: properties } = useQuery({
    queryKey: ['properties-dropdown-comp'],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('id, address, postcode').order('address')
      return data ?? []
    },
    enabled: !propertyId,
  })

  // Sync prop to state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedPropertyId(propertyId)
      setForm({ type: editRecord?.type ?? 'gas_safe', expiry_date: editRecord?.expiry_date ?? '', notes: editRecord?.notes ?? '' })
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [open, propertyId])

  const effectivePropertyId = selectedPropertyId || propertyId

  async function handleDownloadDoc(documentId: string) {
    const { data: doc } = await supabase.from('documents').select('storage_path').eq('id', documentId).single()
    if (!doc) return
    const { data } = await supabase.storage.from('documents').createSignedUrl((doc as any).storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!effectivePropertyId) {
      showError('No property selected', 'Please select a property before saving')
      return
    }

    setSaving(true)

    let documentId: string | null = editRecord?.document_id ?? null

    // Upload file if selected
    if (file) {
      const ext = file.name.split('.').pop()
      const path = `compliance/${effectivePropertyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('documents').upload(path, file)
      if (uploadErr) {
        showError('Upload failed', uploadErr.message)
        setSaving(false)
        return
      }

      const { data: newDoc, error: docErr } = await (supabase.from('documents') as any).insert({
        name: `${form.type.replace(/_/g, ' ').toUpperCase()} Certificate`,
        storage_path: path,
        entity_type: 'property',
        entity_id: effectivePropertyId,
        category: 'Compliance',
        size_bytes: file.size,
      } as any).select('id').single()

      if (docErr) {
        showError('Failed to save document', docErr.message)
        setSaving(false)
        return
      }

      documentId = (newDoc as any)?.id ?? null
    }

    const { error: insertErr } = await supabase.from('property_compliance').insert({
      property_id: effectivePropertyId,
      type: form.type as any,
      expiry_date: form.expiry_date,
      notes: form.notes || null,
      document_id: documentId,
    } as any)

    if (insertErr) {
      showError('Failed to save certificate', insertErr.message)
      setSaving(false)
      return
    }

    setSaving(false)
    qc.invalidateQueries({ queryKey: ['compliance', effectivePropertyId] })
    qc.invalidateQueries({ queryKey: ['compliance-all'] })
    logAudit({ action: 'compliance_added', resource: 'property', resourceId: effectivePropertyId, details: { type: form.type, expiry_date: form.expiry_date } })
    success('Certificate added', `${form.type.replace(/_/g, ' ').toUpperCase()} saved`)
    onClose()
    onSaved?.()
    setForm({ type: 'gas_safe', expiry_date: '', notes: '' })
    setFile(null)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>Add Compliance Certificate</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            {/* Property selector — shown when no propertyId provided */}
            {!propertyId && (
              <div className="space-y-1.5">
                <Label>Property *</Label>
                <Select value={selectedPropertyId} onChange={(e) => setSelectedPropertyId(e.target.value)}>
                  <option value="">Select a property…</option>
                  {(properties as any[])?.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.address}, {p.postcode}</option>
                  ))}
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Certificate Type</Label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="gas_safe">Gas Safe Certificate</option>
                <option value="eicr">EICR (Electrical)</option>
                <option value="epc">EPC</option>
                <option value="pat">PAT Testing</option>
                <option value="fire_risk">Fire Risk Assessment</option>
                <option value="legionella">Legionella Risk</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date *</Label>
              <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Certificate Document</Label>
              {editRecord?.document_id ? (
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => handleDownloadDoc(editRecord.document_id)}>
                    <Download className="h-3 w-3 mr-1" /> Download existing
                  </Button>
                  <span className="text-xs text-gray-400">or upload new:</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {file && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = '' }}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {file && <p className="text-xs text-gray-500">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Certificate'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
