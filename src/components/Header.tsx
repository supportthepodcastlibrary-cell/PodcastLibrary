import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/lib/router';
import { BookOpen, Menu, X } from 'lucide-react';

export default function Header() {
  const { path, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Library', to: '/ebooks' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  const isActive = (to: string) => {
    if (to === '/') return path === '/';
    return path.startsWith(to);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-ink-50/90 backdrop-blur-xl border-b border-ink-200/50'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 transition-transform duration-300 group-hover:scale-105">
                <BookOpen className="h-5 w-5 text-gold-400" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-xl text-ink-900 leading-tight">
                  The Podcast Library
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-gold-600 mt-0.5">
                  Premium eBooks
                </span>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative px-5 py-2 text-sm font-medium tracking-wide transition-colors duration-300 ${
                    isActive(item.to)
                      ? 'text-ink-900'
                      : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {item.label}
                  {isActive(item.to) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-6 bg-gold-500" />
                  )}
                </Link>
              ))}
            </nav>

            <button
              className="md:hidden text-ink-900 p-2"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden border-t border-ink-200/50 bg-ink-50/95 backdrop-blur-xl animate-fade-in">
            <div className="space-y-1 px-4 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive(item.to)
                      ? 'bg-ink-100 text-ink-900'
                      : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      <div className="h-20" />
    </>
  );
}
