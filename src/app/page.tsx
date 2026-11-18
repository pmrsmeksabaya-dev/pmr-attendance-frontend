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
} from 'lucide-react';
import { isLoggedIn, getUser } from '@/lib/auth';
import { formatWitaDate } from '@/lib/time-client';

export default function LandingPortalPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const authStatus = isLoggedIn();
    setLoggedIn(authStatus);
    if (authStatus) {
      const user = getUser();
      setUserName(user?.nama ?? null);
    }

    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-clip bg-gradient-to-b from-slate-50 via-white to-red-50/35">
      {/* Ambient Background Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-red-500/[0.08] blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-rose-500/[0.06] blur-3xl" />
      </div>

      {/* Top Glass Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center -space-x-1.5">
              <div className="w-8 h-8 rounded-full bg-white p-1 shadow-xs ring-1 ring-slate-200 flex items-center justify-center">
                <img
                  src="/logo-smk.png"
                  alt="Logo SMKN 1 Pringgabaya"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-8 h-8 rounded-full bg-white p-1 shadow-xs ring-1 ring-slate-200 flex items-center justify-center">
                <img
                  src="/logo-pmr.png"
                  alt="Logo PMR Wira"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 leading-none">
                PMR Attendance
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                SMKN 1 Pringgabaya
              </p>
            </div>
          </div>

          <a
            href="https://pmr-smeksabaya.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-pmr-red bg-slate-100/80 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors"
          >
            <Globe size={13} />
            <span>Web Utama</span>
          </a>
        </div>
      </header>

      {/* Main Hero Content */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto w-full px-4 py-10 sm:py-14 flex flex-col justify-center">
        <div className="text-center max-w-xl mx-auto">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200/70 text-pmr-red text-xs font-semibold mb-5 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pmr-red opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-pmr-red" />
            </span>
            Sistem Absensi Digital Terintegrasi WhatsApp
          </div>

          {/* Dual Logo Showcase */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2.5 shadow-lg shadow-slate-900/5 border border-slate-100 flex items-center justify-center">
              <img
                src="/logo-smk.png"
                alt="Logo SMKN 1 Pringgabaya"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2.5 shadow-lg shadow-slate-900/5 border border-slate-100 flex items-center justify-center">
              <img
                src="/logo-pmr.png"
                alt="Logo PMR Wira"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            PMR Wira Unit{' '}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pmr-red to-rose-700">
              SMKN 1 Pringgabaya
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            Portal presensi kegiatan latihan rutin, piket UKS, dan kegiatan
            kepalangmerahan secara cepat, akurat, dan transparan.
          </p>

          {/* Live WITA Pill */}
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs text-xs text-slate-600">
            <Clock size={14} className="text-pmr-red" />
            <span>{now ? formatWitaDate(now) : 'Memuat waktu...'}</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">
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
                href="/absensi"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pmr-red to-red-600 text-white font-bold text-sm px-7 py-3.5 rounded-2xl shadow-lg shadow-red-600/25 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                <span>
                  Lanjut ke Dashboard{userName ? ` (${userName.split(' ')[0]})` : ''}
                </span>
                <ArrowRight size={17} />
              </Link>
            ) : (
              <Link
                href="/absensi/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pmr-red to-red-600 text-white font-bold text-sm px-7 py-3.5 rounded-2xl shadow-lg shadow-red-600/25 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                <span>Masuk ke Sistem Absensi</span>
                <ArrowRight size={17} />
              </Link>
            )}

            <Link
              href="/absensi/scan"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-800 font-semibold text-sm px-6 py-3.5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-pmr-red/50 hover:text-pmr-red active:scale-[0.98] transition-all"
            >
              <QrCode size={17} />
              <span>Scan QR Cepat</span>
            </Link>
          </div>
        </div>

        {/* 3 Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-12">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/70 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-pmr-red flex items-center justify-center mb-3">
              <MessageSquare size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Login Tanpa Password
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Cukup kirim perintah <code className="text-pmr-red font-mono">!login</code> ke Bot WhatsApp PMR untuk masuk dengan OTP atau magic link.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/70 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-pmr-red flex items-center justify-center mb-3">
              <QrCode size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Scan QR Real-Time
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Pindai kode QR sesi latihan langsung dari kamera ponsel dengan pencatatan waktu WITA otomatis.
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-slate-200/70 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-pmr-red flex items-center justify-center mb-3">
              <History size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-900">
              Rekap &amp; Manajemen
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Pantau statistik kehadiran pribadi dan kelola keanggotaan pengurus secara terpusat.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-500 py-5 px-4 border-t border-slate-200/70 bg-white/75 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-1.5 font-semibold text-slate-600">
          <ShieldCheck size={14} className="text-pmr-red" />
          <span>PMR Wira Unit SMKN 1 Pringgabaya</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">
          © {new Date().getFullYear()} • Siamo Tutti Fratelli
        </p>
      </footer>
    </div>
  );
}