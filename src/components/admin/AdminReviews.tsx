import { useState, useEffect } from 'react';
import { supabase, type Review } from '@/lib/supabase';
import { Check, X, Trash2, Edit2, Search, Star, Save } from 'lucide-react';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [editing, setEditing] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState({ customer_name: '', rating: 5, comment: '', is_featured: false });

  const loadReviews = async () => {
    const { data } = await supabase.from('reviews').select('*, ebook:ebooks(title)').order('created_at', { ascending: false });
    if (data) setReviews(data as Review[]);
  };

  useEffect(() => { loadReviews(); }, []);

  const toggleApproval = async (review: Review) => {
    await supabase.from('reviews').update({ approved: !review.approved }).eq('id', review.id);
    await loadReviews();
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    await loadReviews();
  };

  const openEdit = (r: Review) => {
    setEditing(r);
    setEditForm({ customer_name: r.customer_name, rating: r.rating, comment: r.comment, is_featured: r.is_featured });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    await supabase.from('reviews').update({
      customer_name: editForm.customer_name,
      rating: editForm.rating,
      comment: editForm.comment,
      is_featured: editForm.is_featured,
    }).eq('id', editing.id);
    setEditing(null);
    await loadReviews();
  };

  const addReview = async () => {
    const { data } = await supabase.from('reviews').insert({
      customer_name: 'New Customer',
      rating: 5,
      comment: 'Write your review here...',
      approved: true,
      is_featured: false,
    }).select().single();
    if (data) {
      await loadReviews();
      const newReview = data as Review;
      setEditing(newReview);
      setEditForm({ customer_name: 'New Customer', rating: 5, comment: 'Write your review here...', is_featured: false });
    }
  };

  const filtered = reviews.filter(r => {
    if (filter === 'approved' && !r.approved) return false;
    if (filter === 'pending' && r.approved) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.customer_name.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q) || (r.ebook?.title?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-ink-900">Review Management</h1>
        <button onClick={addReview} className="btn-primary">
          <Star className="h-4 w-4" /> Add Review
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input type="text" placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <div className="flex gap-2">
          {(['all', 'approved', 'pending'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((review) => (
          <div key={review.id} className="card p-4">
            <div className="flex items-start gap-4">
              {review.customer_avatar ? (
                <img src={review.customer_avatar} alt="" loading="lazy" decoding="async" className="h-10 w-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-200 text-ink-600 font-semibold text-sm shrink-0">
                  {review.customer_name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-ink-900 text-sm">{review.customer_name}</span>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-gold-500 text-gold-500' : 'fill-ink-200 text-ink-200'}`} />
                    ))}
                  </div>
                  {review.is_featured && <span className="badge bg-gold-500/20 text-gold-600">Featured</span>}
                  {review.approved ? <span className="badge bg-green-100 text-green-700">Approved</span> : <span className="badge bg-gold-500/20 text-gold-600">Pending</span>}
                </div>
                {review.ebook && <p className="text-xs text-ink-500 mt-0.5">on "{review.ebook.title}"</p>}
                <p className="text-sm text-ink-600 mt-2 line-clamp-2">{review.comment}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleApproval(review)} className="rounded-lg p-2 hover:bg-ink-100 transition-colors" title={review.approved ? 'Unapprove' : 'Approve'}>
                  {review.approved ? <X className="h-4 w-4 text-ink-500" /> : <Check className="h-4 w-4 text-green-600" />}
                </button>
                <button onClick={() => openEdit(review)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => deleteReview(review.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-ink-400">No reviews found.</div>}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ink-200 p-5">
              <h2 className="font-serif text-xl font-semibold text-ink-900">Edit Review</h2>
              <button onClick={() => setEditing(null)} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Customer Name</label>
                <input type="text" required value={editForm.customer_name} onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onClick={() => setEditForm({ ...editForm, rating: s })}>
                      <Star className={`h-7 w-7 transition-transform hover:scale-110 ${s <= editForm.rating ? 'fill-gold-500 text-gold-500' : 'fill-ink-200 text-ink-200'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Comment</label>
                <textarea rows={4} required value={editForm.comment} onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })} className="input resize-none" />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" checked={editForm.is_featured} onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })} className="rounded border-ink-300" />
                Show on homepage (Featured)
              </label>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1"><Save className="h-4 w-4" /> Save Review</button>
                <button type="button" onClick={() => setEditing(null)} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
