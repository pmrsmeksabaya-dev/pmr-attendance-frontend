'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2, AlertTriangle, CheckCircle2, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { api, ValidateTokenResult, ApiError } from '@/lib/api';
import { isLoggedIn, clearSession } from '@/lib/auth';
import { formatWitaDate } from '@/lib/time-client';

const QRScanner = dynamic(
  () => import('@/components/absensi/QRScanner').then((m) => m.QRScanner),
  { ssr: false }
);

/**
 * Mengekstrak nilai token baik dari URL lengkap
 * (misal: "https://pmr-attendance.vercel.app/absensi/scan?token=ABC123")
 * maupun jika pengguna memasukkan/memindai token mentah langsung.
 */
function extractQrToken(rawInput: string): string {
  const trimmed = rawInput.trim();
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const paramToken = url.searchParams.get('token');
      if (paramToken) return paramToken.trim();
    }
  } catch {
    // Abaikan jika bukan format URL valid, perlakukan sebagai token mentah
  }
  return trimmed;
}

function ScanContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get('token');

  const [token, setToken] = useState<string | null>(tokenFromUrl);
  const [sessionInfo, setSessionInfo] = useState<ValidateTokenResult | null>(null);
  const [status, setStatus] = useState<'scan' | 'validating' | 'valid' | 'error'>('scan');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock agar kamera tidak men-trigger handleToken berkali-kali dalam satu scan
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/absensi/login');
      return;
    }

    if (tokenFromUrl) {
      handleToken(tokenFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl, router]);

  async function handleToken(rawScanned: string) {
    if (isProcessingRef.current) return;

    const cleanToken = extractQrToken(rawScanned);
    if (!cleanToken) {
      toast.error('Kode QR tidak terbaca.');
      return;
    }

    isProcessingRef.current = true;
    setToken(cleanToken);
    setStatus('validating');

    try {
      const info = await api.validateToken(cleanToken);
      setSessionInfo(info);
      setStatus('valid');
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) {
        clearSession();
        toast.error('Sesi login telah berakhir, silakan masuk kembali.');
        router.replace('/absensi/login');
        return;
      }
      const msg = e instanceof ApiError ? e.message : 'QR Code tidak valid atau sesi sudah ditutup.';
      setErrorMsg(msg);
      setStatus('error');
      toast.error(msg);
    } finally {
      isProcessingRef.current = false;
    }
  }

  async function handleAttend() {
    if (!token || isSubmitting) return;
    setIsSubmitting(true);
    setStatus('validating');

    try {
      const result = await api.attend(token);
      toast.success('Absensi berhasil tercatat!');
      const qs = new URLSearchParams({
        nama: result.nama,
        kelas: result.kelas,
        jk: result.jenis_kelamin,
        kegiatan: result.nama_kegiatan,
        tanggal: result.tanggal_kegiatan,
        waktu: result.waktu_absen,
        status: result.status_kehadiran,
      });
      router.push(`/absensi/result?${qs.toString()}`);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) {
        clearSession();
        toast.error('Sesi login telah berakhir, silakan masuk kembali.');
        router.replace('/absensi/login');
        return;
      }
      const msg = e instanceof ApiError ? e.message : 'Absensi gagal dicatat.';
      toast.error(msg);
      setErrorMsg(msg);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleResetScan = () => {
    isProcessingRef.current = false;
    setStatus('scan');
    setToken(null);
    setSessionInfo(null);
    setErrorMsg('');
    setManualToken('');
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Pindai QR Code</h2>
        <p className="text-sm text-gray-600 mt-1">
          Arahkan kamera ke QR Code sesi absensi dari pengurus
        </p>
      </div>

      {status === 'scan' && (
        <>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 overflow-hidden">
            <QRScanner onScan={handleToken} />
          </div>

          <div className="text-center text-xs text-gray-400 font-medium">atau</div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs font-medium text-gray-600 block mb-2">
              Masukkan kode/link QR manual
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualToken.trim()) handleToken(manualToken);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste kode QR di sini..."
                className="flex-1 px-3.5 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pmr-red focus:border-pmr-red"
              />
              <button
                type="submit"
                disabled={!manualToken.trim()}
                className="bg-pmr-red text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-pmr-red-dark disabled:opacity-50 transition"
              >
                Cek
              </button>
            </form>
          </div>
        </>
      )}

      {status === 'validating' && (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
          <Loader2 className="mx-auto text-pmr-red animate-spin mb-3" size={40} />
          <p className="font-semibold text-gray-900">Memproses...</p>
          <p className="text-xs text-gray-500 mt-1">Memvalidasi sesi absensi PMR</p>
        </div>
      )}

      {status === 'valid' && sessionInfo && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-200">
          <div className="flex items-center gap-2.5 mb-3">
            <CheckCircle2 className="text-green-500 shrink-0" size={28} />
            <div>
              <h3 className="font-bold text-gray-900">QR Code Valid</h3>
              <p className="text-xs text-gray-500">Pastikan detail kegiatan sudah sesuai</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm border border-gray-100">
            <div>
              <span className="text-xs text-gray-500 block">Nama Kegiatan</span>
              <span className="font-semibold text-gray-900">{sessionInfo.nama_kegiatan}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700 text-xs pt-1">
              <Calendar size={14} className="text-pmr-red shrink-0" />
              <span>{formatWitaDate(sessionInfo.tanggal_kegiatan)}</span>
            </div>
            {sessionInfo.lokasi && (
              <div className="flex items-center gap-1.5 text-gray-700 text-xs">
                <MapPin size={14} className="text-pmr-red shrink-0" />
                <span>{sessionInfo.lokasi}</span>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={handleAttend}
              disabled={isSubmitting}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Mencatat Kehadiran...' : 'Konfirmasi Absensi'}
            </button>
            <button
              type="button"
              onClick={handleResetScan}
              disabled={isSubmitting}
              className="w-full bg-white text-gray-600 py-2.5 rounded-xl text-xs font-medium border border-gray-200 hover:bg-gray-50 transition"
            >
              Batal &amp; Pindai Ulang
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-200 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="text-red-500" size={26} />
          </div>
          <h3 className="font-bold text-gray-900">Gagal Memproses QR</h3>
          <p className="text-sm text-red-600 mt-1">{errorMsg}</p>
          <button
            onClick={handleResetScan}
            className="mt-5 w-full bg-pmr-red text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-pmr-red-dark transition"
          >
            Pindai Ulang
          </button>
        </div>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12">
          <Loader2 className="mx-auto text-pmr-red animate-spin" size={32} />
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}