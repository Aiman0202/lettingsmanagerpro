-- ============================================================
-- Migration 027: Enhance Company Settings & Add Council Management
-- ============================================================
-- Adds enhanced company settings fields and local authority management
-- for agreement compliance and council submission requirements
-- ============================================================

-- SECTION 1: Enhance company_settings table
-- ============================================================

ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS deposit_scheme_name TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS deposit_scheme_address TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS late_fee_policy TEXT;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS payment_terms TEXT;

COMMENT ON COLUMN company_settings.emergency_phone IS 'Emergency contact phone number for tenant issues';
COMMENT ON COLUMN company_settings.insurance_provider IS 'Company insurance provider name';
COMMENT ON COLUMN company_settings.insurance_policy_number IS 'Insurance policy reference number';
COMMENT ON COLUMN company_settings.insurance_expiry_date IS 'Insurance policy expiry date for renewal reminders';
COMMENT ON COLUMN company_settings.deposit_scheme_name IS 'Default deposit protection scheme (DPS, TDS, MyDeposits)';
COMMENT ON COLUMN company_settings.deposit_scheme_address IS 'Address of the deposit protection scheme';
COMMENT ON COLUMN company_settings.late_fee_policy IS 'Default late payment policy text for agreements';
COMMENT ON COLUMN company_settings.payment_terms IS 'Standard payment terms text for agreements';

-- SECTION 2: Create local_authorities table
-- ============================================================

CREATE TABLE IF NOT EXISTS local_authorities (
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

COMMENT ON TABLE local_authorities IS 'UK local authorities/councils for agreement compliance and submissions';
COMMENT ON COLUMN local_authorities.licensing_required IS 'Whether this council requires property licensing';
COMMENT ON COLUMN local_authorities.licence_type IS 'Type of licence required (Selective, Additional, Mandatory)';

-- Enable Row Level Security
ALTER TABLE local_authorities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for local_authorities
CREATE POLICY "Users can view all local authorities"
  ON local_authorities FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert local authorities"
  ON local_authorities FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can update local authorities"
  ON local_authorities FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can delete local authorities"
  ON local_authorities FOR DELETE
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- SECTION 3: Create council_required_documents table
-- ============================================================

CREATE TABLE IF NOT EXISTS council_required_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  council_id UUID REFERENCES local_authorities(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

COMMENT ON TABLE council_required_documents IS 'Documents required by each council for submission packs';
COMMENT ON COLUMN council_required_documents.document_type IS 'Type of document (e.g., Gas Safety Certificate, EICR)';
COMMENT ON COLUMN council_required_documents.is_required IS 'Whether this document is mandatory for this council';

-- Enable Row Level Security
ALTER TABLE council_required_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for council_required_documents
CREATE POLICY "Users can view all council required documents"
  ON council_required_documents FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert council required documents"
  ON council_required_documents FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can update council required documents"
  ON council_required_documents FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can delete council required documents"
  ON council_required_documents FOR DELETE
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- SECTION 4: Seed common UK councils with document requirements
-- ============================================================

-- Birmingham City Council
INSERT INTO local_authorities (name, city, postcode, phone, email, website, licensing_required, licence_type)
VALUES ('Birmingham City Council', 'Birmingham', 'B1 1BB', '0121 303 1111', 'housing@birmingham.gov.uk', 'https://www.birmingham.gov.uk', true, 'Selective')
ON CONFLICT (name) DO NOTHING;

-- Manchester City Council
INSERT INTO local_authorities (name, city, postcode, phone, email, website, licensing_required, licence_type)
VALUES ('Manchester City Council', 'Manchester', 'M60 2LA', '0161 234 5000', 'housing@manchester.gov.uk', 'https://www.manchester.gov.uk', true, 'Selective')
ON CONFLICT (name) DO NOTHING;

-- Leeds City Council
INSERT INTO local_authorities (name, city, postcode, phone, email, website, licensing_required, licence_type)
VALUES ('Leeds City Council', 'Leeds', 'LS1 1UR', '0113 222 4444', 'housing@leeds.gov.uk', 'https://www.leeds.gov.uk', false, NULL)
ON CONFLICT (name) DO NOTHING;

-- Liverpool City Council
INSERT INTO local_authorities (name, city, postcode, phone, email, website, licensing_required, licence_type)
VALUES ('Liverpool City Council', 'Liverpool', 'L69 7DD', '0151 233 3000', 'housing@liverpool.gov.uk', 'https://www.liverpool.gov.uk', true, 'Additional')
ON CONFLICT (name) DO NOTHING;

-- Sheffield City Council
INSERT INTO local_authorities (name, city, postcode, phone, email, website, licensing_required, licence_type)
VALUES ('Sheffield City Council', 'Sheffield', 'S1 2HH', '0114 273 4567', 'housing@sheffield.gov.uk', 'https://www.sheffield.gov.uk', false, NULL)
ON CONFLICT (name) DO NOTHING;

-- Bristol City Council
INSERT INTO local_authorities (name, city, postcode, phone, email, website, licensing_required, licence_type)
VALUES ('Bristol City Council', 'Bristol', 'BS1 5TR', '0117 922 2000', 'housing@bristol.gov.uk', 'https://www.bristol.gov.uk', true, 'Selective')
ON CONFLICT (name) DO NOTHING;

-- Nottingham City Council
INSERT INTO local_authorities (name, city, postcode, phone, email, website, licensing_required, licence_type)
VALUES ('Nottingham City Council', 'Nottingham', 'NG1 3BT', '0115 876 3000', 'housing@nottinghamcity.gov.uk', 'https://www.nottinghamcity.gov.uk', true, 'Selective')
ON CONFLICT (name) DO NOTHING;

-- Newcastle City Council
INSERT INTO local_authorities (name, city, postcode, phone, email, website, licensing_required, licence_type)
VALUES ('Newcastle City Council', 'Newcastle upon Tyne', 'NE1 8WH', '0191 278 7878', 'housing@newcastle.gov.uk', 'https://www.newcastle.gov.uk', false, NULL)
ON CONFLICT (name) DO NOTHING;

-- Cardiff Council
INSERT INTO local_authorities (name, city, postcode, phone, email, website, licensing_required, licence_type)
VALUES ('Cardiff Council', 'Cardiff', 'CF10 3AT', '029 2087 2087', 'housing@cardiff.gov.uk', 'https://www.cardiff.gov.uk', false, NULL)
ON CONFLICT (name) DO NOTHING;

-- Lambeth Council (London)
INSERT INTO local_authorities (name, city, postcode, phone, email, website, licensing_required, licence_type)
VALUES ('Lambeth Council', 'London', 'SE1 6LX', '020 7926 1000', 'housing@lambeth.gov.uk', 'https://www.lambeth.gov.uk', true, 'Selective')
ON CONFLICT (name) DO NOTHING;

-- Now add standard document requirements for each council
-- Common documents that most councils require
DO $$
DECLARE
  council_record RECORD;
  common_docs TEXT[] := ARRAY[
    'Gas Safety Certificate',
    'EICR (Electrical Installation Condition Report)',
    'EPC (Energy Performance Certificate)',
    'How to Rent Guide Acknowledgment',
    'Deposit Protection Certificate',
    'Smoke/CO Alarm Test Record',
    'Signed Tenancy Agreement',
    'Tenant ID Documents'
  ];
  optional_docs TEXT[] := ARRAY[
    'Fire Risk Assessment',
    'Legionella Risk Assessment',
    'HMO Licence',
    'Building Insurance Certificate'
  ];
  doc_type TEXT;
BEGIN
  -- Loop through all councils
  FOR council_record IN SELECT id FROM local_authorities
  LOOP
    -- Add common required documents
    FOREACH doc_type IN ARRAY common_docs
    LOOP
      INSERT INTO council_required_documents (council_id, document_type, is_required, sort_order)
      VALUES (council_record.id, doc_type, true, array_position(common_docs, doc_type))
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- Add optional documents (not required by default)
    FOREACH doc_type IN ARRAY optional_docs
    LOOP
      INSERT INTO council_required_documents (council_id, document_type, is_required, sort_order)
      VALUES (council_record.id, doc_type, false, 100 + array_position(optional_docs, doc_type))
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- SECTION 5: Add indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_local_authorities_name ON local_authorities(name);
CREATE INDEX IF NOT EXISTS idx_local_authorities_city ON local_authorities(city);
CREATE INDEX IF NOT EXISTS idx_council_required_documents_council_id ON council_required_documents(council_id);
CREATE INDEX IF NOT EXISTS idx_council_required_documents_sort_order ON council_required_documents(sort_order);
