'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Loader2 } from 'lucide-react';

export default function AbsensiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname?.includes('/login');
  const isDashboardRoot = pathname === '/absensi' || pathname === '/absensi/';
  const showBackButton = !isLoginPage && !isDashboardRoot;

  const [isDeparting, setIsDeparting] = useState(false);

  const handleGoToMainWeb = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isDeparting) return;

    setIsDeparting(true);
    setTimeout(() => {
      window.open('https://pmr-smeksabaya.vercel.app', '_blank', 'noopener,noreferrer');
      setTimeout(() => setIsDeparting(false), 600);
    }, 320);
  };

  return (
    <div
      className={`min-h-screen flex flex-col relative overflow-x-clip ${
        isLoginPage
          ? 'bg-white'
          : 'bg-gradient-to-b from-slate-50 via-slate-50/90 to-red-50/30'
      }`}
    >
      {/* Aksen cahaya halus di bagian atas (halaman non-login) */}
      {!isLoginPage && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-red-500/[0.06] to-transparent"
        />
      )}

      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-pmr-red/95 via-red-600/95 to-pmr-red-dark/95 backdrop-blur-md text-white shadow-lg shadow-red-950/10 border-b border-white/15">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
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

            {/* Pill Container Logo SMKN 1 Pringgabaya & PMR Wira */}
            <Link
              href={isLoginPage ? '/absensi/login' : '/absensi'}
              className="flex items-center gap-2.5 group min-w-0"
            >
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2 py-1 rounded-full ring-1 ring-white/25 shadow-inner shrink-0">
                <div className="w-7 h-7 bg-white rounded-full p-0.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <img
                    src="/logo-smk.png"
                    alt="Logo SMKN 1 Pringgabaya"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="w-7 h-7 bg-white rounded-full p-0.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <img
                    src="/logo-pmr.png"
                    alt="Logo PMR Wira"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-sm sm:text-base tracking-tight leading-tight truncate">
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
            className="group relative overflow-hidden inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/15 hover:bg-white hover:text-pmr-red active:scale-95 px-3.5 py-1.5 rounded-full ring-1 ring-white/30 shadow-xs transition-all duration-300 shrink-0"
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
      <main className="relative flex-1 w-full max-w-4xl mx-auto px-4 py-6 pb-20">
        {children}
      </main>

      {/* Glass Footer */}
      <footer className="relative text-center text-xs text-slate-500 py-4 px-4 border-t border-slate-200/70 bg-white/75 backdrop-blur-sm">
        <p className="font-medium text-slate-600">
          © {new Date().getFullYear()} PMR Wira Unit SMKN 1 Pringgabaya
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Sistem Absensi Digital Terintegrasi WhatsApp
        </p>
      </footer>
    </div>
  );
}