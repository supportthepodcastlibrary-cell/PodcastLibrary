import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---- Types ----

export type Podcast = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tagline: string | null;
  logo_url: string | null;
  accent_color: string;
  created_at: string;
};

export type EbookStatus = 'published' | 'coming_soon' | 'draft';

export type Ebook = {
  id: string;
  podcast_id: string | null;
  title: string;
  slug: string;
  author: string;
  short_description: string | null;
  long_description: string | null;
  what_you_learn: string[] | null;
  price_usd: number;
  cover_url: string | null;
  featured: boolean;
  published: boolean;
  status: EbookStatus | null;
  download_url: string | null;
  created_at: string;
  updated_at: string;
  podcast?: Podcast | null;
};

export function isComingSoon(book: Ebook): boolean {
  return book.status === 'coming_soon';
}

export function isVisibleToCustomer(book: Ebook): boolean {
  return book.status === 'published' || book.status === 'coming_soon';
}

export function isPublished(book: Ebook): boolean {
  return book.status === 'published';
}

export type Review = {
  id: string;
  ebook_id: string | null;
  customer_name: string;
  customer_avatar: string | null;
  rating: number;
  comment: string;
  approved: boolean;
  is_featured: boolean;
  created_at: string;
  ebook?: Ebook | null;
};

export type OrderStatus = 'pending' | 'approved' | 'rejected';

export type Order = {
  id: string;
  ebook_id: string | null;
  customer_name: string;
  customer_email: string;
  bitcoin_tx_id: string | null;
  amount_usd: number;
  status: OrderStatus;
  created_at: string;
  approved_at: string | null;
  ebook?: Ebook | null;
};

export type Settings = {
  id: number;
  bitcoin_wallet_address: string;
  bitcoin_qr_url: string;
  business_email: string;
  site_name: string;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  type: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body: string | null;
  order_id: string | null;
  status: string;
  created_at: string;
  sent_at: string | null;
};

export type TicketStatus = 'open' | 'replied' | 'resolved';

export type SupportTicket = {
  id: string;
  customer_name: string;
  customer_email: string;
  subject: string;
  message: string;
  status: TicketStatus;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
};
