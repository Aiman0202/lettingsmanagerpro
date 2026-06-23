import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, FileText, Printer, Send, AlertTriangle, Package, Loader2 } from 'lucide-react'
import { fetchAgreementAttachments, getAttachmentSignedUrl } from '@/utils/agreement-attachments'
import { formatDate } from '@/lib/utils'
import { generateCouncilPackHTML } from '@/utils/council-pack'

interface CouncilSubmissionDialogProps {
  agreementId: string
  open: boolean
  onClose: () => void
  onSubmitted: () => void
}

export default function CouncilSubmissionDialog({ agreementId, open, onClose, onSubmitted }: CouncilSubmissionDialogProps) {
  const qc = useQueryClient()
  const [councilName, setCouncilName] = useState('')
  const [councilReference, setCouncilReference] = useState('')
  const [submittedAt, setSubmittedAt] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [packGenerated, setPackGenerated] = useState(false)

  const { data: agreement } = useQuery({
    queryKey: ['agreement-council', agreementId],
    queryFn: async () => {
      const { data } = await supabase
        .from('generated_agreements')
        .select(`
          *,
          tenancies(
            start_date,
            end_date,
            rent_amount,
            properties(address, postcode),
            landlords(full_name),
            tenancy_tenants(tenants(full_name))
          ),
          agreement_signatures(
            signatory_name,
            signatory_type,
            signed_at,
            capture_method,
            witness_name,
            witness_address,
            witness_occupation
          )
        `)
        .eq('id', agreementId)
        .single()
      return data as any
    },
  })

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings-council'],
    queryFn: async () => {
      const { data } = await supabase.from('company_settings').select('*').limit(1).single()
      return data as any
    },
  })

  const { data: attachments } = useQuery({
    queryKey: ['agreement-attachments', agreementId],
    queryFn: () => fetchAgreementAttachments(agreementId),
  })

  const included = (attachments ?? []).filter((a: any) => a.included_in_council_pack)
  const missingDocs = (attachments ?? []).filter((a: any) => !a.storage_path && a.attachment_type !== 'tenant_reference')

  async function handleOpenAttachment(a: any) {
    const url = await getAttachmentSignedUrl(a.storage_path, a.source_table)
    if (url) window.open(url, '_blank')
  }

  async function handleGenerateAndPrint() {
    if (!agreement) return
    setGenerating(true)

    try {
      const tenancy = agreement.tenancies ?? {}
      const property = tenancy.properties ?? {}
      const landlord = tenancy.landlords ?? {}
      const tenantNames = (tenancy.tenancy_tenants ?? []).map((tt: any) => tt.tenants?.full_name).filter(Boolean)
      const signatures = (agreement.agreement_signatures ?? []).map((s: any) => ({
        name: s.signatory_name,
        type: s.signatory_type,
        signedAt: s.signed_at,
        method: s.capture_method,
        witnessName: s.witness_name,
        witnessAddress: s.witness_address,
        witnessOccupation: s.witness_occupation,
      }))

      // Build attachment data for pack
      const complianceAttachments = (attachments ?? [])
        .filter((a: any) => a.attachment_type === 'compliance_certificate' && a.included_in_council_pack)
        .map((a: any) => ({
          name: a.display_name,
          type: 'compliance_certificate',
          imageUrl: null,
        }))

      const idAttachments = (attachments ?? [])
        .filter((a: any) => a.attachment_type === 'tenant_id_document' && a.included_in_council_pack)
        .map((a: any) => {
          // Parse tenant name from display_name format "Tenant Name — Document Type"
          const parts = a.display_name.split(' — ')
          return {
            tenantName: parts[0] ?? 'Tenant',
            type: parts[1]?.split(' (')[0] ?? 'ID Document',
            number: a.display_name.match(/\(([^)]+)\)/)?.[1] ?? null,
            imageUrl: null,
          }
        })

      const references = (attachments ?? [])
        .filter((a: any) => a.attachment_type === 'tenant_reference' && a.included_in_council_pack)
        .map((a: any) => {
          const parts = a.display_name.split(' — ')
          return {
            tenantName: parts[0] ?? 'Tenant',
            type: parts[1]?.split(' (')[0] ?? 'Reference',
            status: parts[1]?.match(/\(([^)]+)\)/)?.[1] ?? 'Recorded',
          }
        })

      const agencyAddress = [
        companySettings?.address_line1,
        companySettings?.address_line2,
        companySettings?.city,
        companySettings?.postcode,
      ].filter(Boolean).join(', ')

      const packHtml = generateCouncilPackHTML({
        councilName: councilName || 'Local Authority',
        councilReference: councilReference || 'PENDING',
        propertyAddress: property.address ?? 'Property',
        propertyPostcode: property.postcode ?? '',
        tenancyStart: tenancy.start_date ?? '',
        tenancyEnd: tenancy.end_date ?? '',
        rentAmount: tenancy.rent_amount ? `£${Number(tenancy.rent_amount).toLocaleString()}` : '',
        landlordName: landlord.full_name ?? 'Landlord',
        agentName: companySettings?.company_name ?? 'Letting Agency',
        agentAddress: agencyAddress,
        agentPhone: companySettings?.phone,
        agentEmail: companySettings?.email,
        tenantNames,
        agreementHtml: agreement.merged_html ?? '<p>Agreement not yet generated.</p>',
        complianceAttachments,
        idAttachments,
        references,
        signatures,
        generatedAt: new Date().toISOString(),
      })

      // Save pack HTML to database
      await (supabase.from('generated_agreements') as any).update({
        council_pack_html: packHtml,
        council_pack_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', agreementId)

      setPackGenerated(true)

      // Open in new window for printing
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(packHtml)
        printWindow.document.close()
        // Small delay to allow rendering before print dialog
        setTimeout(() => printWindow.print(), 500)
      }
    } catch (err) {
      console.error('Failed to generate council pack:', err)
      alert('Failed to generate council pack. Please try again.')
    } finally {
      setGenerating(false)
    }
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
              <div className="flex justify-between"><span className="text-gray-500">Term:</span> <span className="font-medium">{formatDate(agreement?.tenancies?.start_date)} to {formatDate(agreement?.tenancies?.end_date)}</span></div>
            </div>

            {/* Council details */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3 space-y-1.5">
                <Label>Council / Local Authority Name</Label>
                <Input
                  value={councilName}
                  onChange={(e) => setCouncilName(e.target.value)}
                  placeholder="e.g. Birmingham City Council"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Council Reference *</Label>
                <Input
                  value={councilReference}
                  onChange={(e) => setCouncilReference(e.target.value)}
                  placeholder="e.g. HMO-2026-001"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date Submitted *</Label>
                <Input type="date" value={submittedAt} onChange={(e) => setSubmittedAt(e.target.value)} required />
              </div>
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

            {/* Pack generation status */}
            {packGenerated && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Council pack generated and opened in a new window. Use browser print dialog to save as PDF.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" variant="outline" onClick={handleGenerateAndPrint} disabled={generating}>
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
              ) : (
                <><Printer className="h-4 w-4 mr-2" /> {packGenerated ? 'Re-generate & Print Pack' : 'Generate & Print Pack'}</>
              )}
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
