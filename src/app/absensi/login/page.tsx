'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  KeyRound,
  ClipboardPaste,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  ClipboardList,
  ShieldAlert,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { saveSession, isLoggedIn } from '@/lib/auth';
import { OrgLogos } from '@/components/OrgLogos';

function extractToken(raw: string): string {
  const trimmed = raw.trim();
  const urlMatch = trimmed.match(/[?&]token=([a-zA-Z0-9._-]+)/);
  if (urlMatch?.[1]) return urlMatch[1];
  return trimmed;
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'input'>('loading');
  const [message, setMessage] = useState('Memverifikasi kode...');
  const [manualToken, setManualToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasProcessedUrlRef = useRef(false);

  // Fungsi untuk memproses token Magic Link (!login) maupun kode OTP 6-digit (!otp)
  const processToken = async (rawInput: string) => {
    const cleanToken = extractToken(rawInput);
    if (!cleanToken) {
      setStatus('error');
      setMessage('Kode login atau OTP tidak boleh kosong.');
      return;
    }

    setStatus('loading');
    setMessage('Memverifikasi akses anggota...');
    setIsSubmitting(true);

    try {
      const res = await api.verifyMagic(cleanToken, 'member');
      saveSession(res.jwt, {
        member_id: res.user.member_id,
        nama: res.user.nama,
        role: res.user.role as any,
      });
      setStatus('success');
      setMessage(`Selamat datang, ${res.user.nama}!`);
      toast.success('Login berhasil');
      setTimeout(() => router.replace('/absensi'), 1000);
    } catch (e: any) {
      setStatus('error');
      setMessage(
        e instanceof ApiError
          ? e.message
          : e?.message || 'Gagal verifikasi. Minta link atau kode baru via Bot WhatsApp.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cek sesi atau token dari URL saat pertama kali load
  useEffect(() => {
    if (tokenFromUrl) {
      if (hasProcessedUrlRef.current) return;
      hasProcessedUrlRef.current = true;
      processToken(tokenFromUrl);
    } else if (isLoggedIn()) {
      router.replace('/absensi');
    } else {
      setStatus('input');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl, router]);

  // Handle input change (otomatis ekstrak jika user paste full URL Magic Link)
  const handleTokenChange = (value: string) => {
    const extracted = extractToken(value);
    setManualToken(extracted);

    if (value.includes('token=') && extracted.length >= 6) {
      processToken(extracted);
    }
  };

  // Handle submit form manual
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim().length >= 6) {
      processToken(manualToken.trim());
    }
  };

  // Tempel kode atau URL dari clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const extracted = extractToken(text);
      if (extracted) {
        setManualToken(extracted);
        toast.success('Kode ditempel dari clipboard');
        if (extracted.length >= 6) {
          processToken(extracted);
        }
      } else {
        toast.error('Clipboard kosong');
      }
    } catch {
      toast.error('Izinkan akses clipboard atau tempel manual (Ctrl+V / Tekan Lama)');
    }
  };

  const handleRetryManual = () => {
    setStatus('input');
    setManualToken('');
    if (tokenFromUrl) {
      router.replace('/absensi/login');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-6 text-slate-900 dark:text-red-50 text-center">
      {status === 'loading' && (
        <div className="w-full max-w-md bg-white/95 dark:bg-[#330C0F] backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 dark:border-red-900/60 p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/80 border border-red-100 dark:border-red-800/60 flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-[#D32F2F] animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Memproses...
          </h2>
          <p className="text-slate-500 dark:text-red-200/75 mt-1.5 text-xs sm:text-sm">
            {message}
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="w-full max-w-md bg-white/95 dark:bg-[#330C0F] backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/5 border border-emerald-200/80 dark:border-emerald-800/60 p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold mb-1.5">
            <ShieldCheck size={12} />
            <span>Terverifikasi</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Login Berhasil
          </h2>
          <p className="text-slate-600 dark:text-red-100/85 mt-1.5 text-sm">
            {message}
          </p>
          <p className="text-xs text-slate-400 dark:text-red-200/60 mt-3">
            Mengalihkan ke dashboard absensi...
          </p>

          <Link
            href="/absensi"
            className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-2xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <span>Lanjut ke Dashboard</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="w-full max-w-md bg-white/95 dark:bg-[#330C0F] backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/5 border border-red-200/80 dark:border-red-900/60 p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/80 border border-red-100 dark:border-red-800/60 flex items-center justify-center mb-4">
            <XCircle className="w-9 h-9 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Login Gagal
          </h2>
          <p className="text-slate-600 dark:text-red-100/85 mt-2 text-xs sm:text-sm leading-relaxed max-w-sm">
            {message}
          </p>
          <button
            type="button"
            onClick={handleRetryManual}
            className="mt-6 w-full bg-gradient-to-r from-[#D32F2F] to-red-600 text-white py-3 px-4 rounded-2xl text-sm font-semibold shadow-md shadow-red-600/20 hover:brightness-105 active:scale-[0.98] transition-all"
          >
            Masukkan Kode Manual
          </button>
        </div>
      )}

      {status === 'input' && (
        <div className="w-full max-w-md bg-white/95 dark:bg-[#330C0F] backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 dark:border-red-900/60 p-6 sm:p-8">
          {/* Logo SMKN 1 Pringgabaya, PMI, & PMR Wira dengan BG Putih Permanen */}
          <OrgLogos size="lg" className="mb-5" />

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/80 border border-red-200/70 dark:border-red-800/60 text-[#D32F2F] dark:text-red-200 text-[11px] font-bold uppercase tracking-wider mb-2">
            <KeyRound size={12} />
            <span>Autentikasi Anggota</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            PMR Wira Smeksabaya
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-red-200/75 mt-1.5 mb-6 leading-relaxed">
            Masukkan <b>Kode OTP (6 digit)</b>, <b>Token (8 karakter)</b>, atau tempel{' '}
            <b>Magic Link</b> dari Bot WhatsApp PMR.
          </p>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                autoComplete="one-time-code"
                value={manualToken}
                onChange={(e) => handleTokenChange(e.target.value)}
                placeholder="482910 / uqFe1dME"
                className="w-full px-4 py-3.5 bg-slate-50/70 dark:bg-red-950/50 focus:bg-white dark:focus:bg-red-950/80 text-slate-900 dark:text-white border border-slate-200 dark:border-red-900/70 rounded-2xl focus:ring-2 focus:ring-[#D32F2F]/25 focus:border-[#D32F2F] outline-none text-center text-lg sm:text-xl font-bold tracking-[0.18em] font-mono transition-all"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[11px] font-medium text-slate-400 dark:text-red-200/60">
                  {manualToken.trim().length > 0
                    ? `${manualToken.trim().length} karakter terdeteksi`
                    : 'OTP 6 digit / Token 8 karakter'}
                </span>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D32F2F] dark:text-red-300 hover:underline"
                >
                  <ClipboardPaste size={12} />
                  <span>Tempel Kode</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || manualToken.trim().length < 6}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D32F2F] to-red-600 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-red-600/20 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Panduan Mendapatkan Kode */}
          <div className="mt-6 p-4 bg-slate-50/90 dark:bg-red-950/40 border border-slate-200/70 dark:border-red-900/50 rounded-2xl text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-red-100 mb-2.5">
              <MessageSquare size={14} className="text-[#D32F2F]" />
              <span>Cara Mendapatkan Kode Login</span>
            </div>
            <ol className="space-y-2 text-xs text-slate-600 dark:text-red-200/80">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900 text-[#D32F2F] dark:text-red-200 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  1
                </span>
                <span>Buka chat pribadi WhatsApp resmi Bot PMR Wira</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900 text-[#D32F2F] dark:text-red-200 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  2
                </span>
                <span>
                  Kirim perintah{' '}
                  <code className="bg-white dark:bg-red-950 border border-slate-200 dark:border-red-800 px-1.5 py-0.5 rounded font-mono text-[#D32F2F] dark:text-red-300 font-semibold">
                    !login
                  </code>{' '}
                  atau{' '}
                  <code className="bg-white dark:bg-red-950 border border-slate-200 dark:border-red-800 px-1.5 py-0.5 rounded font-mono text-[#D32F2F] dark:text-red-300 font-semibold">
                    !otp
                  </code>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900 text-[#D32F2F] dark:text-red-200 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  3
                </span>
                <span>Klik tautan langsung atau tempel kode balasan bot di kolom atas</span>
              </li>
            </ol>
          </div>

          {/* Tautan Pindah Portal */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-red-900/50 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-red-200/75">
            <Link
              href="/pengurus/login"
              className="inline-flex items-center gap-1 hover:text-[#D32F2F] transition"
            >
              <ClipboardList size={13} />
              <span>Portal Pengurus</span>
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 hover:text-[#D32F2F] transition"
            >
              <ShieldAlert size={13} />
              <span>Portal Admin</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[75vh]">
          <Loader2 className="animate-spin text-[#D32F2F]" size={32} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}