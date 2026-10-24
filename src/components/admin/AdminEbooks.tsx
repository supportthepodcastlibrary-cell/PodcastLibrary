import { useState, useEffect } from 'react';
import { supabase, type Ebook, type EbookStatus, type Podcast } from '@/lib/supabase';
import { Plus, Edit2, Copy, Trash2, X, Save, Search, Eye, EyeOff, Rocket, Calendar, FileEdit, BookOpen } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

const statusConfig: Record<EbookStatus, { label: string; badge: string; icon: typeof Eye }> = {
  published: { label: 'Published', badge: 'bg-green-100 text-green-700', icon: Rocket },
  coming_soon: { label: 'Coming Soon', badge: 'bg-ink-900 text-gold-400', icon: Calendar },
  draft: { label: 'Draft', badge: 'bg-ink-100 text-ink-600', icon: FileEdit },
};

const emptyForm = {
  title: '', slug: '', author: '', short_description: '', long_description: '',
  what_you_learn: [''], price_usd: 0, cover_url: '', podcast_id: '', featured: false, status: 'draft' as EbookStatus, download_url: '',
};

export default function AdminEbooks() {
  const [books, setBooks] = useState<Ebook[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Ebook | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadBooks = async () => {
    const { data } = await supabase.from('ebooks').select('*, podcast:podcasts(*)').order('created_at', { ascending: false });
    if (data) setBooks(data as Ebook[]);
  };

  useEffect(() => {
    (async () => {
      await loadBooks();
      const { data: pods } = await supabase.from('podcasts').select('*').order('name');
      if (pods) setPodcasts(pods as Podcast[]);
    })();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (book: Ebook) => {
    setEditing(book);
    setForm({
      title: book.title, slug: book.slug, author: book.author,
      short_description: book.short_description || '', long_description: book.long_description || '',
      what_you_learn: book.what_you_learn || [''], price_usd: book.price_usd,
      cover_url: book.cover_url || '', podcast_id: book.podcast_id || '',
      featured: book.featured, status: book.status || 'draft', download_url: book.download_url || '',
    });
    setShowForm(true);
  };

  const duplicateBook = (book: Ebook) => {
    const copySuffix = Date.now().toString(36);
    setEditing(null);
    setForm({
      title: `${book.title} (Copy)`,
      slug: `${book.slug || book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-copy-${copySuffix}`,
      author: book.author,
      short_description: book.short_description || '',
      long_description: book.long_description || '',
      what_you_learn: book.what_you_learn?.length ? [...book.what_you_learn] : [''],
      price_usd: book.price_usd,
      cover_url: book.cover_url || '',
      podcast_id: book.podcast_id || '',
      featured: book.featured,
      // Keep copies hidden until the admin reviews and publishes them.
      status: 'draft',
      download_url: book.download_url || '',
    });
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      what_you_learn: form.what_you_learn.filter(s => s.trim()),
      podcast_id: form.podcast_id || null,
      cover_url: form.cover_url || null,
    };

    try {
      const result = editing
        ? await supabase.from('ebooks').update(payload).eq('id', editing.id)
        : await supabase.from('ebooks').insert(payload);

      if (result.error) {
        alert(`Could not save eBook: ${result.error.message}`);
        return;
      }

      setShowForm(false);
      await loadBooks();
    } catch (error) {
      alert(`Could not save eBook: ${error instanceof Error ? error.message : 'An unexpected error occurred.'}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteBook = async (id: string) => {
    if (!confirm('Delete this eBook? This cannot be undone.')) return;
    await supabase.from('ebooks').delete().eq('id', id);
    await loadBooks();
  };

  const setStatus = async (book: Ebook, status: EbookStatus) => {
    await supabase.from('ebooks').update({ status }).eq('id', book.id);
    await loadBooks();
  };

  const toggleVisibility = async (book: Ebook) => {
    const isHidden = (book.status || 'draft') === 'draft';
    const newStatus: EbookStatus = isHidden ? 'published' : 'draft';
    await supabase.from('ebooks').update({ status: newStatus }).eq('id', book.id);
    await loadBooks();
  };

  const filtered = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-ink-900">eBook Management</h1>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" /> Add eBook
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input type="text" placeholder="Search eBooks..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 border-b border-ink-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-ink-700">Cover</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-700">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-700 hidden md:table-cell">Author</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-700">Price</th>
                <th className="text-center px-4 py-3 font-semibold text-ink-700 hidden sm:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-ink-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((book) => {
                const bStatus = (book.status || 'draft') as EbookStatus;
                const StatusIcon = statusConfig[bStatus].icon;
                return (
                <tr key={book.id} className="border-b border-ink-100 hover:bg-ink-50/50">
                  <td className="px-4 py-3">
                    <div className="h-14 w-10 overflow-hidden rounded bg-gradient-to-br from-ink-700 to-ink-950 flex items-center justify-center">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <BookOpen className="h-4 w-4 text-gold-400/50" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{book.title}</div>
                    {book.podcast && <div className="text-xs text-ink-500">{book.podcast.name}</div>}
                  </td>
                  <td className="px-4 py-3 text-ink-600 hidden md:table-cell">{book.author}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900">${book.price_usd.toFixed(2)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="flex flex-col gap-2 items-center">
                      {(bStatus === 'published' || bStatus === 'coming_soon') && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setStatus(book, 'published')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                              bStatus === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-ink-50 text-ink-400 hover:bg-ink-100'
                            }`}
                          >
                            Published
                          </button>
                          <button
                            onClick={() => setStatus(book, 'coming_soon')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                              bStatus === 'coming_soon'
                                ? 'bg-ink-900 text-gold-400'
                                : 'bg-ink-50 text-ink-400 hover:bg-ink-100'
                            }`}
                          >
                            Coming Soon
                          </button>
                        </div>
                      )}
                      {bStatus === 'draft' && (
                        <span className="badge bg-ink-100 text-ink-500">
                          <FileEdit className="h-3 w-3" /> Draft (hidden)
                        </span>
                      )}
                      {book.featured && <span className="badge bg-gold-500/20 text-gold-600">Featured</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleVisibility(book)}
                        title={(book.status || 'draft') === 'draft' ? 'Show to customers' : 'Hide from customers'}
                        className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors"
                      >
                        {(book.status || 'draft') === 'draft' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => openEdit(book)} title="Edit eBook" aria-label={`Edit ${book.title}`} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => duplicateBook(book)} title="Duplicate eBook" aria-label={`Duplicate ${book.title}`} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteBook(book.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-2xl my-8 rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ink-200 p-5">
              <h2 className="font-serif text-xl font-semibold text-ink-900">{editing ? 'Edit eBook' : 'Add New eBook'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={save} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Title</label>
                  <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Slug (URL)</label>
                  <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input" placeholder="auto-generated from title" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Author</label>
                  <input type="text" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Podcast</label>
                  <select value={form.podcast_id} onChange={(e) => setForm({ ...form, podcast_id: e.target.value })} className="input">
                    <option value="">None</option>
                    {podcasts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Short Description</label>
                <textarea rows={2} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className="input resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Long Description</label>
                <textarea rows={5} value={form.long_description} onChange={(e) => setForm({ ...form, long_description: e.target.value })} className="input resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">What You'll Learn (one per line)</label>
                <textarea
                  rows={4}
                  value={form.what_you_learn.join('\n')}
                  onChange={(e) => setForm({ ...form, what_you_learn: e.target.value.split('\n') })}
                  className="input resize-none"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Price (USD)</label>
                  <input type="number" step="0.01" required value={form.price_usd} onChange={(e) => setForm({ ...form, price_usd: parseFloat(e.target.value) || 0 })} className="input" />
                </div>
                <div>
                  <ImageUpload
                    label="Cover Image"
                    value={form.cover_url}
                    onChange={(url) => setForm({ ...form, cover_url: url })}
                    aspectRatio="aspect-[3/4]"
                    folder="covers"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Download URL (sent after approval)</label>
                <input type="url" value={form.download_url} onChange={(e) => setForm({ ...form, download_url: e.target.value })} className="input" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Visibility & Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['draft', 'coming_soon', 'published'] as EbookStatus[]).map((s) => {
                    const Icon = statusConfig[s].icon;
                    const active = form.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, status: s })}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${active ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-300'}`}
                      >
                        <Icon className={`h-5 w-5 ${active ? 'text-ink-900' : 'text-ink-400'}`} />
                        <span className={`text-xs font-semibold ${active ? 'text-ink-900' : 'text-ink-500'}`}>{statusConfig[s].label}</span>
                      </button>
                    );
                  })}
                </div>
                {form.status === 'draft' && (
                  <p className="mt-2 text-xs text-ink-500">This eBook is hidden from all customers. It will only appear here in the admin dashboard.</p>
                )}
                {form.status === 'coming_soon' && (
                  <p className="mt-2 text-xs text-ink-500">This eBook will be visible on the store with a "Coming Soon" badge. Customers can view details but cannot purchase it.</p>
                )}
                {form.status === 'published' && (
                  <p className="mt-2 text-xs text-ink-500">This eBook is fully live â€” visible on the store and available for purchase with Bitcoin.</p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded border-ink-300" />
                  Featured on homepage
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save eBook'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
