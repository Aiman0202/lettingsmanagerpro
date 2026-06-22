import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/contexts/ToastContext'
import { handleApiError } from '@/utils/validation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Pencil } from 'lucide-react'

interface AmendmentFormDialogProps {
  open: boolean
  onClose: () => void
  tenancyId: string
  currentRentAmount: number
}

export default function AmendmentFormDialog({ open, onClose, tenancyId, currentRentAmount }: AmendmentFormDialogProps) {
  const { success, error: showError } = useToast()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    amendment_type: 'rent_change' as string,
    new_value: String(currentRentAmount),
    effective_date: new Date().toISOString().split('T')[0],
    reason: '',
    tenant_id: '',
  })

  // Fetch available tenants for add/remove
  const { data: tenants } = useQuery({
    queryKey: ['all-tenants'],
    queryFn: async () => {
      const { data } = await supabase.from('tenants').select('id, full_name').order('full_name')
      return data ?? []
    },
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.new_value) return showError('Missing field', 'New value is required')
    if (!form.effective_date) return showError('Missing field', 'Effective date is required')

    setSaving(true)
    try {
      let oldValue: string | null = null

      if (form.amendment_type === 'rent_change') {
        oldValue = String(currentRentAmount)
        // Update tenancy rent
        await (supabase.from('tenancies') as any)
          .update({ rent_amount: parseFloat(form.new_value) })
          .eq('id', tenancyId)
      } else if (form.amendment_type === 'tenant_add') {
        if (!form.tenant_id) { setSaving(false); return showError('Missing field', 'Select a tenant') }
        oldValue = '-'
        // Add tenant to tenancy
        await (supabase.from('tenancy_tenants') as any).insert({
          tenancy_id: tenancyId,
          tenant_id: form.tenant_id,
        })
      } else if (form.amendment_type === 'tenant_remove') {
        if (!form.tenant_id) { setSaving(false); return showError('Missing field', 'Select a tenant') }
        // Get tenant name for old_value
        const tenant = (tenants as any[])?.find((t: any) => t.id === form.tenant_id)
        oldValue = tenant?.full_name ?? form.tenant_id
        // Remove tenant from tenancy
        await (supabase.from('tenancy_tenants') as any)
          .delete()
          .eq('tenancy_id', tenancyId)
          .eq('tenant_id', form.tenant_id)
      }

      // Insert amendment record
      await (supabase.from('tenancy_amendments') as any).insert({
        tenancy_id: tenancyId,
        amendment_type: form.amendment_type,
        old_value: oldValue,
        new_value: form.new_value,
        effective_date: form.effective_date,
        reason: form.reason || null,
      })

      success('Amendment saved', 'Tenancy amendment recorded')
      onClose()
    } catch (err) {
      showError('Save failed', handleApiError(err, 'save amendment'))
    } finally {
      setSaving(false)
    }
  }

  // Reset form when opening
  function handleOpenChange(v: boolean) {
    if (v) {
      setForm({
        amendment_type: 'rent_change',
        new_value: String(currentRentAmount),
        effective_date: new Date().toISOString().split('T')[0],
        reason: '',
        tenant_id: '',
      })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" /> Amend Tenancy
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Amendment Type *</Label>
              <select
                value={form.amendment_type}
                onChange={e => {
                  const type = e.target.value
                  setForm({
                    ...form,
                    amendment_type: type,
                    new_value: type === 'rent_change' ? String(currentRentAmount) : '',
                    tenant_id: '',
                  })
                }}
                className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
              >
                <option value="rent_change">Rent Change</option>
                <option value="tenant_add">Add Tenant</option>
                <option value="tenant_remove">Remove Tenant</option>
                <option value="other">Other</option>
              </select>
            </div>

            {form.amendment_type === 'rent_change' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Current Rent</Label>
                    <p className="text-sm font-medium pt-1">£{currentRentAmount?.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>New Rent *</Label>
                    <Input type="number" min="0" step="0.01" value={form.new_value} onChange={e => setForm({ ...form, new_value: e.target.value })} required />
                  </div>
                </div>
              </>
            )}

            {(form.amendment_type === 'tenant_add' || form.amendment_type === 'tenant_remove') && (
              <div className="space-y-1.5">
                <Label>{form.amendment_type === 'tenant_add' ? 'Tenant to Add *' : 'Tenant to Remove *'}</Label>
                <select
                  value={form.tenant_id}
                  onChange={e => setForm({ ...form, tenant_id: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
                  required
                >
                  <option value="">Select tenant...</option>
                  {(tenants as any[] ?? []).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
            )}

            {form.amendment_type === 'other' && (
              <div className="space-y-1.5">
                <Label>New Value / Description *</Label>
                <Textarea value={form.new_value} onChange={e => setForm({ ...form, new_value: e.target.value })} rows={2} required />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Effective Date *</Label>
              <Input type="date" value={form.effective_date} onChange={e => setForm({ ...form, effective_date: e.target.value })} required />
            </div>

            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2} placeholder="e.g. Annual rent review" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Amendment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
