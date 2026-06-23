-- =============================================================
-- 017: Phase 4 Features — Viewings & Communication Log
-- =============================================================

-- Property Viewings
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

-- Tenant Communication Log
CREATE TABLE tenant_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('call','email','letter','sms','visit','other')),
  direction TEXT NOT NULL DEFAULT 'outbound'
    CHECK (direction IN ('inbound','outbound')),
  subject TEXT,
  body TEXT,
  logged_at TIMESTAMPTZ DEFAULT now(),
  logged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_viewings_property ON property_viewings(property_id);
CREATE INDEX idx_viewings_scheduled ON property_viewings(scheduled_at);
CREATE INDEX idx_viewings_status ON property_viewings(status);
CREATE INDEX idx_communications_tenant ON tenant_communications(tenant_id);
CREATE INDEX idx_communications_logged ON tenant_communications(logged_at);

-- RLS: property_viewings
ALTER TABLE property_viewings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "viewings_select_agency"
  ON property_viewings FOR SELECT
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid()
  ));

CREATE POLICY "viewings_insert_agency"
  ON property_viewings FOR INSERT
  WITH CHECK (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid()
  ));

CREATE POLICY "viewings_update_agency"
  ON property_viewings FOR UPDATE
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid()
  ));

CREATE POLICY "viewings_delete_agency"
  ON property_viewings FOR DELETE
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid()
  ));

-- RLS: tenant_communications
ALTER TABLE tenant_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communications_select_agency"
  ON tenant_communications FOR SELECT
  USING (logged_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid()
  ));

CREATE POLICY "communications_insert_agency"
  ON tenant_communications FOR INSERT
  WITH CHECK (logged_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid()
  ));

CREATE POLICY "communications_update_agency"
  ON tenant_communications FOR UPDATE
  USING (logged_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid()
  ));

CREATE POLICY "communications_delete_agency"
  ON tenant_communications FOR DELETE
  USING (logged_by = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid()
  ));
