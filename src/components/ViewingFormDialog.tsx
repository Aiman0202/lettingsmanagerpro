import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useToast } from '@/contexts/ToastContext'
import { handleApiError } from '@/utils/validation'
import { viewingSchema, zodErrors } from '@/schemas/forms'

export default function ViewingFormDialog({ open, onClose, propertyId, onSaved, editViewing }: {
  open: boolean; onClose: () => void; propertyId?: string; onSaved?: () => void
  editViewing?: any
}) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [saving, setSaving] = useState(false)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    property_id: propertyId ?? '',
    prospect_name: '',
    prospect_email: '',
    prospect_phone: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: '30',
    source: 'walk_in',
    notes: '',
  })

  const { data: properties } = useQuery({
    queryKey: ['properties-dropdown-viewings'],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('id, address, postcode').order('address')
      return data ?? []
    },
  })

  useEffect(() => {
    if (open) {
      setErrs({})
      if (editViewing) {
        const dt = new Date(editViewing.scheduled_at)
        setForm({
          property_id: editViewing.property_id,
          prospect_name: editViewing.prospect_name ?? '',
          prospect_email: editViewing.prospect_email ?? '',
          prospect_phone: editViewing.prospect_phone ?? '',
          scheduled_date: dt.toISOString().split('T')[0],
          scheduled_time: dt.toTimeString().slice(0, 5),
          duration_minutes: String(editViewing.duration_minutes ?? 30),
          source: editViewing.source ?? 'walk_in',
          notes: editViewing.notes ?? '',
        })
      } else {
        setForm({
          property_id: propertyId ?? '',
          prospect_name: '',
          prospect_email: '',
          prospect_phone: '',
          scheduled_date: '',
          scheduled_time: '',
          duration_minutes: '30',
          source: 'walk_in',
          notes: '',
        })
      }
    }
  }, [open, propertyId, editViewing])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const combined = `${form.scheduled_date}T${form.scheduled_time || '09:00'}:00`
    const result = viewingSchema.safeParse({
      property_id: form.property_id,
      prospect_name: form.prospect_name,
      prospect_email: form.prospect_email || undefined,
      prospect_phone: form.prospect_phone || undefined,
      scheduled_at: combined,
      duration_minutes: form.duration_minutes,
      source: form.source,
      notes: form.notes || undefined,
    })
    if (!result.success) { setErrs(zodErrors(result)); return }
    setErrs({})
    setSaving(true)
    try {
      const payload = {
        property_id: form.property_id,
        prospect_name: form.prospect_name,
        prospect_email: form.prospect_email || null,
        prospect_phone: form.prospect_phone || null,
        scheduled_at: combined,
        duration_minutes: parseInt(form.duration_minutes),
        source: form.source,
        notes: form.notes || null,
        updated_at: new Date().toISOString(),
      }
      if (editViewing) {
        await (supabase.from('property_viewings') as any).update(payload).eq('id', editViewing.id)
      } else {
        await (supabase.from('property_viewings') as any).insert(payload)
      }
      success('Viewing saved', editViewing ? 'Viewing has been updated' : 'Viewing has been scheduled')
      qc.invalidateQueries({ queryKey: ['viewings'] })
      qc.invalidateQueries({ queryKey: ['property-viewings'] })
      qc.invalidateQueries({ queryKey: ['dashboard-viewings'] })
      onSaved?.()
      onClose()
    } catch (err) {
      showError('Save failed', handleApiError(err, 'save viewing'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{editViewing ? 'Edit Viewing' : 'Schedule Viewing'}</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-3">
            {!propertyId && (
              <div className="space-y-1.5">
                <Label>Property *</Label>
                <Select value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })}>
                  <option value="">Select property…</option>
                  {(properties as any[])?.map((p) => (
                    <option key={p.id} value={p.id}>{p.address}, {p.postcode}</option>
                  ))}
                </Select>
                {errs.property_id && <p className="text-xs text-red-500">{errs.property_id}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Prospect Name *</Label>
              <Input value={form.prospect_name} onChange={(e) => setForm({ ...form, prospect_name: e.target.value })} />
              {errs.prospect_name && <p className="text-xs text-red-500">{errs.prospect_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.prospect_email} onChange={(e) => setForm({ ...form, prospect_email: e.target.value })} />
                {errs.prospect_email && <p className="text-xs text-red-500">{errs.prospect_email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.prospect_phone} onChange={(e) => setForm({ ...form, prospect_phone: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
                {errs.scheduled_at && <p className="text-xs text-red-500">{errs.scheduled_at}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Time *</Label>
                <Input type="time" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration</Label>
                <Select value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option value="walk_in">Walk-in</option>
                <option value="rightmove">Rightmove</option>
                <option value="zoopla">Zoopla</option>
                <option value="openrent">OpenRent</option>
                <option value="referral">Referral</option>
                <option value="website">Website</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes…" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : editViewing ? 'Update Viewing' : 'Schedule Viewing'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
