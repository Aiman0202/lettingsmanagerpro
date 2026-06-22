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
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Trash2, ChevronDown, ChevronRight, Camera, Home } from 'lucide-react'

const ROOM_PRESETS = ['Living Room', 'Kitchen', 'Bedroom 1', 'Bedroom 2', 'Bedroom 3', 'Bathroom', 'En-suite', 'Hallway', 'Garden', 'Garage', 'Other']

const ITEM_PRESETS: Record<string, string[]> = {
  'Living Room': ['Walls', 'Ceiling', 'Floor/Carpet', 'Windows', 'Curtains/Blinds', 'Radiator', 'Light Fittings', 'Skirting Boards', 'Door'],
  'Kitchen': ['Oven', 'Hob', 'Extractor Fan', 'Sink', 'Cabinets/Units', 'Worktops', 'Floor', 'Walls', 'Windows', 'Fridge/Freezer', 'Washing Machine', 'Dishwasher'],
  'Bedroom 1': ['Walls', 'Ceiling', 'Floor/Carpet', 'Windows', 'Curtains/Blinds', 'Radiator', 'Light Fittings', 'Built-in Wardrobe', 'Door'],
  'Bedroom 2': ['Walls', 'Ceiling', 'Floor/Carpet', 'Windows', 'Curtains/Blinds', 'Radiator', 'Light Fittings', 'Door'],
  'Bedroom 3': ['Walls', 'Ceiling', 'Floor/Carpet', 'Windows', 'Curtains/Blinds', 'Radiator', 'Light Fittings', 'Door'],
  'Bathroom': ['Toilet', 'Basin/Sink', 'Bath', 'Shower', 'Tiles/Walls', 'Floor', 'Mirror', 'Towel Rail', 'Extractor Fan', 'Window'],
  'En-suite': ['Toilet', 'Basin/Sink', 'Shower', 'Tiles/Walls', 'Floor', 'Mirror', 'Extractor Fan'],
  'Hallway': ['Walls', 'Ceiling', 'Floor/Carpet', 'Light Fittings', 'Door', 'Skirting Boards'],
  'Garden': ['Lawn', 'Plants/Shrubs', 'Fencing', 'Patio/Decking', 'Shed', 'Gate'],
}

const CONDITION_RATINGS = ['excellent', 'good', 'fair', 'poor', 'damaged', 'missing']

interface Room {
  id: string
  name: string
  cleanliness: string
  decoration: string
  condition_notes: string
  items: RoomItem[]
  expanded: boolean
}

interface RoomItem {
  id: string
  name: string
  condition: string
  condition_notes: string
  photoFile: File | null
}

interface InspectionFormDialogProps {
  open: boolean
  onClose: () => void
  tenancyId: string
}

export default function InspectionFormDialog({ open, onClose, tenancyId }: InspectionFormDialogProps) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    type: 'move_in' as 'move_in' | 'move_out' | 'mid_tenancy',
    inspection_date: new Date().toISOString().split('T')[0],
    inspector_name: '',
    weather_conditions: '',
    overall_condition: 'good' as string,
    tenant_present: false,
    general_notes: '',
  })

  const [rooms, setRooms] = useState<Room[]>([])

  function addRoom(preset?: string) {
    const name = preset || `Room ${rooms.length + 1}`
    const presetItems = ITEM_PRESETS[name] ?? ['Walls', 'Ceiling', 'Floor', 'Windows', 'Door']
    const newRoom: Room = {
      id: crypto.randomUUID(),
      name,
      cleanliness: 'good',
      decoration: 'good',
      condition_notes: '',
      items: presetItems.map(item => ({
        id: crypto.randomUUID(),
        name: item,
        condition: 'good',
        condition_notes: '',
        photoFile: null,
      })),
      expanded: true,
    }
    setRooms(prev => [...prev, newRoom])
  }

  function removeRoom(roomId: string) {
    setRooms(prev => prev.filter(r => r.id !== roomId))
  }

  function toggleRoom(roomId: string) {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, expanded: !r.expanded } : r))
  }

  function updateRoom(roomId: string, field: string, value: any) {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, [field]: value } : r))
  }

  function addItem(roomId: string) {
    setRooms(prev => prev.map(r => r.id === roomId ? {
      ...r,
      items: [...r.items, { id: crypto.randomUUID(), name: '', condition: 'good', condition_notes: '', photoFile: null }]
    } : r))
  }

  function removeItem(roomId: string, itemId: string) {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, items: r.items.filter(i => i.id !== itemId) } : r))
  }

  function updateItem(roomId: string, itemId: string, field: string, value: any) {
    setRooms(prev => prev.map(r => r.id === roomId ? {
      ...r,
      items: r.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
    } : r))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Insert inspection
      const { data: inspection, error: inspErr } = await supabase
        .from('tenancy_inspections')
        .insert({
          tenancy_id: tenancyId,
          type: form.type,
          inspection_date: form.inspection_date,
          inspector_name: form.inspector_name,
          weather_conditions: form.weather_conditions || null,
          overall_condition: form.overall_condition,
          tenant_present: form.tenant_present,
          general_notes: form.general_notes || null,
        } as any)
        .select('id')
        .single()

      if (inspErr || !inspection) throw inspErr ?? new Error('Failed to create inspection')
      const inspectionId = (inspection as any).id

      // 2. Insert rooms and items
      for (let ri = 0; ri < rooms.length; ri++) {
        const room = rooms[ri]

        const { data: roomRow, error: roomErr } = await supabase
          .from('inspection_rooms')
          .insert({
            inspection_id: inspectionId,
            room_name: room.name,
            room_order: ri,
            cleanliness: room.cleanliness,
            decoration: room.decoration,
            condition_notes: room.condition_notes || null,
          } as any)
          .select('id')
          .single()

        if (roomErr) throw roomErr
        const roomId = (roomRow as any).id

        // Insert items
        for (const item of room.items) {
          if (!item.name.trim()) continue
          await supabase.from('inspection_room_items').insert({
            room_id: roomId,
            item_name: item.name,
            condition: item.condition,
            condition_notes: item.condition_notes || null,
          } as any)
        }

        // Upload photos
        for (const item of room.items) {
          if (item.photoFile) {
            const ext = item.photoFile.name.split('.').pop()
            const path = `${tenancyId}/${inspectionId}/${roomId}/${Date.now()}-${item.id}.${ext}`
            const { error: uploadErr } = await supabase.storage.from('inspection-photos').upload(path, item.photoFile)
            if (!uploadErr) {
              await supabase.from('inspection_photos').insert({
                inspection_id: inspectionId,
                room_id: roomId,
                storage_path: path,
                caption: `${room.name} — ${item.name}`,
              } as any)
            }
          }
        }
      }

      return inspectionId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenancy-inspections', tenancyId] })
      success('Inspection saved', 'Inspection with rooms and items recorded')
      onClose()
    },
    onError: (err) => {
      showError('Save failed', handleApiError(err, 'save inspection'))
    },
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.inspector_name) return showError('Missing field', 'Inspector name is required')
    if (rooms.length === 0) return showError('No rooms', 'Add at least one room')
    setSaving(true)
    try {
      await saveMutation.mutateAsync()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              New Inspection
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Inspection Details */}
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-base">Inspection Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Type *</Label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as any })}
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
                  >
                    <option value="move_in">Move-In</option>
                    <option value="move_out">Move-Out</option>
                    <option value="mid_tenancy">Mid-Tenancy</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input type="date" value={form.inspection_date} onChange={e => setForm({ ...form, inspection_date: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Inspector Name *</Label>
                  <Input value={form.inspector_name} onChange={e => setForm({ ...form, inspector_name: e.target.value })} placeholder="e.g. John Smith" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Weather</Label>
                  <Input value={form.weather_conditions} onChange={e => setForm({ ...form, weather_conditions: e.target.value })} placeholder="e.g. Sunny, 18C" />
                </div>
                <div className="space-y-1.5">
                  <Label>Overall Condition</Label>
                  <select
                    value={form.overall_condition}
                    onChange={e => setForm({ ...form, overall_condition: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
                  >
                    {CONDITION_RATINGS.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.tenant_present} onChange={e => setForm({ ...form, tenant_present: e.target.checked })} className="h-4 w-4" />
                    <span className="text-sm">Tenant present</span>
                  </label>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>General Notes</Label>
                  <Textarea value={form.general_notes} onChange={e => setForm({ ...form, general_notes: e.target.value })} rows={2} placeholder="Any overall observations..." />
                </div>
              </CardContent>
            </Card>

            {/* Rooms */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base">Rooms ({rooms.length})</CardTitle>
                <div className="flex gap-1">
                  <select
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                    onChange={e => { if (e.target.value) { addRoom(e.target.value); e.target.value = '' } }}
                    defaultValue=""
                  >
                    <option value="">+ Preset room...</option>
                    {ROOM_PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <Button type="button" size="sm" variant="outline" onClick={() => addRoom()}>
                    <Plus className="h-3 w-3" /> Custom
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {rooms.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No rooms added yet. Use the buttons above to add rooms.</p>
                )}
                {rooms.map((room, ri) => (
                  <div key={room.id} className="border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between p-3 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => toggleRoom(room.id)} className="text-gray-400 hover:text-gray-600">
                          {room.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <input
                          className="text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1 w-32"
                          value={room.name}
                          onChange={e => updateRoom(room.id, 'name', e.target.value)}
                        />
                        <span className="text-xs text-gray-400">({room.items.length} items)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <select
                          value={room.cleanliness}
                          onChange={e => updateRoom(room.id, 'cleanliness', e.target.value)}
                          className="text-xs border border-gray-200 rounded px-1 py-0.5"
                        >
                          {CONDITION_RATINGS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => removeRoom(room.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {room.expanded && (
                      <div className="p-3 space-y-1.5">
                        {room.items.map(item => (
                          <div key={item.id} className="flex items-center gap-2 text-xs">
                            <input
                              className="flex-1 border border-gray-200 rounded px-2 py-1 bg-white"
                              value={item.name}
                              onChange={e => updateItem(room.id, item.id, 'name', e.target.value)}
                              placeholder="Item name"
                            />
                            <select
                              value={item.condition}
                              onChange={e => updateItem(room.id, item.id, 'condition', e.target.value)}
                              className="border border-gray-200 rounded px-1 py-1 w-20"
                            >
                              {CONDITION_RATINGS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input
                              className="border border-gray-200 rounded px-2 py-1 w-20"
                              value={item.condition_notes}
                              onChange={e => updateItem(room.id, item.id, 'condition_notes', e.target.value)}
                              placeholder="Notes"
                            />
                            <label className="cursor-pointer text-gray-400 hover:text-blue-600">
                              <Camera className="h-3.5 w-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => updateItem(room.id, item.id, 'photoFile', e.target.files?.[0] ?? null)}
                              />
                            </label>
                            {item.photoFile && <span className="text-green-600">✓</span>}
                            <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0 text-red-400" onClick={() => removeItem(room.id, item.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => addItem(room.id)}>
                          <Plus className="h-3 w-3" /> Add item
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Inspection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
