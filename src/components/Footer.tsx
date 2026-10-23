import { Link } from '@/lib/router';
import { BookOpen, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink-900 text-ink-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 py-16 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500">
                <BookOpen className="h-5 w-5 text-ink-900" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-xl text-ink-50 leading-tight">
                  The Podcast Library
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-gold-500 mt-0.5">
                  Premium eBooks
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed text-ink-400 max-w-md">
              Beautifully written digital books designed to inspire healing, confidence,
              relationships, personal growth, and success. Buy once, read forever.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-gold-500 mb-5">Explore</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/" className="text-ink-400 hover:text-gold-400 transition-colors duration-300">Home</Link></li>
              <li><Link to="/ebooks" className="text-ink-400 hover:text-gold-400 transition-colors duration-300">Library</Link></li>
              <li><Link to="/about" className="text-ink-400 hover:text-gold-400 transition-colors duration-300">About</Link></li>
              <li><Link to="/contact" className="text-ink-400 hover:text-gold-400 transition-colors duration-300">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-gold-500 mb-5">Support</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/contact" className="text-ink-400 hover:text-gold-400 transition-colors duration-300">Payment Help</Link></li>
              <li><Link to="/contact" className="text-ink-400 hover:text-gold-400 transition-colors duration-300">Download Issues</Link></li>
              <li>
                <a href="mailto:support.thepodcastlibrary@gmail.com" className="text-ink-400 hover:text-gold-400 transition-colors duration-300 inline-flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  support.thepodcastlibrary@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-ink-700/50 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-500 tracking-wide">
            © {new Date().getFullYear()} The Podcast Library. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-xs text-ink-500">
            <span className="inline-block h-1 w-1 rounded-full bg-gold-500" />
            Read. Heal. Grow.
          </div>
        </div>
      </div>
    </footer>
  );
}
