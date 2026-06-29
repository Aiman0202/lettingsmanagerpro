import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Search, Edit, Trash2, ChevronDown, ChevronRight, Building2 } from 'lucide-react'
import { useToast } from '@/contexts/ToastContext'
import CouncilFormDialog from '@/components/CouncilFormDialog'

export default function CouncilManagement() {
  const qc = useQueryClient()
  const { success, error: showError } = useToast()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCouncil, setEditingCouncil] = useState<any | null>(null)
  const [expandedCouncilId, setExpandedCouncilId] = useState<string | null>(null)

  // Load councils
  const { data: councils, isLoading } = useQuery({
    queryKey: ['councils'],
    queryFn: async () => {
      const { data } = await supabase
        .from('local_authorities')
        .select('*, council_required_documents(*)')
        .order('name')
      return (data ?? []) as any[]
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('local_authorities').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['councils'] })
      success('Council deleted', 'The council has been successfully removed')
    },
    onError: (err: any) => {
      showError('Delete failed', err.message || 'Failed to delete council')
    },
  })

  // Save council (create or update)
  const saveMutation = useMutation({
    mutationFn: async (data: {
      name: string
      address_line1: string
      address_line2: string
      city: string
      postcode: string
      phone: string
      email: string
      website: string
      contact_person: string
      licensing_required: boolean
      licence_type: string
      notes: string
      required_documents: Array<{
        document_type: string
        is_required: boolean
        description: string
        sort_order: number
      }>
    }) => {
      const councilData = {
        name: data.name,
        address_line1: data.address_line1 || null,
        address_line2: data.address_line2 || null,
        city: data.city || null,
        postcode: data.postcode || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        contact_person: data.contact_person || null,
        licensing_required: data.licensing_required,
        licence_type: data.licence_type || null,
        notes: data.notes || null,
      }

      if (editingCouncil) {
        // Update existing council
        const { error } = await (supabase.from('local_authorities') as any)
          .update(councilData)
          .eq('id', editingCouncil.id)
        
        if (error) throw error

        // Update required documents (delete old, insert new)
        await (supabase.from('council_required_documents') as any)
          .delete()
          .eq('council_id', editingCouncil.id)

        if (data.required_documents.length > 0) {
          const docs = data.required_documents.map((doc, idx) => ({
            council_id: editingCouncil.id,
            document_type: doc.document_type,
            is_required: doc.is_required,
            description: doc.description || null,
            sort_order: doc.sort_order ?? idx,
          }))

          const { error: docError } = await (supabase.from('council_required_documents') as any)
            .insert(docs)
          
          if (docError) throw docError
        }

        return { id: editingCouncil.id }
      } else {
        // Create new council
        const { data: newCouncil, error } = await (supabase.from('local_authorities') as any)
          .insert(councilData)
          .select()
          .single()
        
        if (error) throw error

        // Insert required documents
        if (data.required_documents.length > 0) {
          const docs = data.required_documents.map((doc, idx) => ({
            council_id: newCouncil.id,
            document_type: doc.document_type,
            is_required: doc.is_required,
            description: doc.description || null,
            sort_order: doc.sort_order ?? idx,
          }))

          const { error: docError } = await (supabase.from('council_required_documents') as any)
            .insert(docs)
          
          if (docError) throw docError
        }

        return newCouncil
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['councils'] })
      setShowForm(false)
      setEditingCouncil(null)
      success(
        editingCouncil ? 'Council updated' : 'Council added',
        editingCouncil 
          ? 'The council has been successfully updated'
          : 'The council has been successfully added'
      )
    },
    onError: (err: any) => {
      showError('Save failed', err.message || 'Failed to save council')
    },
  })

  const handleEdit = (council: any) => {
    setEditingCouncil(council)
    setShowForm(true)
  }

  const handleDelete = (council: any) => {
    if (confirm(`Delete ${council.name}? This will also remove all required document configurations.`)) {
      deleteMutation.mutate(council.id)
    }
  }

  const handleAddNew = () => {
    setEditingCouncil(null)
    setShowForm(true)
  }

  const toggleExpand = (councilId: string) => {
    setExpandedCouncilId(expandedCouncilId === councilId ? null : councilId)
  }

  // Filter councils by search
  const filteredCouncils = (councils ?? []).filter((c: any) => {
    const searchLower = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(searchLower) ||
      c.city?.toLowerCase().includes(searchLower) ||
      c.postcode?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Local Authority Councils</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage councils and their document requirements for agreement submissions
          </p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Council
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by council name, city, or postcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Councils Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Council Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Licensing</TableHead>
              <TableHead>Required Docs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-10">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filteredCouncils.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-10">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  {search ? 'No councils found matching your search' : 'No councils added yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCouncils.map((council: any) => {
                const requiredCount = (council.council_required_documents ?? []).filter(
                  (d: any) => d.is_required
                ).length
                const isExpanded = expandedCouncilId === council.id

                return (
                  <>
                    <TableRow key={council.id}>
                      <TableCell>
                        <button
                          onClick={() => toggleExpand(council.id)}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">{council.name}</TableCell>
                      <TableCell>{council.city ?? '—'}</TableCell>
                      <TableCell>
                        {council.licensing_required ? (
                          <Badge variant="destructive">
                            {council.licence_type ?? 'Required'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Not Required</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-green-600">
                          {requiredCount} required
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({(council.council_required_documents ?? []).length} total)
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(council)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(council)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded row with document details */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50 p-0">
                          <div className="p-4 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-900">
                              Required Documents for {council.name}
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {(council.council_required_documents ?? [])
                                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                                .map((doc: any) => (
                                  <div
                                    key={doc.id}
                                    className={`flex items-start gap-2 p-2 rounded border ${
                                      doc.is_required
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={doc.is_required}
                                      disabled
                                      className="h-4 w-4 mt-0.5"
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{doc.document_type}</p>
                                      {doc.description && (
                                        <p className="text-xs text-gray-500 mt-1">{doc.description}</p>
                                      )}
                                    </div>
                                    {doc.is_required && (
                                      <Badge variant="success" className="text-xs">Required</Badge>
                                    )}
                                  </div>
                                ))}
                            </div>
                            {council.notes && (
                              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                                <p className="text-sm text-amber-800">
                                  <strong>Notes:</strong> {council.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Dialog */}
      <CouncilFormDialog
        open={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingCouncil(null)
        }}
        onSave={(data) => saveMutation.mutate(data)}
        initialData={editingCouncil ? {
          id: editingCouncil.id,
          name: editingCouncil.name,
          address_line1: editingCouncil.address_line1,
          address_line2: editingCouncil.address_line2,
          city: editingCouncil.city,
          postcode: editingCouncil.postcode,
          phone: editingCouncil.phone,
          email: editingCouncil.email,
          website: editingCouncil.website,
          contact_person: editingCouncil.contact_person,
          licensing_required: editingCouncil.licensing_required,
          licence_type: editingCouncil.licence_type,
          notes: editingCouncil.notes,
          required_documents: (editingCouncil.council_required_documents ?? []).map((d: any) => ({
            document_type: d.document_type,
            is_required: d.is_required,
            description: d.description ?? '',
            sort_order: d.sort_order,
          })),
        } : null}
      />
    </div>
  )
}
