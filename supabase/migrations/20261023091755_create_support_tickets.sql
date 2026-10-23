/*
# Create support tickets table

## Overview
Creates a support_tickets table for customers to submit support requests via a floating button on the website.

## New Table
- `support_tickets`
  - id (uuid PK)
  - customer_name (text, not null)
  - customer_email (text, not null)
  - subject (text, optional)
  - message (text, not null)
  - status (text: 'open' | 'replied' | 'resolved', default 'open')
  - admin_reply (text, nullable — admin can store their reply note)
  - created_at (timestamptz)
  - updated_at (timestamptz)

## Security (RLS)
- anon + authenticated can INSERT (customers submit tickets without logging in)
- authenticated (admin) can SELECT, UPDATE (view and manage tickets)
- Public cannot read tickets
*/

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  subject text DEFAULT '',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'resolved')),
  admin_reply text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON support_tickets TO anon, authenticated;
GRANT SELECT, UPDATE ON support_tickets TO authenticated;

DROP POLICY IF EXISTS "anon_submit_ticket" ON support_tickets;
CREATE POLICY "anon_submit_ticket" ON support_tickets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_tickets" ON support_tickets;
CREATE POLICY "admin_read_tickets" ON support_tickets FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_tickets" ON support_tickets;
CREATE POLICY "admin_update_tickets" ON support_tickets FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);
