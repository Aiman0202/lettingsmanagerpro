-- ============================================================
-- CREATE TENANT STATEMENTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS tenant_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenancy_id UUID NOT NULL REFERENCES tenancies(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_rent DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tenant_statements_tenant ON tenant_statements(tenant_id);
CREATE INDEX idx_tenant_statements_tenancy ON tenant_statements(tenancy_id);
CREATE INDEX idx_tenant_statements_period ON tenant_statements(period_start, period_end);
CREATE INDEX idx_tenant_statements_created ON tenant_statements(created_at DESC);

-- Comments
COMMENT ON TABLE tenant_statements IS 'Monthly rent account statements for tenants';
COMMENT ON COLUMN tenant_statements.total_rent IS 'Total rent due for the period';
COMMENT ON COLUMN tenant_statements.total_paid IS 'Total amount paid for the period';
COMMENT ON COLUMN tenant_statements.balance IS 'Outstanding balance (total_rent - total_paid)';
COMMENT ON COLUMN tenant_statements.transaction_count IS 'Number of rent transactions in the period';

-- RLS Policies
ALTER TABLE tenant_statements ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all tenant statements
CREATE POLICY "Allow authenticated users to view tenant statements"
  ON tenant_statements FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert tenant statements
CREATE POLICY "Allow authenticated users to create tenant statements"
  ON tenant_statements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update tenant statements
CREATE POLICY "Allow authenticated users to update tenant statements"
  ON tenant_statements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete tenant statements
CREATE POLICY "Allow authenticated users to delete tenant statements"
  ON tenant_statements FOR DELETE
  TO authenticated
  USING (true);
