import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit2, Trash2, Home, Ruler, ChevronDown, ChevronRight } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import { handleApiError } from '@/utils/validation'
import { logAudit } from '@/lib/audit'

type RoomType = 'bedroom' | 'bathroom' | 'kitchen' | 'living_room' | 'dining_room' | 'study' | 'hallway' | 'utility' | 'other'

const ROOM_TYPE_OPTIONS: { value: RoomType; label: string }[] = [
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'living_room', label: 'Living Room' },
  { value: 'dining_room', label: 'Dining Room' },
  { value: 'study', label: 'Study' },
  { value: 'hallway', label: 'Hallway' },
  { value: 'utility', label: 'Utility Room' },
  { value: 'other', label: 'Other' },
]

const FLOOR_COVERING_OPTIONS = ['carpet', 'hardwood', 'tile', 'laminate', 'vinyl', 'other']

interface Room {
  id: string
  property_id: string
  room_name: string
  room_type: RoomType
  length_meters: number | null
  width_meters: number | null
  length_feet: number | null
  width_feet: number | null
  features: string[]
  floor_covering: string | null
  description: string | null
}

export default function PropertyRooms({ propertyId }: { propertyId: string }) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({})

  const { data: rooms, isLoading } = useQuery({
    queryKey: ['property-rooms', propertyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('property_rooms')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })
      return (data ?? []) as Room[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('property_rooms').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property-rooms', propertyId] })
      logAudit({ action: 'deleted', resource: 'property_room' })
      success('Room deleted', 'The room has been successfully removed')
    },
    onError: (err) => {
      showError('Delete failed', handleApiError(err, 'delete room'))
    },
  })

  const toggleRoom = (roomId: string) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }))
  }

  const roomCounts = rooms?.reduce((acc, room) => {
    acc[room.room_type] = (acc[room.room_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Rooms ({rooms?.length || 0})
        </CardTitle>
        <Button size="sm" onClick={() => { setEditId(null); setShowForm(true) }}>
          <Plus className="h-4 w-4 mr-1" /> Add Room
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-gray-400 py-8">Loading rooms...</p>
        ) : !rooms || rooms.length === 0 ? (
          <div className="text-center py-8">
            <Home className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">No rooms added yet</p>
            <p className="text-sm text-gray-500 mt-1">Add rooms to provide detailed property information</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Room Summary */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
              {roomCounts && Object.entries(roomCounts).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="justify-between">
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                  <span className="ml-2 font-bold">{count}</span>
                </Badge>
              ))}
            </div>

            {/* Room List */}
            {rooms.map((room) => (
              <div key={room.id} className="border rounded-lg">
                <div 
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleRoom(room.id)}
                >
                  <div className="flex items-center gap-3">
                    <Home className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{room.room_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{room.room_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(room.length_meters || room.width_meters) && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Ruler className="h-4 w-4" />
                        <span>{room.length_meters}m × {room.width_meters}m</span>
                      </div>
                    )}
                    {expandedRooms[room.id] ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {expandedRooms[room.id] && (
                  <div className="border-t p-4 space-y-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {room.length_meters && room.width_meters && (
                        <div>
                          <p className="text-gray-500">Dimensions</p>
                          <p className="font-medium">
                            {room.length_meters}m × {room.width_meters}m
                            {room.length_feet && room.width_feet && (
                              <span className="text-gray-400 ml-1">
                                ({room.length_feet}ft × {room.width_feet}ft)
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      {room.floor_covering && (
                        <div>
                          <p className="text-gray-500">Floor Covering</p>
                          <p className="font-medium capitalize">{room.floor_covering}</p>
                        </div>
                      )}
                    </div>

                    {room.features && room.features.length > 0 && (
                      <div>
                        <p className="text-gray-500 mb-2">Features</p>
                        <div className="flex flex-wrap gap-1">
                          {room.features.map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {room.description && (
                      <div>
                        <p className="text-gray-500 mb-1">Description</p>
                        <p className="text-sm">{room.description}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditId(room.id)
                          setShowForm(true)
                        }}
                      >
                        <Edit2 className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Are you sure you want to delete this room?')) {
                            deleteMutation.mutate(room.id)
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {showForm && (
        <RoomFormDialog
          open={showForm}
          onClose={() => setShowForm(false)}
          propertyId={propertyId}
          editId={editId}
          onSaved={() => {
            setShowForm(false)
            qc.invalidateQueries({ queryKey: ['property-rooms', propertyId] })
          }}
        />
      )}
    </Card>
  )
}

function RoomFormDialog({ open, onClose, propertyId, editId, onSaved }: {
  open: boolean
  onClose: () => void
  propertyId: string
  editId: string | null
  onSaved: () => void
}) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [form, setForm] = useState({
    room_name: '',
    room_type: 'bedroom' as RoomType,
    length_meters: '',
    width_meters: '',
    length_feet: '',
    width_feet: '',
    floor_covering: '',
    description: '',
    features: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [newFeature, setNewFeature] = useState('')

  const { data: existing } = useQuery({
    queryKey: ['property-room', editId],
    enabled: !!editId,
    queryFn: async () => {
      const { data } = await supabase
        .from('property_rooms')
        .select('*')
        .eq('id', editId!)
        .single()
      return data as any
    },
  })

  useEffect(() => {
    if (existing) {
      setForm({
        room_name: existing.room_name ?? '',
        room_type: existing.room_type ?? 'bedroom',
        length_meters: String(existing.length_meters ?? ''),
        width_meters: String(existing.width_meters ?? ''),
        length_feet: String(existing.length_feet ?? ''),
        width_feet: String(existing.width_feet ?? ''),
        floor_covering: existing.floor_covering ?? '',
        description: existing.description ?? '',
        features: existing.features ?? [],
      })
    } else {
      setForm({
        room_name: '',
        room_type: 'bedroom',
        length_meters: '',
        width_meters: '',
        length_feet: '',
        width_feet: '',
        floor_covering: '',
        description: '',
        features: [],
      })
    }
  }, [existing])

  const addFeature = () => {
    if (newFeature.trim() && !form.features.includes(newFeature.trim())) {
      setForm({ ...form, features: [...form.features, newFeature.trim()] })
      setNewFeature('')
    }
  }

  const removeFeature = (feature: string) => {
    setForm({ ...form, features: form.features.filter(f => f !== feature) })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.room_name.trim()) {
      showError('Validation error', 'Room name is required')
      return
    }

    setSaving(true)
    
    try {
      const payload = {
        property_id: propertyId,
        room_name: form.room_name,
        room_type: form.room_type,
        length_meters: form.length_meters ? parseFloat(form.length_meters) : null,
        width_meters: form.width_meters ? parseFloat(form.width_meters) : null,
        length_feet: form.length_feet ? parseFloat(form.length_feet) : null,
        width_feet: form.width_feet ? parseFloat(form.width_feet) : null,
        floor_covering: form.floor_covering || null,
        description: form.description || null,
        features: form.features || [],
      }

      if (editId) {
        const { error } = await (supabase.from('property_rooms') as any).update(payload).eq('id', editId)
        if (error) throw error
        logAudit({ action: 'updated', resource: 'property_room', resourceId: editId, details: { room_name: form.room_name } })
        success('Room updated', `${form.room_name} has been successfully updated`)
      } else {
        const { error } = await (supabase.from('property_rooms') as any).insert(payload)
        if (error) throw error
        logAudit({ action: 'created', resource: 'property_room', details: { room_name: form.room_name } })
        success('Room added', `${form.room_name} has been successfully added`)
      }
      
      setSaving(false)
      onSaved()
    } catch (err) {
      setSaving(false)
      showError('Save failed', handleApiError(err, editId ? 'update room' : 'add room'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-2xl">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Room' : 'Add Room'}</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Room Name *</Label>
                <Input 
                  value={form.room_name} 
                  onChange={(e) => setForm({ ...form, room_name: e.target.value })}
                  placeholder="e.g., Master Bedroom, Kitchen, etc."
                />
              </div>
              <div className="col-span-2">
                <Label>Room Type *</Label>
                <Select 
                  value={form.room_type} 
                  onChange={(e) => setForm({ ...form, room_type: e.target.value as RoomType })}
                >
                  {ROOM_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>

              <div className="col-span-2 border-t pt-4">
                <Label>Dimensions (Metric)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="Length (m)" 
                    value={form.length_meters}
                    onChange={(e) => setForm({ ...form, length_meters: e.target.value })}
                  />
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="Width (m)" 
                    value={form.width_meters}
                    onChange={(e) => setForm({ ...form, width_meters: e.target.value })}
                  />
                </div>
              </div>

              <div className="col-span-2">
                <Label>Dimensions (Imperial)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Input 
                    type="number" 
                    step="0.1"
                    placeholder="Length (ft)" 
                    value={form.length_feet}
                    onChange={(e) => setForm({ ...form, length_feet: e.target.value })}
                  />
                  <Input 
                    type="number" 
                    step="0.1"
                    placeholder="Width (ft)" 
                    value={form.width_feet}
                    onChange={(e) => setForm({ ...form, width_feet: e.target.value })}
                  />
                </div>
              </div>

              <div className="col-span-2">
                <Label>Floor Covering</Label>
                <Select 
                  value={form.floor_covering} 
                  onChange={(e) => setForm({ ...form, floor_covering: e.target.value })}
                >
                  <option value="">Select...</option>
                  {FLOOR_COVERING_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="capitalize">{opt}</option>
                  ))}
                </Select>
              </div>

              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Additional details about the room..."
                />
              </div>

              <div className="col-span-2">
                <Label>Features</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature (e.g., En-suite, Built-in wardrobe)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addFeature()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {form.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1">
                        {feature}
                        <button
                          type="button"
                          onClick={() => removeFeature(feature)}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Add Room'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
