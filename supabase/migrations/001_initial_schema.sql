-- ============================================================
-- LettingsPro â€” Consolidated Database Schema
-- Single idempotent migration (drop-then-create)
-- ============================================================

-- ============================================================
-- SECTION 1: DROP ALL TABLES (cascade handles dependencies)
-- ============================================================
DROP TABLE IF EXISTS sticky_notes CASCADE;
DROP TABLE IF EXISTS tenant_statements CASCADE;
DROP TABLE IF EXISTS council_required_documents CASCADE;
DROP TABLE IF EXISTS local_authorities CASCADE;
DROP TABLE IF EXISTS property_inventory_items CASCADE;
DROP TABLE IF EXISTS property_key_inventory CASCADE;
DROP TABLE IF EXISTS property_meter_readings CASCADE;
DROP TABLE IF EXISTS property_readiness_checklist CASCADE;
DROP TABLE IF EXISTS agreement_layout_settings CASCADE;
DROP TABLE IF EXISTS property_rooms CASCADE;
DROP TABLE IF EXISTS property_viewings CASCADE;
DROP TABLE IF EXISTS tenant_communications CASCADE;
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
DROP FUNCTION IF EXISTS generate_receipt_number();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS public.handle_new_user();

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
  email TEXT,
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
  emergency_phone TEXT,
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
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  insurance_expiry_date DATE,
  deposit_scheme_name TEXT,
  deposit_scheme_address TEXT,
  late_fee_policy TEXT,
  payment_terms TEXT,
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
-- SECTION 7: PROPERTIES (with all enhancements)
-- ============================================================

CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'flat',
  property_subtype TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','let','unavailable','inactive')),
  furnished_status TEXT DEFAULT 'unfurnished',
  landlord_id UUID REFERENCES landlords(id) ON DELETE SET NULL,
  description TEXT,
  short_description TEXT,
  full_description TEXT,
  key_features JSONB DEFAULT '[]'::jsonb,
  epc_rating TEXT,
  utility_note TEXT,
  inventory_note TEXT,
  -- Features: Outdoor
  has_garden BOOLEAN DEFAULT FALSE,
  garden_type TEXT CHECK (garden_type IN ('front','back','communal','none',NULL)),
  has_balcony BOOLEAN DEFAULT FALSE,
  has_terrace BOOLEAN DEFAULT FALSE,
  has_patio BOOLEAN DEFAULT FALSE,
  -- Features: Parking
  has_parking BOOLEAN DEFAULT FALSE,
  parking_type TEXT CHECK (parking_type IN ('garage','driveway','street','allocated','none',NULL)),
  parking_spaces INTEGER DEFAULT 0,
  -- Features: Heating & Energy
  heating_type TEXT CHECK (heating_type IN ('gas_central','electric','underfloor','oil','none',NULL)),
  hot_water_type TEXT CHECK (hot_water_type IN ('gas','electric','solar','none',NULL)),
  has_double_glazing BOOLEAN DEFAULT FALSE,
  -- Features: Interior
  reception_rooms INTEGER DEFAULT 1,
  kitchen_type TEXT CHECK (kitchen_type IN ('separate','open_plan','kitchen_diner',NULL)),
  appliances_included JSONB DEFAULT '[]'::jsonb,
  broadband_type TEXT CHECK (broadband_type IN ('fibre','standard','ultrafast','none',NULL)),
  has_smart_home BOOLEAN DEFAULT FALSE,
  smart_home_features TEXT,
  -- Features: Building
  floor_number INTEGER,
  total_floors INTEGER,
  lift_access BOOLEAN DEFAULT FALSE,
  -- Location & Area
  nearest_station TEXT,
  station_distance_minutes INTEGER,
  nearby_schools JSONB DEFAULT '[]'::jsonb,
  nearby_amenities JSONB DEFAULT '[]'::jsonb,
  neighborhood_description TEXT,
  local_highlights TEXT,
  transport_links TEXT,
  -- Financial
  monthly_rent NUMERIC(10,2),
  deposit_amount NUMERIC(10,2),
  council_tax_band TEXT CHECK (council_tax_band IN ('A','B','C','D','E','F','G','H',NULL)),
  rent_includes JSONB DEFAULT '[]'::jsonb,
  minimum_term_months INTEGER DEFAULT 12,
  available_from DATE,
  -- Media
  floor_plan_url TEXT,
  virtual_tour_url TEXT,
  video_tour_url TEXT,
  tour_360_url TEXT,
  -- Compliance & Legal
  fire_safety_compliant BOOLEAN,
  legionella_assessed BOOLEAN,
  legionella_assessment_date DATE,
  hmo_license_required BOOLEAN DEFAULT FALSE,
  hmo_license_number TEXT,
  hmo_license_expiry DATE,
  -- Management
  managed_by UUID REFERENCES users(id),
  management_type TEXT CHECK (management_type IN ('fully_managed','let_only','tenant_find',NULL)),
  management_fee_percentage DECIMAL(5,2),
  keys_held BOOLEAN DEFAULT FALSE,
  keys_count INTEGER DEFAULT 0,
  alarm_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  -- Website Display
  show_on_website BOOLEAN DEFAULT TRUE,
  featured_property BOOLEAN DEFAULT FALSE,
  custom_slug TEXT UNIQUE,
  seo_title TEXT,
  seo_meta_description TEXT,
  seo_keywords JSONB DEFAULT '[]'::jsonb,
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

CREATE TABLE property_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('bedroom','bathroom','kitchen','living_room','dining_room','study','hallway','utility','other')),
  length_meters DECIMAL(5,2),
  width_meters DECIMAL(5,2),
  length_feet DECIMAL(5,2),
  width_feet DECIMAL(5,2),
  features JSONB DEFAULT '[]'::jsonb,
  floor_covering TEXT CHECK (floor_covering IN ('carpet','hardwood','tile','laminate','vinyl','other',NULL)),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 8: DOCUMENTS & COMPLIANCE
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
  council_id UUID,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount NUMERIC(10,2) NOT NULL,
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  deposit_scheme TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','ending_soon','expired','ended','terminated')),
  agreement_template_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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
  new_rent_amount NUMERIC(10,2),
  old_rent NUMERIC(10,2),
  reason TEXT,
  notes TEXT,
  renewal_type TEXT DEFAULT 'extension' CHECK (renewal_type IN ('extension','new_agreement')),
  previous_agreement_id UUID,
  new_agreement_id UUID,
  amendments_summary JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','signed','completed')),
  created_by UUID REFERENCES auth.users(id),
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
-- SECTION 10: VIEWINGS & COMMUNICATIONS
-- ============================================================

CREATE TABLE property_viewings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  prospect_name TEXT NOT NULL,
  prospect_email TEXT,
  prospect_phone TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','completed','cancelled','no_show','converted')),
  feedback TEXT,
  rating TEXT CHECK (rating IN ('interested','very_interested','not_interested','maybe')),
  notes TEXT,
  source TEXT DEFAULT 'walk_in'
    CHECK (source IN ('walk_in','rightmove','zoopla','openrent','referral','website','other')),
  right_to_rent_checked BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenant_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call','email','letter','sms','visit','other')),
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound','outbound')),
  subject TEXT,
  body TEXT,
  logged_at TIMESTAMPTZ DEFAULT now(),
  logged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 11: MAINTENANCE
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
-- SECTION 12: FINANCE
-- ============================================================

CREATE TABLE rent_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenancy_id UUID REFERENCES tenancies(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','partial')),
  receipt_number TEXT,
  period_start DATE,
  period_end DATE,
  amount_paid NUMERIC(10,2),
  balance_after NUMERIC(10,2) DEFAULT 0,
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

CREATE TABLE tenant_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenancy_id UUID NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_rent DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 13: AGREEMENTS
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
  renewal_id UUID,
  is_renewal BOOLEAN DEFAULT FALSE,
  previous_agreement_id UUID REFERENCES generated_agreements(id),
  merged_content_json JSONB NOT NULL DEFAULT '{}',
  merged_html TEXT,
  pdf_storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_signatures','signed')),
  signed_at TIMESTAMPTZ,
  council_submitted_at TIMESTAMPTZ,
  council_submission_status TEXT DEFAULT 'not_submitted'
    CHECK (council_submission_status IN ('not_submitted','ready_to_submit','submitted','accepted','rejected')),
  council_reference TEXT,
  council_pack_generated_at TIMESTAMPTZ,
  council_pack_html TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK for renewal_id after generated_agreements exists
ALTER TABLE generated_agreements ADD CONSTRAINT fk_generated_agreements_renewal
  FOREIGN KEY (renewal_id) REFERENCES tenancy_renewals(id);

CREATE TABLE agreement_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES generated_agreements(id) ON DELETE CASCADE,
  signatory_type TEXT NOT NULL CHECK (signatory_type IN ('tenant','agent')),
  signatory_id UUID,
  signatory_name TEXT NOT NULL,
  signature_image_base64 TEXT NOT NULL,
  capture_method TEXT NOT NULL CHECK (capture_method IN ('topaz','touch')),
  ip_address TEXT,
  witness_name TEXT,
  witness_address TEXT,
  witness_occupation TEXT,
  witness_signature_base64 TEXT,
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

CREATE TABLE agreement_layout_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL DEFAULT 'default',
  -- Page Setup
  page_size TEXT DEFAULT 'A4',
  page_orientation TEXT DEFAULT 'portrait',
  margin_top TEXT DEFAULT '20mm',
  margin_right TEXT DEFAULT '15mm',
  margin_bottom TEXT DEFAULT '25mm',
  margin_left TEXT DEFAULT '15mm',
  -- Typography
  font_family TEXT DEFAULT 'Times New Roman',
  base_font_size TEXT DEFAULT '11pt',
  line_height NUMERIC DEFAULT 1.8,
  heading1_size TEXT DEFAULT '28pt',
  heading2_size TEXT DEFAULT '16pt',
  heading3_size TEXT DEFAULT '13pt',
  -- Colors
  heading_color TEXT DEFAULT '#1a1a1a',
  text_color TEXT DEFAULT '#000000',
  border_color TEXT DEFAULT '#333333',
  -- Cover Page
  logo_max_height TEXT DEFAULT '80px',
  logo_max_width TEXT DEFAULT '250px',
  cover_title_size TEXT DEFAULT '28pt',
  cover_subtitle_size TEXT DEFAULT '14pt',
  show_cover_page BOOLEAN DEFAULT true,
  -- Signatures
  signature_image_height TEXT DEFAULT '60px',
  signature_block_spacing TEXT DEFAULT '40px',
  show_signatures_inline BOOLEAN DEFAULT true,
  show_signature_page BOOLEAN DEFAULT true,
  -- Footer
  footer_text TEXT DEFAULT 'This agreement is generated on {date}',
  show_page_numbers BOOLEAN DEFAULT true,
  page_number_position TEXT DEFAULT 'bottom-center',
  -- Watermark
  show_watermark_logo BOOLEAN DEFAULT false,
  watermark_opacity NUMERIC DEFAULT 0.08,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 14: INVENTORY & READINESS
-- ============================================================

CREATE TABLE property_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('furniture','appliance','fixture','other')),
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  condition TEXT NOT NULL CHECK (condition IN ('new','good','fair','poor','damaged')),
  notes TEXT,
  photos JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE property_key_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  key_type TEXT NOT NULL CHECK (key_type IN ('front_door','back_door','window','fob','alarm_code','other')),
  description TEXT,
  quantity INTEGER DEFAULT 1,
  handed_to_tenant BOOLEAN DEFAULT false,
  tenant_id UUID REFERENCES tenants(id),
  handed_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE property_meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id),
  meter_type TEXT NOT NULL CHECK (meter_type IN ('gas','electric','water')),
  meter_serial TEXT NOT NULL,
  reading_value NUMERIC NOT NULL,
  reading_date DATE DEFAULT CURRENT_DATE,
  reading_type TEXT NOT NULL CHECK (reading_type IN ('check_in','check_out','interim')),
  photo_path TEXT,
  recorded_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE property_readiness_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenancy_id UUID REFERENCES tenancies(id),
  checklist_type TEXT NOT NULL CHECK (checklist_type IN ('pre_tenancy','check_in','check_out')),
  items JSONB NOT NULL DEFAULT '[]',
  overall_status TEXT DEFAULT 'not_started' CHECK (overall_status IN ('not_started','in_progress','completed')),
  completed_at TIMESTAMPTZ,
  tenant_signature TEXT,
  agent_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SECTION 15: LOCAL AUTHORITIES & COUNCIL
-- ============================================================

CREATE TABLE local_authorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  postcode TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  contact_person TEXT,
  licensing_required BOOLEAN DEFAULT false,
  licence_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE council_required_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  council_id UUID REFERENCES local_authorities(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Add FK for council_id on tenancies (deferred since local_authorities created after tenancies)
ALTER TABLE tenancies ADD CONSTRAINT fk_tenancies_council
  FOREIGN KEY (council_id) REFERENCES local_authorities(id);

-- ============================================================
-- SECTION 16: STICKY NOTES & SYSTEM
-- ============================================================

CREATE TABLE sticky_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  color TEXT NOT NULL DEFAULT 'yellow',
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  rotation INTEGER NOT NULL DEFAULT 0,
  z_index INTEGER NOT NULL DEFAULT 1,
  width INTEGER NOT NULL DEFAULT 200,
  height INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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
-- SECTION 17: FUNCTIONS & TRIGGERS
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

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.receipt_number IS NULL AND NEW.status = 'paid' THEN
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(receipt_number FROM 10) AS INTEGER)
    ), 0) + 1 INTO next_num
    FROM rent_transactions
    WHERE receipt_number IS NOT NULL
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM COALESCE(NEW.paid_date, NEW.due_date));
    NEW.receipt_number := 'RCP-' || TO_CHAR(COALESCE(NEW.paid_date, NEW.due_date), 'YYYY') || '-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_receipt_number
  BEFORE INSERT ON rent_transactions
  FOR EACH ROW EXECUTE FUNCTION generate_receipt_number();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_property_rooms_updated_at
  BEFORE UPDATE ON property_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON property_inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_readiness_checklist_updated_at
  BEFORE UPDATE ON property_readiness_checklist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'negotiator',
    true
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECTION 18: INDEXES
-- ============================================================
CREATE INDEX idx_properties_ref ON properties(reference_number);
CREATE INDEX idx_properties_landlord ON properties(landlord_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_landlords_is_active ON landlords(is_active);
CREATE INDEX idx_landlord_id_docs_landlord ON landlord_id_documents(landlord_id);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
CREATE INDEX idx_property_photos_property ON property_photos(property_id);
CREATE INDEX idx_property_rooms_property ON property_rooms(property_id);
CREATE INDEX idx_property_compliance_property ON property_compliance(property_id);
CREATE INDEX idx_home_safe_licences_property ON property_home_safe_licences(property_id);
CREATE INDEX idx_home_safe_licences_status ON property_home_safe_licences(status);
CREATE INDEX idx_home_safe_licences_document ON property_home_safe_licences(document_id);
CREATE INDEX idx_property_tickets_property ON property_tickets(property_id);
CREATE INDEX idx_property_tickets_status ON property_tickets(status);
CREATE INDEX idx_property_tickets_type ON property_tickets(type);
CREATE INDEX idx_property_tickets_due ON property_tickets(due_date);
CREATE INDEX idx_tenancies_ref ON tenancies(reference_number);
CREATE INDEX idx_tenancies_property ON tenancies(property_id);
CREATE INDEX idx_tenancies_status ON tenancies(status);
CREATE INDEX idx_tenancies_council_id ON tenancies(council_id);
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
CREATE INDEX idx_viewings_property ON property_viewings(property_id);
CREATE INDEX idx_viewings_scheduled ON property_viewings(scheduled_at);
CREATE INDEX idx_viewings_status ON property_viewings(status);
CREATE INDEX idx_communications_tenant ON tenant_communications(tenant_id);
CREATE INDEX idx_communications_logged ON tenant_communications(logged_at);
CREATE INDEX idx_maintenance_property ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_jobs_request ON maintenance_jobs(request_id);
CREATE INDEX idx_rent_txns_receipt ON rent_transactions(receipt_number);
CREATE INDEX idx_rent_txns_period ON rent_transactions(period_start, period_end);
CREATE INDEX idx_tenant_statements_tenant ON tenant_statements(tenant_id);
CREATE INDEX idx_tenant_statements_tenancy ON tenant_statements(tenancy_id);
CREATE INDEX idx_tenant_statements_period ON tenant_statements(period_start, period_end);
CREATE INDEX idx_tenant_statements_created ON tenant_statements(created_at DESC);
CREATE INDEX idx_clauses_category ON agreement_clauses(category);
CREATE INDEX idx_clauses_sort ON agreement_clauses(sort_order);
CREATE INDEX idx_template_sections_template ON template_sections(template_id);
CREATE INDEX idx_template_sections_sort ON template_sections(template_id, sort_order);
CREATE INDEX idx_section_clauses_section ON template_section_clauses(section_id);
CREATE INDEX idx_section_clauses_clause ON template_section_clauses(clause_id);
CREATE INDEX idx_template_versions_template ON template_versions(template_id);
CREATE INDEX idx_generated_agreements_tenancy ON generated_agreements(tenancy_id);
CREATE INDEX idx_generated_agreements_renewal ON generated_agreements(renewal_id);
CREATE INDEX idx_generated_agreements_is_renewal ON generated_agreements(is_renewal);
CREATE INDEX idx_agreement_signatures_agreement ON agreement_signatures(agreement_id);
CREATE INDEX idx_agreement_attachments_agreement ON agreement_attachments(agreement_id);
CREATE INDEX idx_agreement_attachments_source ON agreement_attachments(source_table, source_id);
CREATE INDEX idx_agreement_attachments_type ON agreement_attachments(attachment_type);
CREATE INDEX idx_inventory_items_property ON property_inventory_items(property_id);
CREATE INDEX idx_key_inventory_property ON property_key_inventory(property_id);
CREATE INDEX idx_meter_readings_property ON property_meter_readings(property_id);
CREATE INDEX idx_meter_readings_tenancy ON property_meter_readings(tenancy_id);
CREATE INDEX idx_readiness_property ON property_readiness_checklist(property_id);
CREATE INDEX idx_readiness_tenancy ON property_readiness_checklist(tenancy_id);
CREATE INDEX idx_renewals_status ON tenancy_renewals(status);
CREATE INDEX idx_local_authorities_name ON local_authorities(name);
CREATE INDEX idx_local_authorities_city ON local_authorities(city);
CREATE INDEX idx_council_required_documents_council_id ON council_required_documents(council_id);
CREATE INDEX idx_council_required_documents_sort_order ON council_required_documents(sort_order);
CREATE INDEX idx_sticky_notes_user ON sticky_notes(user_id);
CREATE INDEX idx_sticky_notes_position ON sticky_notes(position_x, position_y);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_agreement_layout_settings_key ON agreement_layout_settings(key);

-- ============================================================
-- SECTION 19: ROW LEVEL SECURITY
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'roles','permissions','users','company_settings',
      'landlords','landlord_id_documents',
      'tenants','tenant_references','tenant_id_documents','tenant_family_members',
      'properties','property_photos','property_rooms','property_compliance',
      'property_home_safe_licences','property_tickets',
      'documents',
      'tenancies','tenancy_tenants','tenancy_renewals',
      'tenancy_inspections','inspection_rooms','inspection_room_items','inspection_photos',
      'tenancy_terminations','tenancy_checklists','tenancy_status_log','tenancy_amendments',
      'arrears_actions',
      'property_viewings','tenant_communications',
      'maintenance_requests','contractors','maintenance_jobs',
      'rent_transactions','landlord_statements','expenses','agency_fees','tenant_statements',
      'agreement_templates','agreement_clauses',
      'template_sections','template_section_clauses','template_versions',
      'generated_agreements','agreement_signatures','agreement_attachments','agreement_defaults',
      'agreement_layout_settings',
      'property_inventory_items','property_key_inventory','property_meter_readings','property_readiness_checklist',
      'local_authorities','council_required_documents',
      'audit_log','notifications','sticky_notes'
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

-- Sticky notes: user-scoped policies (override generic)
DROP POLICY IF EXISTS 'Authenticated access on sticky_notes' ON sticky_notes;
CREATE POLICY "Users can view their own sticky notes"
  ON sticky_notes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own sticky notes"
  ON sticky_notes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own sticky notes"
  ON sticky_notes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own sticky notes"
  ON sticky_notes FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- SECTION 20: STORAGE BUCKETS + POLICIES
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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('inventory-photos', 'inventory-photos', false, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('expense-invoices', 'expense-invoices', false, 10485760,
  ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  b TEXT;
BEGIN
  FOR b IN
    SELECT unnest(ARRAY[
      'property-photos','tenant-id-documents','landlord-id-documents',
      'inspection-photos','documents','agreements',
      'inventory-photos','expense-invoices'
    ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON storage.objects',
      'Auth access on ' || b
    );
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR ALL TO authenticated USING (bucket_id = %L) WITH CHECK (bucket_id = %L)',
      'Auth access on ' || b, b, b
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Public read on company-assets" ON storage.objects;
CREATE POLICY "Public read on company-assets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'company-assets');
DROP POLICY IF EXISTS "Auth write on company-assets" ON storage.objects;
CREATE POLICY "Auth write on company-assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'company-assets');
DROP POLICY IF EXISTS "Auth delete on company-assets" ON storage.objects;
CREATE POLICY "Auth delete on company-assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'company-assets');

