import { RouterProvider, useRouter } from '@/lib/router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import EbooksPage from '@/pages/EbooksPage';
import EbookDetailPage from '@/pages/EbookDetailPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import CheckoutPage from '@/pages/CheckoutPage';
import AdminPage from '@/pages/AdminPage';
import SupportButton from '@/components/SupportButton';

function AppRoutes() {
  const { path } = useRouter();

  if (path === '/admin' || path.startsWith('/admin/')) {
    return <AdminPage />;
  }

  const segments = path.split('/').filter(Boolean);

  let page;
  if (segments.length === 0) {
    page = <HomePage />;
  } else if (segments[0] === 'ebooks') {
    if (segments[1]) {
      page = <EbookDetailPage slug={segments[1]} />;
    } else {
      page = <EbooksPage />;
    }
  } else if (segments[0] === 'checkout' && segments[1]) {
    page = <CheckoutPage slug={segments[1]} />;
  } else if (segments[0] === 'about') {
    page = <AboutPage />;
  } else if (segments[0] === 'contact') {
    page = <ContactPage />;
  } else {
    page = <HomePage />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{page}</main>
      <Footer />
      <SupportButton />
    </div>
  );
}

function App() {
  return (
    <RouterProvider>
      <AppRoutes />
    </RouterProvider>
  );
}

export default App;
