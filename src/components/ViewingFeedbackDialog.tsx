import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/contexts/ToastContext'
import { handleApiError } from '@/utils/validation'
import { CheckCircle } from 'lucide-react'

export default function ViewingFeedbackDialog({ open, onClose, viewing, onSaved }: {
  open: boolean; onClose: () => void; viewing: any; onSaved?: () => void
}) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    status: 'completed',
    rating: 'interested',
    feedback: '',
    right_to_rent_checked: false,
  })

  useEffect(() => {
    if (open && viewing) {
      setForm({
        status: viewing.status ?? 'completed',
        rating: viewing.rating ?? 'interested',
        feedback: viewing.feedback ?? '',
        right_to_rent_checked: viewing.right_to_rent_checked ?? false,
      })
    }
  }, [open, viewing])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await (supabase.from('property_viewings') as any).update({
        status: form.status,
        rating: form.rating,
        feedback: form.feedback || null,
        right_to_rent_checked: form.right_to_rent_checked,
        updated_at: new Date().toISOString(),
      }).eq('id', viewing.id)
      success('Feedback saved', 'Viewing outcome has been recorded')
      qc.invalidateQueries({ queryKey: ['viewings'] })
      qc.invalidateQueries({ queryKey: ['property-viewings'] })
      onSaved?.()
      onClose()
    } catch (err) {
      showError('Save failed', handleApiError(err, 'save feedback'))
    } finally {
      setSaving(false)
    }
  }

  async function handleConvertToTenant() {
    try {
      await (supabase.from('property_viewings') as any).update({
        status: 'converted',
        rating: form.rating,
        feedback: form.feedback || null,
        right_to_rent_checked: form.right_to_rent_checked,
        updated_at: new Date().toISOString(),
      }).eq('id', viewing.id)
      // Create a new tenant from prospect details
      const { data: newTenant } = await (supabase.from('tenants') as any).insert({
        full_name: viewing.prospect_name,
        email: viewing.prospect_email || '',
        phone: viewing.prospect_phone || null,
      }).select('id').single()
      if (newTenant?.id) {
        success('Converted', 'Prospect has been converted to a tenant. Redirecting…')
        qc.invalidateQueries({ queryKey: ['viewings'] })
        qc.invalidateQueries({ queryKey: ['tenants'] })
        onClose()
        window.location.href = `/tenants/${newTenant.id}`
      }
    } catch (err) {
      showError('Conversion failed', handleApiError(err, 'convert prospect'))
    }
  }

  if (!viewing) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>
              Viewing Feedback
              <Badge variant="outline" className="ml-2 text-xs">{viewing.prospect_name}</Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-3">
            <div className="space-y-1.5">
              <Label>Outcome *</Label>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
                <option value="converted">Converted</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Interest Level</Label>
              <Select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
                <option value="very_interested">Very Interested</option>
                <option value="interested">Interested</option>
                <option value="maybe">Maybe</option>
                <option value="not_interested">Not Interested</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Feedback</Label>
              <Textarea
                value={form.feedback}
                onChange={(e) => setForm({ ...form, feedback: e.target.value })}
                rows={3}
                placeholder="What did the prospect say? Any follow-up needed?"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rtr-check"
                checked={form.right_to_rent_checked}
                onChange={(e) => setForm({ ...form, right_to_rent_checked: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="rtr-check" className="cursor-pointer">Right to Rent checked</Label>
            </div>

            {form.status === 'converted' && (
              <div className="border-t pt-3 mt-3">
                <p className="text-sm text-gray-600 mb-2">
                  This prospect is ready to become a tenant. Click below to create their tenant record.
                </p>
                <Button type="button" variant="outline" onClick={handleConvertToTenant}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Convert to Tenant
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Feedback'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
