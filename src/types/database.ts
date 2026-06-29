// Database types generated from Supabase schema
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          role: string
          role_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: string
          role_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: string
          role_id?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      roles: {
        Row: { id: string; name: string; description: string | null; created_at: string }
        Insert: { id?: string; name: string; description?: string | null }
        Update: { name?: string; description?: string | null }
      }
      permissions: {
        Row: { id: string; role_id: string; resource: string; can_read: boolean; can_write: boolean; can_delete: boolean }
        Insert: { id?: string; role_id: string; resource: string; can_read?: boolean; can_write?: boolean; can_delete?: boolean }
        Update: { can_read?: boolean; can_write?: boolean; can_delete?: boolean }
      }
      properties: {
        Row: {
          id: string; address: string; postcode: string; type: string
          bedrooms: number | null; bathrooms: number | null
          status: 'available' | 'let' | 'maintenance' | 'inactive'
          landlord_id: string | null; description: string | null
          epc_rating: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; address: string; postcode: string; type: string
          bedrooms?: number | null; bathrooms?: number | null
          status?: 'available' | 'let' | 'maintenance' | 'inactive'
          landlord_id?: string | null; description?: string | null; epc_rating?: string | null
        }
        Update: {
          address?: string; postcode?: string; type?: string
          bedrooms?: number | null; bathrooms?: number | null
          status?: 'available' | 'let' | 'maintenance' | 'inactive'
          landlord_id?: string | null; description?: string | null; epc_rating?: string | null; updated_at?: string
        }
      }
      property_photos: {
        Row: { id: string; property_id: string; storage_path: string; is_primary: boolean; created_at: string }
        Insert: { id?: string; property_id: string; storage_path: string; is_primary?: boolean }
        Update: { is_primary?: boolean; storage_path?: string }
      }
      property_compliance: {
        Row: {
          id: string; property_id: string
          type: 'gas_safe' | 'eicr' | 'epc' | 'pat' | 'fire_risk' | 'legionella' | 'other'
          expiry_date: string; document_id: string | null; created_at: string; notes: string | null
        }
        Insert: {
          id?: string; property_id: string
          type: 'gas_safe' | 'eicr' | 'epc' | 'pat' | 'fire_risk' | 'legionella' | 'other'
          expiry_date: string; document_id?: string | null; notes?: string | null
        }
        Update: { type?: string; expiry_date?: string; document_id?: string | null; notes?: string | null }
      }
      landlords: {
        Row: {
          id: string; full_name: string; email: string; phone: string | null
          company_name: string | null; address: string | null
          bank_details: string | null
          bank_account_name: string | null; bank_account_number: string | null
          bank_sort_code: string | null; bank_name: string | null
          address_line1: string | null; address_line2: string | null
          city: string | null; postcode: string | null
          is_active: boolean; deactivated_at: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; full_name: string; email: string; phone?: string | null
          company_name?: string | null; address?: string | null; bank_details?: string | null
          bank_account_name?: string | null; bank_account_number?: string | null
          bank_sort_code?: string | null; bank_name?: string | null
          address_line1?: string | null; address_line2?: string | null
          city?: string | null; postcode?: string | null
          is_active?: boolean; deactivated_at?: string | null
        }
        Update: {
          full_name?: string; email?: string; phone?: string | null
          company_name?: string | null; address?: string | null; bank_details?: string | null
          bank_account_name?: string | null; bank_account_number?: string | null
          bank_sort_code?: string | null; bank_name?: string | null
          address_line1?: string | null; address_line2?: string | null
          city?: string | null; postcode?: string | null
          is_active?: boolean; deactivated_at?: string | null; updated_at?: string
        }
      }
      landlord_id_documents: {
        Row: {
          id: string; landlord_id: string; document_type: string; document_number: string | null
          issuing_country: string | null; issue_date: string | null; expiry_date: string | null
          file_path: string | null; notes: string | null
          created_at: string; created_by: string | null
        }
        Insert: {
          id?: string; landlord_id: string; document_type: string; document_number?: string | null
          issuing_country?: string | null; issue_date?: string | null; expiry_date?: string | null
          file_path?: string | null; notes?: string | null
        }
        Update: {
          document_type?: string; document_number?: string | null; issuing_country?: string | null
          issue_date?: string | null; expiry_date?: string | null; file_path?: string | null
          notes?: string | null
        }
      }
      tenants: {
        Row: {
          id: string; full_name: string; email: string; phone: string | null
          dob: string | null; ni_number: string | null; emergency_contact: string | null
          is_active: boolean; deactivated_at: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; full_name: string; email: string; phone?: string | null
          dob?: string | null; ni_number?: string | null; emergency_contact?: string | null
          is_active?: boolean; deactivated_at?: string | null
        }
        Update: {
          full_name?: string; email?: string; phone?: string | null
          dob?: string | null; ni_number?: string | null; emergency_contact?: string | null
          is_active?: boolean; deactivated_at?: string | null; updated_at?: string
        }
      }
      tenant_references: {
        Row: {
          id: string; tenant_id: string
          type: 'employer' | 'previous_landlord' | 'credit'
          status: 'pending' | 'passed' | 'failed' | 'in_progress'
          notes: string | null; created_at: string; updated_at: string
        }
        Insert: { id?: string; tenant_id: string; type: 'employer' | 'previous_landlord' | 'credit'; status?: 'pending' | 'passed' | 'failed' | 'in_progress'; notes?: string | null }
        Update: { status?: string; notes?: string | null; updated_at?: string }
      }
      tenancies: {
        Row: {
          id: string; property_id: string; landlord_id: string; council_id: string | null
          start_date: string; end_date: string
          rent_amount: number; deposit_amount: number
          deposit_scheme: string | null
          status: 'active' | 'expired' | 'ending_soon' | 'draft' | 'arrears' | 'payment_plan' | 'legal_proceedings' | 'terminated'
          agreement_template_id: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; property_id: string; landlord_id: string; council_id?: string | null
          start_date: string; end_date: string
          rent_amount: number; deposit_amount?: number
          deposit_scheme?: string | null; status?: 'active' | 'expired' | 'ending_soon' | 'draft' | 'arrears' | 'payment_plan' | 'legal_proceedings' | 'terminated'
          agreement_template_id?: string | null
        }
        Update: {
          property_id?: string; landlord_id?: string; council_id?: string | null
          start_date?: string; end_date?: string; rent_amount?: number; deposit_amount?: number
          deposit_scheme?: string | null; status?: string; updated_at?: string
        }
      }
      tenancy_tenants: {
        Row: { tenancy_id: string; tenant_id: string; is_lead: boolean }
        Insert: { tenancy_id: string; tenant_id: string; is_lead?: boolean }
        Update: { is_lead?: boolean }
      }
      tenancy_renewals: {
        Row: { id: string; tenancy_id: string; old_end_date: string; new_end_date: string; new_rent: number; created_at: string; notes: string | null }
        Insert: { id?: string; tenancy_id: string; old_end_date: string; new_end_date: string; new_rent: number; notes?: string | null }
        Update: { notes?: string | null }
      }
      maintenance_requests: {
        Row: {
          id: string; property_id: string; tenancy_id: string | null
          title: string; description: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          reported_by: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; property_id: string; tenancy_id?: string | null
          title: string; description?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          reported_by?: string | null
        }
        Update: { title?: string; description?: string | null; priority?: string; status?: string; updated_at?: string }
      }
      contractors: {
        Row: {
          id: string; name: string; trade: string; email: string | null
          phone: string | null; insurance_expiry: string | null; created_at: string; is_active: boolean
        }
        Insert: { id?: string; name: string; trade: string; email?: string | null; phone?: string | null; insurance_expiry?: string | null; is_active?: boolean }
        Update: { name?: string; trade?: string; email?: string | null; phone?: string | null; insurance_expiry?: string | null; is_active?: boolean }
      }
      maintenance_jobs: {
        Row: {
          id: string; request_id: string; contractor_id: string | null
          scheduled_date: string | null; completed_date: string | null
          cost: number | null; notes: string | null; created_at: string; status: string
        }
        Insert: { id?: string; request_id: string; contractor_id?: string | null; scheduled_date?: string | null; completed_date?: string | null; cost?: number | null; notes?: string | null; status?: string }
        Update: { contractor_id?: string | null; scheduled_date?: string | null; completed_date?: string | null; cost?: number | null; notes?: string | null; status?: string }
      }
      rent_transactions: {
        Row: {
          id: string; tenancy_id: string; amount: number
          due_date: string; paid_date: string | null
          payment_method: string | null
          status: 'pending' | 'paid' | 'overdue' | 'partial'
          created_at: string; notes: string | null
        }
        Insert: { id?: string; tenancy_id: string; amount: number; due_date: string; paid_date?: string | null; payment_method?: string | null; status?: 'pending' | 'paid' | 'overdue' | 'partial'; notes?: string | null }
        Update: { amount?: number; due_date?: string; paid_date?: string | null; payment_method?: string | null; status?: string; notes?: string | null }
      }
      landlord_statements: {
        Row: {
          id: string; landlord_id: string; period_start: string; period_end: string
          total_rent: number; fees_deducted: number; net_payout: number
          paid_at: string | null; created_at: string; pdf_path: string | null
        }
        Insert: { id?: string; landlord_id: string; period_start: string; period_end: string; total_rent: number; fees_deducted: number; net_payout: number; paid_at?: string | null; pdf_path?: string | null }
        Update: { paid_at?: string | null; pdf_path?: string | null }
      }
      expenses: {
        Row: { id: string; property_id: string; category: string; amount: number; date: string; description: string | null; receipt_document_id: string | null; created_by: string | null; created_at: string }
        Insert: { id?: string; property_id: string; category: string; amount: number; date: string; description?: string | null; receipt_document_id?: string | null; created_by?: string | null }
        Update: { category?: string; amount?: number; date?: string; description?: string | null; receipt_document_id?: string | null }
      }
      agency_fees: {
        Row: { id: string; tenancy_id: string; fee_type: string; amount: number; charged_at: string; description: string | null }
        Insert: { id?: string; tenancy_id: string; fee_type: string; amount: number; charged_at?: string; description?: string | null }
        Update: { fee_type?: string; amount?: number; description?: string | null }
      }
      documents: {
        Row: {
          id: string
          entity_type: 'property' | 'tenant' | 'landlord' | 'tenancy' | 'general'
          entity_id: string | null; name: string; storage_path: string
          category: string; uploaded_by: string | null; uploaded_at: string; size_bytes: number | null
        }
        Insert: {
          id?: string
          entity_type: 'property' | 'tenant' | 'landlord' | 'tenancy' | 'general'
          entity_id?: string | null; name: string; storage_path: string
          category?: string; uploaded_by?: string | null; size_bytes?: number | null
        }
        Update: { name?: string; category?: string }
      }
      agreement_templates: {
        Row: { id: string; name: string; content_json: Json; merge_fields_schema: Json | null; is_default: boolean; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; content_json: Json; merge_fields_schema?: Json | null; is_default?: boolean; created_by?: string | null }
        Update: { name?: string; content_json?: Json; merge_fields_schema?: Json | null; is_default?: boolean; updated_at?: string }
      }
      generated_agreements: {
        Row: {
          id: string; tenancy_id: string; template_id: string | null
          merged_content_json: Json; merged_html: string | null; pdf_storage_path: string | null
          status: 'draft' | 'pending_signatures' | 'signed'
          signed_at: string | null; created_at: string; updated_at: string
          council_submitted_at: string | null
          council_submission_status: 'not_submitted' | 'ready_to_submit' | 'submitted' | 'accepted' | 'rejected'
          council_reference: string | null
        }
        Insert: { id?: string; tenancy_id: string; template_id?: string | null; merged_content_json: Json; merged_html?: string | null; pdf_storage_path?: string | null; status?: 'draft' | 'pending_signatures' | 'signed'; signed_at?: string | null; council_submitted_at?: string | null; council_submission_status?: 'not_submitted' | 'ready_to_submit' | 'submitted' | 'accepted' | 'rejected'; council_reference?: string | null }
        Update: { merged_html?: string | null; pdf_storage_path?: string | null; status?: string; signed_at?: string | null; updated_at?: string; council_submitted_at?: string | null; council_submission_status?: string; council_reference?: string | null }
      }
      agreement_signatures: {
        Row: {
          id: string; agreement_id: string
          signatory_type: 'tenant' | 'agent'
          signatory_id: string | null; signatory_name: string
          signature_image_base64: string
          capture_method: 'topaz' | 'touch'
          ip_address: string | null; signed_at: string
          signed_by_user_id: string | null
        }
        Insert: {
          id?: string; agreement_id: string
          signatory_type: 'tenant' | 'agent'
          signatory_id?: string | null; signatory_name: string
          signature_image_base64: string; capture_method: 'topaz' | 'touch'
          ip_address?: string | null; signed_at?: string
          signed_by_user_id?: string | null
        }
        Update: Record<string, never>
      }
      company_settings: {
        Row: {
          id: string; company_name: string; logo_storage_path: string | null
          address: string | null; email: string | null; phone: string | null
          bank_details: string | null; vat_number: string | null
          company_registration_number: string | null; website: string | null
          address_line1: string | null; address_line2: string | null
          city: string | null; postcode: string | null
          company_description: string | null
          default_fee_percentage: number; updated_at: string
          emergency_phone: string | null
          insurance_provider: string | null; insurance_policy_number: string | null
          insurance_expiry_date: string | null
          deposit_scheme_name: string | null; deposit_scheme_address: string | null
          late_fee_policy: string | null; payment_terms: string | null
        }
        Insert: {
          id?: string; company_name: string; logo_storage_path?: string | null
          address?: string | null; email?: string | null; phone?: string | null
          bank_details?: string | null; vat_number?: string | null
          company_registration_number?: string | null; website?: string | null
          address_line1?: string | null; address_line2?: string | null
          city?: string | null; postcode?: string | null
          company_description?: string | null; default_fee_percentage?: number
          emergency_phone?: string | null
          insurance_provider?: string | null; insurance_policy_number?: string | null
          insurance_expiry_date?: string | null
          deposit_scheme_name?: string | null; deposit_scheme_address?: string | null
          late_fee_policy?: string | null; payment_terms?: string | null
        }
        Update: {
          company_name?: string; logo_storage_path?: string | null
          address?: string | null; email?: string | null; phone?: string | null
          bank_details?: string | null; vat_number?: string | null
          company_registration_number?: string | null; website?: string | null
          address_line1?: string | null; address_line2?: string | null
          city?: string | null; postcode?: string | null
          company_description?: string | null; default_fee_percentage?: number; updated_at?: string
          emergency_phone?: string | null
          insurance_provider?: string | null; insurance_policy_number?: string | null
          insurance_expiry_date?: string | null
          deposit_scheme_name?: string | null; deposit_scheme_address?: string | null
          late_fee_policy?: string | null; payment_terms?: string | null
        }
      }
      agreement_attachments: {
        Row: {
          id: string; agreement_id: string
          attachment_type: 'compliance_certificate' | 'tenant_id_document' | 'tenant_reference' | 'other'
          source_table: 'property_compliance' | 'tenant_id_documents' | 'tenant_references' | 'documents'
          source_id: string; document_id: string | null
          display_name: string; storage_path: string | null
          included_in_council_pack: boolean; created_at: string
        }
        Insert: {
          id?: string; agreement_id: string
          attachment_type: 'compliance_certificate' | 'tenant_id_document' | 'tenant_reference' | 'other'
          source_table: 'property_compliance' | 'tenant_id_documents' | 'tenant_references' | 'documents'
          source_id: string; document_id?: string | null
          display_name: string; storage_path?: string | null
          included_in_council_pack?: boolean
        }
        Update: {
          display_name?: string; storage_path?: string | null
          included_in_council_pack?: boolean
        }
      }
      agreement_defaults: {
        Row: { id: string; key: string; name: string; body_html: string; created_at: string; updated_at: string }
        Insert: { id?: string; key: string; name: string; body_html: string }
        Update: { name?: string; body_html?: string; updated_at?: string }
      }
      audit_log: {
        Row: { id: string; user_id: string | null; action: string; resource: string; resource_id: string | null; details: Json | null; created_at: string; ip_address: string | null }
        Insert: { id?: string; user_id?: string | null; action: string; resource: string; resource_id?: string | null; details?: Json | null; ip_address?: string | null }
        Update: Record<string, never>
      }
      notifications: {
        Row: { id: string; user_id: string; title: string; body: string; type: string; is_read: boolean; link: string | null; created_at: string }
        Insert: { id?: string; user_id: string; title: string; body: string; type: string; is_read?: boolean; link?: string | null }
        Update: { is_read?: boolean }
      }
      tenant_id_documents: {
        Row: {
          id: string; tenant_id: string; document_type: string; document_number: string | null
          issuing_country: string | null; issue_date: string | null; expiry_date: string | null
          file_path: string | null; file_url: string | null; notes: string | null
          created_at: string; created_by: string | null
        }
        Insert: {
          id?: string; tenant_id: string; document_type: string; document_number?: string | null
          issuing_country?: string | null; issue_date?: string | null; expiry_date?: string | null
          file_path?: string | null; file_url?: string | null; notes?: string | null
          created_at?: string; created_by?: string | null
        }
        Update: {
          document_type?: string; document_number?: string | null; issuing_country?: string | null
          issue_date?: string | null; expiry_date?: string | null; file_path?: string | null
          file_url?: string | null; notes?: string | null
        }
      }
      tenant_family_members: {
        Row: {
          id: string; tenant_id: string; full_name: string; relationship: string
          date_of_birth: string | null; phone: string | null; notes: string | null
          created_at: string
        }
        Insert: {
          id?: string; tenant_id: string; full_name: string; relationship: string
          date_of_birth?: string | null; phone?: string | null; notes?: string | null
        }
        Update: {
          full_name?: string; relationship?: string; date_of_birth?: string | null
          phone?: string | null; notes?: string | null
        }
      }
      property_home_safe_licences: {
        Row: {
          id: string; property_id: string
          status: 'certificates_pending' | 'applied' | 'under_review' | 'granted' | 'rejected' | 'expired'
          has_gas_safe: boolean; has_eicr: boolean; has_epc: boolean
          has_fire_risk_assessment: boolean; has_legionella_risk: boolean; has_smoke_co_alarms: boolean
          application_date: string | null; application_reference: string | null
          licence_number: string | null; licence_issue_date: string | null; licence_expiry_date: string | null
          rejection_reason: string | null; notes: string | null
          document_id: string | null
          created_at: string; updated_at: string; created_by: string | null
        }
        Insert: {
          id?: string; property_id: string
          status?: 'certificates_pending' | 'applied' | 'under_review' | 'granted' | 'rejected' | 'expired'
          has_gas_safe?: boolean; has_eicr?: boolean; has_epc?: boolean
          has_fire_risk_assessment?: boolean; has_legionella_risk?: boolean; has_smoke_co_alarms?: boolean
          application_date?: string | null; application_reference?: string | null
          licence_number?: string | null; licence_issue_date?: string | null; licence_expiry_date?: string | null
          rejection_reason?: string | null; notes?: string | null
          document_id?: string | null
        }
        Update: {
          status?: string; has_gas_safe?: boolean; has_eicr?: boolean; has_epc?: boolean
          has_fire_risk_assessment?: boolean; has_legionella_risk?: boolean; has_smoke_co_alarms?: boolean
          application_date?: string | null; application_reference?: string | null
          licence_number?: string | null; licence_issue_date?: string | null; licence_expiry_date?: string | null
          rejection_reason?: string | null; notes?: string | null; updated_at?: string
          document_id?: string | null
        }
      }
      tenancy_inspections: {
        Row: {
          id: string; tenancy_id: string; type: 'move_in' | 'move_out' | 'mid_tenancy'
          inspection_date: string; inspector_name: string; weather_conditions: string | null
          overall_condition: 'excellent' | 'good' | 'fair' | 'poor' | null
          general_notes: string | null; tenant_present: boolean
          tenant_signature_path: string | null; inspector_signature_path: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; tenancy_id: string; type: 'move_in' | 'move_out' | 'mid_tenancy'
          inspection_date: string; inspector_name: string; weather_conditions?: string | null
          overall_condition?: 'excellent' | 'good' | 'fair' | 'poor' | null
          general_notes?: string | null; tenant_present?: boolean
          tenant_signature_path?: string | null; inspector_signature_path?: string | null
        }
        Update: {
          type?: 'move_in' | 'move_out' | 'mid_tenancy'; inspection_date?: string
          inspector_name?: string; weather_conditions?: string | null
          overall_condition?: 'excellent' | 'good' | 'fair' | 'poor' | null
          general_notes?: string | null; tenant_present?: boolean
          tenant_signature_path?: string | null; inspector_signature_path?: string | null
          updated_at?: string
        }
      }
      inspection_rooms: {
        Row: {
          id: string; inspection_id: string; room_name: string; room_order: number
          cleanliness: 'excellent' | 'good' | 'fair' | 'poor' | null
          decoration: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | null
          condition_notes: string | null; created_at: string
        }
        Insert: {
          id?: string; inspection_id: string; room_name: string; room_order?: number
          cleanliness?: 'excellent' | 'good' | 'fair' | 'poor' | null
          decoration?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | null
          condition_notes?: string | null
        }
        Update: {
          room_name?: string; room_order?: number
          cleanliness?: 'excellent' | 'good' | 'fair' | 'poor' | null
          decoration?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | null
          condition_notes?: string | null
        }
      }
      inspection_room_items: {
        Row: {
          id: string; room_id: string; item_name: string
          condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | 'missing' | null
          condition_notes: string | null; move_in_condition: string | null
          move_out_condition: string | null; requires_action: boolean
          action_notes: string | null; created_at: string
        }
        Insert: {
          id?: string; room_id: string; item_name: string
          condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | 'missing' | null
          condition_notes?: string | null; move_in_condition?: string | null
          move_out_condition?: string | null; requires_action?: boolean
          action_notes?: string | null
        }
        Update: {
          item_name?: string; condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged' | 'missing' | null
          condition_notes?: string | null; move_in_condition?: string | null
          move_out_condition?: string | null; requires_action?: boolean
          action_notes?: string | null
        }
      }
      inspection_photos: {
        Row: {
          id: string; inspection_id: string; room_id: string | null
          item_id: string | null; storage_path: string; caption: string | null
          photo_order: number; created_at: string
        }
        Insert: {
          id?: string; inspection_id: string; room_id?: string | null
          item_id?: string | null; storage_path: string; caption?: string | null
          photo_order?: number
        }
        Update: {
          room_id?: string | null; item_id?: string | null; caption?: string | null
          photo_order?: number
        }
      }
      tenancy_terminations: {
        Row: {
          id: string; tenancy_id: string
          initiated_by: 'tenant' | 'landlord' | 'mutual'; reason: string
          reason_category: 'job_relocation' | 'financial' | 'property_issue' | 'landlord_request' | 'mutual_agreement' | 'breach_of_contract' | 'other'
          notice_date: string; notice_period_days: number; effective_date: string
          penalty_amount: number; penalty_reason: string | null
          deposit_deduction: number; deposit_deduction_reason: string | null
          final_rent_paid: boolean; final_rent_amount: number
          keys_returned: boolean; keys_returned_date: string | null
          property_vacant: boolean; property_vacant_date: string | null
          move_out_inspection_completed: boolean; termination_letter_sent: boolean
          notes: string | null; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; tenancy_id: string
          initiated_by: 'tenant' | 'landlord' | 'mutual'; reason: string
          reason_category: 'job_relocation' | 'financial' | 'property_issue' | 'landlord_request' | 'mutual_agreement' | 'breach_of_contract' | 'other'
          notice_date: string; notice_period_days?: number; effective_date: string
          penalty_amount?: number; penalty_reason?: string | null
          deposit_deduction?: number; deposit_deduction_reason?: string | null
          final_rent_paid?: boolean; final_rent_amount?: number
          keys_returned?: boolean; keys_returned_date?: string | null
          property_vacant?: boolean; property_vacant_date?: string | null
          move_out_inspection_completed?: boolean; termination_letter_sent?: boolean
          notes?: string | null
        }
        Update: {
          initiated_by?: 'tenant' | 'landlord' | 'mutual'; reason?: string
          reason_category?: 'job_relocation' | 'financial' | 'property_issue' | 'landlord_request' | 'mutual_agreement' | 'breach_of_contract' | 'other'
          notice_date?: string; notice_period_days?: number; effective_date?: string
          penalty_amount?: number; penalty_reason?: string | null
          deposit_deduction?: number; deposit_deduction_reason?: string | null
          final_rent_paid?: boolean; final_rent_amount?: number
          keys_returned?: boolean; keys_returned_date?: string | null
          property_vacant?: boolean; property_vacant_date?: string | null
          move_out_inspection_completed?: boolean; termination_letter_sent?: boolean
          notes?: string | null; updated_at?: string
        }
      }
      arrears_actions: {
        Row: {
          id: string; tenancy_id: string
          action_type: 'phone_call' | 'email' | 'letter' | 'sms' | 'visit' | 'section_8_notice' | 'section_21_notice' | 'payment_plan_agreed' | 'payment_received' | 'other'
          action_date: string; notes: string | null; follow_up_date: string | null
          created_by: string | null; created_at: string
        }
        Insert: {
          id?: string; tenancy_id: string
          action_type: 'phone_call' | 'email' | 'letter' | 'sms' | 'visit' | 'section_8_notice' | 'section_21_notice' | 'payment_plan_agreed' | 'payment_received' | 'other'
          action_date?: string; notes?: string | null; follow_up_date?: string | null
          created_by?: string | null
        }
        Update: {
          action_type?: string; action_date?: string; notes?: string | null
          follow_up_date?: string | null
        }
      }
      tenancy_checklists: {
        Row: {
          id: string; tenancy_id: string; type: 'move_in' | 'move_out'
          keys_handed_over: boolean; keys_count: number; keys_description: string | null
          meter_electric_reading: string | null; meter_gas_reading: string | null
          meter_water_reading: string | null; alarm_code: string | null
          parking_permits_handed: boolean; appliances_tested: boolean
          cleaning_completed: boolean; garden_condition: string | null
          notes: string | null; created_at: string
        }
        Insert: {
          id?: string; tenancy_id: string; type: 'move_in' | 'move_out'
          keys_handed_over?: boolean; keys_count?: number; keys_description?: string | null
          meter_electric_reading?: string | null; meter_gas_reading?: string | null
          meter_water_reading?: string | null; alarm_code?: string | null
          parking_permits_handed?: boolean; appliances_tested?: boolean
          cleaning_completed?: boolean; garden_condition?: string | null
          notes?: string | null
        }
        Update: {
          type?: 'move_in' | 'move_out'; keys_handed_over?: boolean; keys_count?: number
          keys_description?: string | null; meter_electric_reading?: string | null
          meter_gas_reading?: string | null; meter_water_reading?: string | null
          alarm_code?: string | null; parking_permits_handed?: boolean
          appliances_tested?: boolean; cleaning_completed?: boolean
          garden_condition?: string | null; notes?: string | null
        }
      }
      local_authorities: {
        Row: {
          id: string; name: string
          address_line1: string | null; address_line2: string | null
          city: string | null; postcode: string | null
          phone: string | null; email: string | null; website: string | null
          contact_person: string | null
          licensing_required: boolean; licence_type: string | null
          notes: string | null
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; name: string
          address_line1?: string | null; address_line2?: string | null
          city?: string | null; postcode?: string | null
          phone?: string | null; email?: string | null; website?: string | null
          contact_person?: string | null
          licensing_required?: boolean; licence_type?: string | null
          notes?: string | null
        }
        Update: {
          name?: string; address_line1?: string | null; address_line2?: string | null
          city?: string | null; postcode?: string | null
          phone?: string | null; email?: string | null; website?: string | null
          contact_person?: string | null
          licensing_required?: boolean; licence_type?: string | null
          notes?: string | null; updated_at?: string
        }
      }
      council_required_documents: {
        Row: {
          id: string; council_id: string
          document_type: string; is_required: boolean
          description: string | null; sort_order: number
        }
        Insert: {
          id?: string; council_id: string
          document_type: string; is_required?: boolean
          description?: string | null; sort_order?: number
        }
        Update: {
          document_type?: string; is_required?: boolean
          description?: string | null; sort_order?: number
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
