import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { FileText, Paperclip, AlertCircle } from 'lucide-react'
import { fetchAgreementAttachments, getAttachmentSignedUrl } from '@/utils/agreement-attachments'
import type { PrintOptions } from '@/utils/print-options'
import { printOptionsToCssVars } from '@/utils/print-options'
import DOMPurify from 'dompurify'

interface AgreementPrintViewProps {
  agreementId: string
  showPreview?: boolean
  printOptions?: PrintOptions
}

export default function AgreementPrintView({ agreementId, showPreview = false, printOptions }: AgreementPrintViewProps) {
  const { data: agreement, isLoading } = useQuery({
    queryKey: ['agreement-print', agreementId],
    queryFn: async () => {
      const { data } = await supabase
        .from('generated_agreements')
        .select(`
          *,
          tenancies(
            start_date,
            end_date,
            rent_amount,
            deposit_amount,
            deposit_scheme,
            reference_number,
            properties(id, address, postcode, type, bedrooms, bathrooms, epc_rating),
            landlords(id, full_name, email, phone, address_line1, address_line2, city, postcode),
            tenancy_tenants(
              tenant_id,
              is_lead,
              tenants(id, full_name, email, phone)
            )
          ),
          agreement_signatures(
            id,
            signatory_type,
            signatory_name,
            signature_image_base64,
            signed_at
          )
        `)
        .eq('id', agreementId)
        .single()
      return data as any
    },
  })

  const { data: companySettings } = useQuery({
    queryKey: ['company-settings-print'],
    queryFn: async () => {
      const { data } = await supabase.from('company_settings').select('*').limit(1).single()
      return data as any
    },
  })

  const { data: logoUrl } = useQuery({
    queryKey: ['company-logo', companySettings?.logo_storage_path],
    queryFn: async () => {
      if (!companySettings?.logo_storage_path) return null
      const { data } = await supabase.storage
        .from('company-assets')
        .createSignedUrl(companySettings.logo_storage_path, 3600)
      return data?.signedUrl ?? null
    },
    enabled: !!companySettings?.logo_storage_path,
  })

  const { data: attachments } = useQuery({
    queryKey: ['agreement-attachments', agreementId],
    queryFn: () => fetchAgreementAttachments(agreementId),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400">
        <FileText className="h-6 w-6 mr-2 animate-pulse" />
        Loading agreement...
      </div>
    )
  }

  if (!agreement) {
    return (
      <div className="text-center p-12 text-gray-400">
        Agreement not found
      </div>
    )
  }

  const tenancy = agreement.tenancies
  const company = companySettings
  const property = tenancy?.properties ?? {}
  const landlord = tenancy?.landlords ?? {}

  const tenants = tenancy?.tenancy_tenants?.map((tt: any) => tt.tenants).filter(Boolean) ?? []
  const tenantNames = tenants.map((t: any) => t?.full_name).filter(Boolean)
  const landlordName = landlord?.full_name ?? 'Landlord'
  const propertyAddress = property?.address ?? 'Property'
  const propertyPostcode = property?.postcode ?? ''
  const startDate = tenancy?.start_date ? formatDate(tenancy.start_date) : ''
  const endDate = tenancy?.end_date ? formatDate(tenancy.end_date) : ''
  const rentAmount = tenancy?.rent_amount ? `£${Number(tenancy.rent_amount).toLocaleString()}` : ''
  const depositAmount = tenancy?.deposit_amount ? `£${Number(tenancy.deposit_amount).toLocaleString()}` : ''
  const tenancyRef = tenancy?.reference_number ?? ''

  const agencyAddress = [
    company?.address_line1, company?.address_line2, company?.city, company?.postcode
  ].filter(Boolean).join(', ')

  const complianceAttachments = (attachments ?? []).filter((a: any) => a.attachment_type === 'compliance_certificate')
  const tenantIdAttachments = (attachments ?? []).filter((a: any) => a.attachment_type === 'tenant_id_document')
  const referenceAttachments = (attachments ?? []).filter((a: any) => a.attachment_type === 'tenant_reference')

  async function openAttachment(attachment: any) {
    const url = await getAttachmentSignedUrl(attachment.storage_path, attachment.source_table)
    if (url) window.open(url, '_blank')
  }

  const defaultHeaderText = `${company?.company_name ?? 'Letting Agency'} | ${propertyAddress} | Ref: ${tenancyRef || agreementId?.slice(0, 8)}`
  const defaultFooterText = `Page | ${company?.company_name ?? ''}`
  const headerText = printOptions?.headerText || defaultHeaderText
  const footerText = printOptions?.footerText || defaultFooterText
  const pageNumbering = printOptions?.pageNumbering ?? 'arabic'
  const cssVars = printOptions ? printOptionsToCssVars(printOptions) : {}

  return (
    <div
      className={showPreview ? 'agreement-preview-screen' : 'agreement-print'}
      data-page-numbering={pageNumbering}
      style={cssVars}
    >
      {!showPreview && (
        <>
          <div className="agreement-header">
            {headerText}
          </div>
          <div className="agreement-footer">
            Page <span className="page-number" /> | {footerText.replace('Page | ', '')}
          </div>
        </>
      )}

      {/* Cover */}
      <div className="agreement-cover">
        {logoUrl ? (
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <img src={logoUrl} alt="Company logo" style={{ maxHeight: '90px', maxWidth: '360px' }} />
          </div>
        ) : (
          company?.company_name && (
            <p style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '4px' }}>{company.company_name}</p>
          )
        )}
        {agencyAddress && (
          <p style={{ fontSize: '9pt', color: '#666', marginBottom: '4px' }}>
            {agencyAddress}
            {company?.phone ? ` | Tel: ${company.phone}` : ''}
            {company?.email ? ` | Email: ${company.email}` : ''}
          </p>
        )}
        {company?.company_registration_number && (
          <p style={{ fontSize: '8pt', color: '#999', marginBottom: '8px' }}>
            Company Reg: {company.company_registration_number}
          </p>
        )}

        <hr style={{ border: 'none', borderTop: '2px solid #999', margin: '16px 0' }} />

        <h1>ASSURED SHORTHOLD TENANCY AGREEMENT</h1>
        {tenancyRef && (
          <p style={{ fontSize: '10pt', color: '#666', marginBottom: '12px' }}>
            Reference: <strong>{tenancyRef}</strong>
          </p>
        )}

        <hr style={{ border: 'none', borderTop: '2px solid #999', margin: '12px 0' }} />

        <table className="agreement-details">
          <tbody>
            <tr><td>Property:</td><td>{propertyAddress}{propertyPostcode ? `, ${propertyPostcode}` : ''}</td></tr>
            <tr><td>Landlord:</td><td>{landlordName}</td></tr>
            <tr><td>Tenant(s):</td><td>{tenantNames.length > 0 ? tenantNames.join(', ') : 'Tenant(s)'}</td></tr>
            <tr><td>Term:</td><td>{startDate} to {endDate}</td></tr>
            <tr><td>Rent:</td><td>{rentAmount} per calendar month</td></tr>
            <tr><td>Deposit:</td><td>{depositAmount}</td></tr>
            <tr><td>Date of Agreement:</td><td>{formatDate(agreement.created_at)}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Agreement body — full comprehensive template from merged_html */}
      {agreement.merged_html ? (
        <div 
          className="agreement-content" 
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(agreement.merged_html) }} 
        />
      ) : (
        <div className="text-center p-12 text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold mb-2">No Agreement Content</h3>
          <p className="text-sm">This agreement has not been generated yet. Please generate the agreement from the tenancy details page first.</p>
        </div>
      )}

      {/* Appendix A: Compliance Certificates */}
      {(printOptions?.appendices.compliance ?? true) && (complianceAttachments.length > 0 || showPreview) && (
        <div className="appendices-section" style={{ pageBreakBefore: 'always' }}>
          <h2>
            <Paperclip className="h-4 w-4" style={{ display: 'inline', marginRight: '6px' }} />
            Appendix A: Property Compliance Certificates
          </h2>
          {complianceAttachments.length > 0 ? (
            <>
              <p style={{ fontSize: '10pt', color: '#666', marginBottom: '12px' }}>
                The following certificates are held for the property at {propertyAddress}{propertyPostcode ? `, ${propertyPostcode}` : ''}:
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                    <th style={{ textAlign: 'left', padding: '6px 10px' }}>Certificate</th>
                    <th style={{ textAlign: 'left', padding: '6px 10px' }}>Document</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceAttachments.map((c: any) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '6px 10px' }}>{c.display_name}</td>
                      <td style={{ padding: '6px 10px', color: '#2563eb', cursor: 'pointer' }} onClick={() => openAttachment(c)}>
                        {c.storage_path ? 'View attached document' : 'Not attached'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p style={{ fontSize: '10pt', color: '#666' }}>
              <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
              No compliance certificates are currently linked to this agreement.
            </p>
          )}
        </div>
      )}

      {/* Appendix B: Tenant ID Documents */}
      {(printOptions?.appendices.tenantId ?? true) && (tenantIdAttachments.length > 0 || showPreview) && (
        <div className="appendices-section" style={{ pageBreakBefore: 'always' }}>
          <h2>
            <Paperclip className="h-4 w-4" style={{ display: 'inline', marginRight: '6px' }} />
            Appendix B: Tenant Identification Documents
          </h2>
          {tenantIdAttachments.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                  <th style={{ textAlign: 'left', padding: '6px 10px' }}>Document</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px' }}>Attachment</th>
                </tr>
              </thead>
              <tbody>
                {tenantIdAttachments.map((c: any) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '6px 10px' }}>{c.display_name}</td>
                    <td style={{ padding: '6px 10px', color: '#2563eb', cursor: 'pointer' }} onClick={() => openAttachment(c)}>
                      {c.storage_path ? 'View document' : 'Not attached'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '10pt', color: '#666' }}>
              <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
              No tenant ID documents are currently linked to this agreement.
            </p>
          )}
        </div>
      )}

      {/* Appendix C: Tenant References */}
      {(printOptions?.appendices.references ?? true) && (referenceAttachments.length > 0 || showPreview) && (
        <div className="appendices-section" style={{ pageBreakBefore: 'always' }}>
          <h2>
            <Paperclip className="h-4 w-4" style={{ display: 'inline', marginRight: '6px' }} />
            Appendix C: Tenant References
          </h2>
          {referenceAttachments.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                  <th style={{ textAlign: 'left', padding: '6px 10px' }}>Reference</th>
                  <th style={{ textAlign: 'left', padding: '6px 10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {referenceAttachments.map((c: any) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '6px 10px' }}>{c.display_name}</td>
                    <td style={{ padding: '6px 10px' }}>Recorded</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '10pt', color: '#666' }}>
              <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
              No tenant references are currently linked to this agreement.
            </p>
          )}
        </div>
      )}

      {/* Appendix D: Signature Verification Log */}
      {(printOptions?.appendices.signatureLog ?? true) && agreement.agreement_signatures && agreement.agreement_signatures.length > 0 && (
        <div className="appendices-section" style={{ pageBreakBefore: 'always' }}>
          <h2>
            Appendix D: Signature Verification Log
          </h2>
          <p style={{ fontSize: '10pt', color: '#666', marginBottom: '12px' }}>
            All signatures were captured electronically and are recorded below for verification purposes.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e5e5', background: '#f9f9f9' }}>
                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Signatory</th>
                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Signed Date</th>
                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Method</th>
                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Witness</th>
                <th style={{ textAlign: 'left', padding: '6px 10px' }}>Witness Address</th>
              </tr>
            </thead>
            <tbody>
              {agreement.agreement_signatures.map((sig: any) => (
                <tr key={sig.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '6px 10px' }}>{sig.signatory_name}</td>
                  <td style={{ padding: '6px 10px' }}>{sig.signatory_type === 'agent' ? 'Letting Agent' : 'Tenant'}</td>
                  <td style={{ padding: '6px 10px' }}>{formatDate(sig.signed_at)}</td>
                  <td style={{ padding: '6px 10px' }}>{sig.capture_method === 'topaz' ? 'Topaz Pad' : 'Touch/Mouse'}</td>
                  <td style={{ padding: '6px 10px' }}>{sig.witness_name ?? '—'}</td>
                  <td style={{ padding: '6px 10px' }}>{sig.witness_address ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPreview && (
        <div className="mt-8 pt-4 border-t border-gray-300 no-print">
          <Badge variant={agreement.status === 'signed' ? 'success' : 'warning'}>
            {agreement.status === 'signed' ? 'Signed' : agreement.status === 'pending_signatures' ? 'Awaiting Signatures' : agreement.status.replace(/_/g, ' ')}
          </Badge>
          {agreement.council_submission_status !== 'not_submitted' && (
            <Badge variant="secondary" className="ml-2">{agreement.council_submission_status.replace(/_/g, ' ')}</Badge>
          )}
          {agreement.signed_at && (
            <span className="ml-3 text-sm text-gray-500">Fully signed on {formatDate(agreement.signed_at)}</span>
          )}
        </div>
      )}
    </div>
  )
}
