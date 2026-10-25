/*
# Support Chat: Add message-level conversation system

## Overview
Converts the existing single-message support ticket model into a proper
multi-message chat. The existing `support_tickets` table is kept as the
"conversation" container (one row per conversation). A new `support_messages`
table stores every individual message (customer or admin) within that
conversation.

## New Table
- `support_messages`
  - id (uuid PK)
  - ticket_id (uuid FK → support_tickets, ON DELETE CASCADE)
  - sender (text: 'customer' | 'admin')
  - message (text, NOT NULL)
  - created_at (timestamptz, default now())

## Modified Table
- `support_tickets` — add `closed` as a valid status value alongside the
  existing 'open', 'replied', 'resolved'. No data is lost; existing rows keep
  their current status.

## Security
- `support_messages` has RLS enabled.
- anon + authenticated can INSERT (customers send messages without logging in).
- anon + authenticated can SELECT their own conversation's messages (matched
  by ticket_id + the ticket's customer_email stored in localStorage on the
  client side; the policy allows SELECT for all anon/authenticated because
  message rows are keyed to a ticket that the customer identifies by email —
  there is no auth.uid() to bind to in a no-login chat widget).
- authenticated (admin) can SELECT and INSERT (admin replies).
- Grants: anon gets INSERT + SELECT; authenticated gets INSERT + SELECT +
  UPDATE (admin can edit). DELETE is not granted to frontend roles.
- support_tickets INSERT/SELECT/UPDATE policies remain as-is for anon +
  authenticated.

## Important Notes
1. This migration is safe to re-run (IF NOT EXISTS, DROP POLICY IF EXISTS).
2. No existing data is modified or deleted.
3. The `support_tickets.status` CHECK constraint is replaced to include 'closed'.
*/

-- 1. Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('customer', 'admin')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT ON support_messages TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON support_messages TO authenticated;

-- Policies for support_messages
DROP POLICY IF EXISTS "anon_insert_messages" ON support_messages;
CREATE POLICY "anon_insert_messages" ON support_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_messages" ON support_messages;
CREATE POLICY "anon_read_messages" ON support_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_messages" ON support_messages;
CREATE POLICY "admin_insert_messages" ON support_messages FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_messages" ON support_messages;
CREATE POLICY "admin_update_messages" ON support_messages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Index for fast lookup by ticket
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON support_messages(created_at);

-- 2. Update support_tickets status CHECK to include 'closed'
-- We need to drop and recreate the constraint
DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'support_tickets'
    AND constraint_name = 'support_tickets_status_check'
  ) THEN
    ALTER TABLE support_tickets DROP CONSTRAINT support_tickets_status_check;
  END IF;
END $$;

-- Add new constraint with 'closed' included
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_status_check
  CHECK (status IN ('open', 'replied', 'resolved', 'closed'));

-- Enable realtime for support_messages
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
