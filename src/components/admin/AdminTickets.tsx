import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, type SupportTicket, type TicketStatus, type ChatMessage } from '@/lib/supabase';
import { Search, X, Send, Clock, CheckCircle, MessageSquare, Headset, Loader2 } from 'lucide-react';

export default function AdminTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | TicketStatus>('all');
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTickets = async () => {
    const { data } = await supabase.from('support_tickets').select('*').order('updated_at', { ascending: false });
    if (data) setTickets(data as SupportTicket[]);
  };

  useEffect(() => { loadTickets(); }, []);

  // Realtime: refresh ticket list when any ticket changes
  useEffect(() => {
    const channel = supabase
      .channel('admin-tickets-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => { loadTickets(); }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          if (selected && newMsg.ticket_id === selected.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
          loadTickets();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selected]);

  const loadMessages = useCallback(async (ticketId: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
    setLoadingMessages(false);
  }, []);

  // Load messages when a ticket is selected
  useEffect(() => {
    if (selected) {
      loadMessages(selected.id);
    } else {
      setMessages([]);
    }
  }, [selected, loadMessages]);

  // Realtime: listen for new messages in the selected conversation
  useEffect(() => {
    if (!selected) return;

    const channel = supabase
      .channel(`admin-ticket-messages-${selected.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `ticket_id=eq.${selected.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selected]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [messages]);

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

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: selected.id,
        sender: 'admin',
        message: reply.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data as ChatMessage]);
      await supabase.from('support_tickets').update({
        status: 'replied',
        admin_reply: reply.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', selected.id);
      setSelected({ ...selected, status: 'replied', admin_reply: reply.trim() });
      await loadTickets();
    }

    setReply('');
    setSaving(false);
  };

  const openTicket = (ticket: SupportTicket) => {
    setSelected(ticket);
    setReply('');
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
      closed: 'bg-ink-200 text-ink-600',
    };
    return <span className={`badge ${styles[status] || ''}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const statusIcon = (status: string) => {
    if (status === 'open') return <Clock className="h-3.5 w-3.5" />;
    if (status === 'replied') return <MessageSquare className="h-3.5 w-3.5" />;
    if (status === 'resolved') return <CheckCircle className="h-3.5 w-3.5" />;
    return <X className="h-3.5 w-3.5" />;
  };

  const openCount = tickets.filter(t => t.status === 'open').length;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-ink-900">Support Conversations</h1>
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
        <div className="flex gap-2 flex-wrap">
          {(['all', 'open', 'replied', 'resolved', 'closed'] as const).map(f => (
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
                <th className="text-left px-4 py-3 font-semibold text-ink-700 hidden md:table-cell">Last Message</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-ink-700 hidden sm:table-cell">Updated</th>
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
                    {new Date(ticket.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      <button onClick={() => openTicket(ticket)} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors">
                        <Headset className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-400">No support conversations found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conversation detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ink-200 p-5 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-200 text-ink-600 font-semibold text-sm shrink-0">
                  {selected.customer_name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif text-lg font-semibold text-ink-900 truncate">{selected.customer_name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {statusBadge(selected.status)}
                    <span className="text-xs text-ink-400">{selected.customer_email}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[200px]">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-ink-300" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-ink-200 mb-2" />
                  <p className="text-sm text-ink-500">No messages in this conversation yet.</p>
                  <p className="text-xs text-ink-400 mt-1">The customer's initial message:</p>
                  <p className="text-sm text-ink-600 mt-2 italic">{selected.message}</p>
                  <p className="text-xs text-ink-400 mt-2">{formatTime(selected.created_at)}</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.sender === 'admin'
                          ? 'bg-ink-900 text-white rounded-br-sm'
                          : 'bg-ink-100 text-ink-800 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.message}</p>
                      <p className={`mt-1 text-[10px] ${msg.sender === 'admin' ? 'text-ink-400' : 'text-ink-400'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply area */}
            <div className="border-t border-ink-100 p-4 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  rows={1}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  className="flex-1 resize-none rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/15 transition-colors max-h-24"
                  placeholder="Type your reply..."
                />
                <button
                  onClick={sendReply}
                  disabled={saving || !reply.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-gold-400 transition-all hover:bg-ink-800 disabled:opacity-40 active:scale-95"
                  aria-label="Send reply"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>

              {/* Status controls */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wide text-ink-500 mr-1">Status:</span>
                {(['open', 'replied', 'resolved', 'closed'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
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
      )}
    </div>
  );
}
