'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  FileSpreadsheet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  X,
} from 'lucide-react';
import { clearSession, getUser } from '@/lib/auth';
import { ThemeToggle } from '../ThemeToggle';
import { OrgLogos } from '../OrgLogos';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard },
  { href: '/admin/members', label: 'Data Anggota', icon: Users },
  { href: '/admin/sessions', label: 'Sesi Absensi', icon: CalendarCheck },
  { href: '/admin/reports', label: 'Laporan', icon: FileSpreadsheet },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

export function AdminSidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  const handleLogout = () => {
    clearSession();
    router.replace('/admin/login');
  };

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const isMini = collapsed && !isMobile;

    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#330C0F] border-r border-slate-200/80 dark:border-red-900/60 text-slate-800 dark:text-red-50">
        {/* Brand Header: Hanya Logo PMR dengan Background Putih Permanen */}
        <div
          className={`h-16 px-4 flex items-center border-b border-slate-100 dark:border-red-900/50 shrink-0 ${
            isMini ? 'justify-center' : 'justify-between gap-2'
          }`}
        >
          <Link
            href="/admin"
            onClick={onCloseMobile}
            title="PMR Admin — SMKN 1 Pringgabaya"
            className="flex items-center gap-2.5 min-w-0"
          >
            <OrgLogos size="sm" onlyPmr />
            {!isMini && (
              <div className="truncate">
                <p className="font-extrabold text-sm leading-tight text-[#D32F2F] dark:text-white">
                  PMR ADMIN
                </p>
                <p className="text-[11px] text-slate-500 dark:text-red-200/70 truncate">
                  SMKN 1 Pringgabaya
                </p>
              </div>
            )}
          </Link>

          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Tutup menu sidebar"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-red-200 dark:hover:bg-red-950 shrink-0"
            >
              <X size={18} />
            </button>
          ) : (
            !isMini && (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Perkecil Sidebar"
                title="Perkecil Sidebar"
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#D32F2F] hover:bg-red-50 dark:hover:bg-red-950 transition shrink-0"
              >
                <ChevronLeft size={16} />
              </button>
            )
          )}
        </div>

        {/* Tombol Perluas Sidebar saat mode mini */}
        {isMini && (
          <div className="flex justify-center pt-3">
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Perluas Sidebar"
              title="Perluas Sidebar"
              className="p-2 rounded-xl text-slate-500 hover:text-[#D32F2F] bg-slate-100/80 dark:bg-red-950/60 hover:bg-red-50 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={isMini ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#D32F2F] text-white shadow-md shadow-red-600/20'
                    : 'text-slate-600 dark:text-red-100/80 hover:bg-red-50/80 dark:hover:bg-red-950/70 hover:text-[#D32F2F]'
                } ${isMini ? 'justify-center' : ''}`}
              >
                <Icon size={18} className="shrink-0" />
                {!isMini && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* Pintasan ke Portal Pengurus */}
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-red-900/50">
            <Link
              href="/pengurus"
              onClick={onCloseMobile}
              title={isMini ? 'Buka Portal Pengurus' : undefined}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/70 transition ${
                isMini ? 'justify-center' : ''
              }`}
            >
              <ClipboardList size={17} className="shrink-0" />
              {!isMini && <span className="truncate">Portal Pengurus</span>}
            </Link>
          </div>
        </nav>

        {/* Footer User & Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-red-900/50 bg-slate-50/60 dark:bg-[#230709]/60 space-y-2 shrink-0">
          {!isMini && user && (
            <div className="px-3 py-2 rounded-xl bg-white dark:bg-red-950/60 border border-slate-100 dark:border-red-900/50">
              <p className="text-xs font-bold truncate">{user.nama}</p>
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900 text-[#D32F2F] dark:text-red-100 text-[10px] font-extrabold uppercase">
                {user.role}
              </span>
            </div>
          )}

          <div
            className={`flex items-center gap-2 ${
              isMini ? 'flex-col' : 'justify-between'
            }`}
          >
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              title="Keluar"
              aria-label="Keluar"
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#D32F2F] bg-red-50 dark:bg-red-950/80 hover:bg-[#D32F2F] hover:text-white transition ${
                isMini ? 'w-full' : 'flex-1'
              }`}
            >
              <LogOut size={15} />
              {!isMini && <span>Keluar</span>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-200 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-64 max-w-[80vw] h-full">
            <SidebarContent isMobile />
          </div>
        </div>
      )}
    </>
  );
}