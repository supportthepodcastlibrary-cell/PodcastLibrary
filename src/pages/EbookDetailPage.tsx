import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/lib/router';
import { supabase, type Ebook, type Review, isComingSoon } from '@/lib/supabase';
import { StarRating } from '@/components/BookCard';
import BookCard from '@/components/BookCard';
import {
  ArrowLeft, ArrowRight, Bitcoin, Check, BookOpen,
  User, Star, Send, Clock, Download, Shield,
} from 'lucide-react';

export default function EbookDetailPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const [book, setBook] = useState<Ebook | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverError, setCoverError] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    setCoverError(false);
  }, [book?.cover_url]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ebooks')
        .select('*, podcast:podcasts(*)')
        .eq('slug', slug)
        .in('status', ['published', 'coming_soon'])
        .maybeSingle();

      if (error || !data) {
        setLoading(false);
        return;
      }

      const ebook = data as Ebook;
      setBook(ebook);

      const [reviewsRes, relatedRes] = await Promise.all([
        supabase.from('reviews').select('*').eq('ebook_id', ebook.id).eq('approved', true).order('created_at', { ascending: false }),
        supabase.from('ebooks').select('*, podcast:podcasts(*)').in('status', ['published', 'coming_soon']).neq('id', ebook.id).limit(4),
      ]);

      if (reviewsRes.data) setReviews(reviewsRes.data as Review[]);
      if (relatedRes.data) setRelated(relatedRes.data as Ebook[]);
      setLoading(false);
    })();
  }, [slug]);

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !reviewForm.name || !reviewForm.comment) return;
    const { error } = await supabase.from('reviews').insert({
      ebook_id: book.id,
      customer_name: reviewForm.name,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      approved: false,
    });
    if (!error) {
      setReviewSubmitted(true);
      setReviewForm({ name: '', rating: 5, comment: '' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <div className="animate-pulse text-ink-400 font-serif text-lg">Loading...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-ink-50 flex flex-col items-center justify-center gap-6">
        <BookOpen className="h-12 w-12 text-ink-300" strokeWidth={1} />
        <h1 className="font-serif text-2xl text-ink-900">Book not found</h1>
        <Link to="/ebooks" className="btn-outline">Back to Library</Link>
      </div>
    );
  }

  return (
    <div className="bg-ink-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Link to="/ebooks" className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-gold-600 transition-colors duration-300">
          <ArrowLeft className="h-4 w-4" /> Back to Library
        </Link>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Cover */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-sm">
              <div className="absolute -inset-6 bg-gradient-to-br from-gold-200/30 to-ink-200/20 rounded-3xl blur-3xl" />
              <div className="relative overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)] bg-white">
                {book.cover_url && !coverError ? (
                  <img
                    key={book.cover_url}
                    src={book.cover_url}
                    alt={book.title}
                    loading="eager"
                    decoding="async"
                    onError={() => setCoverError(true)}
                    className={`w-full aspect-[3/4] object-cover ${isComingSoon(book) ? 'blur-[2px] brightness-[0.6]' : ''}`}
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-ink-800 to-ink-950">
                    <div className="text-center px-8">
                      <BookOpen className="h-12 w-12 text-gold-400/40 mx-auto mb-4" strokeWidth={1} />
                      <span className="font-serif text-2xl text-gold-400 leading-tight">{book.title}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="lg:pt-8">
            {book.podcast && (
              <span className="badge bg-ink-100 text-ink-600 mb-5">
                {book.podcast.name}
              </span>
            )}
            <h1 className="font-serif text-4xl md:text-5xl text-ink-900 leading-tight">
              {book.title}
            </h1>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100">
                <User className="h-4 w-4 text-ink-500" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-ink-400 uppercase tracking-wide">Written by</p>
                <p className="text-sm font-medium text-ink-900">{book.author}</p>
              </div>
            </div>

            {reviews.length > 0 && (
              <div className="mt-5 flex items-center gap-3">
                <StarRating rating={avgRating} size={18} />
                <span className="text-sm text-ink-500">
                  {avgRating.toFixed(1)} · {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}

            <p className="mt-8 text-lg text-ink-500 leading-relaxed">{book.short_description}</p>

            {/* Price + Buy */}
            <div className="mt-10 rounded-2xl border border-ink-200/60 bg-white p-8">
              {isComingSoon(book) ? (
                <>
                  <div className="mb-5">
                    <div className="inline-flex items-center gap-2 rounded-full bg-ink-900 px-4 py-2 text-xs font-medium text-gold-400 mb-3">
                      <Clock className="h-3.5 w-3.5" /> Coming Soon
                    </div>
                    <p className="text-sm text-ink-500 leading-relaxed">
                      This book is currently in production. Be the first to know when it launches.
                    </p>
                  </div>
                  <button onClick={() => navigate('/ebooks')} className="btn-outline w-full text-base">
                    Browse Available Books
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">Price</p>
                      <p className="font-serif text-4xl text-ink-900">${book.price_usd.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-ink-400 uppercase tracking-wide mb-1">Payment</p>
                      <div className="flex items-center gap-1.5 text-ink-700">
                        <Bitcoin className="h-4 w-4 text-gold-600" />
                        <span className="text-sm font-medium">Bitcoin</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/checkout/${book.slug}`)} className="btn-gold w-full text-base">
                    Buy Now <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="mt-4 text-center text-xs text-ink-400">
                    Instant access after payment verification
                  </p>
                </>
              )}
            </div>

            {/* Quick facts */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: Download, label: 'Instant Download' },
                { icon: Shield, label: 'Lifetime Access' },
                { icon: Bitcoin, label: 'Bitcoin Payment' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2.5 rounded-xl border border-ink-200/60 bg-white p-4">
                  <Icon className="h-5 w-5 text-gold-600" strokeWidth={1.5} />
                  <span className="text-xs text-ink-500 text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className="bg-ink-100 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="section-label mb-4">About This Book</p>
          <p className="text-ink-600 leading-relaxed text-lg whitespace-pre-line">
            {book.long_description || book.short_description}
          </p>

          {book.what_you_learn && book.what_you_learn.length > 0 && (
            <div className="mt-12">
              <h3 className="font-serif text-2xl text-ink-900 mb-6">What You'll Learn</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {book.what_you_learn.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 border border-ink-200/60">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-ink-900" strokeWidth={3} />
                    </div>
                    <span className="text-sm text-ink-600 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-ink-50 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="section-label mb-4">Reader Reviews</p>
          <h2 className="font-serif text-3xl text-ink-900 mb-2">What Readers Say</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-3 mb-10">
              <StarRating rating={avgRating} size={20} />
              <span className="text-sm text-ink-500">{avgRating.toFixed(1)} out of 5 · {reviews.length} reviews</span>
            </div>
          )}

          {reviews.length > 0 ? (
            <div className="space-y-5 mb-10">
              {reviews.map((review) => (
                <div key={review.id} className="card p-6">
                  <div className="flex items-start gap-4">
                    {review.customer_avatar ? (
                      <img src={review.customer_avatar} alt={review.customer_name} loading="lazy" decoding="async" className="h-12 w-12 rounded-full object-cover ring-2 ring-gold-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-500 font-serif text-lg ring-2 ring-gold-200">
                        {review.customer_name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-ink-900">{review.customer_name}</p>
                          <StarRating rating={review.rating} size={12} />
                        </div>
                        <span className="text-xs text-ink-400">
                          {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-ink-600 leading-relaxed">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink-400 mb-10">Be the first to review this book.</p>
          )}

          <div className="card p-8">
            <h3 className="font-serif text-xl text-ink-900 mb-5">Write a Review</h3>
            {reviewSubmitted ? (
              <div className="flex items-center gap-3 rounded-xl bg-gold-100 p-4 text-gold-700">
                <Check className="h-5 w-5" />
                <p className="text-sm font-medium">Thank you! Your review has been submitted and is awaiting approval.</p>
              </div>
            ) : (
              <form onSubmit={submitReview} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Your Name</label>
                  <input type="text" required value={reviewForm.name} onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })} className="input" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })} className="transition-transform hover:scale-110">
                        <Star className={`h-7 w-7 ${star <= reviewForm.rating ? 'fill-gold-500 text-gold-500' : 'fill-ink-200 text-ink-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Your Review</label>
                  <textarea required rows={4} value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} className="input resize-none" placeholder="Share your thoughts about this book..." />
                </div>
                <button type="submit" className="btn-primary">
                  <Send className="h-4 w-4" /> Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-ink-100 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="section-label mb-3">Continue Reading</p>
                <h2 className="font-serif text-3xl md:text-4xl text-ink-900">You Might Also Like</h2>
              </div>
              <Link to="/ebooks" className="hidden sm:flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-gold-600 transition-colors duration-300">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {related.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
