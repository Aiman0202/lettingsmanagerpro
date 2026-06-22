import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import { handleApiError } from '@/utils/validation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, Calculator, Key } from 'lucide-react'

interface TerminationFormDialogProps {
  open: boolean
  onClose: () => void
  tenancyId: string
  tenancyEndDate?: string
  onTerminationComplete?: () => void
}

export default function TerminationFormDialog({ open, onClose, tenancyId, tenancyEndDate, onTerminationComplete }: TerminationFormDialogProps) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    initiated_by: 'tenant' as 'tenant' | 'landlord' | 'mutual',
    reason_category: 'job_relocation' as string,
    reason: '',
    notice_date: new Date().toISOString().split('T')[0],
    notice_period_days: 30,
    effective_date: '',
    penalty_amount: 0,
    penalty_reason: '',
    deposit_deduction: 0,
    deposit_deduction_reason: '',
    final_rent_amount: 0,
    final_rent_paid: false,
    keys_returned: false,
    keys_returned_date: '',
    property_vacant: false,
    property_vacant_date: '',
    move_out_inspection_completed: false,
    termination_letter_sent: false,
    notes: '',
  })

  // Auto-calculate effective date from notice date + period
  useEffect(() => {
    if (form.notice_date && form.notice_period_days) {
      const noticeDate = new Date(form.notice_date)
      noticeDate.setDate(noticeDate.getDate() + form.notice_period_days)
      setForm(prev => ({
        ...prev,
        effective_date: noticeDate.toISOString().split('T')[0]
      }))
    }
  }, [form.notice_date, form.notice_period_days])

  const reasonCategories = [
    { value: 'job_relocation', label: 'Job Relocation' },
    { value: 'financial', label: 'Financial Difficulties' },
    { value: 'property_issue', label: 'Property Issues' },
    { value: 'landlord_request', label: 'Landlord Request' },
    { value: 'mutual_agreement', label: 'Mutual Agreement' },
    { value: 'breach_of_contract', label: 'Breach of Contract' },
    { value: 'other', label: 'Other' },
  ]

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.reason) throw new Error('Reason is required')
      if (!form.effective_date) throw new Error('Effective date is required')

      // Create termination record
      const { error } = await supabase
        .from('tenancy_terminations')
        .insert({
          tenancy_id: tenancyId,
          initiated_by: form.initiated_by,
          reason: form.reason,
          reason_category: form.reason_category,
          notice_date: form.notice_date,
          notice_period_days: form.notice_period_days,
          effective_date: form.effective_date,
          penalty_amount: form.penalty_amount,
          penalty_reason: form.penalty_reason || null,
          deposit_deduction: form.deposit_deduction,
          deposit_deduction_reason: form.deposit_deduction_reason || null,
          final_rent_amount: form.final_rent_amount,
          final_rent_paid: form.final_rent_paid,
          keys_returned: form.keys_returned,
          keys_returned_date: form.keys_returned_date || null,
          property_vacant: form.property_vacant,
          property_vacant_date: form.property_vacant_date || null,
          move_out_inspection_completed: form.move_out_inspection_completed,
          termination_letter_sent: form.termination_letter_sent,
          notes: form.notes || null,
        } as any)

      if (error) throw error

      // Get tenancy details to find property_id and current status
      const { data: tenancyData } = await supabase
        .from('tenancies')
        .select('status, property_id')
        .eq('id', tenancyId)
        .single()

      // Update tenancy status to ended
      await supabase
        .from('tenancies')
        .update({ status: 'ended' } as any)
        .eq('id', tenancyId)

      // Set property back to available
      if ((tenancyData as any)?.property_id) {
        await supabase
          .from('properties')
          .update({ status: 'available' } as any)
          .eq('id', (tenancyData as any).property_id)
      }

      // Log status transition
      await (supabase.from('tenancy_status_log') as any).insert({
        tenancy_id: tenancyId,
        from_status: (tenancyData as any)?.status ?? null,
        to_status: 'ended',
        reason: `Termination: ${form.reason_category} — ${form.reason.substring(0, 100)}`,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenancy-detail', tenancyId] })
      qc.invalidateQueries({ queryKey: ['tenancy-terminations', tenancyId] })
      qc.invalidateQueries({ queryKey: ['tenancies'] })
      success('Termination recorded', 'Tenancy status updated to ended, property set to available')
      onClose()
      onTerminationComplete?.()
    },
    onError: (err) => {
      showError('Save failed', handleApiError(err, 'record termination'))
    },
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveMutation.mutateAsync()
    } finally {
      setSaving(false)
    }
  }

  const totalFinancial = form.penalty_amount + form.deposit_deduction + form.final_rent_amount

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Record Early Termination
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Initiation Details */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Termination Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Initiated By *</Label>
                  <select
                    value={form.initiated_by}
                    onChange={e => setForm({ ...form, initiated_by: e.target.value as any })}
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
                    required
                  >
                    <option value="tenant">Tenant</option>
                    <option value="landlord">Landlord</option>
                    <option value="mutual">Mutual Agreement</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Reason Category *</Label>
                  <select
                    value={form.reason_category}
                    onChange={e => setForm({ ...form, reason_category: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
                    required
                  >
                    {reasonCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label>Reason *</Label>
                  <Textarea
                    value={form.reason}
                    onChange={e => setForm({ ...form, reason: e.target.value })}
                    placeholder="Detailed reason for termination..."
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Notice Date *</Label>
                  <Input
                    type="date"
                    value={form.notice_date}
                    onChange={e => setForm({ ...form, notice_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Notice Period (days)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.notice_period_days}
                    onChange={e => setForm({ ...form, notice_period_days: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="col-span-2">
                  <Badge variant="outline" className="text-sm">
                    Effective Date: {form.effective_date || '—'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Financial Settlement */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4" /> Financial Settlement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Penalty Amount (£)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.penalty_amount}
                      onChange={e => setForm({ ...form, penalty_amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Penalty Reason</Label>
                    <Input
                      value={form.penalty_reason}
                      onChange={e => setForm({ ...form, penalty_reason: e.target.value })}
                      placeholder="Reason for penalty"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Deposit Deduction (£)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.deposit_deduction}
                      onChange={e => setForm({ ...form, deposit_deduction: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Deposit Deduction Reason</Label>
                    <Input
                      value={form.deposit_deduction_reason}
                      onChange={e => setForm({ ...form, deposit_deduction_reason: e.target.value })}
                      placeholder="Reason for deduction"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Final Rent Owed (£)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.final_rent_amount}
                      onChange={e => setForm({ ...form, final_rent_amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1.5 flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.final_rent_paid}
                        onChange={e => setForm({ ...form, final_rent_paid: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Final rent paid</span>
                    </label>
                  </div>
                </div>

                {totalFinancial > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3">
                    <p className="text-sm font-semibold text-amber-900">Total Financial Impact: £{totalFinancial.toFixed(2)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Handover */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" /> Property Handover
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.keys_returned}
                        onChange={e => setForm({ ...form, keys_returned: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">Keys returned</span>
                    </label>
                  </div>
                  {form.keys_returned && (
                    <div className="space-y-1.5">
                      <Label>Keys Returned Date</Label>
                      <Input
                        type="date"
                        value={form.keys_returned_date}
                        onChange={e => setForm({ ...form, keys_returned_date: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.property_vacant}
                        onChange={e => setForm({ ...form, property_vacant: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">Property vacant</span>
                    </label>
                  </div>
                  {form.property_vacant && (
                    <div className="space-y-1.5">
                      <Label>Property Vacant Date</Label>
                      <Input
                        type="date"
                        value={form.property_vacant_date}
                        onChange={e => setForm({ ...form, property_vacant_date: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.move_out_inspection_completed}
                    onChange={e => setForm({ ...form, move_out_inspection_completed: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">Move-out inspection completed</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.termination_letter_sent}
                    onChange={e => setForm({ ...form, termination_letter_sent: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">Termination letter sent</span>
                </label>

                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Record Termination
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
