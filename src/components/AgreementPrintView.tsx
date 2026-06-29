import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { FileText } from 'lucide-react'
import { generateAgreementHTML } from '@/utils/agreement-html'
import { loadAgreementSettings } from '@/utils/agreement-settings'

interface AgreementPrintViewProps {
  agreementId: string
  showPreview?: boolean
}

export default function AgreementPrintView({ agreementId, showPreview = false }: AgreementPrintViewProps) {
  // Load layout settings - MUST be at top level before any returns
  const [layoutSettings, setLayoutSettings] = useState<any>(null)

  useEffect(() => {
    loadAgreementSettings().then(setLayoutSettings)
  }, [])

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
  const property = tenancy?.properties ?? {}
  const landlord = tenancy?.landlords ?? {}
  const tenants = tenancy?.tenancy_tenants?.map((tt: any) => tt.tenants).filter(Boolean) ?? []

  // Generate the SAME HTML used for print PDF
  const previewHTML = generateAgreementHTML({
    agreement,
    propertyAddress: property?.address,
    propertyPostcode: property?.postcode,
    landlordName: landlord?.full_name,
    tenantNames: tenants.map((t: any) => t?.full_name).filter(Boolean),
    startDate: tenancy?.start_date,
    endDate: tenancy?.end_date,
    rentAmount: tenancy?.rent_amount ? String(tenancy.rent_amount) : undefined,
    depositAmount: tenancy?.deposit_amount ? String(tenancy.deposit_amount) : undefined,
    complianceAttachments: [],
    signatures: agreement?.agreement_signatures || [],
    companyLogo: logoUrl,
    companyName: companySettings?.company_name || 'Property Management',
    settings: layoutSettings,
  })

  return (
    <div className="relative">
      {/* Preview iframe showing EXACT print output */}
      <iframe
        srcDoc={previewHTML}
        className="w-full"
        style={{ 
          height: showPreview ? 'calc(100vh - 200px)' : '100vh',
          border: 'none',
          background: 'white'
        }}
        title="Agreement Preview"
        sandbox="allow-same-origin"
      />
      
      {/* Status badges (preview mode only) */}
      {showPreview && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <Badge variant={agreement.status === 'signed' ? 'success' : 'warning'}>
            {agreement.status === 'signed' ? 'Signed' : agreement.status === 'pending_signatures' ? 'Awaiting Signatures' : agreement.status.replace(/_/g, ' ')}
          </Badge>
          {agreement.council_submission_status !== 'not_submitted' && (
            <Badge variant="secondary" className="ml-2">
              {agreement.council_submission_status.replace(/_/g, ' ')}
            </Badge>
          )}
          {agreement.signed_at && (
            <span className="ml-3 text-sm text-gray-500">
              Fully signed on {formatDate(agreement.signed_at)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
