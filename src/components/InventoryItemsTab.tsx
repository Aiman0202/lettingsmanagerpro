import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Edit, Trash2, Camera } from 'lucide-react'
import { formatConditionLabel } from '@/utils/inventory'
import InventoryItemFormDialog from './InventoryItemFormDialog'
import { useToast } from '@/contexts/ToastContext'

interface InventoryItemsTabProps {
  propertyId: string
}

export default function InventoryItemsTab({ propertyId }: InventoryItemsTabProps) {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory-items', propertyId],
    queryFn: async () => {
      let query = supabase
        .from('property_inventory_items')
        .select('*')
        .eq('property_id', propertyId)
        .order('category')
        .order('name')

      if (categoryFilter) {
        query = query.eq('category', categoryFilter)
      }

      const { data } = await query
      const inventoryItems = data ?? []

      // Load photos for each item
      const itemsWithPhotos = await Promise.all(
        inventoryItems.map(async (item: any) => {
          if (item.photos && item.photos.length > 0) {
            const photoUrls = await Promise.all(
              item.photos.map(async (path: string) => {
                const { data } = await supabase.storage
                  .from('inventory-photos')
                  .createSignedUrl(path, 3600)
                return data?.signedUrl ?? ''
              })
            )
            return { ...item, photoUrls: photoUrls.filter(url => url) }
          }
          return { ...item, photoUrls: [] }
        })
      )

      return itemsWithPhotos
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('property_inventory_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory-items', propertyId] })
      success('Item deleted', 'Inventory item has been removed')
    },
    onError: (err) => {
      showError('Delete failed', err instanceof Error ? err.message : 'Could not delete item')
    },
  })

  const categories = ['furniture', 'appliance', 'fixture', 'other']

  const groupedItems = items?.reduce((acc, item: any) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Property Inventory</h3>
          <p className="text-sm text-gray-500">{items?.length ?? 0} items tracked</p>
        </div>
        <Button size="sm" onClick={() => { setEditId(null); setShowForm(true) }}>
          <Plus className="h-4 w-4 mr-2" /> Add Item
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2">
        <Button
          variant={categoryFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCategoryFilter('')}
        >
          All
        </Button>
        {categories.map(cat => (
          <Button
            key={cat}
            variant={categoryFilter === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Loading inventory...</div>
      ) : items?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">No inventory items yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems || {}).map(([category, categoryItems]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-base capitalize">{category} ({categoryItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryItems.map((item: any) => {
                      const conditionStyle = formatConditionLabel(item.condition)
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-gray-500">{item.description}</p>
                              )}
                              {/* Display first photo thumbnail */}
                              {item.photoUrls && item.photoUrls.length > 0 && (
                                <div className="mt-2 flex gap-1 flex-wrap">
                                  {item.photoUrls.slice(0, 3).map((url: string, idx: number) => (
                                    <img
                                      key={idx}
                                      src={url}
                                      alt={`${item.name} photo ${idx + 1}`}
                                      className="w-12 h-12 object-cover rounded border"
                                    />
                                  ))}
                                  {item.photoUrls.length > 3 && (
                                    <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                      +{item.photoUrls.length - 3}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <Badge className={`${conditionStyle.bgColor} ${conditionStyle.color} border-0`}>
                              {conditionStyle.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-gray-600">
                            {item.notes || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setEditId(item.id); setShowForm(true) }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  if (confirm('Delete this inventory item?')) {
                                    deleteMutation.mutate(item.id)
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InventoryItemFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        propertyId={propertyId}
        editId={editId}
        onSaved={() => {
          setShowForm(false)
          qc.invalidateQueries({ queryKey: ['inventory-items', propertyId] })
        }}
      />
    </div>
  )
}
