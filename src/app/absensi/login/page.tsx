'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
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
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { saveSession, isLoggedIn } from '@/lib/auth';

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'input'>('loading');
  const [message, setMessage] = useState('Memverifikasi kode...');
  const [manualToken, setManualToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasProcessedUrlRef = useRef(false);

  // Fungsi untuk memproses token (!login) maupun kode (!otp)
  const processToken = async (token: string) => {
    const cleanToken = token.trim();
    if (!cleanToken) {
      setStatus('error');
      setMessage('Kode login atau OTP tidak boleh kosong.');
      return;
    }

    setStatus('loading');
    setMessage('Memverifikasi kode...');
    setIsSubmitting(true);

    try {
      const res = await api.verifyMagic(cleanToken);
      saveSession(res.jwt, {
        member_id: res.user.member_id,
        nama: res.user.nama,
        role: res.user.role as any,
      });
      setStatus('success');
      setMessage(`Selamat datang, ${res.user.nama}!`);
      toast.success('Login berhasil');
      setTimeout(() => router.replace('/absensi'), 1200);
    } catch (e: any) {
      setStatus('error');
      setMessage(
        e instanceof ApiError
          ? e.message
          : 'Gagal verifikasi. Minta link atau kode baru via Bot WhatsApp.'
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

  // Handle submit form manual
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      processToken(manualToken.trim());
    }
  };

  // Tempel kode dari clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.trim().slice(0, 8);
      if (cleaned) {
        setManualToken(cleaned);
        toast.success('Kode ditempel dari clipboard');
      } else {
        toast.error('Clipboard kosong');
      }
    } catch {
      toast.error('Izinkan akses clipboard atau tempel manual di kolom');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[72vh] text-slate-900 text-center">
      {status === 'loading' && (
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-pmr-red animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Memproses...
          </h2>
          <p className="text-slate-500 mt-1.5 text-xs sm:text-sm">{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/5 border border-emerald-200/80 p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold mb-1.5">
            <ShieldCheck size={12} />
            Terverifikasi
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Login Berhasil
          </h2>
          <p className="text-slate-600 mt-1.5 text-sm">{message}</p>
          <p className="text-xs text-slate-400 mt-4">
            Mengalihkan ke dashboard absensi...
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/5 border border-red-200/80 p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
            <XCircle className="w-9 h-9 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Login Gagal
          </h2>
          <p className="text-slate-600 mt-2 text-xs sm:text-sm leading-relaxed max-w-sm">
            {message}
          </p>
          <button
            onClick={() => {
              setStatus('input');
              setManualToken('');
            }}
            className="mt-6 w-full bg-gradient-to-r from-pmr-red to-red-600 text-white py-3 px-4 rounded-2xl text-sm font-semibold shadow-md shadow-red-600/20 hover:brightness-105 active:scale-[0.98] transition-all"
          >
            Masukkan Kode Manual
          </button>
        </div>
      )}

      {status === 'input' && (
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-6 sm:p-8">
          {/* Logo SMKN 1 Pringgabaya & PMR Wira */}
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center shadow-2xs">
              <img
                src="/logo-smk.png"
                alt="Logo SMKN 1 Pringgabaya"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="h-9 w-px bg-slate-200" />
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center shadow-2xs">
              <img
                src="/logo-pmr.png"
                alt="Logo PMR Wira"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200/70 text-pmr-red text-[11px] font-bold uppercase tracking-wider mb-2">
            <KeyRound size={12} />
            <span>Autentikasi Anggota</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            PMR Wira Smeksabaya
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 mb-6 leading-relaxed">
            Masukkan 8 karakter kode login atau OTP yang dikirim oleh Bot WhatsApp PMR.
          </p>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                maxLength={8}
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="uqFe1dME"
                className="w-full px-4 py-3.5 bg-slate-50/70 focus:bg-white text-slate-900 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-pmr-red/25 focus:border-pmr-red outline-none text-center text-xl font-bold tracking-[0.22em] font-mono transition-all"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[11px] font-medium text-slate-400">
                  {manualToken.trim().length}/8 karakter
                </span>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-pmr-red hover:underline"
                >
                  <ClipboardPaste size={12} />
                  <span>Tempel Kode</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || manualToken.trim().length < 8}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pmr-red to-red-600 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-red-600/20 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
              {!isSubmitting && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Panduan Mendapatkan Kode */}
          <div className="mt-6 p-4 bg-slate-50/90 border border-slate-200/70 rounded-2xl text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
              <MessageSquare size={14} className="text-pmr-red" />
              <span>Cara Mendapatkan Kode Login</span>
            </div>
            <ol className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-100 text-pmr-red font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  1
                </span>
                <span>Buka chat WhatsApp resmi Bot PMR Wira</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-100 text-pmr-red font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  2
                </span>
                <span>
                  Kirim perintah{' '}
                  <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-pmr-red font-semibold">
                    !login
                  </code>{' '}
                  atau{' '}
                  <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono text-pmr-red font-semibold">
                    !otp
                  </code>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-100 text-pmr-red font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                  3
                </span>
                <span>Salin 8 karakter kode balasan bot lalu tempel di kolom atas</span>
              </li>
            </ol>
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
        <div className="flex items-center justify-center min-h-[72vh]">
          <Loader2 className="animate-spin text-pmr-red" size={32} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}