import { useState, useEffect } from 'react';
import type { Ebook } from '@/lib/supabase';
import { isComingSoon } from '@/lib/supabase';
import { Link } from '@/lib/router';
import { Star, ArrowUpRight, Clock } from 'lucide-react';

export function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          style={{ width: size, height: size }}
          className={
            star <= Math.round(rating)
              ? 'fill-gold-500 text-gold-500'
              : 'fill-ink-200 text-ink-200'
          }
        />
      ))}
    </div>
  );
}

function CoverImage({ src, alt, className, comingSoon }: { src: string | null; alt: string; className?: string; comingSoon?: boolean }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (!src || imgError) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-950 ${className ?? ''}`}>
        <div className="text-center px-4">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold-500/15">
              <span className="font-serif text-lg text-gold-400">B</span>
            </div>
          </div>
          <span className="font-serif text-sm text-gold-300/80 leading-snug">{alt}</span>
        </div>
      </div>
    );
  }

  return (
    <img
      key={src}
      src={src}
      alt={alt}
      className={`${className ?? ''} ${comingSoon ? 'blur-[2px] brightness-[0.5]' : ''}`}
      loading="lazy"
      decoding="async"
      onError={() => setImgError(true)}
    />
  );
}

export default function BookCard({ book, staticLayout = false }: { book: Ebook; staticLayout?: boolean }) {
  const comingSoon = isComingSoon(book);

  return (
    <Link
      to={`/ebooks/${book.slug}`}
      className="group block"
    >
      <div className={`relative aspect-[3/4] overflow-hidden rounded-xl bg-ink-100 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] transition-shadow duration-500 ${staticLayout ? '' : 'group-hover:shadow-[0_16px_45px_-12px_rgba(0,0,0,0.18)] group-hover:-translate-y-1'}`}>
        <CoverImage
          src={book.cover_url}
          alt={book.title}
          className={`h-full w-full object-cover ${staticLayout ? '' : 'transition-transform duration-700 group-hover:scale-[1.03]'}`}
          comingSoon={comingSoon}
        />

        {/* Coming Soon ribbon + overlay */}
        {comingSoon && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-ink-950/10 to-transparent" />
            <div className="absolute top-0 right-0">
              <div className="relative">
                <div className="bg-gold-500 text-ink-900 text-xs font-semibold px-4 py-2 rounded-bl-xl shadow-lg">
                  Coming Soon
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
              <p className="font-serif text-sm text-ink-50/80 tracking-wide">Not yet available</p>
            </div>
          </>
        )}

        {/* Published badge */}
        {!comingSoon && book.featured && (
          <span className="absolute top-3 left-3 badge bg-gold-500 text-ink-900">
            Bestseller
          </span>
        )}

        {/* Hover overlay — published only */}
        {!comingSoon && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-900/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink-50/95 opacity-0 translate-y-2 transition-all duration-400 group-hover:opacity-100 group-hover:translate-y-0">
              <ArrowUpRight className="h-4 w-4 text-ink-900" />
            </div>
          </>
        )}
      </div>

      <div className="mt-5 px-1">
        <h3 className="font-serif text-lg text-ink-900 leading-snug group-hover:text-gold-700 transition-colors duration-300 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-ink-500 mt-1.5 tracking-wide">by {book.author}</p>
        <p className="text-sm text-ink-500 mt-2 line-clamp-2 leading-relaxed">
          {book.short_description}
        </p>
        <div className="mt-4">
          {comingSoon ? (
            <div className="flex items-center gap-2 text-ink-400">
              <Clock className="h-4 w-4 text-gold-600" />
              <span className="text-sm font-medium">Coming Soon</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-serif text-xl text-ink-900">${book.price_usd.toFixed(2)}</span>
              <span className="text-xs font-medium text-gold-600 tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                View Details →
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
