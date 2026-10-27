import { useState, useEffect } from 'react';
import { supabase, type Order } from '@/lib/supabase';
import { Check, X, Eye, Search } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadOrders = async () => {
    const { data } = await supabase.from('orders').select('*, ebook:ebooks(*)').order('created_at', { ascending: false });
    if (data) setOrders(data as Order[]);
  };

  useEffect(() => { loadOrders(); }, []);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    await supabase.from('orders').update({
      status,
      approved_at: status === 'approved' ? new Date().toISOString() : null,
    }).eq('id', id);

    const order = orders.find(o => o.id === id) || selected;
    if (order) {
      if (status === 'approved') {
        await supabase.from('notifications').insert({
          type: 'payment_approved',
          recipient_email: order.customer_email,
          recipient_name: order.customer_name,
          subject: 'Payment Verified — Your eBook Download Is Ready',
          body: `Hi \( {order.customer_name}, your Bitcoin payment for " \){order.ebook?.title}" has been verified. You can now download your eBook. Thank you for your purchase!`,
          order_id: order.id,
          status: 'pending',
        });
      } else if (status === 'rejected') {
        await supabase.from('notifications').insert({
          type: 'payment_rejected',
          recipient_email: order.customer_email,
          recipient_name: order.customer_name,
          subject: 'Payment Verification Issue',
          body: `Hi \( {order.customer_name}, we were unable to verify your Bitcoin payment for " \){order.ebook?.title}". Please contact us at support.thepodcastlibrary@gmail.com for assistance.`,
          order_id: order.id,
          status: 'pending',
        });
      }
    }

    setActionLoading(false);
    setSelected(null);
    await loadOrders();
  };

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.customer_name.toLowerCase().includes(q) || o.customer_email.toLowerCase().includes(q) || (o.bitcoin_tx_id?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gold-500/20 text-gold-600',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return <span className={`badge ${styles[status] || ''}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink-900 mb-6">Orders & Payments</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input type="text" placeholder="Search by name, email, or tx ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 border-b border-ink-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-ink-700">Customer</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-700 hidden md:table-cell">eBook</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-700">Amount</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-700 hidden sm:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-semibold text-ink-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-ink-100 hover:bg-ink-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{order.customer_name}</div>
                    <div className="text-xs text-ink-500">{order.customer_email}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-600 hidden md:table-cell">{order.ebook?.title || 'N/A'}</td>
                  <td className="px-4 py-3 font-semibold text-ink-900">${order.amount_usd.toFixed(2)}</td>
                  <td className="px-4 py-3">{statusBadge(order.status)}</td>
                  <td className="px-4 py-3 text-ink-500 hidden sm:table-cell text-xs">
                    {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelected(order)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      {order.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(order.id, 'approved')} className="rounded-lg p-2 text-green-600 hover:bg-green-50 transition-colors" title="Approve">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => updateStatus(order.id, 'rejected')} className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors" title="Reject">
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-400">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ink-200 p-5">
              <h2 className="font-serif text-xl font-semibold text-ink-900">Order Details</h2>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-ink-500 text-xs uppercase tracking-wide">Customer Name</p>
                  <p className="font-medium text-ink-900">{selected.customer_name}</p>
                </div>
                <div>
                  <p className="text-ink-500 text-xs uppercase tracking-wide">Customer Email</p>
                  <p className="font-medium text-ink-900">{selected.customer_email}</p>
                </div>
                <div>
                  <p className="text-ink-500 text-xs uppercase tracking-wide">eBook</p>
                  <p className="font-medium text-ink-900">{selected.ebook?.title || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-ink-500 text-xs uppercase tracking-wide">Amount</p>
                  <p className="font-medium text-ink-900">${selected.amount_usd.toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-ink-500 text-xs uppercase tracking-wide">Payment / Card Details</p>
                  <p className="font-mono text-xs text-ink-800 break-all bg-ink-50 rounded-lg p-2 mt-1">
                    {selected.bitcoin_tx_id || 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-ink-500 text-xs uppercase tracking-wide">Billing Address</p>
                  <p className="text-sm text-ink-800 bg-ink-50 rounded-lg p-2 mt-1 break-words">
                    {selected.billing_address || 'Not provided'}
                  </p>
                </div>
                <div>
                  <p className="text-ink-500 text-xs uppercase tracking-wide">Status</p>
                  <div className="mt-1">{statusBadge(selected.status)}</div>
                </div>
                <div>
                  <p className="text-ink-500 text-xs uppercase tracking-wide">Date</p>
                  <p className="font-medium text-ink-900 text-sm">{new Date(selected.created_at).toLocaleString()}</p>
                </div>
              </div>
              {selected.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <button onClick={() => updateStatus(selected.id, 'approved')} disabled={actionLoading} className="btn-primary flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60">
                    <Check className="h-4 w-4" /> Approve Payment
                  </button>
                  <button onClick={() => updateStatus(selected.id, 'rejected')} disabled={actionLoading} className="btn-outline text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-60">
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
                }
