'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { getJwt, getUser, clearSession } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

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
  const isLoginPage = pathname === '/admin/login';

  const [authorized, setAuthorized] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
        router.replace('/admin/login');
        return;
      }

      const role = (user.role || '').toLowerCase();
      if (role !== 'admin' && role !== 'owner') {
        toast.error('Akses ditolak. Halaman ini khusus Admin / Pengurus Inti PMR.');
        clearSession();
        router.replace('/admin/login');
        return;
      }

      setAuthorized(true);
    };

    verifyAccess();
    window.addEventListener('storage', verifyAccess);
    return () => window.removeEventListener('storage', verifyAccess);
  }, [router, pathname, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!authorized) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 dark:bg-[#1F0709] gap-3">
        <Loader2 className="animate-spin text-[#D32F2F]" size={32} />
        <p className="text-xs font-semibold text-slate-500 dark:text-red-200/70">
          Memverifikasi akses Admin PMR...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50/80 dark:bg-[#1F0709] text-slate-900 dark:text-red-50">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Mobile Top Bar */}
      <header className="lg:hidden sticky top-0 z-20 h-14 px-4 bg-white/90 dark:bg-[#2A090C]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-red-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-slate-700 dark:text-red-100 hover:bg-red-50 dark:hover:bg-red-950"
            aria-label="Buka Menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-extrabold text-sm text-[#D32F2F] dark:text-white">
            PMR ADMIN
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div
        className={`transition-all duration-200 ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}