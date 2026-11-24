'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2,
  ShieldAlert,
  KeyRound,
  ArrowRight,
  ClipboardPaste,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { saveSession, getUser, isLoggedIn } from '@/lib/auth';

function AdminLoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get('token');

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const processedRef = useRef(false);

  const handleVerify = async (rawToken: string) => {
    const clean = rawToken.trim();
    if (!clean) return;

    setLoading(true);
    try {
      // Kirim portal: 'admin' agar tervalidasi khusus token/OTP dari !loginadmin
      const res = await (api.verifyMagic as any)(clean, 'admin');
      const role = (res.user.role || '').toLowerCase();

      if (role !== 'admin' && role !== 'owner') {
        toast.error(
          'Akses ditolak. Akun Anda bukan Admin/Owner.'
        );
        router.replace(role === 'pengurus' ? '/pengurus' : '/absensi');
        return;
      }

      saveSession(res.jwt, {
        member_id: res.user.member_id,
        nama: res.user.nama,
        role: res.user.role as any,
      });

      toast.success(`Selamat datang di Panel Admin, ${res.user.nama}`);
      router.replace('/admin');
    } catch (e: any) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : e?.message || 'Kode login tidak valid, salah portal, atau kedaluwarsa.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl && !processedRef.current) {
      processedRef.current = true;
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

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip.trim()) {
        // Jika user menyalin seluruh URL magic link, ekstrak parameter ?token= secara otomatis
        const text = clip.trim();
        const urlMatch = text.match(/[?&]token=([a-zA-Z0-9_-]+)/);
        const extracted = urlMatch ? urlMatch[1] : text.slice(0, 12);
        setToken(extracted);
      }
    } catch {
      toast.error('Gagal membaca clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#230709] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#330C0F] rounded-3xl shadow-xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
        <div className="bg-gradient-to-r from-[#D32F2F] to-red-800 p-6 text-center text-white">
          <div className="w-14 h-14 bg-white rounded-full p-2 mx-auto mb-3 shadow-md flex items-center justify-center">
            <img
              src="/logo-pmr.png"
              alt="Logo PMR"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">
            Admin Control Portal
          </h1>
          <p className="text-xs text-white/80 mt-1">
            PMR Wira SMKN 1 Pringgabaya
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify(token);
          }}
          className="p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-start gap-2.5 text-xs font-medium text-[#D32F2F] dark:text-red-200 bg-red-50 dark:bg-red-950/60 border border-red-200/70 dark:border-red-800/60 px-3.5 py-2.5 rounded-xl leading-relaxed">
            <ShieldAlert size={16} className="shrink-0 mt-0.5 text-[#D32F2F]" />
            <span>
              Kirim <b className="font-mono">!loginadmin</b> ke Bot WhatsApp PMR untuk mendapatkan <b>Magic Link</b> atau <b>Kode OTP 6-Digit</b> (khusus Admin &amp; Owner).
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1.5">
              Kode OTP (6 Digit) / Token Magic Link
            </label>
            <div className="relative">
              <KeyRound
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                maxLength={12}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Contoh: 482910"
                className="w-full pl-10 pr-20 py-3 bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 rounded-xl font-mono text-base tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                autoFocus
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-[#D32F2F] text-[11px] font-bold hover:bg-red-100"
              >
                <ClipboardPaste size={12} />
                Paste
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
                <span>Masuk ke Dashboard Admin</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-[#D32F2F]" size={32} />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}