import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, FileText, Printer, Send, AlertTriangle } from 'lucide-react'
import { fetchAgreementAttachments, getAttachmentSignedUrl } from '@/utils/agreement-attachments'
import { formatDate } from '@/lib/utils'

interface CouncilSubmissionDialogProps {
  agreementId: string
  open: boolean
  onClose: () => void
  onSubmitted: () => void
}

export default function CouncilSubmissionDialog({ agreementId, open, onClose, onSubmitted }: CouncilSubmissionDialogProps) {
  const qc = useQueryClient()
  const [councilReference, setCouncilReference] = useState('')
  const [submittedAt, setSubmittedAt] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const { data: agreement } = useQuery({
    queryKey: ['agreement-council', agreementId],
    queryFn: async () => {
      const { data } = await supabase
        .from('generated_agreements')
        .select(`
          *,
          tenancies(properties(address), tenancy_tenants(tenants(full_name)))
        `)
        .eq('id', agreementId)
        .single()
      return data as any
    },
  })

  const { data: attachments } = useQuery({
    queryKey: ['agreement-attachments', agreementId],
    queryFn: () => fetchAgreementAttachments(agreementId),
  })

  const included = (attachments ?? []).filter((a: any) => a.included_in_council_pack)
  const missingDocs = (attachments ?? []).filter((a: any) => !a.storage_path && a.attachment_type !== 'tenant_reference')

  async function handlePrint() {
    setGenerating(true)
    // Open preview in print mode
    const previewWindow = window.open(`/agreements/preview/${agreementId}`, '_blank')
    if (previewWindow) previewWindow.focus()
    setGenerating(false)
  }

  async function handleOpenAttachment(a: any) {
    const url = await getAttachmentSignedUrl(a.storage_path, a.source_table)
    if (url) window.open(url, '_blank')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!councilReference || !submittedAt) return

    setSaving(true)
    await (supabase.from('generated_agreements') as any).update({
      council_submission_status: 'submitted',
      council_reference: councilReference,
      council_submitted_at: new Date(submittedAt).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', agreementId)

    setSaving(false)
    qc.invalidateQueries({ queryKey: ['agreements'] })
    onSubmitted()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent onClose={onClose} className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>City Council Submission Pack</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {/* Property summary */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Property:</span> <span className="font-medium">{agreement?.tenancies?.properties?.address ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tenants:</span> <span className="font-medium">{(agreement?.tenancies?.tenancy_tenants ?? []).map((tt: any) => tt.tenants?.full_name).join(', ') || '—'}</span></div>
            </div>

            {/* Document checklist */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Documents included in council pack</h3>
              {missingDocs.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {missingDocs.length} document(s) are listed but have no file attached.
                </div>
              )}
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {/* Agreement itself */}
                <div className="flex items-center justify-between p-3 bg-green-50/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Signed Tenancy Agreement</span>
                  </div>
                  <Badge variant="success">Included</Badge>
                </div>

                {included.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      {a.storage_path ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      <div>
                        <div className="text-sm font-medium">{a.display_name}</div>
                        <div className="text-xs text-gray-500 capitalize">{a.attachment_type.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                    {a.storage_path && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenAttachment(a)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {included.length === 0 && (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No supporting documents are attached to this agreement.
                  </div>
                )}
              </div>
            </div>

            {/* Council reference fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Council Reference *</Label>
                <Input value={councilReference} onChange={(e) => setCouncilReference(e.target.value)} placeholder="e.g. HMO-2026-001" required />
              </div>
              <div className="space-y-1.5">
                <Label>Date Submitted *</Label>
                <Input type="date" value={submittedAt} onChange={(e) => setSubmittedAt(e.target.value)} required />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" variant="outline" onClick={handlePrint} disabled={generating}>
              <Printer className="h-4 w-4 mr-2" /> Print Pack
            </Button>
            <Button type="submit" disabled={saving || !councilReference || !submittedAt}>
              <Send className="h-4 w-4 mr-2" /> {saving ? 'Saving…' : 'Mark as Sent to Council'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
