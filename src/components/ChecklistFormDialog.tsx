import { useState } from 'react'
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
import { Loader2, Key, Gauge, FileCheck } from 'lucide-react'

interface ChecklistFormDialogProps {
  open: boolean
  onClose: () => void
  tenancyId: string
  checklistType: 'move_in' | 'move_out'
}

export default function ChecklistFormDialog({ open, onClose, tenancyId, checklistType }: ChecklistFormDialogProps) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    keys_handed_over: false,
    keys_count: 0,
    keys_description: '',
    meter_electric_reading: '',
    meter_gas_reading: '',
    meter_water_reading: '',
    alarm_code: '',
    parking_permits_handed: false,
    appliances_tested: false,
    cleaning_completed: false,
    garden_condition: '',
    notes: '',
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('tenancy_checklists')
        .insert({
          tenancy_id: tenancyId,
          type: checklistType,
          ...form,
          meter_electric_reading: form.meter_electric_reading || null,
          meter_gas_reading: form.meter_gas_reading || null,
          meter_water_reading: form.meter_water_reading || null,
          alarm_code: form.alarm_code || null,
          keys_description: form.keys_description || null,
          garden_condition: form.garden_condition || null,
          notes: form.notes || null,
        } as any)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenancy-checklists', tenancyId] })
      success('Checklist saved', `${checklistType === 'move_in' ? 'Move-in' : 'Move-out'} checklist completed`)
      onClose()
    },
    onError: (err) => {
      showError('Save failed', handleApiError(err, 'save checklist'))
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              {checklistType === 'move_in' ? 'Move-In' : 'Move-Out'} Checklist
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Keys Section */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" /> Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.keys_handed_over}
                    onChange={e => setForm({ ...form, keys_handed_over: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-medium">Keys handed over</span>
                </label>

                {form.keys_handed_over && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Number of Keys</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.keys_count}
                        onChange={e => setForm({ ...form, keys_count: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Key Description</Label>
                      <Input
                        value={form.keys_description}
                        onChange={e => setForm({ ...form, keys_description: e.target.value })}
                        placeholder="e.g., 2 front, 1 back, 1 window"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meter Readings */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gauge className="h-4 w-4" /> Meter Readings
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Electric Meter *</Label>
                  <Input
                    value={form.meter_electric_reading}
                    onChange={e => setForm({ ...form, meter_electric_reading: e.target.value })}
                    placeholder="Reading"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Gas Meter *</Label>
                  <Input
                    value={form.meter_gas_reading}
                    onChange={e => setForm({ ...form, meter_gas_reading: e.target.value })}
                    placeholder="Reading"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Water Meter *</Label>
                  <Input
                    value={form.meter_water_reading}
                    onChange={e => setForm({ ...form, meter_water_reading: e.target.value })}
                    placeholder="Reading"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Other Items */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Other Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Alarm Code</Label>
                  <Input
                    value={form.alarm_code}
                    onChange={e => setForm({ ...form, alarm_code: e.target.value })}
                    placeholder="Enter alarm code"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.parking_permits_handed}
                      onChange={e => setForm({ ...form, parking_permits_handed: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Parking permits handed over</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.appliances_tested}
                      onChange={e => setForm({ ...form, appliances_tested: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Appliances tested and working</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.cleaning_completed}
                      onChange={e => setForm({ ...form, cleaning_completed: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">Cleaning completed</span>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <Label>Garden Condition</Label>
                  <Input
                    value={form.garden_condition}
                    onChange={e => setForm({ ...form, garden_condition: e.target.value })}
                    placeholder="e.g., Well maintained, Needs work"
                  />
                </div>

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
              Save Checklist
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
