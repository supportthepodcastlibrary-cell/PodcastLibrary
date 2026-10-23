import { useState, useEffect } from 'react';
import { supabase, type SupportTicket, type TicketStatus } from '@/lib/supabase';
import { Search, Eye, X, Send, Clock, CheckCircle, MessageSquare } from 'lucide-react';

export default function AdminTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | TicketStatus>('all');
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTickets = async () => {
    const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (data) setTickets(data as SupportTicket[]);
  };

  useEffect(() => { loadTickets(); }, []);

  const updateStatus = async (id: string, status: TicketStatus) => {
    await supabase.from('support_tickets').update({
      status,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    await loadTickets();
    if (selected?.id === id) {
      setSelected({ ...selected, status });
    }
  };

  const saveReply = async () => {
    if (!selected || !reply.trim()) return;
    setSaving(true);
    await supabase.from('support_tickets').update({
      admin_reply: reply,
      status: 'replied',
      updated_at: new Date().toISOString(),
    }).eq('id', selected.id);
    setSaving(false);
    setReply('');
    await loadTickets();
    setSelected({ ...selected, admin_reply: reply, status: 'replied' });
  };

  const openTicket = (ticket: SupportTicket) => {
    setSelected(ticket);
    setReply(ticket.admin_reply || '');
  };

  const filtered = tickets.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.customer_name.toLowerCase().includes(q) || t.customer_email.toLowerCase().includes(q) || t.message.toLowerCase().includes(q);
    }
    return true;
  });

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-gold-500/20 text-gold-600',
      replied: 'bg-blue-100 text-blue-700',
      resolved: 'bg-green-100 text-green-700',
    };
    return <span className={`badge ${styles[status] || ''}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const statusIcon = (status: string) => {
    if (status === 'open') return <Clock className="h-3.5 w-3.5" />;
    if (status === 'replied') return <MessageSquare className="h-3.5 w-3.5" />;
    return <CheckCircle className="h-3.5 w-3.5" />;
  };

  const openCount = tickets.filter(t => t.status === 'open').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-ink-900">Support Tickets</h1>
        {openCount > 0 && (
          <span className="badge bg-gold-500/20 text-gold-600">
            <Clock className="h-3.5 w-3.5" /> {openCount} open
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input type="text" placeholder="Search by name, email, or message..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </div>
        <div className="flex gap-2">
          {(['all', 'open', 'replied', 'resolved'] as const).map(f => (
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
                <th className="text-left px-4 py-3 font-semibold text-ink-700 hidden md:table-cell">Message</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-700 hidden sm:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-semibold text-ink-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => (
                <tr key={ticket.id} className="border-b border-ink-100 hover:bg-ink-50/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{ticket.customer_name}</div>
                    <div className="text-xs text-ink-500">{ticket.customer_email}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-600 hidden md:table-cell max-w-xs">
                    <p className="truncate">{ticket.message}</p>
                  </td>
                  <td className="px-4 py-3">{statusBadge(ticket.status)}</td>
                  <td className="px-4 py-3 text-ink-500 hidden sm:table-cell text-xs">
                    {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button onClick={() => openTicket(ticket)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-400">No support tickets found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ink-200 p-5 sticky top-0 bg-white z-10">
              <h2 className="font-serif text-xl font-semibold text-ink-900">Support Ticket</h2>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Customer info */}
              <div className="rounded-xl bg-ink-50 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-200 text-ink-600 font-semibold text-sm">
                    {selected.customer_name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink-900">{selected.customer_name}</div>
                    <div className="text-xs text-ink-500">{selected.customer_email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  {statusBadge(selected.status)}
                  <span className="text-xs text-ink-400">
                    {new Date(selected.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Customer message */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">Customer Message</p>
                <div className="rounded-xl border border-ink-200 p-4">
                  <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line">{selected.message}</p>
                </div>
              </div>

              {/* Admin reply */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">Admin Reply</p>
                <textarea
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="input resize-none text-sm"
                  placeholder="Type your reply or internal note here..."
                />
                <button
                  onClick={saveReply}
                  disabled={saving || !reply.trim()}
                  className="btn-primary mt-2 text-sm py-2 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Reply'}
                </button>
              </div>

              {/* Status controls */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">Update Status</p>
                <div className="flex gap-2">
                  {(['open', 'replied', 'resolved'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(selected.id, s)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
                        selected.status === s
                          ? 'bg-ink-900 text-white'
                          : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
                      }`}
                    >
                      {statusIcon(s)} {s}
                    </button>
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
