import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import { handleApiError } from '@/utils/validation'
import { generateRentSchedule } from '@/utils/finance'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, RefreshCw, FileText, Pen, Calendar } from 'lucide-react'
import AmendmentHistory from './AmendmentHistory'
import { generateAgreementForTenancy } from '@/utils/agreements'

interface RenewalFormDialogProps {
  open: boolean
  onClose: () => void
  tenancyId: string
  currentEndDate: string
  currentRentAmount: number
  currentAgreement?: any
  amendments?: any[]
  onRenewed?: (renewalType: 'extension' | 'new_agreement') => void
}

export default function RenewalFormDialog({ open, onClose, tenancyId, currentEndDate, currentRentAmount, currentAgreement, amendments = [], onRenewed }: RenewalFormDialogProps) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'type' | 'details'>('type')
  const [renewalType, setRenewalType] = useState<'extension' | 'new_agreement'>('extension')

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

  // Reset form when opening
  function handleOpenChange(v: boolean) {
    if (v) {
      setStep('type')
      setRenewalType('extension')
      setForm({
        new_end_date: defaultNewEnd,
        new_rent_amount: currentRentAmount,
        reason: '',
      })
    } else {
      onClose()
    }
  }

  const handleContinue = () => {
    setStep('details')
  }

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

      // 2. Insert renewal record with new fields
      const { error: renewErr } = await (supabase.from('tenancy_renewals') as any).insert({
        tenancy_id: tenancyId,
        old_end_date: currentEndDate,
        new_end_date: form.new_end_date,
        old_rent: currentRentAmount,
        new_rent: form.new_rent_amount,
        renewal_type: renewalType,
        notes: form.reason || null,
        amendments_summary: amendments.length > 0 ? amendments : null,
        status: 'pending',
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

      // 4. For 'new_agreement' type, generate a new agreement
      let newAgreementId: string | null = null
      if (renewalType === 'new_agreement') {
        try {
          newAgreementId = await generateAgreementForTenancy(tenancyId)
          
          // Link the new agreement to the renewal
          if (newAgreementId) {
            await (supabase.from('tenancy_renewals') as any)
              .update({ new_agreement_id: newAgreementId })
              .eq('tenancy_id', tenancyId)
          }
        } catch (err) {
          console.error('Failed to generate new agreement:', err)
          // Don't fail the entire renewal if agreement generation fails
        }
      }

      // 5. Log status transition
      await (supabase.from('tenancy_status_log') as any).insert({
        tenancy_id: tenancyId,
        from_status: (tenancyData as any)?.status ?? null,
        to_status: 'active',
        reason: `Renewal (${renewalType}) — new end date ${form.new_end_date}`,
      })

      // 6. Regenerate rent schedule for the new period
      await generateRentSchedule(tenancyId, form.new_end_date, form.new_end_date, form.new_rent_amount)

      qc.invalidateQueries({ queryKey: ['tenancy-detail', tenancyId] })
      qc.invalidateQueries({ queryKey: ['tenancy-rent', tenancyId] })
      qc.invalidateQueries({ queryKey: ['tenancy-timeline', tenancyId] })
      qc.invalidateQueries({ queryKey: ['tenancies'] })
      qc.invalidateQueries({ queryKey: ['tenancy-agreement', tenancyId] })
      
      const renewalLabel = renewalType === 'extension' ? 'Simple Extension' : 'New Agreement'
      success('Tenancy renewed', `${renewalLabel} — End date updated to ${formatDate(form.new_end_date)}`)
      onRenewed?.(renewalType)
      onClose()
    } catch (err) {
      showError('Renewal failed', handleApiError(err, 'renew tenancy'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {step === 'type' ? (
          // Step 1: Choose Renewal Type
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" /> Renew Tenancy
              </DialogTitle>
              <DialogDescription>
                Choose how you would like to renew this tenancy
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {/* Current Terms Summary */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                <div>
                  <span className="text-gray-500">Current End Date</span>
                  <p className="font-medium">{formatDate(currentEndDate)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Current Rent</span>
                  <p className="font-medium">£{currentRentAmount?.toLocaleString()}</p>
                </div>
              </div>

              {/* Amendment History */}
              <AmendmentHistory tenancyId={tenancyId} />

              {/* Renewal Type Selection */}
              <div className="space-y-3">
                <Label className="text-base">Renewal Type</Label>
                
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    renewalType === 'extension' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setRenewalType('extension')}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="renewalType"
                      checked={renewalType === 'extension'}
                      onChange={() => setRenewalType('extension')}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Pen className="h-4 w-4" />
                        <strong>Simple Extension</strong>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Keep same terms, only update dates and rent. Generates a Deed of Variation.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    renewalType === 'new_agreement' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setRenewalType('new_agreement')}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="renewalType"
                      checked={renewalType === 'new_agreement'}
                      onChange={() => setRenewalType('new_agreement')}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <strong>New Agreement</strong>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Review and modify terms, highlight all changes from previous agreement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleContinue}>
                Continue →
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Step 2: Renewal Details
          <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" /> {renewalType === 'extension' ? 'Extension Details' : 'New Agreement Details'}
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
            <Button type="button" variant="outline" onClick={() => setStep('type')}>← Back</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {renewalType === 'extension' ? 'Create Extension' : 'Create New Agreement'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
