-- ============================================================
-- Enhanced Renewal Tracking
-- Adds renewal type, agreement linkage, and amendment summary
-- ============================================================

-- Add renewal type and agreement linkage to tenancy_renewals
ALTER TABLE tenancy_renewals 
ADD COLUMN IF NOT EXISTS renewal_type TEXT DEFAULT 'extension' CHECK (renewal_type IN ('extension', 'new_agreement')),
ADD COLUMN IF NOT EXISTS previous_agreement_id UUID REFERENCES generated_agreements(id),
ADD COLUMN IF NOT EXISTS new_agreement_id UUID REFERENCES generated_agreements(id),
ADD COLUMN IF NOT EXISTS amendments_summary JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'completed')),
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add renewal tracking to generated_agreements
ALTER TABLE generated_agreements 
ADD COLUMN IF NOT EXISTS renewal_id UUID REFERENCES tenancy_renewals(id),
ADD COLUMN IF NOT EXISTS is_renewal BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS previous_agreement_id UUID REFERENCES generated_agreements(id);

-- Add indexes for renewal queries
CREATE INDEX IF NOT EXISTS idx_renewals_status ON tenancy_renewals(status);
CREATE INDEX IF NOT EXISTS idx_agreements_renewal ON generated_agreements(renewal_id);
CREATE INDEX IF NOT EXISTS idx_agreements_is_renewal ON generated_agreements(is_renewal);

-- Add old_rent column to tenancy_renewals for comparison
ALTER TABLE tenancy_renewals 
ADD COLUMN IF NOT EXISTS old_rent NUMERIC(10,2);

-- Update existing records to set old_rent from tenancies
UPDATE tenancy_renewals r
SET old_rent = t.rent_amount
FROM tenancies t
WHERE r.tenancy_id = t.id AND r.old_rent IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN tenancy_renewals.renewal_type IS 'Type of renewal: extension (Deed of Variation) or new_agreement (full new agreement)';
COMMENT ON COLUMN tenancy_renewals.amendments_summary IS 'JSON summary of all amendments during the tenancy period';
COMMENT ON COLUMN generated_agreements.is_renewal IS 'True if this agreement was created as part of a renewal';
COMMENT ON COLUMN generated_agreements.previous_agreement_id IS 'Link to the agreement this renewal replaces';
