import { useState, useEffect } from 'react';
import { supabase, type Order } from '@/lib/supabase';
import { Search, Download, Eye } from 'lucide-react';

type Customer = {
  name: string;
  email: string;
  orders: Order[];
  totalSpent: number;
  booksPurchased: string[];
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('orders').select('*, ebook:ebooks(*)').order('created_at', { ascending: false });
      if (!data) return;
      const orders = data as Order[];

      const grouped: Record<string, Customer> = {};
      orders.forEach(o => {
        const key = o.customer_email;
        if (!grouped[key]) {
          grouped[key] = { name: o.customer_name, email: o.customer_email, orders: [], totalSpent: 0, booksPurchased: [] };
        }
        grouped[key].orders.push(o);
        if (o.status === 'approved') {
          grouped[key].totalSpent += Number(o.amount_usd);
          if (o.ebook?.title && !grouped[key].booksPurchased.includes(o.ebook.title)) {
            grouped[key].booksPurchased.push(o.ebook.title);
          }
        }
      });

      setCustomers(Object.values(grouped));
    })();
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink-900 mb-6">Customer Management</h1>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 border-b border-ink-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-ink-700">Customer</th>
                <th className="text-center px-4 py-3 font-semibold text-ink-700 hidden sm:table-cell">Orders</th>
                <th className="text-center px-4 py-3 font-semibold text-ink-700 hidden md:table-cell">Books</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-700">Total Spent</th>
                <th className="text-right px-4 py-3 font-semibold text-ink-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.email} className="border-b border-ink-100 hover:bg-ink-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{c.name}</div>
                    <div className="text-xs text-ink-500">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-ink-600 hidden sm:table-cell">{c.orders.length}</td>
                  <td className="px-4 py-3 text-center text-ink-600 hidden md:table-cell">{c.booksPurchased.length}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900">${c.totalSpent.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button onClick={() => setSelected(c)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-400">No customers found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ink-200 p-5 sticky top-0 bg-white">
              <h2 className="font-serif text-xl font-semibold text-ink-900">Customer Details</h2>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-ink-500 text-xs uppercase tracking-wide">Name</p>
                <p className="font-medium text-ink-900">{selected.name}</p>
              </div>
              <div>
                <p className="text-ink-500 text-xs uppercase tracking-wide">Email</p>
                <p className="font-medium text-ink-900">{selected.email}</p>
              </div>
              <div>
                <p className="text-ink-500 text-xs uppercase tracking-wide mb-2">Purchased Books</p>
                {selected.booksPurchased.length > 0 ? (
                  <div className="space-y-1.5">
                    {selected.booksPurchased.map(b => (
                      <div key={b} className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-700">
                        <Download className="h-4 w-4 text-gold-600" /> {b}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-ink-400">No approved purchases yet.</p>}
              </div>
              <div>
                <p className="text-ink-500 text-xs uppercase tracking-wide mb-2">Order History</p>
                <div className="space-y-2">
                  {selected.orders.map(o => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2 text-sm">
                      <div>
                        <div className="text-ink-900 font-medium">{o.ebook?.title || 'N/A'}</div>
                        <div className="text-xs text-ink-500">{new Date(o.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-ink-900">${o.amount_usd.toFixed(2)}</div>
                        <span className={`text-xs capitalize ${o.status === 'approved' ? 'text-green-600' : o.status === 'pending' ? 'text-gold-600' : 'text-red-500'}`}>{o.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
