'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  ClipboardPaste,
  UserCheck,
  ClipboardList,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { saveSession, getUser, isLoggedIn } from '@/lib/auth';
import { OrgLogos } from '@/components/OrgLogos';

function extractToken(raw: string): string {
  const trimmed = raw.trim();
  const urlMatch = trimmed.match(/[?&]token=([a-zA-Z0-9._-]+)/);
  if (urlMatch?.[1]) return urlMatch[1];
  return trimmed;
}

function AdminLoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get('token');

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(Boolean(tokenFromUrl));
  const processedRef = useRef(false);

  const handleVerify = async (rawToken: string) => {
    const clean = extractToken(rawToken);
    if (!clean) return;

    setLoading(true);
    try {
      // Validasi khusus token/OTP dari perintah !loginadmin
      const res = await api.verifyMagic(clean, 'admin');
      const role = (res.user.role || '').toLowerCase();

      if (role !== 'admin' && role !== 'owner') {
        toast.error(
          `Akses ditolak. Akun Anda berstatus "${res.user.role.toUpperCase()}", bukan Admin atau Owner.`
        );
        router.replace(role === 'pengurus' ? '/pengurus' : '/absensi');
        return;
      }

      saveSession(res.jwt, {
        member_id: res.user.member_id,
        nama: res.user.nama,
        role: res.user.role as any,
      });

      toast.success(`Selamat datang di Panel Admin, ${res.user.nama}!`);
      router.replace('/admin');
    } catch (e: any) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : e?.message || 'Kode login tidak valid, salah portal, atau kedaluwarsa.'
      );
      setLoading(false);
      if (tokenFromUrl) {
        router.replace('/admin/login');
      }
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      if (processedRef.current) return;
      processedRef.current = true;
      setToken(extractToken(tokenFromUrl));
      handleVerify(tokenFromUrl);
      return;
    }

    if (isLoggedIn()) {
      const u = getUser();
      const role = (u?.role || '').toLowerCase();
      if (role === 'admin' || role === 'owner') {
        router.replace('/admin');
      } else if (role === 'pengurus') {
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

    if (value.includes('token=') && extracted.length >= 6) {
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
      toast.success('Kode ditempel dari clipboard.');

      if (extracted.length >= 6) {
        handleVerify(extracted);
      }
    } catch {
      toast.error('Izin clipboard ditolak. Tempel manual menggunakan Ctrl+V / Tekan Lama.');
    }
  };

  if (tokenFromUrl && loading) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-[#230709] flex flex-col items-center justify-center gap-3 p-4">
        <Loader2 className="animate-spin text-[#D32F2F]" size={36} />
        <p className="text-sm font-bold text-slate-700 dark:text-red-100">
          Memverifikasi Magic Link Admin Control Portal...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-[#230709] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#330C0F] rounded-3xl shadow-xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
        {/* Header dengan Tiga Logo Background Putih Permanen */}
        <div className="bg-gradient-to-r from-[#D32F2F] via-red-700 to-red-900 p-6 text-center text-white">
          <div className="mb-3">
            <OrgLogos size="lg" shape="circle" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">
            Admin Control Portal
          </h1>
          <p className="text-xs text-white/85 mt-1">
            Panel Manajemen &amp; Pembina — SMKN 1 Pringgabaya
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (token.trim().length >= 6 && !loading) {
              handleVerify(token);
            }
          }}
          className="p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-start gap-2.5 text-xs font-medium text-slate-700 dark:text-red-100/90 bg-red-50/80 dark:bg-red-950/60 border border-red-200/70 dark:border-red-800/60 px-3.5 py-3 rounded-2xl leading-relaxed">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-[#D32F2F]" />
            <span>
              Kirim{' '}
              <code className="px-1.5 py-0.5 rounded-md bg-white dark:bg-[#230709] border border-red-200/60 dark:border-red-800/60 font-mono font-extrabold text-[#D32F2F] dark:text-red-300">
                !loginadmin
              </code>{' '}
              melalui <b>Chat Pribadi (Japri)</b> ke Bot WhatsApp PMR untuk
              mendapatkan <b>Magic Link</b> atau <b>Kode OTP 6-Digit</b> (khusus
              Admin &amp; Owner).
            </span>
          </div>

          <div>
            <label
              htmlFor="admin-token-input"
              className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1.5"
            >
              Kode OTP (6 Digit) / Token Magic Link
            </label>
            <div className="relative">
              <KeyRound
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="admin-token-input"
                type="text"
                autoComplete="one-time-code"
                required
                value={token}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="482910 / tempel link"
                className="w-full pl-10 pr-20 py-3 bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 rounded-xl font-mono text-sm sm:text-base font-bold tracking-wider text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                autoFocus
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-200 text-[11px] font-bold hover:bg-red-100 dark:hover:bg-red-900 transition"
              >
                <ClipboardPaste size={12} />
                <span>Paste</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || token.trim().length < 6}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-red-700 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm shadow-md shadow-red-600/20 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>Memverifikasi Akses...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Dashboard Admin</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Info Keamanan */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-red-200/60 pt-1">
            <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
            <span>Akses terbatas &amp; tercatat di Audit Log sistem.</span>
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
              href="/pengurus/login"
              className="inline-flex items-center gap-1 hover:text-[#D32F2F] transition"
            >
              <ClipboardList size={13} />
              <span>Portal Pengurus</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-slate-50 dark:bg-[#230709] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#D32F2F]" size={32} />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}