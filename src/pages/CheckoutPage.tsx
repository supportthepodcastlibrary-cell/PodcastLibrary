import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/lib/router';
import { supabase, type Ebook, type Settings } from '@/lib/supabase';
import {
  ArrowLeft, Bitcoin, Copy, Check, ArrowRight, Loader2, AlertCircle,
} from 'lucide-react';

export default function CheckoutPage({ slug }: { slug: string }) {
  const { navigate } = useRouter();
  const [book, setBook] = useState<Ebook | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [form, setForm] = useState({ customer_name: '', customer_email: '', bitcoin_tx_id: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [{ data: ebook }, { data: settingsData }] = await Promise.all([
        supabase.from('ebooks').select('*, podcast:podcasts(*)').eq('slug', slug).eq('status', 'published').maybeSingle(),
        supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      ]);
      if (ebook) setBook(ebook as Ebook);
      if (settingsData) setSettings(settingsData as Settings);
      setLoading(false);
    })();
  }, [slug]);

  const copyWallet = () => {
    if (settings?.bitcoin_wallet_address) {
      navigator.clipboard.writeText(settings.bitcoin_wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!book || !form.customer_name || !form.customer_email || !form.bitcoin_tx_id) {
      setError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    const { error: insertError } = await supabase.from('orders').insert({
      ebook_id: book.id,
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      bitcoin_tx_id: form.bitcoin_tx_id,
      amount_usd: book.price_usd,
      status: 'pending',
    });

    if (insertError) {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }

    await supabase.from('notifications').insert({
      type: 'payment_submission',
      recipient_email: form.customer_email,
      recipient_name: form.customer_name,
      subject: 'Payment Received — Awaiting Verification',
      body: `Hi ${form.customer_name}, we've received your Bitcoin payment submission for "${book.title}". Transaction ID: ${form.bitcoin_tx_id}. We'll verify your payment and send your download link within 24 hours.`,
      status: 'pending',
    });

    setSubmitting(false);
    setConfirmed(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ink-300" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-ink-50 flex flex-col items-center justify-center gap-6">
        <AlertCircle className="h-12 w-12 text-ink-300" />
        <h1 className="font-serif text-2xl text-ink-900">Book not found</h1>
        <Link to="/ebooks" className="btn-outline">Back to Library</Link>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full">
          <div className="card p-8 md:p-12 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold-100 mx-auto mb-6">
              <Check className="h-10 w-10 text-gold-600" strokeWidth={2} />
            </div>
            <h1 className="font-serif text-3xl text-ink-900 mb-4">
              Payment Submitted
            </h1>
            <p className="text-ink-500 leading-relaxed mb-2">
              Thank you, {form.customer_name}. Your Bitcoin payment is now awaiting verification.
            </p>
            <p className="text-sm text-ink-400 leading-relaxed mb-8">
              We've sent a confirmation email to <span className="font-medium text-ink-700">{form.customer_email}</span>.
              Once your payment is verified, you'll receive a second email with your download link.
            </p>
            <div className="rounded-xl bg-ink-100 p-5 mb-8 text-left">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-100">
                  <span className="text-gold-700 font-medium text-xs">1</span>
                </div>
                <span className="text-ink-600">Payment verification (within 24 hours)</span>
              </div>
              <div className="flex items-center gap-3 text-sm mt-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-200">
                  <span className="text-ink-500 font-medium text-xs">2</span>
                </div>
                <span className="text-ink-500">Download link sent via email</span>
              </div>
            </div>
            <Link to="/ebooks" className="btn-primary w-full">
              Back to Library
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const walletAddress = settings?.bitcoin_wallet_address || 'bc1qexamplewalletaddress000000000';

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <Link to={`/ebooks/${book.slug}`} className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-gold-600 transition-colors duration-300">
          <ArrowLeft className="h-4 w-4" /> Back to {book.title}
        </Link>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
        <p className="section-label mb-3">Checkout</p>
        <h1 className="font-serif text-4xl md:text-5xl text-ink-900 mb-12">Complete Your Purchase</h1>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <div className="card p-8">
              <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-ink-400 mb-5">Order Summary</h2>
              <div className="flex gap-5">
                <div className="w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                  {book.cover_url && !coverError ? (
                    <img src={book.cover_url} alt={book.title} loading="eager" decoding="async" onError={() => setCoverError(true)} className="w-full aspect-[3/4] object-cover" />
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-ink-800 to-ink-950">
                      <span className="font-serif text-[10px] text-gold-400 text-center p-1 leading-tight">{book.title}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-xl text-ink-900">{book.title}</h3>
                  <p className="text-sm text-ink-400 mt-1">by {book.author}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-ink-400">eBook · Lifetime Access</span>
                    <span className="font-serif text-2xl text-ink-900">${book.price_usd.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100">
                  <Bitcoin className="h-5 w-5 text-gold-600" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-ink-900">Pay with Bitcoin</h2>
                  <p className="text-xs text-ink-400 mt-0.5">Send the exact amount to the wallet below</p>
                </div>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="rounded-2xl border border-ink-200 bg-white p-4">
                  {settings?.bitcoin_qr_url ? (
                    <img src={settings.bitcoin_qr_url} alt="Bitcoin QR Code" loading="eager" decoding="async" className="h-48 w-48" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="flex h-48 w-48 items-center justify-center bg-ink-50 rounded-xl">
                      <div className="text-center">
                        <Bitcoin className="h-12 w-12 text-gold-500 mx-auto mb-2" />
                        <p className="text-xs text-ink-400">QR code will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-3 text-xs text-ink-400">Scan with your Bitcoin wallet app</p>
              </div>

              <div className="rounded-xl bg-ink-100 p-4">
                <p className="text-xs text-ink-400 mb-2">Bitcoin Wallet Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs sm:text-sm font-mono text-ink-700 break-all">{walletAddress}</code>
                  <button onClick={copyWallet} className="shrink-0 rounded-full border border-ink-200 bg-white px-4 py-2 text-xs font-medium text-ink-600 hover:border-ink-900 hover:text-ink-900 transition-colors flex items-center gap-1.5">
                    {copied ? <><Check className="h-3.5 w-3.5 text-green-600" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                  </button>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-gold-300/50 bg-gold-100/50 p-5">
                <span className="text-sm font-medium text-ink-700">Amount to send</span>
                <span className="font-serif text-2xl text-ink-900">${book.price_usd.toFixed(2)} USD</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card p-8 sticky top-24">
              <h2 className="font-serif text-xl text-ink-900 mb-4">Confirm Your Payment</h2>
              <p className="text-sm text-ink-500 mb-6 leading-relaxed">
                After sending your Bitcoin payment, submit your transaction details below for verification.
              </p>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Full Name</label>
                  <input type="text" required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="input" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Email Address</label>
                  <input type="email" required value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} className="input" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1.5">Bitcoin Transaction ID</label>
                  <input type="text" required value={form.bitcoin_tx_id} onChange={(e) => setForm({ ...form, bitcoin_tx_id: e.target.value })} className="input font-mono text-xs" placeholder="e.g. 4a5e1b4f..." />
                  <p className="mt-1.5 text-xs text-ink-400">Found in your wallet's transaction history</p>
                </div>

                <button type="submit" disabled={submitting} className="btn-gold w-full disabled:opacity-60">
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    <>Submit Payment <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-ink-400 leading-relaxed">
                Your payment will be verified within 24 hours. You'll receive email updates at each step.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
