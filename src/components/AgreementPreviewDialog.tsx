import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, X, Loader2 } from 'lucide-react'
import AgreementPrintView from './AgreementPrintView'
import { supabase } from '@/lib/supabase'
import { generateAgreementHTML } from '@/utils/agreement-html'
import { loadAgreementSettings } from '@/utils/agreement-settings'
import { useToast } from '@/contexts/ToastContext'
import { useState } from 'react'

interface AgreementPreviewDialogProps {
  agreementId: string
  open: boolean
  onClose: () => void
}

export default function AgreementPreviewDialog({ agreementId, open, onClose }: AgreementPreviewDialogProps) {
  const { error: showError } = useToast()
  const [printing, setPrinting] = useState(false)

  async function handlePrint() {
    setPrinting(true)
    
    try {
      // Fetch agreement data with all related info
      const { data: agreement, error: agreementError } = await supabase
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

      if (agreementError || !agreement) {
        console.error('Agreement fetch error:', agreementError)
        showError('Failed to load agreement', agreementError?.message || 'Could not fetch agreement details for printing')
        setPrinting(false)
        return
      }

      // Extract related data
      const tenancy = (agreement as any).tenancies
      const property = tenancy?.properties
      const landlord = tenancy?.landlords
      const tenancyTenants = tenancy?.tenancy_tenants || []
      const tenantNames = tenancyTenants.map((tt: any) => tt.tenants?.full_name).filter(Boolean)
      
      // Extract signatures
      const signatures = (agreement as any).agreement_signatures || []

      // Get company logo
      let logoUrl = null
      const { data: settings } = await supabase
        .from('company_settings')
        .select('company_name, logo_storage_path')
        .single()
      
      const settingsData = settings as any
      if (settingsData?.logo_storage_path) {
        const { data: signedUrlData } = await supabase.storage
          .from('company-assets')
          .createSignedUrl(settingsData.logo_storage_path, 3600)
        
        if (signedUrlData?.signedUrl) {
          logoUrl = signedUrlData.signedUrl
        }
      }

      // Load layout settings
      const layoutSettings = await loadAgreementSettings()

      // Generate HTML
      const html = generateAgreementHTML({
        agreement,
        propertyAddress: property?.address,
        propertyPostcode: property?.postcode,
        landlordName: landlord?.full_name,
        tenantNames,
        startDate: tenancy?.start_date,
        endDate: tenancy?.end_date,
        rentAmount: tenancy?.rent_amount,
        depositAmount: tenancy?.deposit_amount,
        complianceAttachments: [],
        signatures,
        companyLogo: logoUrl,
        companyName: settingsData?.company_name || 'Property Management',
        settings: layoutSettings,
      })

      // Open print window
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        showError('Print blocked', 'Please allow popups to print agreements')
        setPrinting(false)
        return
      }

      printWindow.document.write(html)
      printWindow.document.close()
      
      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.print()
        setPrinting(false)
      }, 250)
    } catch (err) {
      console.error('Print failed:', err)
      showError('Print failed', 'Could not generate agreement for printing')
      setPrinting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="agreement-print-dialog max-w-[95vw] w-full max-h-[92vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-200 shrink-0 print-hide">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Agreement Print Preview</DialogTitle>
            <div className="flex gap-2 items-center">
              <Button onClick={handlePrint} size="sm" className="gap-1.5" disabled={printing}>
                {printing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4" /> Print / Save PDF
                  </>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Preview area */}
          <div className="flex-1 overflow-y-auto bg-gray-100 py-6">
            <AgreementPrintView
              agreementId={agreementId}
              showPreview={true}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
