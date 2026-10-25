/*
# Fix support chat: make support_tickets.message nullable

## Problem
The support_tickets table has `message text NOT NULL` from the original
schema. The new chat flow creates a ticket (conversation) first, then
sends individual messages via the support_messages table. The initial
ticket insert no longer includes a message, which violates the NOT NULL
constraint and causes "Could not start conversation" errors.

## Fix
Drop the NOT NULL constraint on support_tickets.message and set a default
of '' (empty string) so existing code that reads `ticket.message` still
works without null checks. No data is lost.

## Notes
- This is safe to re-run.
- The actual conversation content now lives in support_messages; the
  message column on support_tickets is kept for backward compatibility
  but is no longer required.
*/

ALTER TABLE support_tickets ALTER COLUMN message DROP NOT NULL;
ALTER TABLE support_tickets ALTER COLUMN message SET DEFAULT '';
