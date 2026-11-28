'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  ShieldCheck,
  History,
  ArrowRight,
  Clock,
  Globe,
  MessageSquare,
  ClipboardList,
  ShieldAlert,
} from 'lucide-react';
import { isLoggedIn, getUser } from '@/lib/auth';
import { formatWitaDate } from '@/lib/time-client';
import { OrgLogos } from '@/components/OrgLogos';
import { ThemeToggle } from '@/components/ThemeToggle';

function resolveDashboardRoute(role?: string | null): {
  href: string;
  label: string;
} {
  const normalized = (role || '').toLowerCase();
  if (normalized === 'admin' || normalized === 'owner') {
    return { href: '/admin', label: 'Masuk ke Panel Admin' };
  }
  if (normalized === 'pengurus') {
    return { href: '/pengurus', label: 'Masuk ke Portal Pengurus' };
  }
  return { href: '/absensi', label: 'Lanjut ke Dashboard' };
}

export default function LandingPortalPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const authStatus = isLoggedIn();
    setLoggedIn(authStatus);
    if (authStatus) {
      const user = getUser();
      setUserName(user?.nama ?? null);
      setUserRole(user?.role ?? null);
    }

    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dashboardTarget = resolveDashboardRoute(userRole);
  const firstName = userName ? userName.trim().split(' ')[0] : null;

  return (
    <div className="min-h-dvh flex flex-col relative overflow-x-clip bg-gradient-to-b from-slate-50 via-white to-red-50/40 dark:from-[#230709] dark:via-[#230709] dark:to-[#2E090C] text-slate-900 dark:text-red-50">
      {/* Ambient Background Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-[#D32F2F]/[0.08] dark:bg-[#D32F2F]/[0.16] blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-rose-500/[0.06] dark:bg-rose-600/[0.12] blur-3xl" />
      </div>

      {/* Top Glass Header */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#330C0F]/85 backdrop-blur-xl border-b border-slate-200/70 dark:border-red-900/60">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <OrgLogos size="sm" shape="circle" />
            <div className="min-w-0">
              <p className="font-extrabold text-sm text-slate-900 dark:text-white leading-none truncate">
                PMR Attendance
              </p>
              <p className="text-[11px] text-slate-500 dark:text-red-200/75 font-medium mt-0.5 truncate">
                SMKN 1 Pringgabaya
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://pmr-smeksabaya.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-red-100 hover:text-[#D32F2F] dark:hover:text-white bg-slate-100/90 dark:bg-red-950/70 hover:bg-red-50 dark:hover:bg-red-900/80 border border-slate-200/60 dark:border-red-900/60 px-3 py-1.5 rounded-full transition-colors"
            >
              <Globe size={13} />
              <span className="hidden sm:inline">Website Utama</span>
              <span className="sm:hidden">Web PMR</span>
            </a>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 py-10 sm:py-14 flex flex-col justify-center">
        <div className="text-center max-w-xl mx-auto">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 dark:bg-red-950/80 border border-red-200/70 dark:border-red-800/60 text-[#D32F2F] dark:text-red-200 text-xs font-bold mb-6 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D32F2F] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D32F2F]" />
            </span>
            <span>Sistem Absensi Digital Terintegrasi WhatsApp</span>
          </div>

          {/* Tiga Logo Organisasi (SMKN 1 Pringgabaya, PMI, PMR Wira) */}
          <div className="mb-6">
            <OrgLogos size="lg" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            PMR Wira Unit <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D32F2F] to-rose-600 dark:from-red-400 dark:to-rose-300">
              SMKN 1 Pringgabaya
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-red-100/80 mt-3 leading-relaxed">
            Portal presensi kegiatan latihan rutin, piket UKS, dan kegiatan
            kepalangmerahan secara cepat, akurat, dan transparan.
          </p>

          {/* Live WITA Pill */}
          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-white/95 dark:bg-[#330C0F] border border-slate-200/80 dark:border-red-900/60 shadow-xs text-xs text-slate-600 dark:text-red-200/80">
            <Clock size={14} className="text-[#D32F2F] shrink-0" />
            <span>{now ? formatWitaDate(now) : 'Memuat waktu...'}</span>
            <span className="text-slate-300 dark:text-red-800">•</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {now
                ? now.toLocaleTimeString('id-ID', {
                    timeZone: 'Asia/Makassar',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                  })
                : '--:--:--'}{' '}
              WITA
            </span>
          </div>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {loggedIn ? (
              <Link
                href={dashboardTarget.href}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D32F2F] to-red-700 text-white font-bold text-sm px-7 py-3.5 rounded-2xl shadow-lg shadow-red-600/25 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                <span>
                  {dashboardTarget.label}
                  {firstName ? ` (${firstName})` : ''}
                </span>
                <ArrowRight size={17} />
              </Link>
            ) : (
              <Link
                href="/absensi/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D32F2F] to-red-700 text-white font-bold text-sm px-7 py-3.5 rounded-2xl shadow-lg shadow-red-600/25 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                <span>Masuk ke Sistem Absensi</span>
                <ArrowRight size={17} />
              </Link>
            )}

            <Link
              href="/absensi/scan"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-[#330C0F] text-slate-800 dark:text-red-50 font-bold text-sm px-6 py-3.5 rounded-2xl border border-slate-200/90 dark:border-red-900/60 shadow-xs hover:border-[#D32F2F]/60 hover:text-[#D32F2F] dark:hover:text-red-300 active:scale-[0.98] transition-all"
            >
              <QrCode size={17} className="text-[#D32F2F]" />
              <span>Scan QR Cepat</span>
            </Link>
          </div>

          {/* Tautan Akses Portal Pengurus & Admin */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-red-200/75">
            <Link
              href="/pengurus/login"
              className="inline-flex items-center gap-1.5 hover:text-[#D32F2F] dark:hover:text-red-300 transition-colors"
            >
              <ClipboardList size={13} className="text-[#D32F2F]" />
              <span>Portal Pengurus</span>
            </Link>
            <span className="text-slate-300 dark:text-red-900">•</span>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 hover:text-[#D32F2F] dark:hover:text-red-300 transition-colors"
            >
              <ShieldAlert size={13} className="text-[#D32F2F]" />
              <span>Portal Admin</span>
            </Link>
          </div>
        </div>

        {/* 3 Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-12">
          <div className="bg-white/95 dark:bg-[#330C0F] backdrop-blur-sm rounded-2xl p-5 border border-slate-200/75 dark:border-red-900/60 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/80 text-[#D32F2F] dark:text-red-300 flex items-center justify-center mb-3">
              <MessageSquare size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Login Tanpa Password
            </h3>
            <p className="text-xs text-slate-500 dark:text-red-200/75 mt-1 leading-relaxed">
              Cukup kirim perintah{' '}
              <code className="px-1 py-0.5 rounded bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-300 font-mono font-bold">
                !login
              </code>{' '}
              ke Bot WhatsApp PMR untuk masuk dengan OTP atau magic link.
            </p>
          </div>

          <div className="bg-white/95 dark:bg-[#330C0F] backdrop-blur-sm rounded-2xl p-5 border border-slate-200/75 dark:border-red-900/60 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/80 text-[#D32F2F] dark:text-red-300 flex items-center justify-center mb-3">
              <QrCode size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Scan QR Real-Time
            </h3>
            <p className="text-xs text-slate-500 dark:text-red-200/75 mt-1 leading-relaxed">
              Pindai kode QR sesi latihan langsung dari kamera ponsel dengan
              pencatatan waktu WITA otomatis.
            </p>
          </div>

          <div className="bg-white/95 dark:bg-[#330C0F] backdrop-blur-sm rounded-2xl p-5 border border-slate-200/75 dark:border-red-900/60 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/80 text-[#D32F2F] dark:text-red-300 flex items-center justify-center mb-3">
              <History size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Rekap &amp; Manajemen
            </h3>
            <p className="text-xs text-slate-500 dark:text-red-200/75 mt-1 leading-relaxed">
              Pantau statistik kehadiran pribadi, pengajuan izin, dan kelola
              keanggotaan pengurus secara terpusat.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-500 dark:text-red-200/70 py-5 px-4 border-t border-slate-200/70 dark:border-red-900/60 bg-white/80 dark:bg-[#330C0F]/85 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-1.5 font-bold text-slate-700 dark:text-red-100">
          <ShieldCheck size={14} className="text-[#D32F2F]" />
          <span>PMR Wira Unit SMKN 1 Pringgabaya</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-red-200/55 mt-0.5">
          © {new Date().getFullYear()} • Siamo Tutti Fratelli
        </p>
      </footer>
    </div>
  );
}