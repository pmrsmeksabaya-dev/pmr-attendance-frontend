'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  LogOut,
  LayoutDashboard,
  Users,
  Wallet,
  HeartPulse,
  Package,
  Menu,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { getJwt, getUser, clearSession } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV_ITEMS = [
  {
    href: '/pengurus',
    label: 'Ringkasan & Divisi',
    desc: 'Koordinasi pengurus',
    icon: LayoutDashboard,
  },
  {
    href: '/pengurus/anggota',
    label: 'Data Anggota',
    desc: 'Sekretaris & Keanggotaan',
    icon: Users,
  },
  {
    href: '/pengurus/keuangan',
    label: 'Kas Bendahara',
    desc: 'Pemasukan & pengeluaran',
    icon: Wallet,
  },
  {
    href: '/pengurus/uks',
    label: 'Pelayanan UKS',
    desc: 'Log pasien & P3K',
    icon: HeartPulse,
  },
  {
    href: '/pengurus/inventaris',
    label: 'Inventaris Alat',
    desc: 'Divisi Perlengkapan',
    icon: Package,
  },
];

export default function PengurusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/pengurus/login';

  const [authorized, setAuthorized] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Muat status collapse sidebar desktop dari localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pmr_pengurus_sidebar_collapsed');
      if (saved === '1') setCollapsed(true);
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pmr_pengurus_sidebar_collapsed', next ? '1' : '0');
      } catch {
        // Abaikan
      }
      return next;
    });
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isLoginPage) {
      setAuthorized(true);
      return;
    }

    const token = getJwt();
    const user = getUser();

    if (!token || !user) {
      router.replace('/pengurus/login');
      return;
    }

    const role = (user.role || '').toLowerCase();
    if (role !== 'pengurus' && role !== 'admin' && role !== 'owner') {
      toast.error('Akses ditolak. Halaman ini khusus Pengurus PMR.');
      clearSession();
      router.replace('/pengurus/login');
      return;
    }

    setUserName(user.nama || 'Pengurus');
    setUserRole(role.toUpperCase());
    setAuthorized(true);
  }, [router, pathname, isLoginPage]);

  const handleLogout = () => {
    clearSession();
    router.replace('/pengurus/login');
  };

  if (isLoginPage) return <>{children}</>;

  if (!authorized) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-[#1F0709]">
        <Loader2 className="animate-spin text-[#D32F2F]" size={30} />
      </div>
    );
  }

  const SidebarContent = ({ isMini = false }: { isMini?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div
        className={`p-4 flex items-center border-b border-slate-100 dark:border-red-900/50 ${
          isMini ? 'justify-center' : 'justify-between'
        }`}
      >
        <Link
          href="/pengurus"
          title="Portal Pengurus PMR"
          className="flex items-center gap-3 min-w-0"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950 p-1.5 border border-red-200/70 dark:border-red-800/60 shrink-0">
            <img
              src="/logo-pmr.png"
              alt="Logo PMR"
              className="w-full h-full object-contain"
            />
          </div>
          {!isMini && (
            <div className="min-w-0">
              <p className="font-extrabold text-xs tracking-wide text-[#D32F2F] dark:text-white truncate">
                PORTAL PENGURUS
              </p>
              <p className="text-[10px] text-slate-500 dark:text-red-200/70 truncate">
                PMR Wira SMKN 1 Pringgabaya
              </p>
            </div>
          )}
        </Link>

        {/* Tombol tutup khusus drawer mobile */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-red-200 dark:hover:bg-red-950"
          aria-label="Tutup menu"
        >
          <X size={18} />
        </button>

        {/* Tombol toggle mini sidebar khusus desktop saat mode lebar */}
        {!isMini && (
          <button
            type="button"
            onClick={toggleCollapsed}
            title="Perkecil Sidebar"
            aria-label="Perkecil Sidebar"
            className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-[#D32F2F] hover:bg-red-50 dark:hover:bg-red-950 transition"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Tombol expand saat mode mini */}
      {isMini && (
        <div className="hidden lg:flex justify-center pt-3">
          <button
            type="button"
            onClick={toggleCollapsed}
            title="Perluas Sidebar"
            aria-label="Perluas Sidebar"
            className="p-2 rounded-xl text-slate-500 hover:text-[#D32F2F] bg-slate-100/80 dark:bg-red-950/60 hover:bg-red-50 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Daftar Menu Navigasi */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        {!isMini && (
          <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-red-300/50">
            Menu Bidang &amp; Divisi
          </p>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/pengurus'
              ? pathname === '/pengurus'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isMini ? `${item.label} — ${item.desc}` : undefined}
              className={`group flex items-center rounded-xl transition-all ${
                isMini ? 'justify-center p-2.5' : 'gap-3 px-3.5 py-2.5'
              } ${
                active
                  ? 'bg-[#D32F2F] text-white shadow-md shadow-red-600/20'
                  : 'text-slate-700 dark:text-red-100/85 hover:bg-red-50 dark:hover:bg-red-950/60'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-red-950 text-[#D32F2F] group-hover:bg-red-100'
                }`}
              >
                <Icon size={17} />
              </div>
              {!isMini && (
                <div className="min-w-0">
                  <p className="text-xs font-extrabold truncate">{item.label}</p>
                  <p
                    className={`text-[10px] truncate ${
                      active
                        ? 'text-white/80'
                        : 'text-slate-400 dark:text-red-200/60'
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>
              )}
            </Link>
          );
        })}

        {/* Pintasan ke Admin jika role ADMIN / OWNER */}
        {(userRole === 'ADMIN' || userRole === 'OWNER') && (
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-red-900/50">
            <Link
              href="/admin"
              title={isMini ? 'Buka Panel Admin' : undefined}
              className={`flex items-center rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 transition ${
                isMini ? 'justify-center p-2.5' : 'gap-2.5 px-3.5 py-2.5'
              }`}
            >
              <ShieldCheck size={17} className="shrink-0" />
              {!isMini && <span>Buka Panel Admin</span>}
            </Link>
          </div>
        )}
      </div>

      {/* Footer Akun & Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-red-900/50 bg-slate-50/60 dark:bg-[#230709]/60">
        {isMini ? (
          <div className="flex flex-col items-center gap-2.5">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              title={`Keluar Portal (${userName})`}
              aria-label="Keluar Portal"
              className="p-2.5 rounded-xl text-[#D32F2F] bg-red-50 dark:bg-red-950 hover:bg-[#D32F2F] hover:text-white transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-extrabold truncate">{userName}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-red-100 dark:bg-red-950 text-[#D32F2F] dark:text-red-200">
                  {userRole || 'PENGURUS'}
                </span>
              </div>
              <ThemeToggle />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-[#D32F2F] bg-red-50 dark:bg-red-950 hover:bg-[#D32F2F] hover:text-white transition"
            >
              <LogOut size={14} />
              <span>Keluar Portal</span>
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-[#1F0709] text-slate-900 dark:text-red-50 flex flex-col lg:flex-row">
      {/* Topbar Sticky khusus Mobile & Tablet (< lg) */}
      <header className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-[#2A090C]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-red-900/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-red-50 dark:bg-red-950 text-[#D32F2F] hover:bg-red-100 transition"
            aria-label="Buka menu sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/logo-pmr.png"
              alt="Logo PMR"
              className="w-7 h-7 object-contain"
            />
            <div>
              <p className="font-extrabold text-xs text-[#D32F2F] dark:text-white leading-none">
                PORTAL PENGURUS
              </p>
              <p className="text-[10px] text-slate-500 dark:text-red-200/70 mt-0.5">
                PMR Wira SMKN 1 Pringgabaya
              </p>
            </div>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* Overlay & Slide-over Drawer Sidebar Mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[82vw] bg-white dark:bg-[#2A090C] h-full shadow-2xl border-r border-slate-200 dark:border-red-900/60 z-10">
            <SidebarContent isMini={false} />
          </aside>
        </div>
      )}

      {/* Sidebar Sticky Desktop (>= lg) dengan transisi lebar */}
      <aside
        className={`hidden lg:block lg:sticky lg:top-0 lg:h-dvh bg-white dark:bg-[#2A090C] border-r border-slate-200/80 dark:border-red-900/60 shrink-0 transition-all duration-200 ${
          collapsed ? 'lg:w-20' : 'lg:w-68'
        }`}
      >
        <SidebarContent isMini={collapsed} />
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}