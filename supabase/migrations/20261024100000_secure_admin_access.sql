/*
  Secure admin access.

  Only Supabase Auth users whose app_metadata.role is exactly 'admin'
  may read or modify administrative data.

  IMPORTANT: after applying this migration, set the intended administrator's
  app_metadata role to "admin" in Supabase Auth (or run the SQL shown below).
*/

-- Helper used by every RLS policy below. SECURITY DEFINER avoids recursive
-- policy checks while still reading only the current user's JWT claims.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- Podcasts
DROP POLICY IF EXISTS "admin_insert_podcasts" ON podcasts;
CREATE POLICY "admin_insert_podcasts" ON podcasts FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_podcasts" ON podcasts;
CREATE POLICY "admin_update_podcasts" ON podcasts FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_podcasts" ON podcasts;
CREATE POLICY "admin_delete_podcasts" ON podcasts FOR DELETE TO authenticated USING (public.is_admin());

-- eBooks
DROP POLICY IF EXISTS "admin_read_all_ebooks" ON ebooks;
CREATE POLICY "admin_read_all_ebooks" ON ebooks FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_insert_ebooks" ON ebooks;
CREATE POLICY "admin_insert_ebooks" ON ebooks FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_ebooks" ON ebooks;
CREATE POLICY "admin_update_ebooks" ON ebooks FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_ebooks" ON ebooks;
CREATE POLICY "admin_delete_ebooks" ON ebooks FOR DELETE TO authenticated USING (public.is_admin());

-- Reviews
DROP POLICY IF EXISTS "admin_read_all_reviews" ON reviews;
CREATE POLICY "admin_read_all_reviews" ON reviews FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_update_reviews" ON reviews;
CREATE POLICY "admin_update_reviews" ON reviews FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_reviews" ON reviews;
CREATE POLICY "admin_delete_reviews" ON reviews FOR DELETE TO authenticated USING (public.is_admin());

-- Orders
DROP POLICY IF EXISTS "admin_read_orders" ON orders;
CREATE POLICY "admin_read_orders" ON orders FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Settings
DROP POLICY IF EXISTS "admin_update_settings" ON settings;
CREATE POLICY "admin_update_settings" ON settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Notifications
DROP POLICY IF EXISTS "admin_read_notifications" ON notifications;
CREATE POLICY "admin_read_notifications" ON notifications FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_insert_notifications" ON notifications;
CREATE POLICY "admin_insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_notifications" ON notifications;
CREATE POLICY "admin_update_notifications" ON notifications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Support tickets
DROP POLICY IF EXISTS "admin_read_tickets" ON support_tickets;
CREATE POLICY "admin_read_tickets" ON support_tickets FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "admin_update_tickets" ON support_tickets;
CREATE POLICY "admin_update_tickets" ON support_tickets FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Storage: only admins may upload/change/delete admin images.
DROP POLICY IF EXISTS "admin_upload_images" ON storage.objects;
CREATE POLICY "admin_upload_images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images' AND public.is_admin());
DROP POLICY IF EXISTS "admin_delete_images" ON storage.objects;
CREATE POLICY "admin_delete_images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'images' AND public.is_admin());
DROP POLICY IF EXISTS "admin_update_images" ON storage.objects;
CREATE POLICY "admin_update_images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'images' AND public.is_admin()) WITH CHECK (bucket_id = 'images' AND public.is_admin());

-- The admin signup flow has intentionally been removed from the frontend.
-- To grant the existing admin account access, run this once in Supabase SQL Editor,
-- replacing the email with the actual administrator email:
--
-- UPDATE auth.users
-- SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- WHERE email = 'YOUR-ADMIN-EMAIL@example.com';
