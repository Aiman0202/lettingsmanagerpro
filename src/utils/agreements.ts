import { supabase } from '@/lib/supabase'
import { syncAttachmentsToAgreement } from '@/utils/agreement-attachments'
import { loadAgreementSettings, generateSettingsCSS } from '@/utils/agreement-settings'

// Default merge field replacements
function applyMergeFields(html: string, context: Record<string, string>): string {
  let result = html
  for (const [key, value] of Object.entries(context)) {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
    result = result.replace(regex, value || 'N/A')
  }
  return result
}

export async function generateAgreementForTenancy(tenancyId: string): Promise<string | null> {
  // Fetch tenancy with all related data
  const { data: tenancy } = await supabase
    .from('tenancies')
    .select(`
      id, reference_number, start_date, end_date, rent_amount, deposit_amount, deposit_scheme,
      property_id, council_id,
      properties(id, address, postcode, type, bedrooms, bathrooms, epc_rating),
      landlords(id, full_name, email, phone, address_line1, address_line2, city, postcode, bank_name, bank_sort_code, bank_account_number, bank_account_name),
      tenancy_tenants(tenant_id, is_lead, tenants(id, full_name, email, phone, dob, ni_number))
    `)
    .eq('id', tenancyId)
    .single()

  if (!tenancy) return null

  const tenancyAny = tenancy as any

  // Fetch default AST body
  const { data: defaultTemplate } = await supabase
    .from('agreement_defaults')
    .select('body_html')
    .eq('key', 'default_ast')
    .single()

  if (!defaultTemplate) {
    console.error('Default AST template not found in agreement_defaults')
    return null
  }

  // Fetch company settings
  const { data: companySettings } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .single()

  const company = (companySettings as any) ?? {}
  const property = tenancyAny.properties ?? {}
  const landlord = tenancyAny.landlords ?? {}

  // Fetch council data if council_id is set
  let council: any = {}
  if (tenancyAny.council_id) {
    const { data: councilData } = await supabase
      .from('local_authorities')
      .select('*')
      .eq('id', tenancyAny.council_id)
      .single()
    council = councilData ?? {}
  }

  const tenants = (tenancyAny.tenancy_tenants ?? [])
    .map((tt: any) => tt.tenants)
    .filter(Boolean)
  const tenantNames = tenants.map((t: any) => t?.full_name).filter(Boolean).join(', ')

  const landlordAddress = [
    landlord.address_line1, landlord.address_line2, landlord.city, landlord.postcode
  ].filter(Boolean).join(', ')

  const agencyAddress = [
    company.address_line1, company.address_line2, company.city, company.postcode
  ].filter(Boolean).join(', ')

  // Lead tenant details
  const leadTenant = tenants.find((t: any, i: number) =>
    (tenancyAny.tenancy_tenants ?? [])[i]?.is_lead
  ) ?? tenants[0]
  const leadTenantAny = leadTenant as any ?? {}

  // Rent due day from start_date
  const startDateObj = tenancyAny.start_date ? new Date(tenancyAny.start_date) : null
  const rentDueDay = startDateObj ? startDateObj.getDate().toString() : 'N/A'

  const mergeContext: Record<string, string> = {
    // Existing merge fields
    '{{tenancy_reference}}': tenancyAny.reference_number ?? 'N/A',
    '{{start_date}}': tenancyAny.start_date ? new Date(tenancyAny.start_date).toLocaleDateString('en-GB') : 'N/A',
    '{{end_date}}': tenancyAny.end_date ? new Date(tenancyAny.end_date).toLocaleDateString('en-GB') : 'N/A',
    '{{rent_amount}}': tenancyAny.rent_amount != null ? `£${Number(tenancyAny.rent_amount).toLocaleString()}` : 'N/A',
    '{{deposit_amount}}': tenancyAny.deposit_amount != null ? `£${Number(tenancyAny.deposit_amount).toLocaleString()}` : 'N/A',
    '{{deposit_scheme}}': tenancyAny.deposit_scheme ?? 'N/A',
    '{{property_address}}': property.address ?? 'N/A',
    '{{property_postcode}}': property.postcode ?? 'N/A',
    '{{property_type}}': property.type ?? 'N/A',
    '{{property_description}}': property.description ?? '',
    '{{property_bedrooms}}': property.bedrooms ? property.bedrooms.toString() : '',
    '{{property_bathrooms}}': property.bathrooms ? property.bathrooms.toString() : '',
    '{{property_epc_rating}}': property.epc_rating ?? '',
    '{{property_utility_note}}': property.utility_note ?? '',
    '{{property_inventory_note}}': property.inventory_note ?? '',
    '{{landlord_name}}': landlord.full_name ?? 'N/A',
    '{{landlord_address}}': landlordAddress || 'N/A',
    '{{landlord_email}}': landlord.email ?? 'N/A',
    '{{landlord_phone}}': landlord.phone ?? 'N/A',
    '{{tenant_name}}': tenantNames || 'N/A',
    '{{agency_name}}': company.company_name ?? 'N/A',
    '{{agency_address}}': agencyAddress || 'N/A',
    '{{agency_phone}}': company.phone ?? 'N/A',
    '{{agency_email}}': company.email ?? 'N/A',
    '{{agency_reg_number}}': company.company_registration_number ?? 'N/A',
    '{{agent_name}}': company.company_name ? `${company.company_name} (Agent)` : 'Letting Agent',
    '{{today_date}}': new Date().toLocaleDateString('en-GB'),

    // Tenant details (lead tenant)
    '{{tenant_dob}}': leadTenantAny?.dob ? new Date(leadTenantAny.dob).toLocaleDateString('en-GB') : '',
    '{{tenant_phone}}': leadTenantAny?.phone ?? '',
    '{{tenant_email}}': leadTenantAny?.email ?? '',
    '{{tenant_id_number}}': leadTenantAny?.ni_number ?? '',
    '{{lead_tenant_name}}': leadTenantAny?.full_name ?? tenantNames.split(',')[0] ?? 'N/A',

    // Tenancy description
    '{{tenancy_description}}': tenancyAny.description ?? '',

    // All tenant members (comma-separated list)
    '{{all_tenant_names}}': tenantNames,
    '{{all_tenant_emails}}': (tenants as any[]).map((t: any) => t.email).filter(Boolean).join(', '),
    '{{all_tenant_phones}}': (tenants as any[]).map((t: any) => t.phone).filter(Boolean).join(', '),

    // Rent details
    '{{rent_frequency}}': 'month',
    '{{rent_day}}': rentDueDay,
    '{{rent_due_day}}': rentDueDay,

    // Bank/payment details (from landlord's bank)
    '{{bank_name}}': landlord.bank_name ?? '',
    '{{bank_sort_code}}': landlord.bank_sort_code ?? '',
    '{{bank_account_number}}': landlord.bank_account_number ?? '',
    '{{payment_reference}}': tenancyAny.reference_number ?? '',

    // Agency extended details
    '{{agency_emergency_phone}}': company.phone ?? '',
    '{{agency_website}}': company.website ?? '',

    // Inventory (blank - to be filled per property)
    '{{inventory_living_room}}': '',
    '{{inventory_kitchen}}': '',
    '{{inventory_electrical_items}}': '',
    '{{inventory_bedroom_1}}': '',
    '{{inventory_bedroom_2}}': '',
    '{{inventory_bedroom_3}}': '',

    // Utilities (blank - to be filled per tenancy)
    '{{gas_meter_number}}': '',
    '{{electric_meter_number}}': '',
    '{{water_charges}}': '',
    '{{council_tax_band}}': '',

    // Parties & definitions
    '{{permitted_occupiers}}': '',
    '{{relevant_person_declaration}}': '',
    '{{relevant_person_name}}': '',
    '{{relevant_person_address}}': '',
    '{{relevant_person_phone}}': '',
    '{{relevant_person_email}}': '',
    '{{guarantor_name}}': '',
    '{{guarantor_address}}': '',
    '{{guarantor_phone}}': '',
    '{{guarantor_email}}': '',
    '{{principal_contact}}': company.company_name ? `${company.company_name} (Agent)` : 'The Landlord',

    // HMO details
    '{{hmo_status}}': '',
    '{{hmo_licence_status}}': '',
    '{{hmo_licence_details}}': '',
    '{{hmo_max_individuals}}': '',
    '{{hmo_max_families}}': '',

    // Council details
    '{{council_name}}': council.name ?? '',
    '{{council_address}}': [council.address_line1, council.address_line2, council.city, council.postcode].filter(Boolean).join(', ') ?? '',
    '{{council_phone}}': council.phone ?? '',
    '{{council_email}}': council.email ?? '',
    '{{council_website}}': council.website ?? '',
    '{{council_licence_type}}': council.licence_type ?? '',
    '{{council_reference}}': '',

    // Other
    '{{garden_maintenance}}': '',

    // Family members
    '{{family_member_1_name}}': '',
    '{{family_member_1_dob}}': '',
    '{{family_member_1_relation}}': '',
    '{{family_member_2_name}}': '',
    '{{family_member_2_dob}}': '',
    '{{family_member_2_relation}}': '',
    '{{family_member_3_name}}': '',
    '{{family_member_3_dob}}': '',
    '{{family_member_3_relation}}': '',

    // Individual tenant members (up to 5)
    '{{tenant_1_name}}': (tenants as any[])[0]?.full_name ?? '',
    '{{tenant_1_email}}': (tenants as any[])[0]?.email ?? '',
    '{{tenant_1_phone}}': (tenants as any[])[0]?.phone ?? '',
    '{{tenant_1_dob}}': (tenants as any[])[0]?.dob ? new Date((tenants as any[])[0].dob).toLocaleDateString('en-GB') : '',
    '{{tenant_2_name}}': (tenants as any[])[1]?.full_name ?? '',
    '{{tenant_2_email}}': (tenants as any[])[1]?.email ?? '',
    '{{tenant_2_phone}}': (tenants as any[])[1]?.phone ?? '',
    '{{tenant_2_dob}}': (tenants as any[])[1]?.dob ? new Date((tenants as any[])[1].dob).toLocaleDateString('en-GB') : '',
    '{{tenant_3_name}}': (tenants as any[])[2]?.full_name ?? '',
    '{{tenant_3_email}}': (tenants as any[])[2]?.email ?? '',
    '{{tenant_3_phone}}': (tenants as any[])[2]?.phone ?? '',
    '{{tenant_3_dob}}': (tenants as any[])[2]?.dob ? new Date((tenants as any[])[2].dob).toLocaleDateString('en-GB') : '',
    '{{tenant_4_name}}': (tenants as any[])[3]?.full_name ?? '',
    '{{tenant_4_email}}': (tenants as any[])[3]?.email ?? '',
    '{{tenant_4_phone}}': (tenants as any[])[3]?.phone ?? '',
    '{{tenant_4_dob}}': (tenants as any[])[3]?.dob ? new Date((tenants as any[])[3].dob).toLocaleDateString('en-GB') : '',
    '{{tenant_5_name}}': (tenants as any[])[4]?.full_name ?? '',
    '{{tenant_5_email}}': (tenants as any[])[4]?.email ?? '',
    '{{tenant_5_phone}}': (tenants as any[])[4]?.phone ?? '',
    '{{tenant_5_dob}}': (tenants as any[])[4]?.dob ? new Date((tenants as any[])[4].dob).toLocaleDateString('en-GB') : '',
  }

  // Build logo HTML if company has a logo
  const logoHtml = company.logo_storage_path
    ? `<div style="text-align: center; margin-bottom: 16px;"><img src="${company.logo_storage_path}" alt="Company Logo" style="max-height: 80px; max-width: 400px;" /></div>`
    : ''

  const bodyHtml = logoHtml + applyMergeFields((defaultTemplate as any).body_html, mergeContext)

  // Apply agreement layout settings from database
  const layoutSettings = await loadAgreementSettings()
  const settingsCSS = generateSettingsCSS(layoutSettings)
  const finalHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assured Periodic Tenancy Agreement</title>
  <style>${settingsCSS}</style>
</head>
<body>
  <div class="agreement-body">
    <div class="agreement-content">
      ${bodyHtml}
    </div>
  </div>
</body>
</html>
  `

  // Insert generated agreement
  const { data: agreement, error } = await (supabase.from('generated_agreements') as any)
    .insert({
      tenancy_id: tenancyId,
      template_id: null,
      merged_content_json: { body: finalHtml, context: mergeContext },
      merged_html: finalHtml,
      status: 'pending_signatures',
      council_submission_status: 'not_submitted',
    })
    .select('id')
    .single()

  if (error || !agreement) {
    console.error('Failed to generate agreement:', error)
    return null
  }

  const agreementId = (agreement as any).id

  // Auto-attach compliance certs, tenant ID docs, and references
  if (tenancyAny.property_id) {
    await syncAttachmentsToAgreement(agreementId, tenancyId, tenancyAny.property_id)
  }

  return agreementId
}

// Embed captured signatures into agreement HTML with witness details
export async function embedSignaturesIntoAgreement(agreementId: string) {
  const { data: agreement } = await supabase
    .from('generated_agreements')
    .select('merged_html')
    .eq('id', agreementId)
    .single()

  if (!agreement || !(agreement as any).merged_html) return

  const { data: signatures } = await supabase
    .from('agreement_signatures')
    .select('*')
    .eq('agreement_id', agreementId)
    .order('signed_at')

  let updatedHtml = (agreement as any).merged_html

  for (const sig of (signatures ?? []) as any[]) {
    const signedDate = new Date(sig.signed_at).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric'
    })

    // Build detailed signature block
    let sigHtml = `<div class="signature-block">`
    sigHtml += `<p style="font-weight: bold; margin-bottom: 4px;">${sig.signatory_name}</p>`
    sigHtml += `<p style="font-size: 9pt; color: #666; margin-bottom: 8px;">${sig.signatory_type === 'agent' ? 'Letting Agent' : 'Tenant'}</p>`
    sigHtml += `<img src="${sig.signature_image_base64}" class="signature-image" style="max-width: 220px; max-height: 70px; margin-bottom: 4px;" />`
    sigHtml += `<p style="font-size: 10pt;">Signed: ${signedDate}</p>`

    // Add witness details if present
    if (sig.witness_name) {
      sigHtml += `<div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e5e5;">`
      sigHtml += `<p style="font-size: 9pt; color: #555; font-style: italic; margin-bottom: 4px;">In the presence of:</p>`
      sigHtml += `<p style="font-size: 10pt;"><strong>Witness:</strong> ${sig.witness_name}</p>`
      if (sig.witness_address) {
        sigHtml += `<p style="font-size: 9pt; color: #666;">Address: ${sig.witness_address}</p>`
      }
      if (sig.witness_occupation) {
        sigHtml += `<p style="font-size: 9pt; color: #666;">Occupation: ${sig.witness_occupation}</p>`
      }
      if (sig.witness_signature_base64) {
        sigHtml += `<img src="${sig.witness_signature_base64}" class="signature-image witness-sig" style="max-width: 160px; max-height: 50px; margin-top: 4px;" />`
      }
      sigHtml += `</div>`
    }

    sigHtml += `</div>`

    updatedHtml = updatedHtml.replace(
      new RegExp(`\\[SIGNATURE:${sig.signatory_type}\\]`, 'g'),
      sigHtml
    )
  }

  await (supabase.from('generated_agreements') as any).update({
    merged_html: updatedHtml
  }).eq('id', agreementId)
}
