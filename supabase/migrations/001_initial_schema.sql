-- ============================================================
-- LettingsPro — Consolidated Database Schema
-- Single migration replacing 001–021
-- Drop-then-create pattern for clean slate
-- ============================================================

-- ============================================================
-- SECTION 1: DROP ALL TABLES (cascade handles dependencies)
-- ============================================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS agreement_defaults CASCADE;
DROP TABLE IF EXISTS agreement_attachments CASCADE;
DROP TABLE IF EXISTS agreement_signatures CASCADE;
DROP TABLE IF EXISTS generated_agreements CASCADE;
DROP TABLE IF EXISTS template_versions CASCADE;
DROP TABLE IF EXISTS template_section_clauses CASCADE;
DROP TABLE IF EXISTS template_sections CASCADE;
DROP TABLE IF EXISTS agreement_clauses CASCADE;
DROP TABLE IF EXISTS agreement_templates CASCADE;
DROP TABLE IF EXISTS agency_fees CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS landlord_statements CASCADE;
DROP TABLE IF EXISTS rent_transactions CASCADE;
DROP TABLE IF EXISTS maintenance_jobs CASCADE;
DROP TABLE IF EXISTS contractors CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS arrears_actions CASCADE;
DROP TABLE IF EXISTS tenancy_amendments CASCADE;
DROP TABLE IF EXISTS tenancy_status_log CASCADE;
DROP TABLE IF EXISTS tenancy_checklists CASCADE;
DROP TABLE IF EXISTS tenancy_terminations CASCADE;
DROP TABLE IF EXISTS inspection_photos CASCADE;
DROP TABLE IF EXISTS inspection_room_items CASCADE;
DROP TABLE IF EXISTS inspection_rooms CASCADE;
DROP TABLE IF EXISTS tenancy_inspections CASCADE;
DROP TABLE IF EXISTS tenancy_renewals CASCADE;
DROP TABLE IF EXISTS tenancy_tenants CASCADE;
DROP TABLE IF EXISTS tenancies CASCADE;
DROP TABLE IF EXISTS property_tickets CASCADE;
DROP TABLE IF EXISTS property_home_safe_licences CASCADE;
DROP TABLE IF EXISTS property_compliance CASCADE;
DROP TABLE IF EXISTS property_photos CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS tenant_family_members CASCADE;
DROP TABLE IF EXISTS tenant_id_documents CASCADE;
DROP TABLE IF EXISTS tenant_references CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS landlord_id_documents CASCADE;
DROP TABLE IF EXISTS landlords CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

DROP FUNCTION IF EXISTS generate_next_reference(TEXT, TEXT);

-- ============================================================
-- SECTION 2: EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SECTION 3: CORE (Roles, Permissions, Users)
-- ============================================================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  resource TEXT NOT NULL,
  can_read BOOLEAN DEFAULT TRUE,
  can_write BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  UNIQUE(role_id, resource)
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'negotiator',
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 4: COMPANY SETTINGS
-- ============================================================

CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  logo_storage_path TEXT,
  address TEXT,
  email TEXT,
  phone TEXT,
  bank_details TEXT,
  vat_number TEXT,
  default_fee_percentage NUMERIC(5,2) DEFAULT 10.00,
  company_registration_number TEXT,
  website TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postcode TEXT,
  company_description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 5: LANDLORDS
-- ============================================================

CREATE TABLE landlords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  address TEXT,
  bank_details TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_sort_code TEXT,
  bank_name TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postcode TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE landlord_id_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('passport','driving_license','national_id','biometric_residence_permit','other')),
  document_number TEXT,
  issuing_country TEXT,
  issue_date DATE,
  expiry_date DATE,
  file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================================
-- SECTION 6: TENANTS
-- ============================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  dob DATE,
  ni_number TEXT,
  emergency_contact TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenant_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('employer','previous_landlord','credit')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','passed','failed','in_progress')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenant_id_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('passport','driving_license','right_to_rent','biometric_residence_permit','national_id','other')),
  document_number TEXT,
  issuing_country TEXT,
  issue_date DATE,
  expiry_date DATE,
  file_path TEXT,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE tenant_family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('spouse','partner','child','parent','sibling','other')),
  date_of_birth DATE,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 7: PROPERTIES
-- ============================================================

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'flat',
  bedrooms INTEGER,
  bathrooms INTEGER,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','let','unavailable','inactive')),
  landlord_id UUID REFERENCES landlords(id) ON DELETE SET NULL,
  description TEXT,
  epc_rating TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE property_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NOTE: documents table is defined in Section 8 so property_compliance
-- and property_home_safe_licences can FK to it; they follow below.

-- ============================================================
-- SECTION 8: DOCUMENTS
-- ============================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('property','tenant','landlord','tenancy','general')),
  entity_id UUID,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  size_bytes BIGINT
);

-- Property compliance (FK to both properties and documents)
CREATE TABLE property_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('gas_safe','eicr','epc','pat','fire_risk','legionella','other')),
  expiry_date DATE NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE property_home_safe_licences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'certificates_pending'
    CHECK (status IN ('certificates_pending','applied','under_review','granted','rejected','expired')),
  has_gas_safe BOOLEAN DEFAULT FALSE,
  has_eicr BOOLEAN DEFAULT FALSE,
  has_epc BOOLEAN DEFAULT FALSE,
  has_fire_risk_assessment BOOLEAN DEFAULT FALSE,
  has_legionella_risk BOOLEAN DEFAULT FALSE,
  has_smoke_co_alarms BOOLEAN DEFAULT FALSE,
  application_date DATE,
  application_reference TEXT,
  licence_number TEXT,
  licence_issue_date DATE,
  licence_expiry_date DATE,
  rejection_reason TEXT,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE property_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('enquiry','notice','issue','action_item')),
  subtype TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  due_date DATE,
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 9: TENANCIES
-- ============================================================

CREATE TABLE tenancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  landlord_id UUID REFERENCES landlords(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount NUMERIC(10,2) NOT NULL,
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  deposit_scheme TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','ending_soon','expired','ended','terminated')),
  agreement_template_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Only one active/ending_soon tenancy per property
CREATE UNIQUE INDEX uq_property_active_tenancy
  ON tenancies (property_id)
  WHERE status IN ('active', 'ending_soon');

CREATE TABLE tenancy_tenants (
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  is_lead BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (tenancy_id, tenant_id)
);

CREATE TABLE tenancy_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
  old_end_date DATE NOT NULL,
  new_end_date DATE NOT NULL,
  new_rent NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenancy_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id UUID NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('move_in','move_out','mid_tenancy')),
  inspection_date DATE NOT NULL,
  inspector_name TEXT NOT NULL,
  weather_conditions TEXT,
  overall_condition TEXT CHECK (overall_condition IN ('excellent','good','fair','poor')),
  general_notes TEXT,
  tenant_present BOOLEAN DEFAULT FALSE,
  tenant_signature_path TEXT,
  inspector_signature_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE inspection_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES tenancy_inspections(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  room_order INTEGER DEFAULT 0,
  cleanliness TEXT CHECK (cleanliness IN ('excellent','good','fair','poor')),
  decoration TEXT CHECK (decoration IN ('excellent','good','fair','poor','damaged')),
  condition_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE inspection_room_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES inspection_rooms(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  condition TEXT CHECK (condition IN ('excellent','good','fair','poor','damaged','missing')),
  condition_notes TEXT,
  move_in_condition TEXT,
  move_out_condition TEXT,
  requires_action BOOLEAN DEFAULT FALSE,
  action_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE inspection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES tenancy_inspections(id) ON DELETE CASCADE,
  room_id UUID REFERENCES inspection_rooms(id) ON DELETE SET NULL,
  item_id UUID REFERENCES inspection_room_items(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  photo_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenancy_terminations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id UUID NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  initiated_by TEXT NOT NULL CHECK (initiated_by IN ('tenant','landlord','mutual')),
  reason TEXT NOT NULL,
  reason_category TEXT NOT NULL CHECK (reason_category IN ('job_relocation','financial','property_issue','landlord_request','mutual_agreement','breach_of_contract','other')),
  notice_date DATE NOT NULL,
  notice_period_days INTEGER NOT NULL DEFAULT 30,
  effective_date DATE NOT NULL,
  penalty_amount NUMERIC(10,2) DEFAULT 0,
  penalty_reason TEXT,
  deposit_deduction NUMERIC(10,2) DEFAULT 0,
  deposit_deduction_reason TEXT,
  final_rent_paid BOOLEAN DEFAULT FALSE,
  final_rent_amount NUMERIC(10,2) DEFAULT 0,
  keys_returned BOOLEAN DEFAULT FALSE,
  keys_returned_date DATE,
  property_vacant BOOLEAN DEFAULT FALSE,
  property_vacant_date DATE,
  move_out_inspection_completed BOOLEAN DEFAULT FALSE,
  termination_letter_sent BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenancy_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id UUID NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('move_in','move_out')),
  keys_handed_over BOOLEAN DEFAULT FALSE,
  keys_count INTEGER DEFAULT 0,
  keys_description TEXT,
  meter_electric_reading TEXT,
  meter_gas_reading TEXT,
  meter_water_reading TEXT,
  alarm_code TEXT,
  parking_permits_handed BOOLEAN DEFAULT FALSE,
  appliances_tested BOOLEAN DEFAULT FALSE,
  cleaning_completed BOOLEAN DEFAULT FALSE,
  garden_condition TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenancy_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id UUID NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenancy_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id UUID NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  amendment_type TEXT NOT NULL CHECK (amendment_type IN ('rent_change','tenant_add','tenant_remove','other')),
  old_value TEXT,
  new_value TEXT NOT NULL,
  effective_date DATE NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE arrears_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'phone_call','email','letter','sms','visit',
    'section_8_notice','section_21_notice',
    'payment_plan_agreed','payment_received','other'
  )),
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  follow_up_date DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 10: MAINTENANCE
-- ============================================================

CREATE TABLE maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trade TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  insurance_expiry DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE maintenance_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  contractor_id UUID REFERENCES contractors(id) ON DELETE SET NULL,
  scheduled_date DATE,
  completed_date DATE,
  cost NUMERIC(10,2),
  notes TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 11: FINANCE
-- ============================================================

CREATE TABLE rent_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','partial')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE landlord_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES landlords(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_rent NUMERIC(10,2) NOT NULL,
  fees_deducted NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_payout NUMERIC(10,2) NOT NULL,
  paid_at TIMESTAMPTZ,
  pdf_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  receipt_document_id UUID,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agency_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  charged_at TIMESTAMPTZ DEFAULT now(),
  description TEXT
);

-- ============================================================
-- SECTION 12: AGREEMENTS
-- ============================================================

CREATE TABLE agreement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content_json JSONB NOT NULL DEFAULT '{}',
  merge_fields_schema JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agreement_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('terms_conditions','tenancy_requirements','deposit_financial','special_clauses')),
  title TEXT NOT NULL,
  content_html TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_builtin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE template_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES agreement_templates(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'header','parties','property_details','financial_terms',
    'tenant_obligations','landlord_obligations','requirements',
    'special_clauses','signatures','footer'
  )),
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT FALSE,
  condition_expression JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE template_section_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES template_sections(id) ON DELETE CASCADE,
  clause_id UUID NOT NULL REFERENCES agreement_clauses(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  condition_expression JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(section_id, clause_id)
);

CREATE TABLE template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES agreement_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  change_summary TEXT,
  content_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(template_id, version_number)
);

CREATE TABLE generated_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
  template_id UUID REFERENCES agreement_templates(id) ON DELETE SET NULL,
  merged_content_json JSONB NOT NULL DEFAULT '{}',
  merged_html TEXT,
  pdf_storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_signatures','signed')),
  signed_at TIMESTAMPTZ,
  council_submitted_at TIMESTAMPTZ,
  council_submission_status TEXT DEFAULT 'not_submitted'
    CHECK (council_submission_status IN ('not_submitted','ready_to_submit','submitted','accepted','rejected')),
  council_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agreement_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES generated_agreements(id) ON DELETE CASCADE,
  signatory_type TEXT NOT NULL CHECK (signatory_type IN ('tenant','agent')),
  signatory_id UUID,
  signatory_name TEXT NOT NULL,
  signature_image_base64 TEXT NOT NULL,
  capture_method TEXT NOT NULL CHECK (capture_method IN ('topaz','touch')),
  ip_address TEXT,
  signed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  signed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agreement_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES generated_agreements(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('compliance_certificate','tenant_id_document','tenant_reference','other')),
  source_table TEXT NOT NULL CHECK (source_table IN ('property_compliance','tenant_id_documents','tenant_references','documents')),
  source_id UUID NOT NULL,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  storage_path TEXT,
  included_in_council_pack BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agreement_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  body_html TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 13: SYSTEM
-- ============================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 14: FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION generate_next_reference(prefix TEXT, tbl TEXT)
RETURNS TEXT AS $$
DECLARE
  max_num INTEGER;
  next_ref TEXT;
BEGIN
  EXECUTE format(
    'SELECT COALESCE(MAX(NULLIF(regexp_replace(reference_number, ''^%s-'', ''''), '''')::INTEGER), 0) FROM %I',
    prefix, tbl
  ) INTO max_num;
  next_ref := prefix || '-' || LPAD((max_num + 1)::TEXT, 4, '0');
  RETURN next_ref;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SECTION 15: INDEXES
-- ============================================================

-- Properties
CREATE INDEX idx_properties_ref ON properties(reference_number);
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_properties_status ON properties(status);

-- Landlords
CREATE INDEX idx_landlords_is_active ON landlords(is_active);
CREATE INDEX idx_landlord_id_docs_landlord ON landlord_id_documents(landlord_id);

-- Tenants
CREATE INDEX idx_tenants_is_active ON tenants(is_active);

-- Property related
CREATE INDEX idx_property_photos_property ON property_photos(property_id);
CREATE INDEX idx_property_compliance_property ON property_compliance(property_id);
CREATE INDEX idx_home_safe_licences_property ON property_home_safe_licences(property_id);
CREATE INDEX idx_home_safe_licences_status ON property_home_safe_licences(status);
CREATE INDEX idx_home_safe_licences_document ON property_home_safe_licences(document_id);
CREATE INDEX idx_property_tickets_property ON property_tickets(property_id);
CREATE INDEX idx_property_tickets_status ON property_tickets(status);
CREATE INDEX idx_property_tickets_type ON property_tickets(type);
CREATE INDEX idx_property_tickets_due ON property_tickets(due_date);

-- Tenancies
CREATE INDEX idx_tenancies_ref ON tenancies(reference_number);
CREATE INDEX idx_tenancies_property ON tenancies(property_id);
CREATE INDEX idx_tenancies_status ON tenancies(status);

-- Tenancy children
CREATE INDEX idx_inspections_tenancy ON tenancy_inspections(tenancy_id);
CREATE INDEX idx_inspections_type ON tenancy_inspections(type);
CREATE INDEX idx_inspections_date ON tenancy_inspections(inspection_date);
CREATE INDEX idx_inspection_photos_inspection ON inspection_photos(inspection_id);
CREATE INDEX idx_terminations_tenancy ON tenancy_terminations(tenancy_id);
CREATE INDEX idx_checklists_tenancy ON tenancy_checklists(tenancy_id);
CREATE INDEX idx_status_log_tenancy ON tenancy_status_log(tenancy_id);
CREATE INDEX idx_status_log_created ON tenancy_status_log(created_at);
CREATE INDEX idx_amendments_tenancy ON tenancy_amendments(tenancy_id);
CREATE INDEX idx_amendments_date ON tenancy_amendments(effective_date);
CREATE INDEX idx_arrears_actions_tenancy ON arrears_actions(tenancy_id);
CREATE INDEX idx_arrears_actions_follow_up ON arrears_actions(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Maintenance
CREATE INDEX idx_maintenance_property ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_jobs_request ON maintenance_jobs(request_id);

-- Agreements
CREATE INDEX idx_clauses_category ON agreement_clauses(category);
CREATE INDEX idx_clauses_sort ON agreement_clauses(sort_order);
CREATE INDEX idx_template_sections_template ON template_sections(template_id);
CREATE INDEX idx_template_sections_sort ON template_sections(template_id, sort_order);
CREATE INDEX idx_section_clauses_section ON template_section_clauses(section_id);
CREATE INDEX idx_section_clauses_clause ON template_section_clauses(clause_id);
CREATE INDEX idx_template_versions_template ON template_versions(template_id);
CREATE INDEX idx_generated_agreements_tenancy ON generated_agreements(tenancy_id);
CREATE INDEX idx_agreement_signatures_agreement ON agreement_signatures(agreement_id);
CREATE INDEX idx_agreement_attachments_agreement ON agreement_attachments(agreement_id);
CREATE INDEX idx_agreement_attachments_source ON agreement_attachments(source_table, source_id);

-- ============================================================
-- SECTION 16: ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all application tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'roles','permissions','users','company_settings',
      'landlords','landlord_id_documents',
      'tenants','tenant_references','tenant_id_documents','tenant_family_members',
      'properties','property_photos','property_compliance',
      'property_home_safe_licences','property_tickets',
      'documents',
      'tenancies','tenancy_tenants','tenancy_renewals',
      'tenancy_inspections','inspection_rooms','inspection_room_items','inspection_photos',
      'tenancy_terminations','tenancy_checklists','tenancy_status_log','tenancy_amendments',
      'arrears_actions',
      'maintenance_requests','contractors','maintenance_jobs',
      'rent_transactions','landlord_statements','expenses','agency_fees',
      'agreement_templates','agreement_clauses',
      'template_sections','template_section_clauses','template_versions',
      'generated_agreements','agreement_signatures','agreement_attachments','agreement_defaults',
      'audit_log','notifications'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      'Authenticated access on ' || tbl,
      tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- SECTION 17: STORAGE BUCKETS + POLICIES
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('property-photos', 'property-photos', false),
  ('tenant-id-documents', 'tenant-id-documents', false),
  ('landlord-id-documents', 'landlord-id-documents', false),
  ('company-assets', 'company-assets', true),
  ('inspection-photos', 'inspection-photos', false),
  ('documents', 'documents', false),
  ('agreements', 'agreements', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies per bucket
DO $$
DECLARE
  b TEXT;
BEGIN
  FOR b IN
    SELECT unnest(ARRAY[
      'property-photos','tenant-id-documents','landlord-id-documents',
      'inspection-photos','documents','agreements'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR ALL TO authenticated USING (bucket_id = %L) WITH CHECK (bucket_id = %L)',
      'Auth access on ' || b, b, b
    );
  END LOOP;
END $$;

-- Company assets: public read, authenticated write
CREATE POLICY "Public read on company-assets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'company-assets');
CREATE POLICY "Auth write on company-assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-assets');
CREATE POLICY "Auth delete on company-assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-assets');

-- ============================================================
-- SECTION 18: SEED — Default Roles
-- ============================================================

INSERT INTO roles (name, description) VALUES
  ('admin', 'Full access to all modules'),
  ('manager', 'Access to most modules, no system settings'),
  ('negotiator', 'Properties, tenants, landlords, tenancies'),
  ('accounts', 'Finance and documents only')
ON CONFLICT (name) DO NOTHING;
