'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MapPin,
  QrCode,
  Keyboard,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
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
      const msg =
        e instanceof ApiError
          ? e.message
          : 'QR Code tidak valid atau sesi sudah ditutup.';
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
      {/* Header Judul Halaman */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200/70 text-pmr-red text-xs font-semibold mb-2">
          <QrCode size={13} />
          <span>Presensi Kegiatan PMR</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Pindai QR Code
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Arahkan kamera ke QR Code sesi latihan atau kegiatan dari pengurus
        </p>
      </div>

      {/* STATE 1: SCAN KAMERA & INPUT MANUAL */}
      {status === 'scan' && (
        <>
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-3.5 shadow-lg shadow-slate-900/5 border border-slate-200/80 overflow-hidden">
            <QRScanner onScan={handleToken} />
          </div>

          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-x-0 h-px bg-slate-200/80" />
            <span className="relative px-3 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              atau input manual
            </span>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2.5">
              <Keyboard size={14} className="text-pmr-red" />
              <span>Masukkan kode atau tautan QR dari pengurus</span>
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
                placeholder="Tempel kode/link QR di sini..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50/70 focus:bg-white text-slate-900 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pmr-red/30 focus:border-pmr-red transition-all"
              />
              <button
                type="submit"
                disabled={!manualToken.trim()}
                className="bg-gradient-to-r from-pmr-red to-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-red-600/20 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                Cek
              </button>
            </form>
          </div>
        </>
      )}

      {/* STATE 2: VALIDATING */}
      {status === 'validating' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-10 shadow-lg shadow-slate-900/5 border border-slate-200/80 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="text-pmr-red animate-spin" size={32} />
          </div>
          <p className="font-bold text-base text-slate-900">Memproses...</p>
          <p className="text-xs text-slate-500 mt-1">
            Memvalidasi token sesi absensi PMR Wira
          </p>
        </div>
      )}

      {/* STATE 3: VALID & KONFIRMASI */}
      {status === 'valid' && sessionInfo && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-slate-900/5 border border-emerald-200/90">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center shrink-0">
              <CheckCircle2 className="text-emerald-600" size={26} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                <ShieldCheck size={12} />
                <span>Sesi Aktif</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 leading-tight">
                QR Code Terverifikasi
              </h3>
            </div>
          </div>

          <div className="bg-slate-50/90 rounded-2xl p-4 space-y-2.5 text-sm border border-slate-200/70">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Nama Kegiatan
              </span>
              <span className="font-bold text-base text-slate-900 mt-0.5 block">
                {sessionInfo.nama_kegiatan}
              </span>
            </div>

            <div className="h-px bg-slate-200/70" />

            <div className="flex items-center gap-2 text-slate-700 text-xs font-medium">
              <Calendar size={14} className="text-pmr-red shrink-0" />
              <span>{formatWitaDate(sessionInfo.tanggal_kegiatan)}</span>
            </div>

            {sessionInfo.lokasi && (
              <div className="flex items-center gap-2 text-slate-700 text-xs font-medium">
                <MapPin size={14} className="text-pmr-red shrink-0" />
                <span>{sessionInfo.lokasi}</span>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2.5">
            <button
              onClick={handleAttend}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Mencatat Kehadiran...' : 'Konfirmasi Hadir Sekarang'}
            </button>
            <button
              type="button"
              onClick={handleResetScan}
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-white text-slate-600 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 active:scale-[0.99] transition-all"
            >
              <RefreshCw size={13} />
              <span>Batal &amp; Pindai Ulang</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 4: ERROR */}
      {status === 'error' && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-lg shadow-slate-900/5 border border-red-200/90 text-center">
          <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
            <AlertTriangle className="text-red-500" size={28} />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Gagal Memproses QR</h3>
          <p className="text-xs sm:text-sm text-red-600 mt-1.5 leading-relaxed">
            {errorMsg}
          </p>
          <button
            onClick={handleResetScan}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pmr-red to-red-600 text-white py-3 rounded-2xl text-sm font-semibold shadow-md shadow-red-600/20 hover:brightness-105 active:scale-[0.99] transition-all"
          >
            <RefreshCw size={15} />
            <span>Pindai Ulang</span>
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
        <div className="flex items-center justify-center py-14">
          <Loader2 className="text-pmr-red animate-spin" size={32} />
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}