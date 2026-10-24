import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type RouterContextType = {
  path: string;
  navigate: (to: string) => void;
};

const RouterContext = createContext<RouterContextType>({
  path: '/',
  navigate: () => {},
});

function getPath() {
  // Support clean URLs such as /admin and /admin/ebooks, while accepting
  // legacy hash URLs (/#/admin) so old bookmarks continue to work.
  const hashPath = window.location.hash.startsWith('#/')
    ? window.location.hash.slice(1)
    : '';
  const pathname = window.location.pathname || '/';
  return hashPath || pathname;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(getPath);

  useEffect(() => {
    const updatePath = () => {
      setPath(getPath());
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', updatePath);
    window.addEventListener('hashchange', updatePath);
    return () => {
      window.removeEventListener('popstate', updatePath);
      window.removeEventListener('hashchange', updatePath);
    };
  }, []);

  const navigate = (to: string) => {
    const normalized = to.startsWith('/') ? to : `/${to}`;
    if (window.location.hash.startsWith('#/')) {
      window.history.replaceState(null, '', normalized);
    } else {
      window.history.pushState(null, '', normalized);
    }
    setPath(normalized);
    window.scrollTo(0, 0);
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

export function Link({
  to,
  children,
  className,
  onClick,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { navigate } = useRouter();
  const href = to.startsWith('/') ? to : `/${to}`;
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(href);
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
