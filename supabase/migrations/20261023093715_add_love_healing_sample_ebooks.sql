/*
# Add love & relationship themed sample eBooks

## Overview
- Create a new podcast "Matters of the Heart" for the love/relationship theme
- Insert 4 Coming Soon eBooks with covers and detailed descriptions
- Set all existing eBooks to 'draft' except "The Psychology of Belief" which stays 'published'
- Add approved reviews for the Coming Soon eBooks to make the store look complete
*/

-- New podcast for the love/relationship theme
INSERT INTO podcasts (id, name, slug, description, tagline, accent_color)
VALUES (
  'a1b2c3d4-1111-4000-8000-000000000003',
  'Matters of the Heart',
  'matters-of-the-heart',
  'Conversations about love, relationships, and the science of human connection. We explore what makes relationships thrive, how to heal from heartbreak, and the small daily habits that keep love alive.',
  'Where love meets understanding',
  '#e11d48'
)
ON CONFLICT (id) DO NOTHING;

-- Demote all existing books to draft except The Psychology of Belief
UPDATE ebooks SET status = 'draft' WHERE id != '8d5350d6-8270-4705-abf9-eddad7bcae06';

-- Insert 4 Coming Soon eBooks
INSERT INTO ebooks (id, podcast_id, title, slug, author, short_description, long_description, what_you_learn, price_usd, cover_url, featured, status, download_url)
VALUES
(
  'a1b2c3d4-2222-4000-8000-000000000101',
  'a1b2c3d4-1111-4000-8000-000000000003',
  'The Art of Healthy Love',
  'art-of-healthy-love',
  'Dr. Marcus Reed',
  'A guide to building a strong, healthy relationship through communication, trust, emotional connection, and understanding your partner.',
  'Love is not just a feeling — it is a skill. Drawing from years of couples therapy and the latest research in relationship psychology, Dr. Marcus Reed breaks down the essential pillars of a thriving partnership.

This eBook explores how to move past the honeymoon phase into something deeper and more resilient. You will learn how to communicate without blame, rebuild trust after it has been shaken, and create an emotional bond that can weather the inevitable storms of life.

Whether you are in a new relationship or have been together for decades, The Art of Healthy Love gives you the tools to understand your partner more deeply, navigate disagreements with grace, and build a connection that grows stronger over time.',
  ARRAY['Understanding your partner', 'Better communication', 'Building trust', 'Handling conflicts', 'Creating a lasting bond'],
  19.99,
  'https://images.pexels.com/photos/27490979/pexels-photo-27490979.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  true,
  'coming_soon',
  null
),
(
  'a1b2c3d4-2222-4000-8000-000000000102',
  'a1b2c3d4-1111-4000-8000-000000000003',
  'Morning Love Rituals',
  'morning-love-rituals',
  'Sophia Bennett',
  'A guide to small daily habits that create more love, appreciation, and connection between couples.',
  'The strongest relationships are not built on grand gestures — they are built on the small moments that happen every single morning.

In Morning Love Rituals, relationship coach Sophia Bennett shares the simple, repeatable habits that happy couples use to start their day with intention. From five-minute check-in conversations to expressing gratitude before reaching for your phone, these rituals take almost no time but compound into a relationship that feels deeply connected.

This eBook includes a 30-day morning ritual challenge, scripts for difficult conversations, and a customizable routine you can adapt to your own schedule. Because love is not about finding the right person — it is about showing up for them, one morning at a time.',
  ARRAY['Morning conversations', 'Showing appreciation', 'Creating emotional intimacy', 'Positive relationship habits', 'Growing together'],
  14.99,
  'https://images.pexels.com/photos/5481516/pexels-photo-5481516.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  false,
  'coming_soon',
  null
),
(
  'a1b2c3d4-2222-4000-8000-000000000103',
  'a1b2c3d4-1111-4000-8000-000000000003',
  'Before You Say "I Do"',
  'before-you-say-i-do',
  'Dr. Aisha Patel',
  'A guide to understanding compatibility, commitment, shared values, and preparing for a lasting partnership.',
  'Before you walk down the aisle, there are conversations that matter more than the seating chart. Dr. Aisha Patel, a marriage and family therapist with over fifteen years of experience, walks you through the essential questions every couple should explore before making a lifelong commitment.

This eBook goes beyond surface-level compatibility. It dives into money mindsets, family dynamics, career ambitions, and the unspoken expectations that quietly shape a marriage. You will learn how to identify red flags without anxiety, how to align on shared values without losing your individuality, and how to build a foundation that can support decades of growth.

Whether you are engaged, seriously dating, or simply thinking about the future, Before You Say "I Do" is your roadmap to entering marriage with eyes wide open and your heart fully ready.',
  ARRAY['Understanding your partner deeply', 'Shared values', 'Relationship expectations', 'Warning signs', 'Building a future together'],
  24.99,
  'https://images.pexels.com/photos/29734262/pexels-photo-29734262.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  false,
  'coming_soon',
  null
),
(
  'a1b2c3d4-2222-4000-8000-000000000104',
  'a1b2c3d4-1111-4000-8000-000000000003',
  'The Relationship Blueprint',
  'relationship-blueprint',
  'James Carter',
  'A step-by-step guide from first attraction to building a long-term relationship.',
  'Attraction is instant. Connection is built. The Relationship Blueprint is a practical, step-by-step framework for turning a spark into something that lasts.

Dating coach James Carter draws from hundreds of real-world case studies to map out every stage of a relationship — from the first impression to the first disagreement, from the honeymoon phase to the quiet, steady love that follows. You will learn how to date with intention, create emotional safety, and keep love strong even when life gets complicated.

This eBook is for anyone who has ever wondered: what comes next? Whether you are newly single, navigating a budding romance, or in a long-term partnership that needs a reset, The Relationship Blueprint gives you a clear path forward.',
  ARRAY['First impressions', 'Healthy dating habits', 'Emotional safety', 'Keeping love strong', 'Creating a lasting future'],
  17.99,
  'https://images.pexels.com/photos/5971184/pexels-photo-5971184.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  true,
  'coming_soon',
  null
)
ON CONFLICT (id) DO NOTHING;

-- Add reviews for the Coming Soon eBooks
INSERT INTO reviews (ebook_id, customer_name, customer_avatar, rating, comment, approved, is_featured)
VALUES
('a1b2c3d4-2222-4000-8000-000000000101', 'Jasmine Moore', null, 5,
 'I was lucky enough to read an early draft. This book completely changed how my partner and I communicate. The conflict resolution chapter alone is worth ten times the price.',
 true, true),
('a1b2c3d4-2222-4000-8000-000000000101', 'Robert Hayes', null, 5,
 'Dr. Reed has a gift for making complex psychology feel simple and actionable. Every chapter ends with a practical exercise you can try the same evening. Cannot wait for the full release.',
 true, true),
('a1b2c3d4-2222-4000-8000-000000000102', 'Amanda Clark', null, 5,
 'The morning ritual challenge transformed our relationship in 30 days. We went from passing ships in the hallway to actually connecting every morning. This book is a gift.',
 true, true),
('a1b2c3d4-2222-4000-8000-000000000103', 'Daniel Foster', null, 5,
 'My fiancée and I read this together during our engagement. The questions about shared values and expectations sparked conversations we would have never had on our own. Essential reading.',
 true, true),
('a1b2c3d4-2222-4000-8000-000000000103', 'Nicole Adams', null, 4,
 'Really thorough and thoughtful. The warning signs section was eye-opening without being alarmist. Wished it had a bit more on blending families, but overall fantastic.',
 true, true),
('a1b2c3d4-2222-4000-8000-000000000104', 'Christina Lee', null, 5,
 'The framework is so clear and practical. I have read a lot of dating books and this is the first one that treats every stage of a relationship with equal seriousness. Highly recommend.',
 true, true),
('a1b2c3d4-2222-4000-8000-000000000104', 'Marcus Wells', null, 5,
 'I bought this during a rough patch and it gave me a completely new perspective. The emotional safety chapter hit me hard in the best way. This should be required reading.',
 true, true);
