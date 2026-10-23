import { useState, useEffect } from 'react';
import { supabase, type Settings } from '@/lib/supabase';
import { Save, Bitcoin, Check } from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';

export default function AdminWallet() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState({ bitcoin_wallet_address: '', bitcoin_qr_url: '', business_email: '', site_name: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
      if (data) {
        setSettings(data as Settings);
        setForm({
          bitcoin_wallet_address: data.bitcoin_wallet_address || '',
          bitcoin_qr_url: data.bitcoin_qr_url || '',
          business_email: data.business_email || '',
          site_name: data.site_name || '',
        });
      }
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('settings').update({
      bitcoin_wallet_address: form.bitcoin_wallet_address,
      bitcoin_qr_url: form.bitcoin_qr_url,
      business_email: form.business_email,
      site_name: form.site_name,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink-900 mb-6">Wallet & Settings</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bitcoin Wallet */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10">
              <Bitcoin className="h-5 w-5 text-gold-600" />
            </div>
            <h2 className="font-serif text-lg font-semibold text-ink-900">Bitcoin Wallet</h2>
          </div>
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Bitcoin Wallet Address</label>
              <input type="text" value={form.bitcoin_wallet_address} onChange={(e) => setForm({ ...form, bitcoin_wallet_address: e.target.value })} className="input font-mono text-sm" placeholder="bc1q..." />
              <p className="mt-1.5 text-xs text-ink-400">This address will be shown to customers at checkout.</p>
            </div>
            <div>
              <ImageUpload
                label="Bitcoin QR Code Image"
                value={form.bitcoin_qr_url}
                onChange={(url) => setForm({ ...form, bitcoin_qr_url: url })}
                aspectRatio="aspect-square"
                folder="qr-codes"
              />
            </div>
            {form.bitcoin_qr_url && (
              <div className="flex justify-center">
                <img src={form.bitcoin_qr_url} alt="QR Preview" className="h-32 w-32 rounded-lg border border-ink-200" />
              </div>
            )}
          </form>
        </div>

        {/* Site Settings */}
        <div className="card p-6">
          <h2 className="font-serif text-lg font-semibold text-ink-900 mb-5">Site Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Business Email</label>
              <input type="email" value={form.business_email} onChange={(e) => setForm({ ...form, business_email: e.target.value })} className="input" placeholder="support.thepodcastlibrary@gmail.com" />
              <p className="mt-1.5 text-xs text-ink-400">Used as the sender email for customer notifications.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Site Name</label>
              <input type="text" value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} className="input" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
            <Check className="h-4 w-4" /> Settings saved successfully
          </span>
        )}
      </div>
    </div>
  );
}
