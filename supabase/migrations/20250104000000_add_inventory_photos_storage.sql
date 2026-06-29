-- Add inventory-photos storage bucket and RLS policies
-- This migration creates storage for inventory item photos

-- Create storage bucket for inventory photos (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventory-photos',
  'inventory-photos',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for inventory-photos bucket
-- Allow authenticated users to upload photos
DROP POLICY IF EXISTS "Users can upload inventory photos" ON storage.objects;
CREATE POLICY "Users can upload inventory photos" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'inventory-photos' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view inventory photos
DROP POLICY IF EXISTS "Users can view inventory photos" ON storage.objects;
CREATE POLICY "Users can view inventory photos" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'inventory-photos');

-- Allow authenticated users to update their inventory photos
DROP POLICY IF EXISTS "Users can update inventory photos" ON storage.objects;
CREATE POLICY "Users can update inventory photos" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'inventory-photos')
WITH CHECK (bucket_id = 'inventory-photos');

-- Allow authenticated users to delete inventory photos
DROP POLICY IF EXISTS "Users can delete inventory photos" ON storage.objects;
CREATE POLICY "Users can delete inventory photos" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'inventory-photos');
