import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Search, FolderOpen, Download, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const categories = ['Contract', 'Compliance', 'Reference', 'Invoice', 'Correspondence', 'Other']

export default function DocumentsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', search, entityTypeFilter],
    queryFn: async () => {
      let q = supabase
        .from('documents')
        .select('*')
        .order('uploaded_at', { ascending: false })
      if (entityTypeFilter) q = q.eq('entity_type', entityTypeFilter)
      if (search) q = q.ilike('name', `%${search}%`)
      const { data } = await q
      return data ?? []
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (doc: any) => {
      await supabase.storage.from('documents').remove([doc.storage_path])
      await supabase.from('documents').delete().eq('id', doc.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })

  async function handleDownload(doc: any) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 text-sm mt-1">{documents?.length ?? 0} files</p>
        </div>
        <Button onClick={() => setShowUpload(true)}><Plus className="h-4 w-4" /> Upload</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={entityTypeFilter} onChange={(e) => setEntityTypeFilter(e.target.value)} className="w-44">
              <option value="">All types</option>
              <option value="property">Property</option>
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
              <option value="tenancy">Tenancy</option>
              <option value="general">General</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-400">Loading…</TableCell></TableRow>
            ) : (documents ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-400">No documents found</p>
                </TableCell>
              </TableRow>
            ) : (documents ?? []).map((doc: any) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.name}</TableCell>
                <TableCell><Badge variant="secondary">{doc.category}</Badge></TableCell>
                <TableCell className="capitalize">{doc.entity_type}</TableCell>
                <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => { if (confirm('Delete document?')) deleteMutation.mutate(doc) }}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <UploadDocumentDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onSaved={() => { setShowUpload(false); qc.invalidateQueries({ queryKey: ['documents'] }) }}
      />
    </div>
  )
}

function UploadDocumentDialog({ open, onClose, onSaved }: {
  open: boolean; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({
    entity_type: 'general', entity_id: '', name: '', category: 'Other',
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: properties } = useQuery({
    queryKey: ['properties-dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('id, address').order('address')
      return data ?? []
    },
  })
  const { data: tenants } = useQuery({
    queryKey: ['tenants-dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('tenants').select('id, full_name').order('full_name')
      return data ?? []
    },
  })
  const { data: landlords } = useQuery({
    queryKey: ['landlords-dropdown'],
    queryFn: async () => {
      const { data } = await supabase.from('landlords').select('id, full_name').order('full_name')
      return data ?? []
    },
  })
  const { data: tenancies } = useQuery({
    queryKey: ['tenancies-dropdown'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenancies')
        .select('id, properties(address)')
        .order('created_at')
      return data ?? []
    },
  })

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    
    const { error: uploadError } = await supabase.storage.from('documents').upload(path, file)
    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    await supabase.from('documents').insert({
      name: form.name || file.name,
      storage_path: path,
      entity_type: form.entity_type as any,
      entity_id: form.entity_id || null,
      category: form.category,
      size_bytes: file.size,
    })

    setUploading(false)
    setFile(null)
    setForm({ entity_type: 'general', entity_id: '', name: '', category: 'Other' })
    onSaved()
  }

  const entityOptions: Record<string, any[]> = {
    property: properties ?? [],
    tenant: tenants ?? [],
    landlord: landlords ?? [],
    tenancy: tenancies ?? [],
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <form onSubmit={handleUpload}>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label>File *</Label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) { setFile(f); if (!form.name) setForm((prev) => ({ ...prev, name: f.name })) }
                }}
                required
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Display Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Leave blank to use filename" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Entity Type</Label>
                <Select value={form.entity_type} onChange={(e) => setForm({ ...form, entity_type: e.target.value, entity_id: '' })}>
                  <option value="general">General</option>
                  <option value="property">Property</option>
                  <option value="tenant">Tenant</option>
                  <option value="landlord">Landlord</option>
                  <option value="tenancy">Tenancy</option>
                </Select>
              </div>
            </div>
            {form.entity_type !== 'general' && (
              <div className="space-y-1.5">
                <Label>Link to {form.entity_type}</Label>
                <Select value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })}>
                  <option value="">None</option>
                  {(entityOptions[form.entity_type] ?? []).map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.address ?? item.full_name ?? item.properties?.address ?? item.id}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={uploading || !file}>{uploading ? 'Uploading…' : 'Upload'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
