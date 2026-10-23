import { useState, useEffect, useMemo } from 'react';
import { supabase, type Ebook } from '@/lib/supabase';
import BookCard from '@/components/BookCard';
import { Search, BookOpen, Heart, Sparkles, Shield, Star, ArrowRight } from 'lucide-react';

const collections = [
  { name: 'All Books', slug: 'all', icon: BookOpen },
  { name: 'Love & Relationships', slug: 'love', icon: Heart },
  { name: 'Healing', slug: 'healing', icon: Sparkles },
  { name: 'Personal Growth', slug: 'growth', icon: BookOpen },
  { name: 'Confidence', slug: 'confidence', icon: Shield },
  { name: 'Inspiration', slug: 'inspiration', icon: Star },
  { name: 'Success', slug: 'success', icon: ArrowRight },
];

export default function EbooksPage() {
  const [books, setBooks] = useState<Ebook[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: ebooks } = await supabase
        .from('ebooks')
        .select('*, podcast:podcasts(*)')
        .in('status', ['published', 'coming_soon'])
        .order('created_at', { ascending: false });
      if (ebooks) setBooks(ebooks as Ebook[]);
      setLoading(false);
    })();
  }, []);

  const filteredBooks = useMemo(() => {
    let result = [...books];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.short_description?.toLowerCase().includes(q) ?? false)
      );
    }
    if (sortBy === 'price-low') result.sort((a, b) => a.price_usd - b.price_usd);
    else if (sortBy === 'price-high') result.sort((a, b) => b.price_usd - a.price_usd);
    return result;
  }, [books, search, sortBy]);

  return (
    <div>
      <section className="bg-ink-50 pt-12 pb-16 md:pt-20 md:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="section-label mb-4">Our Library</p>
          <h1 className="font-serif text-4xl md:text-6xl text-ink-900 leading-tight">The Library</h1>
          <p className="mt-6 text-lg text-ink-500 max-w-xl leading-relaxed">
            A curated collection of premium eBooks. Explore by theme, find your next read,
            and own it forever.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-ink-100 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Collection tabs */}
          <div className="mb-10 flex flex-wrap gap-2.5">
            {collections.map((col) => {
              const active = selectedCollection === col.slug;
              return (
                <button
                  key={col.slug}
                  onClick={() => setSelectedCollection(col.slug)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                    active
                      ? 'bg-ink-900 text-ink-50'
                      : 'bg-white text-ink-500 border border-ink-200 hover:border-ink-400 hover:text-ink-900'
                  }`}
                >
                  <col.icon className="h-3.5 w-3.5" />
                  {col.name}
                </button>
              );
            })}
          </div>

          {/* Filter bar */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search by title, author, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-11"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-low' | 'price-high')}
              className="input max-w-[200px] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          <p className="text-sm text-ink-500 mb-8">
            {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'} found
          </p>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-xl bg-ink-200/60" />
                  <div className="mt-5 h-5 bg-ink-200/60 rounded w-3/4" />
                  <div className="mt-2 h-4 bg-ink-200/40 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <BookOpen className="h-12 w-12 text-ink-300 mx-auto mb-4" strokeWidth={1} />
              <h3 className="font-serif text-xl text-ink-900 mb-2">No books found</h3>
              <p className="text-ink-500">Try adjusting your search or collection.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
