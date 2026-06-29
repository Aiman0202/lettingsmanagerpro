-- Add council_id to tenancies table for council submission tracking

-- Add council_id column to tenancies
ALTER TABLE tenancies 
  ADD COLUMN IF NOT EXISTS council_id UUID REFERENCES local_authorities(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tenancies_council_id ON tenancies(council_id);

-- Add comment
COMMENT ON COLUMN tenancies.council_id IS 'References the local authority council for this tenancy (for HMO/licensing compliance)';
