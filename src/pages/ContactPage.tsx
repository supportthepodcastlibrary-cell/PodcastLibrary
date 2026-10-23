import { useState } from 'react';
import { Mail, MessageSquare, Send, Check, Bitcoin, BookOpen } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name && form.email && form.message) {
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    }
  };

  return (
    <div>
      <section className="bg-ink-50 pt-12 pb-16 md:pt-20 md:pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="section-label mb-5">Get in Touch</p>
          <h1 className="font-serif text-4xl md:text-6xl text-ink-900 leading-tight">Contact Us</h1>
          <p className="mt-6 text-lg text-ink-500 max-w-xl leading-relaxed">
            Questions about a book, a payment, or a download? We're here to help.
          </p>
        </div>
      </section>

      <section className="bg-ink-100 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-5">
              <div className="card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 mb-4">
                  <Mail className="h-5 w-5 text-gold-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium text-ink-900">Email</h3>
                <p className="text-sm text-ink-500 mt-1">support.thepodcastlibrary@gmail.com</p>
              </div>
              <div className="card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 mb-4">
                  <Bitcoin className="h-5 w-5 text-gold-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium text-ink-900">Payment Support</h3>
                <p className="text-sm text-ink-500 mt-1">Questions about Bitcoin payments or transaction verification.</p>
              </div>
              <div className="card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 mb-4">
                  <BookOpen className="h-5 w-5 text-gold-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-medium text-ink-900">Reading Help</h3>
                <p className="text-sm text-ink-500 mt-1">Issues with downloads or accessing your eBook.</p>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="card p-8 md:p-10">
                {sent ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-100 mb-5">
                      <Check className="h-8 w-8 text-gold-600" strokeWidth={2} />
                    </div>
                    <h3 className="font-serif text-2xl text-ink-900 mb-3">Message Sent</h3>
                    <p className="text-sm text-ink-500 max-w-sm leading-relaxed">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                    <button onClick={() => setSent(false)} className="btn-ghost mt-6">
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h2 className="font-serif text-2xl text-ink-900 flex items-center gap-2.5 mb-2">
                      <MessageSquare className="h-5 w-5 text-gold-600" strokeWidth={1.5} /> Send a Message
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1.5">Name</label>
                        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Your name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
                        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="your@email.com" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">Subject</label>
                      <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input" placeholder="What's this about?" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1.5">Message</label>
                      <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input resize-none" placeholder="Tell us how we can help..." />
                    </div>
                    <button type="submit" className="btn-primary">
                      <Send className="h-4 w-4" /> Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
