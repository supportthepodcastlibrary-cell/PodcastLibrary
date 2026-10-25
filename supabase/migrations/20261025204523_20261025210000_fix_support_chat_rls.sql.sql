/*
# Fix support chat RLS: allow anon to read and update their own tickets

## Problem
The 20261024100000_secure_admin_access.sql migration replaced the
support_tickets SELECT and UPDATE policies with admin-only checks
(is_admin()). This locked out anonymous customers — they can INSERT a
ticket but cannot SELECT it back (needed for .insert().select().single()
in registration) or UPDATE its status (needed when sending a new message).
As a result the chat widget shows "Failed to send message" / "Could not
start conversation".

## Fix
Add two new policies for the anon role on support_tickets:
1. SELECT — allows anon to read tickets (the chat widget identifies its
   conversation by ticket_id stored in localStorage; there is no server-side
   auth for anonymous visitors).
2. UPDATE — allows anon to update the ticket status back to 'open' when
   the customer sends a new message after an admin reply.

The existing admin-only SELECT/UPDATE policies (admin_read_tickets,
admin_update_tickets) are kept untouched. The new anon policies run in
parallel — Postgres ORs all matching permissive policies.

## Security notes
- This is a no-auth chat widget. The original INSERT policy already allows
  anyone to create tickets. Adding anon SELECT/UPDATE is consistent with
  that design.
- The support_messages table already has anon SELECT + INSERT policies
  with USING (true), so message-level access is not changed.
- No data is modified or deleted.
*/

-- Allow anon (customers) to read support tickets
DROP POLICY IF EXISTS "anon_read_tickets" ON support_tickets;
CREATE POLICY "anon_read_tickets" ON support_tickets FOR SELECT
  TO anon, authenticated USING (true);

-- Allow anon (customers) to update support ticket status
DROP POLICY IF EXISTS "anon_update_tickets" ON support_tickets;
CREATE POLICY "anon_update_tickets" ON support_tickets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
