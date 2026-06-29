-- Add expense-invoices storage bucket and RLS policies
-- This migration creates storage for expense invoice documents

-- Create storage bucket for expense invoices (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-invoices',
  'expense-invoices',
  false,
  10485760, -- 10MB limit (invoices can be larger)
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for expense-invoices bucket
-- Allow authenticated users to upload invoices
DROP POLICY IF EXISTS "Users can upload expense invoices" ON storage.objects;
CREATE POLICY "Users can upload expense invoices" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'expense-invoices' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view expense invoices
DROP POLICY IF EXISTS "Users can view expense invoices" ON storage.objects;
CREATE POLICY "Users can view expense invoices" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'expense-invoices');

-- Allow authenticated users to update their expense invoices
DROP POLICY IF EXISTS "Users can update expense invoices" ON storage.objects;
CREATE POLICY "Users can update expense invoices" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'expense-invoices')
WITH CHECK (bucket_id = 'expense-invoices');

-- Allow authenticated users to delete expense invoices
DROP POLICY IF EXISTS "Users can delete expense invoices" ON storage.objects;
CREATE POLICY "Users can delete expense invoices" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'expense-invoices');
