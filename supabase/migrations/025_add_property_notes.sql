-- Add utility_note and inventory_note columns to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS utility_note TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS inventory_note TEXT;

-- Add comments for documentation
COMMENT ON COLUMN properties.utility_note IS 'Notes about utility meters, providers, or arrangements for this property';
COMMENT ON COLUMN properties.inventory_note IS 'Special notes about inventory items or inventory condition for this property';
