/*
# Add status column to ebooks

## Overview
Adds a `status` text column to the ebooks table to support three states:
- 'published' — visible and purchasable
- 'coming_soon' — visible on site but not purchasable
- 'draft' — hidden from customers

## Changes
- Add `status` text column with CHECK constraint
- Backfill from existing `published` boolean: true → 'published', false → 'draft'
- Set default to 'draft' for new rows
*/

ALTER TABLE ebooks ADD COLUMN IF NOT EXISTS status text
  CHECK (status IN ('published', 'coming_soon', 'draft'));

UPDATE ebooks SET status = CASE WHEN published = true THEN 'published' ELSE 'draft' END
  WHERE status IS NULL;

ALTER TABLE ebooks ALTER COLUMN status SET DEFAULT 'draft';
