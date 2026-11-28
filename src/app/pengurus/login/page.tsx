'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2,
  ClipboardCheck,
  KeyRound,
  ArrowRight,
  ClipboardPaste,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { saveSession, getUser, isLoggedIn } from '@/lib/auth';

function extractToken(raw: string): string {
  const trimmed = raw.trim();
  const urlMatch = trimmed.match(/[?&]token=([a-zA-Z0-9._-]+)/);
  if (urlMatch?.[1]) return urlMatch[1];
  return trimmed;
}

function PengurusLoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get('token');

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const processedRef = useRef(false);

  const handleVerify = async (rawToken: string) => {
    const clean = extractToken(rawToken);
    if (!clean || loading) return;

    setLoading(true);
    try {
      const res = await api.verifyMagic(clean, 'pengurus');
      const role = (res.user.role || '').toLowerCase();

      if (role !== 'pengurus' && role !== 'admin' && role !== 'owner') {
        toast.error(
          'Akses ditolak. Akun Anda terdaftar sebagai Anggota biasa, bukan Pengurus PMR.'
        );
        router.replace('/absensi');
        return;
      }

      saveSession(res.jwt, {
        member_id: res.user.member_id,
        nama: res.user.nama,
        role: res.user.role as any,
      });

      toast.success(`Selamat datang di Portal Pengurus, ${res.user.nama}`);
      router.replace('/pengurus');
    } catch (e: any) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : e?.message || 'Kode OTP atau Magic Link tidak valid / kedaluwarsa.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl && !processedRef.current) {
      processedRef.current = true;
      setToken(tokenFromUrl);
      handleVerify(tokenFromUrl);
      return;
    }

    if (isLoggedIn()) {
      const u = getUser();
      const role = (u?.role || '').toLowerCase();
      if (role === 'pengurus' || role === 'admin' || role === 'owner') {
        router.replace('/pengurus');
      } else {
        router.replace('/absensi');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl, router]);

  const handleInputChange = (value: string) => {
    const extracted = extractToken(value);
    setToken(extracted);

    // Jika menempelkan URL magic link lengkap atau 6 digit angka OTP secara utuh
    if (value.includes('token=') && extracted.length >= 16) {
      handleVerify(extracted);
    }
  };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (!clip.trim()) {
        toast.error('Clipboard kosong.');
        return;
      }
      const extracted = extractToken(clip);
      setToken(extracted);
      toast.success('Token ditempel dari clipboard.');

      if (extracted.length >= 6) {
        handleVerify(extracted);
      }
    } catch {
      toast.error('Izin clipboard ditolak browser. Tempel manual menggunakan Ctrl+V / Tekan Lama.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#230709] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#330C0F] rounded-3xl shadow-xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
        {/* Header Gradient PMR */}
        <div className="bg-gradient-to-r from-[#D32F2F] via-rose-700 to-red-900 p-6 text-center text-white">
          <div className="w-14 h-14 bg-white rounded-full p-2 mx-auto mb-3 shadow-md flex items-center justify-center">
            <img
              src="/logo-pmr.png"
              alt="Logo PMR"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">
            Portal Pengurus PMR
          </h1>
          <p className="text-xs text-white/85 mt-1">
            PMR Wira SMKN 1 Pringgabaya
          </p>
        </div>

        {/* Form Verifikasi */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify(token);
          }}
          className="p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-start gap-2.5 text-xs font-medium text-[#D32F2F] dark:text-red-200 bg-red-50 dark:bg-red-950/60 border border-red-200/70 dark:border-red-800/60 px-3.5 py-2.5 rounded-xl leading-relaxed">
            <ClipboardCheck
              size={16}
              className="shrink-0 mt-0.5 text-[#D32F2F]"
            />
            <span>
              Kirim <b className="font-mono">!loginpengurus</b> ke chat pribadi
              Bot WhatsApp PMR untuk mendapatkan <b>Magic Link</b> atau{' '}
              <b>Kode OTP 6-Digit</b>.
            </span>
          </div>

          <div>
            <label
              htmlFor="pengurus-token-input"
              className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1.5"
            >
              Kode OTP (6 Digit) atau Token Magic Link
            </label>
            <div className="relative">
              <KeyRound
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="pengurus-token-input"
                type="text"
                autoComplete="one-time-code"
                value={token}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Contoh: 482910 atau tempel link"
                className="w-full pl-10 pr-20 py-3 bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 rounded-xl font-mono text-sm tracking-wider text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                autoFocus
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-200 text-[11px] font-bold hover:bg-red-100 dark:hover:bg-red-900 transition"
              >
                <ClipboardPaste size={12} /> Paste
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || token.trim().length < 6}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-red-700 text-white font-bold py-3.5 rounded-xl text-sm shadow-md shadow-red-600/20 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Memverifikasi Akses...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Portal Pengurus</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Info Keamanan Sesi */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-red-200/60 pt-1">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>Sesi terisolasi &amp; setiap aktivitas tercatat di Audit Log.</span>
          </div>

          {/* Tautan Pindah Portal */}
          <div className="pt-3 border-t border-slate-100 dark:border-red-900/50 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-red-200/75">
            <Link
              href="/absensi/login"
              className="inline-flex items-center gap-1 hover:text-[#D32F2F] transition"
            >
              <UserCheck size={13} />
              <span>Login Anggota</span>
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 hover:text-[#D32F2F] transition"
            >
              <ShieldAlert size={13} />
              <span>Login Admin</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PengurusLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#230709] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#D32F2F]" size={32} />
        </div>
      }
    >
      <PengurusLoginContent />
    </Suspense>
  );
}