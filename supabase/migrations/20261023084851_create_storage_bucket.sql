/*
# Create storage bucket for image uploads

## Overview
Creates a public storage bucket called 'images' for storing eBook cover images and Bitcoin QR codes uploaded by the admin.

## Changes
- Insert a row into storage.buckets for 'images' (public = true so uploaded files are publicly readable via their URL)
- Grant INSERT and SELECT to 'authenticated' so logged-in admin can upload and read files
- Grant SELECT to 'anon' so public website visitors can view the images
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users (admin) to upload files
GRANT INSERT ON storage.objects TO authenticated;

-- Allow both anon and authenticated to read (public bucket)
GRANT SELECT ON storage.objects TO anon, authenticated;

-- Policy: authenticated can upload
DROP POLICY IF EXISTS "admin_upload_images" ON storage.objects;
CREATE POLICY "admin_upload_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Policy: anyone can read (public images)
DROP POLICY IF EXISTS "public_read_images" ON storage.objects;
CREATE POLICY "public_read_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'images');

-- Policy: authenticated can delete (replace/remove old images)
DROP POLICY IF EXISTS "admin_delete_images" ON storage.objects;
CREATE POLICY "admin_delete_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- Policy: authenticated can update (overwrite)
DROP POLICY IF EXISTS "admin_update_images" ON storage.objects;
CREATE POLICY "admin_update_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');
