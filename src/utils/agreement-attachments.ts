import { supabase } from '@/lib/supabase'

export interface AgreementAttachmentInput {
  agreement_id: string
  attachment_type: 'compliance_certificate' | 'tenant_id_document' | 'tenant_reference' | 'other'
  source_table: 'property_compliance' | 'tenant_id_documents' | 'tenant_references' | 'documents'
  source_id: string
  document_id?: string | null
  display_name: string
  storage_path?: string | null
  included_in_council_pack?: boolean
}

export interface AgreementAttachment extends AgreementAttachmentInput {
  id: string
  created_at: string
}

// Fetch property compliance certificates with linked document info
export async function fetchComplianceAttachments(propertyId: string) {
  const { data: comps } = await supabase
    .from('property_compliance')
    .select('id, type, expiry_date, document_id')
    .eq('property_id', propertyId)

  if (!comps?.length) return []

  const docIds = (comps as any[]).map((c) => c.document_id).filter(Boolean)
  let docMap = new Map<string, any>()

  if (docIds.length) {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, name, storage_path')
      .in('id', docIds)
    ;(docs as any[] ?? []).forEach((d) => docMap.set(d.id, d))
  }

  return (comps as any[]).map((c) => ({
    attachment_type: 'compliance_certificate' as const,
    source_table: 'property_compliance' as const,
    source_id: c.id,
    document_id: c.document_id ?? null,
    display_name: `${c.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Certificate`,
    storage_path: docMap.get(c.document_id)?.storage_path ?? null,
    included_in_council_pack: true,
  }))
}

// Fetch tenant ID documents for all tenants in a tenancy
export async function fetchTenantIdAttachments(tenancyId: string) {
  const { data: ttData } = await supabase
    .from('tenancy_tenants')
    .select('tenant_id, tenants(full_name)')
    .eq('tenancy_id', tenancyId)

  const tenantIds = ((ttData as any[]) ?? []).map((tt) => tt.tenant_id).filter(Boolean)
  if (!tenantIds.length) return []

  const { data: idDocs } = await supabase
    .from('tenant_id_documents')
    .select('id, tenant_id, document_type, document_number, expiry_date, file_path')
    .in('tenant_id', tenantIds)

  const tenantMap = new Map(
    ((ttData as any[]) ?? []).map((tt) => [tt.tenant_id, (tt.tenants as any)?.full_name ?? 'Tenant'])
  )

  return ((idDocs as any[]) ?? []).map((doc) => ({
    attachment_type: 'tenant_id_document' as const,
    source_table: 'tenant_id_documents' as const,
    source_id: doc.id,
    document_id: null,
    display_name: `${tenantMap.get(doc.tenant_id) ?? 'Tenant'} — ${doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}${doc.document_number ? ` (${doc.document_number})` : ''}`,
    storage_path: doc.file_path ?? null,
    included_in_council_pack: true,
  }))
}

// Fetch tenant references (no document attachments in current schema, but listed for council pack)
export async function fetchTenantReferenceAttachments(tenancyId: string) {
  const { data: ttData } = await supabase
    .from('tenancy_tenants')
    .select('tenant_id, tenants(full_name)')
    .eq('tenancy_id', tenancyId)

  const tenantIds = ((ttData as any[]) ?? []).map((tt) => tt.tenant_id).filter(Boolean)
  if (!tenantIds.length) return []

  const { data: refs } = await supabase
    .from('tenant_references')
    .select('id, tenant_id, type, status')
    .in('tenant_id', tenantIds)

  const tenantMap = new Map(
    ((ttData as any[]) ?? []).map((tt) => [tt.tenant_id, (tt.tenants as any)?.full_name ?? 'Tenant'])
  )

  return ((refs as any[]) ?? []).map((ref) => ({
    attachment_type: 'tenant_reference' as const,
    source_table: 'tenant_references' as const,
    source_id: ref.id,
    document_id: null,
    display_name: `${tenantMap.get(ref.tenant_id) ?? 'Tenant'} — ${ref.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Reference (${ref.status})`,
    storage_path: null,
    included_in_council_pack: true,
  }))
}

// Sync all auto-discovered attachments into agreement_attachments table
export async function syncAttachmentsToAgreement(
  agreementId: string,
  tenancyId: string,
  propertyId: string
) {
  const [compliance, tenantIds, references] = await Promise.all([
    fetchComplianceAttachments(propertyId),
    fetchTenantIdAttachments(tenancyId),
    fetchTenantReferenceAttachments(tenancyId),
  ])

  const all = [...compliance, ...tenantIds, ...references]

  // Delete existing auto-synced attachments for this agreement to avoid duplicates
  await supabase.from('agreement_attachments').delete().eq('agreement_id', agreementId)

  if (!all.length) return []

  const rows = all.map((a) => ({ ...a, agreement_id: agreementId }))
  const { data, error } = await (supabase.from('agreement_attachments') as any).insert(rows).select()

  if (error) {
    console.error('Failed to sync agreement attachments:', error)
    return []
  }

  return (data as any[]) ?? []
}

// Fetch attachments already stored for an agreement
export async function fetchAgreementAttachments(agreementId: string) {
  const { data } = await supabase
    .from('agreement_attachments')
    .select('*')
    .eq('agreement_id', agreementId)
    .order('attachment_type')
  return (data as any[]) ?? []
}

// Generate a signed URL for viewing/downloading an attachment
export async function getAttachmentSignedUrl(
  storagePath: string | null,
  sourceTable: string = 'documents'
): Promise<string | null> {
  if (!storagePath) return null
  const bucket = sourceTable === 'tenant_id_documents' ? 'tenant-id-documents' : 'documents'
  const { data } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 300)
  return (data as any)?.signedUrl ?? null
}
