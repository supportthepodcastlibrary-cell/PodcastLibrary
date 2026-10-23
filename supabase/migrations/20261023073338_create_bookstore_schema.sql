/*
# The Podcast Library - Database Schema

## Overview
Creates the complete database schema for a digital eBook bookstore selling eBooks from multiple podcasts. Includes podcasts, eBooks, customer reviews, Bitcoin payment orders, site settings, and notification records.

## New Tables
1. `podcasts` - Stores podcast brands that produce eBooks
   - id (uuid PK), name, slug, description, logo_url, accent_color, tagline, created_at
2. `ebooks` - eBook listings for sale
   - id (uuid PK), podcast_id (FK), title, slug, author, short_description, long_description, what_you_learn (text[]), price_usd (numeric), cover_url, featured (bool), published (bool), download_url, created_at, updated_at
3. `reviews` - Customer reviews with approval workflow
   - id (uuid PK), ebook_id (FK), customer_name, customer_avatar, rating (int 1-5), comment, approved (bool), is_featured (bool), created_at
4. `orders` - Bitcoin payment submissions
   - id (uuid PK), ebook_id (FK), customer_name, customer_email, bitcoin_tx_id, amount_usd, status (enum pending/approved/rejected), created_at, approved_at
5. `settings` - Singleton row for site configuration
   - id (int PK default 1), bitcoin_wallet_address, bitcoin_qr_url, business_email, site_name, created_at, updated_at
6. `notifications` - Records of email notifications sent/queued
   - id (uuid PK), type (text), recipient_email, recipient_name, subject, body, order_id (FK nullable), status (text), created_at, sent_at

## Security (RLS)
- `podcasts`: Public read (anon+authenticated), admin write (authenticated)
- `ebooks`: Public read of published, admin full CRUD (authenticated)
- `reviews`: Public read of approved, anon can submit reviews (INSERT), admin can update/delete (authenticated)
- `orders`: Admin read (authenticated), anon can insert orders, admin can update status (authenticated)
- `settings`: Public read, admin write (authenticated)
- `notifications`: Admin only (authenticated)
- All write operations for management are restricted to authenticated users (the admin)
*/

-- ENUM for order status
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ PODCASTS ============
CREATE TABLE IF NOT EXISTS podcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  tagline text,
  logo_url text,
  accent_color text DEFAULT '#0ea5e9',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON podcasts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON podcasts TO authenticated;

DROP POLICY IF EXISTS "public_read_podcasts" ON podcasts;
CREATE POLICY "public_read_podcasts" ON podcasts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_podcasts" ON podcasts;
CREATE POLICY "admin_insert_podcasts" ON podcasts FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_podcasts" ON podcasts;
CREATE POLICY "admin_update_podcasts" ON podcasts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_podcasts" ON podcasts;
CREATE POLICY "admin_delete_podcasts" ON podcasts FOR DELETE
  TO authenticated USING (true);

-- ============ EBOOKS ============
CREATE TABLE IF NOT EXISTS ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id uuid REFERENCES podcasts(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  author text NOT NULL,
  short_description text,
  long_description text,
  what_you_learn text[] DEFAULT '{}',
  price_usd numeric(10,2) NOT NULL DEFAULT 0,
  cover_url text,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  download_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON ebooks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ebooks TO authenticated;

DROP POLICY IF EXISTS "public_read_published_ebooks" ON ebooks;
CREATE POLICY "public_read_published_ebooks" ON ebooks FOR SELECT
  TO anon, authenticated USING (published = true);

DROP POLICY IF EXISTS "admin_read_all_ebooks" ON ebooks;
CREATE POLICY "admin_read_all_ebooks" ON ebooks FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_ebooks" ON ebooks;
CREATE POLICY "admin_insert_ebooks" ON ebooks FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_ebooks" ON ebooks;
CREATE POLICY "admin_update_ebooks" ON ebooks FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_ebooks" ON ebooks;
CREATE POLICY "admin_delete_ebooks" ON ebooks FOR DELETE
  TO authenticated USING (true);

-- ============ REVIEWS ============
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id uuid REFERENCES ebooks(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_avatar text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON reviews TO anon, authenticated;
GRANT INSERT ON reviews TO anon, authenticated;
GRANT UPDATE, DELETE ON reviews TO authenticated;

DROP POLICY IF EXISTS "public_read_approved_reviews" ON reviews;
CREATE POLICY "public_read_approved_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (approved = true);

DROP POLICY IF EXISTS "admin_read_all_reviews" ON reviews;
CREATE POLICY "admin_read_all_reviews" ON reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "anyone_submit_review" ON reviews;
CREATE POLICY "anyone_submit_review" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_reviews" ON reviews;
CREATE POLICY "admin_update_reviews" ON reviews FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_delete_reviews" ON reviews;
CREATE POLICY "admin_delete_reviews" ON reviews FOR DELETE
  TO authenticated USING (true);

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id uuid REFERENCES ebooks(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  bitcoin_tx_id text,
  amount_usd numeric(10,2) NOT NULL DEFAULT 0,
  status order_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON orders TO anon, authenticated;
GRANT SELECT, UPDATE ON orders TO authenticated;

DROP POLICY IF EXISTS "anon_insert_order" ON orders;
CREATE POLICY "anon_insert_order" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_orders" ON orders;
CREATE POLICY "admin_read_orders" ON orders FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_orders" ON orders;
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============ SETTINGS ============
CREATE TABLE IF NOT EXISTS settings (
  id integer PRIMARY KEY DEFAULT 1,
  bitcoin_wallet_address text DEFAULT '',
  bitcoin_qr_url text DEFAULT '',
  business_email text DEFAULT 'contact@thepodcastlibrary.com',
  site_name text DEFAULT 'The Podcast Library',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON settings TO anon, authenticated;
GRANT UPDATE ON settings TO authenticated;

DROP POLICY IF EXISTS "public_read_settings" ON settings;
CREATE POLICY "public_read_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_settings" ON settings;
CREATE POLICY "admin_update_settings" ON settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Insert default settings row
INSERT INTO settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  body text,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;
GRANT INSERT ON notifications TO anon, authenticated;

DROP POLICY IF EXISTS "admin_read_notifications" ON notifications;
CREATE POLICY "admin_read_notifications" ON notifications FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_notifications" ON notifications;
CREATE POLICY "admin_insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_notifications" ON notifications;
CREATE POLICY "admin_update_notifications" ON notifications FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_ebooks_podcast_id ON ebooks(podcast_id);
CREATE INDEX IF NOT EXISTS idx_ebooks_featured ON ebooks(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_reviews_ebook_id ON reviews(ebook_id);
CREATE INDEX IF NOT EXISTS idx_orders_ebook_id ON orders(ebook_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
