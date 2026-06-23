import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/contexts/ToastContext'
import { handleApiError } from '@/utils/validation'
import { communicationSchema, zodErrors } from '@/schemas/forms'

export default function CommunicationFormDialog({ open, onClose, tenantId, onSaved }: {
  open: boolean; onClose: () => void; tenantId: string; onSaved?: () => void
}) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [saving, setSaving] = useState(false)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    type: 'call',
    direction: 'outbound',
    subject: '',
    body: '',
    logged_date: new Date().toISOString().split('T')[0],
    logged_time: new Date().toTimeString().slice(0, 5),
  })

  useEffect(() => {
    if (open) {
      setErrs({})
      const now = new Date()
      setForm({
        type: 'call',
        direction: 'outbound',
        subject: '',
        body: '',
        logged_date: now.toISOString().split('T')[0],
        logged_time: now.toTimeString().slice(0, 5),
      })
    }
  }, [open])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const logged_at = `${form.logged_date}T${form.logged_time || '09:00'}:00`
    const result = communicationSchema.safeParse({
      type: form.type,
      direction: form.direction,
      subject: form.subject || undefined,
      body: form.body || undefined,
      logged_at,
    })
    if (!result.success) { setErrs(zodErrors(result)); return }
    setErrs({})
    setSaving(true)
    try {
      await (supabase.from('tenant_communications') as any).insert({
        tenant_id: tenantId,
        type: form.type,
        direction: form.direction,
        subject: form.subject || null,
        body: form.body || null,
        logged_at,
      })
      success('Communication logged', `${form.type} has been added to the timeline`)
      qc.invalidateQueries({ queryKey: ['tenant-communications', tenantId] })
      onSaved?.()
      onClose()
    } catch (err) {
      showError('Save failed', handleApiError(err, 'log communication'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>Log Communication</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="call">Phone Call</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="letter">Letter</option>
                  <option value="visit">Visit</option>
                  <option value="other">Other</option>
                </Select>
                {errs.type && <p className="text-xs text-red-500">{errs.type}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Direction</Label>
                <Select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
                  <option value="outbound">Outbound (to tenant)</option>
                  <option value="inbound">Inbound (from tenant)</option>
                </Select>
                {errs.direction && <p className="text-xs text-red-500">{errs.direction}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Rent reminder, Repair update…"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Details</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={4}
                placeholder="Summary of the communication…"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.logged_date} onChange={(e) => setForm({ ...form, logged_date: e.target.value })} />
                {errs.logged_at && <p className="text-xs text-red-500">{errs.logged_at}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input type="time" value={form.logged_time} onChange={(e) => setForm({ ...form, logged_time: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Log Communication'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
