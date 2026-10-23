import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Headset, X, Send, Check, Loader2 } from 'lucide-react';

export default function SupportButton() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || !form.message) return;
    setSubmitting(true);

    const { error: insertError } = await supabase.from('support_tickets').insert({
      customer_name: form.name,
      customer_email: form.email,
      message: form.message,
      status: 'open',
    });

    if (insertError) {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => {
      setSubmitted(false);
      setOpen(false);
    }, 2500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-gold-400 shadow-lg transition-all hover:scale-105 hover:bg-ink-800 hover:shadow-xl active:scale-95"
        aria-label="Customer Support"
      >
        {open ? <X className="h-6 w-6" /> : <Headset className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-gold-500" />
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm animate-fade-in-up">
          <div className="rounded-2xl bg-white shadow-2xl border border-ink-200 overflow-hidden">
            <div className="bg-ink-950 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500">
                  <Headset className="h-5 w-5 text-ink-950" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-white">Customer Support</h3>
                  <p className="text-xs text-ink-400">We typically reply within 24 hours</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {submitted ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-500/10 mb-3">
                    <Check className="h-7 w-7 text-gold-600" />
                  </div>
                  <h4 className="font-serif text-base font-semibold text-ink-900 mb-1">Message Sent!</h4>
                  <p className="text-sm text-ink-500">We'll get back to you at your email soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && (
                    <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{error}</div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input py-2 text-sm"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input py-2 text-sm"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1">Message</label>
                    <textarea
                      required
                      rows={3}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="input py-2 text-sm resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full py-2.5 text-sm disabled:opacity-60"
                  >
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="h-4 w-4" /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
