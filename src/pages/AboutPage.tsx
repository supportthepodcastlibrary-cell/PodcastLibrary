import { Link } from '@/lib/router';
import { BookOpen, Bitcoin, Shield, Sparkles, Users, ArrowRight, Download, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <div>
      <section className="bg-ink-50 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="section-label mb-5">About Us</p>
          <h1 className="font-serif text-4xl md:text-6xl text-ink-900 leading-[1.1] max-w-3xl">
            Books worth keeping. Ideas worth returning to.
          </h1>
          <p className="mt-8 text-lg text-ink-500 leading-relaxed max-w-2xl">
            The Podcast Library is a digital publishing house dedicated to creating beautifully
            written eBooks that inspire healing, confidence, relationships, and personal growth.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-ink-100 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16">
            <div>
              <p className="section-label mb-4">The Idea</p>
              <h2 className="font-serif text-2xl md:text-3xl text-ink-900 mb-5 leading-tight">
                Knowledge should last.
              </h2>
              <p className="text-ink-500 leading-relaxed">
                We believe the best ideas — the ones that change how you think, work, and live —
                deserve more than a passing moment. They deserve to be written down, beautifully
                formatted, and kept on your shelf forever.
              </p>
            </div>
            <div>
              <p className="section-label mb-4">The Craft</p>
              <h2 className="font-serif text-2xl md:text-3xl text-ink-900 mb-5 leading-tight">
                Every book, made with care.
              </h2>
              <p className="text-ink-500 leading-relaxed">
                Each eBook is carefully researched, thoughtfully edited, and elegantly designed.
                No filler, no fluff — just pure, structured knowledge you can return to again and again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-ink-50 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="section-label mb-3">What We Believe</p>
            <h2 className="font-serif text-3xl md:text-5xl text-ink-900">Our Values</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: BookOpen, title: 'Quality Over Quantity', desc: 'Every book is carefully crafted. We publish fewer titles because each one matters.' },
              { icon: Heart, title: 'Reader First', desc: 'Our readers are our community. Your reviews and feedback shape what we publish next.' },
              { icon: Shield, title: 'True Ownership', desc: 'When you buy a book, you own it. No DRM, no expiring access, no subscriptions.' },
              { icon: Bitcoin, title: 'Financial Freedom', desc: 'We accept Bitcoin because we believe in open, permissionless money. No gatekeepers.' },
              { icon: Download, title: 'Instant Access', desc: 'Buy once, download immediately. Read on any device, anywhere, forever.' },
              { icon: Sparkles, title: 'Beautiful Design', desc: 'Every page is formatted with care. Reading should be a pleasure, not a chore.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-8 hover:shadow-[0_15px_50px_-15px_rgba(0,0,0,0.1)] transition-shadow duration-500">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 mb-5">
                  <Icon className="h-6 w-6 text-gold-600" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-lg text-ink-900 mb-3">{title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-100 py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl md:text-5xl text-ink-900 mb-6 leading-tight">
            Ready to dive in?
          </h2>
          <p className="text-ink-500 mb-8 max-w-md mx-auto leading-relaxed">
            Explore our library and find your next great read.
          </p>
          <Link to="/ebooks" className="btn-primary inline-flex">
            Explore Library <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
