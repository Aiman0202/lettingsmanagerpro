-- Migration 016: Fix missing columns that cause runtime errors

-- 1. Add furnished_status to properties (used by agreement generation)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS furnished_status TEXT DEFAULT 'unfurnished';

-- 2. Fix tenancy_renewals column mismatches (code uses new_rent_amount, DB has new_rent)
ALTER TABLE tenancy_renewals ADD COLUMN IF NOT EXISTS new_rent_amount NUMERIC(10,2);
-- Copy existing data from new_rent to new_rent_amount
UPDATE tenancy_renewals SET new_rent_amount = new_rent WHERE new_rent_amount IS NULL AND new_rent IS NOT NULL;

-- 3. Add reason column to tenancy_renewals (used by RenewalFormDialog)
ALTER TABLE tenancy_renewals ADD COLUMN IF NOT EXISTS reason TEXT;
