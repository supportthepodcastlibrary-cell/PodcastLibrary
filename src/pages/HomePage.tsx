import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/lib/router';
import { supabase, type Ebook, type Review } from '@/lib/supabase';
import BookCard, { StarRating } from '@/components/BookCard';
import {
  ArrowRight, BookOpen, Download, Shield, Sparkles, Quote, Mail, Star, Heart,
} from 'lucide-react';

const collections = [
  { name: 'Love & Relationships', slug: 'love', icon: Heart, desc: 'Deepen your connections and build lasting bonds.' },
  { name: 'Healing', slug: 'healing', icon: Sparkles, desc: 'Find peace, process pain, and begin again.' },
  { name: 'Personal Growth', slug: 'growth', icon: BookOpen, desc: 'Becoming the person you\'re meant to be.' },
  { name: 'Confidence', slug: 'confidence', icon: Shield, desc: 'Step into your power and own your worth.' },
  { name: 'Inspiration', slug: 'inspiration', icon: Star, desc: 'Stories that ignite your inner fire.' },
  { name: 'Success', slug: 'success', icon: ArrowRight, desc: 'Strategies for a life of purpose and achievement.' },
];

function HeroCover({ book }: { book: Ebook }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [book.cover_url]);

  if (!book.cover_url || imgError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-950">
        <span className="font-serif text-sm text-gold-300/80 p-3 text-center leading-tight">{book.title}</span>
      </div>
    );
  }

  return (
    <img
      key={book.cover_url}
      src={book.cover_url}
      alt={book.title}
      className="h-full w-full object-cover"
      loading="eager"
      onError={() => setImgError(true)}
    />
  );
}

export default function HomePage() {
  const { navigate } = useRouter();
  const [featuredBooks, setFeaturedBooks] = useState<Ebook[]>([]);
  const [testimonials, setTestimonials] = useState<Review[]>([]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: featured }, { data: reviews }] = await Promise.all([
        supabase.from('ebooks').select('*, podcast:podcasts(*)').in('status', ['published', 'coming_soon']).order('created_at', { ascending: false }).limit(8),
        supabase.from('reviews').select('*, ebook:ebooks(title)').eq('approved', true).eq('is_featured', true).limit(3),
      ]);
      if (featured) setFeaturedBooks(featured as Ebook[]);
      if (reviews) setTestimonials(reviews as Review[]);
    })();
  }, []);

  const featuredCollection = [...featuredBooks]
    .sort((a, b) => {
      const publishedRank = Number(b.status === 'published') - Number(a.status === 'published');
      if (publishedRank !== 0) return publishedRank;
      return Number(b.featured) - Number(a.featured);
    })
    .slice(0, 4);
  const heroBook = featuredCollection[0];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubscribed(true);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-50 pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="absolute top-20 right-0 h-96 w-96 rounded-full bg-gold-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-ink-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — text */}
            <div className="max-w-xl animate-fade-in-up">
              <p className="section-label mb-5">Premium Digital Library</p>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-ink-900 leading-[1.05]">
                Read. Heal.
                <br />
                <span className="text-gold-600 italic">Grow.</span>
              </h1>
              <p className="mt-8 text-lg text-ink-500 leading-relaxed max-w-md">
                Discover beautifully written digital books designed to inspire healing,
                confidence, relationships, personal growth, and success.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate('/ebooks')} className="btn-primary">
                  Explore Library
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => navigate('/ebooks')} className="btn-outline">
                  Browse Collections
                </button>
              </div>
            </div>

            {/* Right — single published book */}
            <div className="flex items-center justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {heroBook ? (
                <div className="w-[min(88vw,380px)] aspect-[2/3] overflow-hidden rounded-xl bg-ink-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)]">
                  <HeroCover book={heroBook} />
                </div>
              ) : (
                <div className="w-[min(88vw,380px)] aspect-[2/3] rounded-xl bg-ink-100 shadow-2xl flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-ink-300" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-20 md:py-28 bg-ink-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="section-label mb-3">Featured Collection</p>
              <h2 className="font-serif text-3xl md:text-5xl text-ink-900">Editor's Picks</h2>
            </div>
            <Link to="/ebooks" className="hidden sm:flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-gold-600 transition-colors duration-300">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mx-auto max-w-4xl grid grid-cols-2 gap-4 sm:gap-8 lg:gap-10">
            {featuredCollection.map((book) => (
              <BookCard key={book.id} book={book} staticLayout />
            ))}
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="py-20 md:py-28 bg-ink-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="section-label mb-3">Browse by Theme</p>
            <h2 className="font-serif text-3xl md:text-5xl text-ink-900">Collections</h2>
            <p className="mt-4 text-ink-500 max-w-lg mx-auto leading-relaxed">
              Each collection is a curated bookshelf — explore by what moves you.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => (
              <button
                key={col.slug}
                onClick={() => navigate('/ebooks')}
                className="group flex items-center gap-5 rounded-2xl border border-ink-200/60 bg-white px-6 py-6 text-left transition-all duration-400 hover:shadow-[0_15px_50px_-15px_rgba(0,0,0,0.1)] hover:border-gold-300"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-ink-100 transition-colors duration-300 group-hover:bg-gold-100">
                  <col.icon className="h-6 w-6 text-gold-600" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-lg text-ink-900 leading-snug">{col.name}</h3>
                  <p className="text-sm text-ink-500 mt-1 leading-relaxed">{col.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-300 transition-all duration-300 group-hover:text-gold-600 group-hover:translate-x-1 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-20 md:py-28 bg-ink-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="section-label mb-3">Why The Podcast Library</p>
            <h2 className="font-serif text-3xl md:text-5xl text-ink-900">A reading experience built for you</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Download, title: 'Instant Download', desc: 'Get your eBook immediately after payment verification.' },
              { icon: Shield, title: 'Secure Payment', desc: 'Bitcoin transactions — private, borderless, and permanent.' },
              { icon: BookOpen, title: 'Lifetime Access', desc: 'Buy once, read forever. No subscriptions, no DRM.' },
              { icon: Sparkles, title: 'Premium Reading', desc: 'Beautifully formatted for every device and screen.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm mb-5 transition-transform duration-300 hover:scale-105">
                  <Icon className="h-7 w-7 text-gold-600" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-lg text-ink-900 mb-2">{title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed max-w-[220px] mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-20 md:py-28 bg-ink-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="section-label mb-3">What Readers Say</p>
              <h2 className="font-serif text-3xl md:text-5xl text-ink-900">Loved by Readers</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((review) => (
                <div key={review.id} className="flex flex-col items-center text-center">
                  {review.customer_avatar ? (
                    <img src={review.customer_avatar} alt={review.customer_name} loading="lazy" decoding="async" className="h-16 w-16 rounded-full object-cover ring-2 ring-gold-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-100 text-ink-500 font-serif text-xl ring-2 ring-gold-200">
                      {review.customer_name.charAt(0)}
                    </div>
                  )}
                  <Quote className="h-6 w-6 text-gold-400 mt-6 mb-4" />
                  <p className="text-ink-600 leading-relaxed italic text-[15px] max-w-xs">"{review.comment}"</p>
                  <div className="mt-6">
                    <p className="text-sm font-medium text-ink-900">{review.customer_name}</p>
                    <div className="mt-1.5 flex justify-center">
                      <StarRating rating={review.rating} size={13} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-20 md:py-28 bg-ink-100">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-gold-100">
            <Mail className="h-6 w-6 text-gold-600" strokeWidth={1.5} />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-ink-900 mb-4">
            New releases, delivered gently
          </h2>
          <p className="text-ink-500 mb-8 max-w-md mx-auto leading-relaxed">
            Be the first to know when new eBooks arrive. No spam, just beautiful books.
          </p>
          {subscribed ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-gold-100 px-6 py-3 text-gold-700 font-medium">
              <Star className="h-5 w-5 fill-gold-500 text-gold-500" />
              You're subscribed. Welcome aboard.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-full border border-ink-200 bg-white px-5 py-3.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/15 transition-colors"
              />
              <button type="submit" className="btn-gold whitespace-nowrap">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
