import { useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order, Notification } from '@/lib/supabase';
import { useRouter, Link } from '@/lib/router';
import {
  LayoutDashboard, BookOpen, CreditCard, Star, Wallet,
  Users, Bell, LogOut, Menu, X, Lock, LifeBuoy,
} from 'lucide-react';

import AdminEbooks from '@/components/admin/AdminEbooks';
import AdminOrders from '@/components/admin/AdminOrders';
import AdminReviews from '@/components/admin/AdminReviews';
import AdminWallet from '@/components/admin/AdminWallet';
import AdminCustomers from '@/components/admin/AdminCustomers';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminTickets from '@/components/admin/AdminTickets';

export default function AdminPage() {
  const { path, navigate } = useRouter();
  const [authed, setAuthed] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const isAdmin = session?.user?.app_metadata?.role === 'admin';
      setAuthed(!!session);
      setAuthorized(isAdmin);
      setChecking(false);
    };

    checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAdmin = session?.user?.app_metadata?.role === 'admin';
      setAuthed(!!session);
      setAuthorized(isAdmin);
      setChecking(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="animate-pulse text-ink-400">Loading...</div>
      </div>
    );
  }

  if (!authed || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500 mb-4">
              <Lock className="h-7 w-7 text-ink-950" />
            </div>
            <h1 className="font-serif text-2xl font-semibold text-white">Admin Dashboard</h1>
            <p className="text-sm text-ink-400 mt-2">Sign in with an authorized administrator account.</p>
          </div>

          {loginError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 mb-4 text-sm text-red-300">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="rounded-2xl bg-white p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="Your admin email" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary w-full">Sign In</button>
          </form>

          <p className="text-center text-xs text-ink-500 mt-4">
            <Link to="/" className="text-ink-400 hover:text-gold-400 transition-colors">Back to website</Link>
          </p>
        </div>
      </div>
    );
  }

  // Determine active tab from path
  const segments = path.split('/');
  const activeTab = segments[2] || 'overview';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'ebooks', label: 'eBooks', icon: BookOpen },
    { id: 'orders', label: 'Orders & Payments', icon: CreditCard },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
  ];

  const renderTab = (): ReactNode => {
    switch (activeTab) {
      case 'ebooks': return <AdminEbooks />;
      case 'orders': return <AdminOrders />;
      case 'reviews': return <AdminReviews />;
      case 'wallet': return <AdminWallet />;
      case 'customers': return <AdminCustomers />;
      case 'notifications': return <AdminNotifications />;
      case 'tickets': return <AdminTickets />;
      default: return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-ink-950 text-white flex flex-col transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500">
              <LayoutDashboard className="h-4 w-4 text-ink-950" />
            </div>
            <div>
              <div className="font-serif text-sm font-semibold">Admin Panel</div>
              <div className="text-[10px] text-ink-400">The Podcast Library</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={`/admin/${tab.id === 'overview' ? '' : tab.id}`}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id || (activeTab === 'overview' && tab.id === 'overview')
                  ? 'bg-gold-500 text-ink-950'
                  : 'text-ink-300 hover:bg-white/5 hover:text-white'
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-300 hover:bg-white/5 hover:text-white w-full transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-20 bg-ink-950 text-white flex items-center justify-between px-4 py-3">
          <span className="font-serif text-sm font-semibold">Admin Panel</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <div className="p-4 md:p-8">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}

// Overview dashboard
function AdminOverview() {
  const [stats, setStats] = useState({ ebooks: 0, orders: 0, pending: 0, revenue: 0, reviews: 0, pendingReviews: 0, openTickets: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    (async () => {
      const [ebooks, orders, reviews, recentOrds, recentNotifs] = await Promise.all([
        supabase.from('ebooks').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*'),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*, ebook:ebooks(*)').order('created_at', { ascending: false }).limit(5),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5),
      ]);
      const pendingOrders = orders.data?.filter(o => o.status === 'pending').length || 0;
      const approvedRevenue = orders.data?.filter(o => o.status === 'approved').reduce((sum, o) => sum + Number(o.amount_usd), 0) || 0;
      const [pendingReviews, openTickets] = await Promise.all([
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('approved', false),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      ]);
      setStats({
        ebooks: ebooks.count || 0,
        orders: orders.data?.length || 0,
        pending: pendingOrders,
        revenue: approvedRevenue,
        reviews: reviews.count || 0,
        pendingReviews: pendingReviews.count || 0,
        openTickets: openTickets.count || 0,
      });
      if (recentOrds.data) setRecentOrders(recentOrds.data as Order[]);
      if (recentNotifs.data) setRecentNotifications(recentNotifs.data as Notification[]);
    })();
  }, []);

  const cards = [
    { label: 'Total eBooks', value: stats.ebooks, icon: BookOpen, color: 'text-ink-600' },
    { label: 'Total Orders', value: stats.orders, icon: CreditCard, color: 'text-ink-600' },
    { label: 'Pending Payments', value: stats.pending, icon: Wallet, color: 'text-gold-600' },
    { label: 'Approved Revenue', value: `${stats.revenue.toFixed(2)}`, icon: LayoutDashboard, color: 'text-green-600' },
    { label: 'Total Reviews', value: stats.reviews, icon: Star, color: 'text-ink-600' },
    { label: 'Pending Reviews', value: stats.pendingReviews, icon: Bell, color: 'text-gold-600' },
    { label: 'Open Tickets', value: stats.openTickets, icon: LifeBuoy, color: 'text-gold-600' },
  ];

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gold-500/20 text-gold-600',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return <span className={`badge ${styles[status] || ''}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink-900 mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 mb-3`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="font-serif text-2xl font-semibold text-ink-900">{value}</div>
            <div className="text-xs text-ink-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-ink-900">Recent Orders</h2>
            {stats.pending > 0 && (
              <span className="badge bg-gold-500/20 text-gold-600">
                {stats.pending} awaiting review
              </span>
            )}
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink-900 truncate">{order.customer_name}</div>
                    <div className="text-xs text-ink-500">${order.amount_usd.toFixed(2)} · {new Date(order.created_at).toLocaleDateString()}</div>
                  </div>
                  {statusBadge(order.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400 py-4 text-center">No orders yet.</p>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-ink-900">Recent Notifications</h2>
            <Bell className="h-4 w-4 text-ink-400" />
          </div>
          {recentNotifications.length > 0 ? (
            <div className="space-y-3">
              {recentNotifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 rounded-lg border border-ink-100 px-3 py-2.5">
                  <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${n.status === 'sent' ? 'bg-green-500' : 'bg-gold-500'}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink-900 truncate">{n.subject}</div>
                    <div className="text-xs text-ink-500 truncate">{n.recipient_email}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400 py-4 text-center">No notifications yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
