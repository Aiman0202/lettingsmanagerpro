-- Property Inventory Management & Readiness Procedures
-- Migration: Add inventory tables

-- 1. Property Inventory Items
CREATE TABLE IF NOT EXISTS property_inventory_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('furniture', 'appliance', 'fixture', 'other')),
  name text NOT NULL,
  description text,
  quantity integer DEFAULT 1,
  condition text NOT NULL CHECK (condition IN ('new', 'good', 'fair', 'poor', 'damaged')),
  notes text,
  photos jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Key Inventory
CREATE TABLE IF NOT EXISTS property_key_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  key_type text NOT NULL CHECK (key_type IN ('front_door', 'back_door', 'window', 'fob', 'alarm_code', 'other')),
  description text,
  quantity integer DEFAULT 1,
  handed_to_tenant boolean DEFAULT false,
  tenant_id uuid REFERENCES tenants(id),
  handed_at timestamptz,
  returned_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 3. Meter Readings
CREATE TABLE IF NOT EXISTS property_meter_readings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  tenancy_id uuid REFERENCES tenancies(id),
  meter_type text NOT NULL CHECK (meter_type IN ('gas', 'electric', 'water')),
  meter_serial text NOT NULL,
  reading_value numeric NOT NULL,
  reading_date date DEFAULT CURRENT_DATE,
  reading_type text NOT NULL CHECK (reading_type IN ('check_in', 'check_out', 'interim')),
  photo_path text,
  recorded_by text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 4. Readiness Checklist
CREATE TABLE IF NOT EXISTS property_readiness_checklist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  tenancy_id uuid REFERENCES tenancies(id),
  checklist_type text NOT NULL CHECK (checklist_type IN ('pre_tenancy', 'check_in', 'check_out')),
  items jsonb NOT NULL DEFAULT '[]',
  overall_status text DEFAULT 'not_started' CHECK (overall_status IN ('not_started', 'in_progress', 'completed')),
  completed_at timestamptz,
  tenant_signature text,
  agent_signature text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_property ON property_inventory_items(property_id);
CREATE INDEX IF NOT EXISTS idx_key_inventory_property ON property_key_inventory(property_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_property ON property_meter_readings(property_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_tenancy ON property_meter_readings(tenancy_id);
CREATE INDEX IF NOT EXISTS idx_readiness_property ON property_readiness_checklist(property_id);
CREATE INDEX IF NOT EXISTS idx_readiness_tenancy ON property_readiness_checklist(tenancy_id);

-- Enable Row Level Security
ALTER TABLE property_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_key_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_readiness_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for now - adjust based on your RBAC)
DROP POLICY IF EXISTS "Users can view inventory items" ON property_inventory_items;
CREATE POLICY "Users can view inventory items" ON property_inventory_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage inventory items" ON property_inventory_items;
CREATE POLICY "Users can manage inventory items" ON property_inventory_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view key inventory" ON property_key_inventory;
CREATE POLICY "Users can view key inventory" ON property_key_inventory FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage key inventory" ON property_key_inventory;
CREATE POLICY "Users can manage key inventory" ON property_key_inventory FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view meter readings" ON property_meter_readings;
CREATE POLICY "Users can view meter readings" ON property_meter_readings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage meter readings" ON property_meter_readings;
CREATE POLICY "Users can manage meter readings" ON property_meter_readings FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view readiness checklists" ON property_readiness_checklist;
CREATE POLICY "Users can view readiness checklists" ON property_readiness_checklist FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage readiness checklists" ON property_readiness_checklist;
CREATE POLICY "Users can manage readiness checklists" ON property_readiness_checklist FOR ALL USING (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON property_inventory_items;
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON property_inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_readiness_checklist_updated_at ON property_readiness_checklist;
CREATE TRIGGER update_readiness_checklist_updated_at
  BEFORE UPDATE ON property_readiness_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
