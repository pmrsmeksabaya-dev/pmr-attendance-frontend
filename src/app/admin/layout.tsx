'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, Menu, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getJwt, getUser, clearSession } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { OrgLogos } from '@/components/OrgLogos';
import { ThemeToggle } from '@/components/ThemeToggle';

const SIDEBAR_STORAGE_KEY = 'pmr_admin_sidebar_collapsed';

function isJwtExpired(token: string): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true;
    const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalized));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage =
    pathname === '/admin/login' || pathname?.startsWith('/admin/login/');

  const [authorized, setAuthorized] = useState(false);
  const [roleLabel, setRoleLabel] = useState<'ADMIN' | 'OWNER'>('ADMIN');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === 'true') {
        setSidebarCollapsed(true);
      }
    } catch {
      // Abaikan jika akses localStorage dibatasi
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Abaikan jika akses localStorage dibatasi
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (isLoginPage) {
      setAuthorized(true);
      return;
    }

    const verifyAccess = () => {
      const token = getJwt();
      const user = getUser();

      if (!token || !user || isJwtExpired(token)) {
        clearSession();
        setAuthorized(false);
        router.replace('/admin/login');
        return;
      }

      const role = (user.role || '').toLowerCase();
      if (role === 'admin' || role === 'owner') {
        setRoleLabel(role === 'owner' ? 'OWNER' : 'ADMIN');
        setAuthorized(true);
        return;
      }

      toast.error('Akses ditolak. Halaman ini khusus Admin & Owner PMR.');
      setAuthorized(false);
      if (role === 'pengurus') {
        router.replace('/pengurus');
      } else {
        router.replace('/absensi');
      }
    };

    verifyAccess();
    window.addEventListener('storage', verifyAccess);
    window.addEventListener('focus', verifyAccess);
    return () => {
      window.removeEventListener('storage', verifyAccess);
      window.removeEventListener('focus', verifyAccess);
    };
  }, [router, pathname, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!authorized) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 dark:bg-[#230709] gap-3 p-4">
        <Loader2 className="animate-spin text-[#D32F2F]" size={32} />
        <p className="text-xs font-semibold text-slate-500 dark:text-red-200/75">
          Memverifikasi akses Admin PMR...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50/90 dark:bg-[#230709] text-slate-900 dark:text-red-50 print:bg-white print:text-slate-900">
      <div className="print:hidden">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
      </div>

      {/* Mobile Top Bar */}
      <header className="lg:hidden print:hidden sticky top-0 z-20 h-14 px-3.5 bg-white/95 dark:bg-[#330C0F]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-red-900/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-slate-700 dark:text-red-100 hover:bg-red-50 dark:hover:bg-red-950 shrink-0 transition"
            aria-label="Buka Menu"
          >
            <Menu size={20} />
          </button>

          <Link href="/admin" className="flex items-center gap-2 min-w-0">
            <OrgLogos size="sm" shape="circle" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-[#D32F2F] dark:text-white truncate">
                  PMR ADMIN
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold border shrink-0 ${
                    roleLabel === 'OWNER'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/60'
                      : 'bg-red-50 text-[#D32F2F] border-red-200 dark:bg-red-950/80 dark:text-red-200 dark:border-red-800/60'
                  }`}
                >
                  <ShieldCheck size={9} />
                  {roleLabel}
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="shrink-0">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div
        className={`transition-all duration-200 print:pl-0 ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full print:p-0 print:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}