'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { saveSession } from '@/lib/auth';

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'input'>('loading');
  const [message, setMessage] = useState('Memverifikasi kode...');
  const [manualToken, setManualToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setTimeout(() => router.push('/absensi'), 1500);
    } catch (e: any) {
      setStatus('error');
      setMessage(
        e instanceof ApiError
          ? e.message
          : 'Gagal verifikasi. Minta link atau kode baru via bot.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cek token dari URL saat pertama kali load
  useEffect(() => {
    if (tokenFromUrl) {
      processToken(tokenFromUrl);
    } else {
      setStatus('input');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl]);

  // Handle submit form manual
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      processToken(manualToken.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] bg-white text-gray-900 text-center">
      {status === 'loading' && (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-pmr-red animate-spin mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Memproses...</h2>
          <p className="text-gray-600 mt-2 text-sm">{message}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Login Berhasil</h2>
          <p className="text-gray-600 mt-2">{message}</p>
          <p className="text-sm text-gray-400 mt-4">Mengalihkan ke beranda...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center">
          <XCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Login Gagal</h2>
          <p className="text-gray-600 mt-2 text-sm max-w-md">{message}</p>
          <button
            onClick={() => {
              setStatus('input');
              setManualToken('');
            }}
            className="mt-6 text-pmr-red hover:underline text-sm font-semibold"
          >
            Coba masukkan kode manual
          </button>
        </div>
      )}

      {status === 'input' && (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {/* Logo SMKN 1 Pringgabaya & PMR Wira */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <img
              src="/logo-smk.png"
              alt="Logo SMKN 1 Pringgabaya"
              className="w-14 h-14 object-contain"
            />
            <div className="h-10 w-[1px] bg-gray-200" />
            <img
              src="/logo-pmr.png"
              alt="Logo PMR Wira"
              className="w-14 h-14 object-contain"
            />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">PMR Wira Smeksabaya</h2>
          <p className="text-xs font-semibold text-pmr-red uppercase tracking-wider mb-4">
            Sistem Absensi Digital
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Masukkan 8 karakter kode login atau OTP yang Anda terima dari Bot WhatsApp PMR.
          </p>

          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                maxLength={8}
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Contoh: uqFe1dME"
                className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pmr-red focus:border-pmr-red outline-none text-center text-lg tracking-widest font-mono"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || manualToken.trim().length < 8}
              className="w-full bg-pmr-red text-white py-3 rounded-xl font-semibold hover:bg-pmr-red-dark disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isSubmitting ? 'Memverifikasi...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900 text-left">
            <p className="font-semibold mb-2">📖 Cara Mendapatkan Kode:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Buka WhatsApp Anda</li>
              <li>
                Kirim pesan <code className="bg-blue-100 px-1 rounded">!login</code> atau{' '}
                <code className="bg-blue-100 px-1 rounded">!otp</code> ke Bot PMR
              </li>
              <li>Salin 8 karakter kode yang dibalas bot</li>
              <li>Tempel (paste) di kolom di atas</li>
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
        <div className="flex items-center justify-center min-h-[70vh] bg-white">
          <Loader2 className="animate-spin text-pmr-red" size={32} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}