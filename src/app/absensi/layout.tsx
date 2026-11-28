'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { OrgLogos } from '@/components/OrgLogos';

export default function AbsensiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage =
    pathname?.includes('/login') || pathname?.includes('/verify');
  const isDashboardRoot = pathname === '/absensi' || pathname === '/absensi/';
  const showBackButton = !isAuthPage && !isDashboardRoot;

  const [isDeparting, setIsDeparting] = useState(false);

  const handleGoToMainWeb = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isDeparting) return;

    setIsDeparting(true);
    setTimeout(() => {
      window.open(
        'https://pmr-smeksabaya.vercel.app',
        '_blank',
        'noopener,noreferrer'
      );
      setTimeout(() => setIsDeparting(false), 600);
    }, 320);
  };

  return (
    <div
      className={`min-h-dvh flex flex-col relative overflow-x-clip ${
        isAuthPage
          ? 'bg-slate-50 dark:bg-[#230709]'
          : 'bg-gradient-to-b from-slate-50 via-slate-50/90 to-red-50/30 dark:from-[#230709] dark:via-[#230709] dark:to-[#2D090C]'
      }`}
    >
      {/* Aksen cahaya halus di bagian atas (halaman non-autentikasi) */}
      {!isAuthPage && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#D32F2F]/[0.07] dark:from-[#D32F2F]/[0.14] to-transparent"
        />
      )}

      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-[#D32F2F]/95 via-red-700/95 to-red-900/95 backdrop-blur-md text-white shadow-lg shadow-red-950/15 border-b border-white/15">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {showBackButton && (
              <Link
                href="/absensi"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 ring-1 ring-white/20 transition-all shrink-0"
                aria-label="Kembali ke Beranda"
                title="Kembali ke Beranda"
              >
                <ArrowLeft size={18} />
              </Link>
            )}

            {/* Tiga Logo Organisasi (SMKN 1 Pringgabaya, PMI, PMR Wira) + Judul */}
            <Link
              href={isAuthPage ? '/absensi/login' : '/absensi'}
              className="flex items-center gap-2.5 group min-w-0"
            >
              <div className="bg-white/15 backdrop-blur-sm px-2 py-1 rounded-full ring-1 ring-white/25 shadow-inner shrink-0 group-hover:bg-white/20 transition-colors">
                <OrgLogos size="sm" shape="circle" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-sm sm:text-base tracking-tight leading-tight truncate">
                    PMR Attendance
                  </h1>
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)] shrink-0"
                    title="Sistem Online"
                  />
                </div>
                <p className="text-[11px] text-white/85 font-medium leading-tight truncate">
                  SMKN 1 Pringgabaya
                </p>
              </div>
            </Link>
          </div>

          {/* Tautan Website Utama dengan Animasi Pergi */}
          <a
            href="https://pmr-smeksabaya.vercel.app"
            onClick={handleGoToMainWeb}
            className="group relative overflow-hidden inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/15 hover:bg-white hover:text-[#D32F2F] active:scale-95 px-3.5 py-1.5 rounded-full ring-1 ring-white/30 shadow-xs transition-all duration-300 shrink-0"
          >
            {/* Efek kilau (shimmer) melintas saat hover */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/35 to-transparent"
            />

            <span className="relative z-10">
              {isDeparting ? (
                'Membuka...'
              ) : (
                <>
                  <span className="hidden sm:inline">Website Utama</span>
                  <span className="sm:hidden">Web PMR</span>
                </>
              )}
            </span>

            {isDeparting ? (
              <Loader2 size={13} className="relative z-10 animate-spin" />
            ) : (
              <ArrowUpRight
                size={14}
                className="relative z-10 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            )}
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 w-full max-w-4xl mx-auto px-4 py-6 pb-16">
        {children}
      </main>

      {/* Glass Footer */}
      <footer className="relative text-center text-xs text-slate-500 dark:text-red-200/70 py-4 px-4 border-t border-slate-200/70 dark:border-red-900/60 bg-white/80 dark:bg-[#330C0F]/85 backdrop-blur-sm">
        <p className="font-semibold text-slate-700 dark:text-red-100">
          © {new Date().getFullYear()} PMR Wira Unit SMKN 1 Pringgabaya
        </p>
        <p className="text-[11px] text-slate-400 dark:text-red-200/55 mt-0.5">
          Sistem Absensi Digital Terintegrasi WhatsApp
        </p>
      </footer>
    </div>
  );
}