-- ============================================================
-- Agreement Layout Settings Table
-- Allows customization of print layout properties via Settings UI
-- ============================================================

CREATE TABLE IF NOT EXISTS agreement_layout_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  key text UNIQUE NOT NULL DEFAULT 'default',
  
  -- Page Setup
  page_size text DEFAULT 'A4', -- A4, Letter, Legal
  page_orientation text DEFAULT 'portrait', -- portrait, landscape
  margin_top text DEFAULT '20mm',
  margin_right text DEFAULT '15mm',
  margin_bottom text DEFAULT '25mm',
  margin_left text DEFAULT '15mm',
  
  -- Typography
  font_family text DEFAULT 'Times New Roman', -- Times New Roman, Arial, Georgia
  base_font_size text DEFAULT '11pt',
  line_height numeric DEFAULT 1.8,
  heading1_size text DEFAULT '28pt',
  heading2_size text DEFAULT '16pt',
  heading3_size text DEFAULT '13pt',
  
  -- Colors
  heading_color text DEFAULT '#1a1a1a',
  text_color text DEFAULT '#000000',
  border_color text DEFAULT '#333333',
  
  -- Cover Page
  logo_max_height text DEFAULT '80px',
  logo_max_width text DEFAULT '250px',
  cover_title_size text DEFAULT '28pt',
  cover_subtitle_size text DEFAULT '14pt',
  show_cover_page boolean DEFAULT true,
  
  -- Signatures
  signature_image_height text DEFAULT '60px',
  signature_block_spacing text DEFAULT '40px',
  show_signatures_inline boolean DEFAULT true,
  show_signature_page boolean DEFAULT true,
  
  -- Footer
  footer_text text DEFAULT 'This agreement is generated on {date}',
  show_page_numbers boolean DEFAULT true,
  page_number_position text DEFAULT 'bottom-center', -- bottom-center, bottom-right
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE agreement_layout_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and write
CREATE POLICY "Allow authenticated users to read agreement layout settings"
  ON agreement_layout_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update agreement layout settings"
  ON agreement_layout_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert agreement layout settings"
  ON agreement_layout_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_agreement_layout_settings_key ON agreement_layout_settings(key);

-- Insert default settings row
INSERT INTO agreement_layout_settings (key) 
VALUES ('default')
ON CONFLICT (key) DO NOTHING;
