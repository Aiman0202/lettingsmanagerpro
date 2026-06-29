-- Add description column to tenancies table
ALTER TABLE tenancies ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN tenancies.description IS 'Detailed description of the tenancy arrangement, special terms, or notes';
