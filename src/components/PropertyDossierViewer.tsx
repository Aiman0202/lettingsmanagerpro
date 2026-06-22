import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchDossierData } from '@/utils/dossier'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, Printer, X, Loader2 } from 'lucide-react'

export default function PropertyDossierViewer({ open, onClose, tenancyId, companySettings, companyLogoUrl }: {
  open: boolean; onClose: () => void; tenancyId: string; companySettings?: any; companyLogoUrl?: string | null
}) {
  const [downloading, setDownloading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['dossier', tenancyId],
    queryFn: () => fetchDossierData(tenancyId),
    enabled: open && !!tenancyId,
  })

  function handlePrint() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const content = document.getElementById('dossier-content')
    if (!content) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Tenancy Agreement - ${companySettings?.company_name ?? 'Letting Agency'}</title>
      <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1a1a1a; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        h2 { font-size: 18px; margin: 24px 0 12px; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; }
        h3 { font-size: 14px; margin: 16px 0 8px; }
        p { margin: 4px 0; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th, td { border: 1px solid #e5e5e5; padding: 6px 10px; text-align: left; font-size: 12px; }
        th { background: #f5f5f5; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
        .green { background: #dcfce7; color: #166534; }
        .amber { background: #fef3c7; color: #92400e; }
        .red { background: #fee2e2; color: #991b1b; }
        .section { page-break-inside: avoid; margin-bottom: 20px; }
        .cover { text-align: center; padding: 60px 0; }
        .cover h1 { font-size: 32px; }
        @media print { .no-print { display: none; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `)
    printWindow.document.close()
    setTimeout(() => { printWindow.print() }, 500)
  }

  async function handleDownload() {
    setDownloading(true)
    handlePrint()
    setDownloading(false)
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClose={onClose}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {companyLogoUrl && <img src={companyLogoUrl} alt="Company Logo" className="h-8 w-auto" />}
              <div>
                <span>Tenancy Agreement</span>
                {companySettings?.company_name && (
                  <p className="text-xs font-normal text-gray-500 mt-0.5">{companySettings.company_name}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownload} disabled={downloading || isLoading}>
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
              <Button size="sm" onClick={handlePrint} disabled={isLoading}>
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">
              <Loader2 className="h-8 w-8 mx-auto animate-spin mb-3" />
              Generating dossier…
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-gray-400">
              Failed to load dossier data.
            </div>
          ) : (
            <DossierContent data={data} companySettings={companySettings} companyLogoUrl={companyLogoUrl} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DossierContent({ data, companySettings, companyLogoUrl }: { data: any; companySettings?: any; companyLogoUrl?: string | null }) {
  return (
    <div id="dossier-content" className="space-y-8">
      {/* Cover */}
      <div className="text-center py-8 border-b">
        {companyLogoUrl && <img src={companyLogoUrl} alt="Company Logo" className="h-16 w-auto mx-auto mb-4" />}
        <h1 className="text-3xl font-bold">{companySettings?.company_name ?? data.companySettings?.name ?? 'Letting Agency'}</h1>
        {companySettings?.address_line1 && (
          <p className="text-sm text-gray-600 mt-2">
            {companySettings.address_line1}
            {companySettings.address_line2 && <>, {companySettings.address_line2}</>}
            {companySettings.city && <>, {companySettings.city}</>}
            {companySettings.postcode && <> {companySettings.postcode}</>}
          </p>
        )}
        {(companySettings?.phone || companySettings?.email) && (
          <p className="text-sm text-gray-500 mt-1">
            {companySettings.phone}{companySettings.phone && companySettings.email && <> • </>}{companySettings.email}
          </p>
        )}
        <p className="text-lg text-gray-600 mt-4">{data.property.address}</p>
        <p className="text-sm text-gray-400">
          Tenancy: {new Date(data.tenancy.start_date).toLocaleDateString('en-GB')} — {new Date(data.tenancy.end_date).toLocaleDateString('en-GB')}
        </p>
        <p className="text-xs text-gray-400">Generated {new Date().toLocaleDateString('en-GB')}</p>
      </div>

      {/* Property */}
      <div className="section">
        <h2>Property Details</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <p><span className="text-gray-500">Address:</span> {data.property.address}</p>
          <p><span className="text-gray-500">Postcode:</span> {data.property.postcode}</p>
          <p><span className="text-gray-500">Type:</span> {data.property.type}</p>
          <p><span className="text-gray-500">Bedrooms:</span> {data.property.bedrooms}</p>
          <p><span className="text-gray-500">Bathrooms:</span> {data.property.bathrooms}</p>
          <p><span className="text-gray-500">EPC Rating:</span> {data.property.epc_rating ?? '—'}</p>
        </div>
        {data.property.description && (
          <p className="text-sm mt-3 text-gray-600">{data.property.description}</p>
        )}
      </div>

      {/* Landlord */}
      <div className="section">
        <h2>Landlord Details</h2>
        <div className="text-sm space-y-1">
          <p><span className="text-gray-500">Name:</span> {data.landlord?.full_name}</p>
          <p><span className="text-gray-500">Email:</span> {data.landlord?.email}</p>
          <p><span className="text-gray-500">Phone:</span> {data.landlord?.phone ?? '—'}</p>
        </div>
      </div>

      {/* Tenants */}
      <div className="section">
        <h2>Tenant Details</h2>
        {data.tenants.map((t: any) => (
          <div key={t.id} className="border rounded-lg p-4 mb-3 text-sm">
            <p className="font-medium">{t.full_name}</p>
            <p><span className="text-gray-500">Email:</span> {t.email ?? '—'}</p>
            <p><span className="text-gray-500">Phone:</span> {t.phone ?? '—'}</p>
            {t.date_of_birth && <p><span className="text-gray-500">DOB:</span> {formatDate(t.date_of_birth)}</p>}
            {t.ni_number && <p><span className="text-gray-500">NI Number:</span> {t.ni_number}</p>}
            {t.emergency_contact && <p><span className="text-gray-500">Emergency:</span> {t.emergency_contact}</p>}
          </div>
        ))}
      </div>

      {/* Tenancy Terms */}
      <div className="section">
        <h2>Tenancy Terms</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <p><span className="text-gray-500">Start Date:</span> {formatDate(data.tenancy.start_date)}</p>
          <p><span className="text-gray-500">End Date:</span> {formatDate(data.tenancy.end_date)}</p>
          <p><span className="text-gray-500">Monthly Rent:</span> {formatCurrency(data.tenancy.rent_amount)}</p>
          <p><span className="text-gray-500">Deposit:</span> {formatCurrency(data.tenancy.deposit_amount)}</p>
          <p><span className="text-gray-500">Deposit Scheme:</span> {data.tenancy.deposit_scheme ?? '—'}</p>
          <p><span className="text-gray-500">Status:</span> <Badge variant={data.tenancy.status === 'active' ? 'success' : 'secondary'}>{data.tenancy.status}</Badge></p>
        </div>
      </div>

      {/* Compliance */}
      <div className="section">
        <h2>Property Compliance Certificates</h2>
        {data.compliance.length === 0 ? (
          <p className="text-sm text-gray-400">No compliance certificates on file.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr><th>Type</th><th>Expiry Date</th><th>Status</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {data.compliance.map((c: any) => {
                const days = Math.ceil((new Date(c.expiry_date).getTime() - Date.now()) / 86400000)
                const status = days <= 0 ? 'Expired' : days <= 30 ? 'Expiring Soon' : 'Valid'
                const cls = status === 'Valid' ? 'green' : status === 'Expiring Soon' ? 'amber' : 'red'
                return (
                  <tr key={c.id}>
                    <td>{c.type.replace(/_/g, ' ').toUpperCase()}</td>
                    <td>{formatDate(c.expiry_date)}</td>
                    <td><span className={`badge ${cls}`}>{status}</span></td>
                    <td>{c.notes ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Tenant Documents */}
      <div className="section">
        <h2>Documents</h2>
        {data.tenants.map((t: any) => {
          const docs = data.tenantDocuments[t.id] ?? []
          if (docs.length === 0) return null
          return (
            <div key={t.id} className="mb-4">
              <h3>{t.full_name} — Documents</h3>
              <table className="w-full text-sm">
                <thead><tr><th>Name</th><th>Category</th><th>Uploaded</th></tr></thead>
                <tbody>
                  {docs.map((d: any) => (
                    <tr key={d.id}><td>{d.name}</td><td>{d.category}</td><td>{formatDate(d.uploaded_at)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
        {(data.tenantDocuments['property'] ?? []).length > 0 && (
          <div>
            <h3>Property Documents</h3>
            <table className="w-full text-sm">
              <thead><tr><th>Name</th><th>Category</th><th>Uploaded</th></tr></thead>
              <tbody>
                {(data.tenantDocuments['property'] as any[]).map((d: any) => (
                  <tr key={d.id}><td>{d.name}</td><td>{d.category}</td><td>{formatDate(d.uploaded_at)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Agreement */}
      <div className="section">
        <h2>Tenancy Agreement</h2>
        {data.agreement ? (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Status: <Badge variant={data.agreement.status === 'signed' ? 'success' : 'warning'}>{data.agreement.status}</Badge>
            </p>
            <div className="border rounded p-4 text-sm text-gray-700 whitespace-pre-line">
              {(() => {
                try {
                  const content = data.agreement.merged_content_json
                  if (typeof content === 'string') return content
                  if (content?.content) {
                    return content.content.map((node: any) => node.text ?? '').join('\n')
                  }
                  return JSON.stringify(content, null, 2)
                } catch {
                  return 'Agreement content available in original format.'
                }
              })()}
            </div>
            {data.signatures.length > 0 && (
              <div className="mt-4">
                <h3>Signatures</h3>
                <div className="grid grid-cols-2 gap-4">
                  {data.signatures.map((s: any) => (
                    <div key={s.id} className="border rounded p-3 text-center">
                      <p className="text-xs text-gray-500">{s.signatory_name}</p>
                      <img src={s.signature_b64} alt="Signature" className="h-16 mx-auto my-2 object-contain" />
                      <p className="text-xs text-gray-400">{formatDate(s.signed_at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No agreement has been generated yet.</p>
        )}
      </div>
    </div>
  )
}
