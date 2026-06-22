import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Eye, Send, CheckCircle, Building2, Users, ExternalLink, Info } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import AgreementPreviewDialog from '@/components/AgreementPreviewDialog'
import CouncilSubmissionDialog from '@/components/CouncilSubmissionDialog'

type StatusFilter = 'all' | 'pending' | 'signed' | 'submitted'

export default function AgreementsPage() {
  const qc = useQueryClient()
  const [previewAgreementId, setPreviewAgreementId] = useState<string | null>(null)
  const [councilAgreementId, setCouncilAgreementId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const { data: agreements, error: agreementsError, isLoading } = useQuery({
    queryKey: ['agreements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_agreements')
        .select(`
          *,
          tenancies(
            id,
            reference_number,
            rent_amount,
            deposit_amount,
            properties(address),
            tenancy_tenants(tenants(full_name))
          ),
          agreement_signatures(signatory_type)
        `)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Failed to load agreements:', error)
        throw new Error(error.message)
      }
      return data ?? []
    },
  })

  const filteredAgreements = (agreements ?? []).filter((a: any) => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'pending') return a.status === 'pending_signatures'
    if (statusFilter === 'signed') return a.status === 'signed' && (a.council_submission_status ?? 'not_submitted') === 'not_submitted'
    if (statusFilter === 'submitted') return (a.council_submission_status ?? 'not_submitted') !== 'not_submitted'
    return true
  })

  const counts = {
    all: (agreements ?? []).length,
    pending: (agreements ?? []).filter((a: any) => a.status === 'pending_signatures').length,
    signed: (agreements ?? []).filter((a: any) => a.status === 'signed' && (a.council_submission_status ?? 'not_submitted') === 'not_submitted').length,
    submitted: (agreements ?? []).filter((a: any) => (a.council_submission_status ?? 'not_submitted') !== 'not_submitted').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenancy Agreements</h1>
          <p className="text-gray-500 text-sm mt-1">All generated tenancy agreements</p>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>Agreements are created from the tenancy detail page. Open a tenancy and go to the <strong>Agreement</strong> tab to create, sign, and manage it.</span>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'all', label: 'All', count: counts.all },
          { key: 'pending', label: 'Awaiting Signatures', count: counts.pending },
          { key: 'signed', label: 'Signed', count: counts.signed },
          { key: 'submitted', label: 'Submitted to Council', count: counts.submitted },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {agreementsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          <strong>Failed to load agreements:</strong> {(agreementsError as Error).message}
        </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Tenants</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Council</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-400">Loading agreements…</TableCell>
              </TableRow>
            ) : filteredAgreements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-400">
                  No agreements found
                </TableCell>
              </TableRow>
            ) : filteredAgreements.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                    {a.tenancies?.properties?.address ?? '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-gray-400 shrink-0" />
                    {(a.tenancies?.tenancy_tenants ?? []).map((tt: any) => tt.tenants?.full_name).filter(Boolean).join(', ') || '—'}
                  </div>
                </TableCell>
                <TableCell className="text-sm font-mono text-gray-500">
                  {a.tenancies?.reference_number ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={a.status === 'signed' ? 'success' : a.status === 'pending_signatures' ? 'warning' : 'secondary'}>
                    {a.status === 'signed' ? 'Signed' : a.status === 'pending_signatures' ? 'Awaiting' : (a.status ?? '—').replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={(a.council_submission_status ?? 'not_submitted') === 'submitted' ? 'success' : 'outline'}>
                    {(a.council_submission_status ?? 'not submitted').replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">{formatDate(a.created_at)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <Button variant="ghost" size="sm" title="Preview agreement" onClick={() => setPreviewAgreementId(a.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {a.status === 'signed' && (a.council_submission_status ?? 'not_submitted') === 'not_submitted' && (
                      <Button variant="ghost" size="sm" title="Submit to council" onClick={() => setCouncilAgreementId(a.id)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {a.status === 'signed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {a.tenancies?.id && (
                      <Link to={`/tenancies/${a.tenancies.id}`}>
                        <Button variant="ghost" size="sm" title="Go to tenancy">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {previewAgreementId && (
        <AgreementPreviewDialog
          agreementId={previewAgreementId}
          open={!!previewAgreementId}
          onClose={() => setPreviewAgreementId(null)}
        />
      )}

      {councilAgreementId && (
        <CouncilSubmissionDialog
          agreementId={councilAgreementId}
          open={!!councilAgreementId}
          onClose={() => setCouncilAgreementId(null)}
          onSubmitted={() => { setCouncilAgreementId(null); qc.invalidateQueries({ queryKey: ['agreements'] }) }}
        />
      )}
    </div>
  )
}
