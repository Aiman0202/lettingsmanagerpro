import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Camera, X, Upload } from 'lucide-react'
import { compressImage, generatePhotoFilename } from '@/utils/image-compression'
import { useToast } from '@/contexts/ToastContext'

interface InventoryItemFormDialogProps {
  open: boolean
  onClose: () => void
  propertyId: string
  editId: string | null
  onSaved: () => void
}

export default function InventoryItemFormDialog({
  open,
  onClose,
  propertyId,
  editId,
  onSaved,
}: InventoryItemFormDialogProps) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [form, setForm] = useState({
    category: 'furniture',
    name: '',
    description: '',
    quantity: '1',
    condition: 'good',
    notes: '',
  })
  const [photos, setPhotos] = useState<Array<{ url: string; path: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data: existing } = useQuery({
    queryKey: ['inventory-item', editId],
    enabled: !!editId,
    queryFn: async () => {
      const { data } = await supabase
        .from('property_inventory_items')
        .select('*')
        .eq('id', editId!)
        .single()
      return data as any
    },
  })

  useEffect(() => {
    if (existing) {
      setForm({
        category: existing.category ?? 'furniture',
        name: existing.name ?? '',
        description: existing.description ?? '',
        quantity: String(existing.quantity ?? 1),
        condition: existing.condition ?? 'good',
        notes: existing.notes ?? '',
      })
      // Load existing photos
      if (existing.photos && Array.isArray(existing.photos)) {
        loadPhotos(existing.photos)
      } else {
        setPhotos([])
      }
    } else {
      setForm({
        category: 'furniture',
        name: '',
        description: '',
        quantity: '1',
        condition: 'good',
        notes: '',
      })
      setPhotos([])
    }
  }, [existing, open])

  async function loadPhotos(photoPaths: string[]) {
    const loadedPhotos = await Promise.all(
      photoPaths.map(async (path) => {
        const { data } = await supabase.storage
          .from('inventory-photos')
          .createSignedUrl(path, 3600)
        return {
          url: data?.signedUrl ?? '',
          path
        }
      })
    )
    setPhotos(loadedPhotos.filter(p => p.url))
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true)
    try {
      // Compress image (maxWidth: 1200, quality: 0.8)
      const compressed = await compressImage(file, 1200, 0.8)

      // Generate unique filename
      const timestamp = Date.now()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filename = `${propertyId}-${timestamp}.${ext}`
      const storagePath = `inventory-items/${filename}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('inventory-photos')
        .upload(storagePath, compressed, {
          contentType: compressed.type,
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get signed URL
      const { data: urlData } = await supabase.storage
        .from('inventory-photos')
        .createSignedUrl(storagePath, 3600)

      if (urlData?.signedUrl) {
        setPhotos(prev => [...prev, { url: urlData.signedUrl, path: storagePath }])
        success('Photo uploaded', 'Image has been added to inventory item')
      }
    } catch (err) {
      showError('Upload failed', err instanceof Error ? err.message : 'Could not upload image')
    } finally {
      setUploading(false)
    }
  }

  async function removePhoto(photoPath: string) {
    try {
      // Delete from storage
      const { error } = await supabase.storage
        .from('inventory-photos')
        .remove([photoPath])

      if (error) throw error

      // Remove from state
      setPhotos(prev => prev.filter(p => p.path !== photoPath))
      success('Photo removed', 'Image has been removed')
    } catch (err) {
      showError('Delete failed', err instanceof Error ? err.message : 'Could not delete image')
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      showError('Validation Error', 'Item name is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        property_id: propertyId,
        category: form.category,
        name: form.name.trim(),
        description: form.description.trim() || null,
        quantity: parseInt(form.quantity) || 1,
        condition: form.condition,
        notes: form.notes.trim() || null,
        photos: photos.map(p => p.path),
      }

      if (editId) {
        const { error } = await (supabase.from('property_inventory_items') as any)
          .update(payload)
          .eq('id', editId)
        if (error) throw error
        success('Item updated', `${form.name} has been updated`)
      } else {
        const { error } = await (supabase.from('property_inventory_items') as any)
          .insert(payload)
        if (error) throw error
        success('Item added', `${form.name} has been added to inventory`)
      }

      onSaved()
    } catch (err) {
      showError('Save failed', err instanceof Error ? err.message : 'Could not save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit' : 'Add'} Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="furniture">Furniture</option>
                <option value="appliance">Appliance</option>
                <option value="fixture">Fixture</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Item Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Dining Table, Washing Machine"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g., Oak wood, seats 6"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Condition *</Label>
                <Select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                >
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="damaged">Damaged</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional details, damage notes, etc."
                rows={3}
              />
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) handlePhotoUpload(file)
                    }
                    input.click()
                  }}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Add Photo'}
                </Button>
                <span className="text-xs text-gray-500">
                  {photos.length} photo{photos.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Photo Grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {photos.map((photo) => (
                    <div key={photo.path} className="relative group">
                      <img
                        src={photo.url}
                        alt="Inventory photo"
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.path)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Add'} Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
