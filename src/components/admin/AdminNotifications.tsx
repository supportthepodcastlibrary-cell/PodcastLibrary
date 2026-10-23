import { useState, useEffect } from 'react';
import { supabase, type Notification } from '@/lib/supabase';
import { Bell, Check, Clock, Mail } from 'lucide-react';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('all');

  const load = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (data) setNotifications(data as Notification[]);
  };

  useEffect(() => { load(); }, []);

  const markSent = async (id: string) => {
    await supabase.from('notifications').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id);
    await load();
  };

  const filtered = notifications.filter(n => {
    if (filter === 'pending' && n.status !== 'pending') return false;
    if (filter === 'sent' && n.status !== 'sent') return false;
    return true;
  });

  const typeColors: Record<string, string> = {
    payment_submission: 'bg-blue-100 text-blue-700',
    payment_approved: 'bg-green-100 text-green-700',
    payment_rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-semibold text-ink-900">Notifications</h1>
        <div className="flex gap-2">
          {(['all', 'pending', 'sent'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((n) => (
          <div key={n.id} className="card p-4">
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                n.status === 'sent' ? 'bg-green-100' : 'bg-gold-500/10'
              }`}>
                {n.status === 'sent' ? <Check className="h-5 w-5 text-green-600" /> : <Clock className="h-5 w-5 text-gold-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`badge ${typeColors[n.type] || 'bg-ink-100 text-ink-600'}`}>{n.type.replace(/_/g, ' ')}</span>
                  <span className={`badge ${n.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gold-500/20 text-gold-600'}`}>{n.status}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-900 font-medium">
                  <Mail className="h-3.5 w-3.5 text-ink-400" />
                  {n.recipient_name} <span className="text-ink-500">({n.recipient_email})</span>
                </div>
                <p className="text-sm font-medium text-ink-700 mt-1">{n.subject}</p>
                <p className="text-sm text-ink-500 mt-1 line-clamp-2">{n.body}</p>
                <p className="text-xs text-ink-400 mt-1.5">
                  {new Date(n.created_at).toLocaleString()}
                  {n.sent_at && ` · Sent ${new Date(n.sent_at).toLocaleString()}`}
                </p>
              </div>
              {n.status === 'pending' && (
                <button onClick={() => markSent(n.id)} className="shrink-0 rounded-lg border border-green-300 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors">
                  Mark Sent
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-10 w-10 text-ink-300 mx-auto mb-3" />
            <p className="text-ink-400">No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
