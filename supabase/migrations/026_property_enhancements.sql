-- ============================================================
-- PROPERTY ENHANCEMENTS - Comprehensive Property Details
-- Categories 2-10: Features, Rooms, Location, Financial, 
-- Descriptions, Media, Compliance, Management, Website Display
-- ============================================================

-- CATEGORY 2: PROPERTY FEATURES
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_subtype TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_number INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_floors INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lift_access BOOLEAN DEFAULT FALSE;

-- Outdoor Space
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_garden BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS garden_type TEXT CHECK (garden_type IN ('front', 'back', 'communal', 'none', NULL));
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_balcony BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_terrace BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_patio BOOLEAN DEFAULT FALSE;

-- Parking
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_type TEXT CHECK (parking_type IN ('garage', 'driveway', 'street', 'allocated', 'none', NULL));
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking_spaces INTEGER DEFAULT 0;

-- Heating & Energy
ALTER TABLE properties ADD COLUMN IF NOT EXISTS heating_type TEXT CHECK (heating_type IN ('gas_central', 'electric', 'underfloor', 'oil', 'none', NULL));
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hot_water_type TEXT CHECK (hot_water_type IN ('gas', 'electric', 'solar', 'none', NULL));
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_double_glazing BOOLEAN DEFAULT FALSE;

-- Interior Features
ALTER TABLE properties ADD COLUMN IF NOT EXISTS reception_rooms INTEGER DEFAULT 1;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS kitchen_type TEXT CHECK (kitchen_type IN ('separate', 'open_plan', 'kitchen_diner', NULL));
ALTER TABLE properties ADD COLUMN IF NOT EXISTS appliances_included JSONB DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS broadband_type TEXT CHECK (broadband_type IN ('fibre', 'standard', 'ultrafast', 'none', NULL));
ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_smart_home BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS smart_home_features TEXT;

-- CATEGORY 3: ROOM DETAILS (separate table)
CREATE TABLE IF NOT EXISTS property_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  room_name TEXT NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('bedroom', 'bathroom', 'kitchen', 'living_room', 'dining_room', 'study', 'hallway', 'utility', 'other')),
  length_meters DECIMAL(5,2),
  width_meters DECIMAL(5,2),
  length_feet DECIMAL(5,2),
  width_feet DECIMAL(5,2),
  features JSONB DEFAULT '[]'::jsonb,
  floor_covering TEXT CHECK (floor_covering IN ('carpet', 'hardwood', 'tile', 'laminate', 'vinyl', 'other', NULL)),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_rooms_property ON property_rooms(property_id);

-- CATEGORY 4: LOCATION & AREA
ALTER TABLE properties ADD COLUMN IF NOT EXISTS nearest_station TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS station_distance_minutes INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS nearby_schools JSONB DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS nearby_amenities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS neighborhood_description TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS local_highlights TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS transport_links TEXT;

-- CATEGORY 5: FINANCIAL DETAILS
ALTER TABLE properties ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(10,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS council_tax_band TEXT CHECK (council_tax_band IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', NULL));
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rent_includes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS minimum_term_months INTEGER DEFAULT 12;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS available_from DATE;

-- CATEGORY 6: DESCRIPTIONS (enhanced)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS full_description TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS key_features JSONB DEFAULT '[]'::jsonb;

-- CATEGORY 7: MEDIA & DOCUMENTS
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_plan_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_tour_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tour_360_url TEXT;

-- CATEGORY 8: COMPLIANCE & LEGAL (enhanced - some via compliance table)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS fire_safety_compliant BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS legionella_assessed BOOLEAN;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS legionella_assessment_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hmo_license_required BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hmo_license_number TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hmo_license_expiry DATE;

-- CATEGORY 9: MANAGEMENT DETAILS (internal)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS managed_by UUID REFERENCES users(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS management_type TEXT CHECK (management_type IN ('fully_managed', 'let_only', 'tenant_find', NULL));
ALTER TABLE properties ADD COLUMN IF NOT EXISTS management_fee_percentage DECIMAL(5,2);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS keys_held BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS keys_count INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS alarm_code TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- CATEGORY 10: WEBSITE DISPLAY SETTINGS
ALTER TABLE properties ADD COLUMN IF NOT EXISTS show_on_website BOOLEAN DEFAULT TRUE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS featured_property BOOLEAN DEFAULT FALSE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS custom_slug TEXT UNIQUE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS seo_meta_description TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS seo_keywords JSONB DEFAULT '[]'::jsonb;

-- Add updated_at trigger for property_rooms
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_property_rooms_updated_at
    BEFORE UPDATE ON property_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN properties.property_subtype IS 'Subtype: terraced, semi-detached, detached, bungalow, apartment, studio';
COMMENT ON COLUMN properties.furnished_status IS 'Furnishing: furnished, unfurnished, part_furnished';
COMMENT ON COLUMN properties.garden_type IS 'Garden type: front, back, communal, none';
COMMENT ON COLUMN properties.parking_type IS 'Parking type: garage, driveway, street, allocated, none';
COMMENT ON COLUMN properties.heating_type IS 'Heating: gas_central, electric, underfloor, oil, none';
COMMENT ON COLUMN properties.hot_water_type IS 'Hot water: gas, electric, solar, none';
COMMENT ON COLUMN properties.kitchen_type IS 'Kitchen: separate, open_plan, kitchen_diner';
COMMENT ON COLUMN properties.broadband_type IS 'Broadband: fibre, standard, ultrafast, none';
COMMENT ON COLUMN properties.management_type IS 'Management: fully_managed, let_only, tenant_find';
COMMENT ON TABLE property_rooms IS 'Detailed room information for each property';
