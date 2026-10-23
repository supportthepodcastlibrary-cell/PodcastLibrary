/*
# Fix broken eBook cover image URLs

## Problem
Several eBooks had cover_url pointing to non-existent Unsplash photo IDs (returning 404).
Only the Supabase Storage-uploaded images and the Pexels images were working correctly.

## Fix
Replace all broken Unsplash URLs with verified working Pexels image URLs.
The two Supabase-uploaded covers (The Art of Healthy Love, The Relationship Blueprint)
are confirmed working and left untouched.
*/

-- The Psychology of Belief (published — most critical)
UPDATE ebooks SET cover_url = 'https://images.pexels.com/photos/6192326/pexels-photo-6192326.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE title = 'The Psychology of Belief';

-- Meditations on Focus
UPDATE ebooks SET cover_url = 'https://images.pexels.com/photos/7880211/pexels-photo-7880211.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE title = 'Meditations on Focus';

-- The Anxiety Antidote
UPDATE ebooks SET cover_url = 'https://images.pexels.com/photos/5979734/pexels-photo-5979734.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE title = 'The Anxiety Antidote';

-- The Founder Playbook
UPDATE ebooks SET cover_url = 'https://images.pexels.com/photos/7413909/pexels-photo-7413909.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE title = 'The Founder Playbook';

-- From Zero to Launch
UPDATE ebooks SET cover_url = 'https://images.pexels.com/photos/28304274/pexels-photo-28304274.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE title = 'From Zero to Launch';

-- The Art of Bootstrapping
UPDATE ebooks SET cover_url = 'https://images.pexels.com/photos/4452604/pexels-photo-4452604.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
WHERE title = 'The Art of Bootstrapping';
