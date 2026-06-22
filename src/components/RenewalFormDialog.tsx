import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import { handleApiError } from '@/utils/validation'
import { generateRentSchedule } from '@/utils/finance'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, RefreshCw } from 'lucide-react'

interface RenewalFormDialogProps {
  open: boolean
  onClose: () => void
  tenancyId: string
  currentEndDate: string
  currentRentAmount: number
}

export default function RenewalFormDialog({ open, onClose, tenancyId, currentEndDate, currentRentAmount }: RenewalFormDialogProps) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [saving, setSaving] = useState(false)

  // Default to 12 months from current end date
  const defaultNewEnd = (() => {
    const d = new Date(currentEndDate)
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().split('T')[0]
  })()

  const [form, setForm] = useState({
    new_end_date: defaultNewEnd,
    new_rent_amount: currentRentAmount,
    reason: '',
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.new_end_date) return showError('Missing field', 'New end date is required')
    if (!form.new_rent_amount || form.new_rent_amount <= 0) return showError('Invalid amount', 'Enter a valid rent amount')

    setSaving(true)
    try {
      // 1. Get current tenancy status
      const { data: tenancyData } = await supabase
        .from('tenancies')
        .select('status')
        .eq('id', tenancyId)
        .single()

      // 2. Insert renewal record
      const { error: renewErr } = await (supabase.from('tenancy_renewals') as any).insert({
        tenancy_id: tenancyId,
        new_end_date: form.new_end_date,
        new_rent: form.new_rent_amount,
        notes: form.reason || null,
      })

      if (renewErr) throw renewErr

      // 3. Update tenancy
      await (supabase.from('tenancies') as any)
        .update({
          end_date: form.new_end_date,
          rent_amount: form.new_rent_amount,
          status: 'active',
        })
        .eq('id', tenancyId)

      // 4. Log status transition
      await (supabase.from('tenancy_status_log') as any).insert({
        tenancy_id: tenancyId,
        from_status: (tenancyData as any)?.status ?? null,
        to_status: 'active',
        reason: `Renewal — new end date ${form.new_end_date}`,
      })

      // 5. Regenerate rent schedule for the new period
      await generateRentSchedule(tenancyId, form.new_end_date, form.new_end_date, form.new_rent_amount)

      qc.invalidateQueries({ queryKey: ['tenancy-detail', tenancyId] })
      qc.invalidateQueries({ queryKey: ['tenancy-rent', tenancyId] })
      qc.invalidateQueries({ queryKey: ['tenancy-timeline', tenancyId] })
      qc.invalidateQueries({ queryKey: ['tenancies'] })
      success('Tenancy renewed', `End date updated to ${formatDate(form.new_end_date)}`)
      onClose()
    } catch (err) {
      showError('Renewal failed', handleApiError(err, 'renew tenancy'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" /> Renew Tenancy
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Current End Date</span>
                <p className="font-medium">{formatDate(currentEndDate)}</p>
              </div>
              <div>
                <span className="text-gray-500">Current Rent</span>
                <p className="font-medium">£{currentRentAmount?.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>New End Date *</Label>
              <Input type="date" value={form.new_end_date} onChange={e => setForm({ ...form, new_end_date: e.target.value })} required />
            </div>

            <div className="space-y-1.5">
              <Label>New Monthly Rent *</Label>
              <Input type="number" min="0" step="0.01" value={form.new_rent_amount} onChange={e => setForm({ ...form, new_rent_amount: parseFloat(e.target.value) || 0 })} required />
            </div>

            <div className="space-y-1.5">
              <Label>Reason / Notes</Label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2} placeholder="e.g. Annual renewal with rent increase" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Renew Tenancy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
