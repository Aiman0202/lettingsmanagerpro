import { supabase } from '@/lib/supabase'

export interface DossierData {
  property: any
  landlord: any
  tenants: any[]
  tenancy: any
  compliance: any[]
  tenantDocuments: Record<string, any[]>
  agreement: any | null
  signatures: any[]
  companySettings: any
}

export async function fetchDossierData(tenancyId: string): Promise<DossierData | null> {
  // Fetch tenancy with all relations
  const { data: tenancy } = await supabase
    .from('tenancies')
    .select(`
      *,
      properties(*),
      landlords(*)
    `)
    .eq('id', tenancyId)
    .single()

  if (!tenancy) return null

  const property = (tenancy as any).properties
  const landlord = (tenancy as any).landlords

  // Fetch tenants
  const { data: ttData } = await supabase
    .from('tenancy_tenants')
    .select('*, tenants(*)')
    .eq('tenancy_id', tenancyId)

  const tenants = ((ttData as any[]) ?? []).map((tt) => tt.tenants)

  // Fetch compliance
  const { data: compliance } = await supabase
    .from('property_compliance')
    .select('*')
    .eq('property_id', property.id)

  // Fetch tenant documents
  const tenantDocMap: Record<string, any[]> = {}
  for (const tenant of tenants) {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('entity_type', 'tenant')
      .eq('entity_id', tenant.id)
    tenantDocMap[tenant.id] = data ?? []
  }

  // Fetch property documents
  const { data: propertyDocs } = await supabase
    .from('documents')
    .select('*')
    .eq('entity_type', 'property')
    .eq('entity_id', property.id)

  if (propertyDocs && propertyDocs.length > 0) {
    tenantDocMap['property'] = propertyDocs
  }

  // Fetch generated agreement
  const { data: agreement } = await supabase
    .from('generated_agreements')
    .select('*')
    .eq('tenancy_id', tenancyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let signatures: any[] = []
  if (agreement) {
    const { data: sigs } = await supabase
      .from('agreement_signatures')
      .select('*')
      .eq('agreement_id', (agreement as any).id)
    signatures = sigs ?? []
  }

  // Fetch company settings
  const { data: companySettings } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .single()

  return {
    property,
    landlord,
    tenants,
    tenancy,
    compliance: compliance ?? [],
    tenantDocuments: tenantDocMap,
    agreement,
    signatures,
    companySettings,
  }
}
