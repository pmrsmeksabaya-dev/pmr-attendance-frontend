'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
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
  ClipboardPaste,
  Clock,
  UserCheck,
  History,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ValidateTokenResult, ApiError } from '@/lib/api';
import { isLoggedIn, clearSession, getUser } from '@/lib/auth';
import { formatWitaDate } from '@/lib/time-client';
import { OrgLogos } from '@/components/OrgLogos';

const QRScanner = dynamic(
  () => import('@/components/absensi/QRScanner').then((m) => m.QRScanner),
  { ssr: false }
);

/**
 * Mengekstrak nilai token baik dari URL lengkap
 * (misal: "https://pmr-attendance.vercel.app/absensi/scan?token=ABC123"),
 * potongan query ("?token=ABC123"), maupun token mentah langsung.
 */
function extractQrToken(rawInput: string): string {
  const trimmed = rawInput.trim();
  const match = trimmed.match(/[?&]token=([a-zA-Z0-9._-]+)/);
  if (match?.[1]) return match[1].trim();

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

type ExtendedSessionInfo = ValidateTokenResult & {
  jam_mulai?: string | null;
  jam_selesai?: string | null;
  keterangan?: string | null;
};

function ScanContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get('token');
  const currentUser = getUser();

  const [token, setToken] = useState<string | null>(tokenFromUrl);
  const [sessionInfo, setSessionInfo] = useState<ExtendedSessionInfo | null>(null);
  const [status, setStatus] = useState<'scan' | 'validating' | 'valid' | 'error'>('scan');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock agar kamera dan Strict Mode tidak memvalidasi token yang sama berkali-kali
  const isProcessingRef = useRef(false);
  const processedUrlTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/absensi/login');
      return;
    }

    if (tokenFromUrl && processedUrlTokenRef.current !== tokenFromUrl) {
      processedUrlTokenRef.current = tokenFromUrl;
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
      setSessionInfo(info as ExtendedSessionInfo);
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

      const resolvedLokasi =
        (result as { lokasi?: string }).lokasi || sessionInfo?.lokasi || '';

      const qs = new URLSearchParams({
        nama: result.nama,
        kelas: result.kelas,
        jk: result.jenis_kelamin,
        kegiatan: result.nama_kegiatan,
        tanggal: result.tanggal_kegiatan,
        waktu: result.waktu_absen,
        status: result.status_kehadiran,
      });

      if (resolvedLokasi) {
        qs.set('lokasi', resolvedLokasi);
      }

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
    processedUrlTokenRef.current = null;
    setStatus('scan');
    setToken(null);
    setSessionInfo(null);
    setErrorMsg('');
    setManualToken('');
    if (tokenFromUrl) {
      router.replace('/absensi/scan');
    }
  };

  const handleManualInputChange = (rawValue: string) => {
    const extracted = extractQrToken(rawValue);
    setManualToken(extracted);

    if (rawValue.includes('token=') && extracted.length >= 6) {
      handleToken(extracted);
    }
  };

  const handlePasteManual = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      const extracted = extractQrToken(clip);
      if (extracted) {
        setManualToken(extracted);
        toast.success('Kode QR ditempel dari clipboard.');
        if (extracted.length >= 6) {
          handleToken(extracted);
        }
      } else {
        toast.error('Clipboard kosong.');
      }
    } catch {
      toast.error('Izin clipboard ditolak. Tempel manual pada kolom input.');
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header Judul Halaman */}
      <div className="text-center">
        <OrgLogos size="sm" className="mb-3" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/80 border border-red-200/70 dark:border-red-800/60 text-[#D32F2F] dark:text-red-200 text-xs font-semibold mb-2">
          <QrCode size={13} />
          <span>Presensi Kegiatan PMR</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Pindai QR Code
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-red-200/75 mt-1">
          Arahkan kamera ke QR Code sesi latihan atau kegiatan dari pengurus
        </p>
      </div>

      {/* STATE 1: SCAN KAMERA & INPUT MANUAL */}
      {status === 'scan' && (
        <>
          <div className="bg-white/95 dark:bg-[#330C0F] backdrop-blur-md rounded-3xl p-3.5 shadow-lg shadow-slate-900/5 border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
            <QRScanner onScan={handleToken} />
          </div>

          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-x-0 h-px bg-slate-200/80 dark:bg-red-900/60" />
            <span className="relative px-3 bg-slate-50 dark:bg-[#230709] text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-red-200/60">
              atau input manual
            </span>
          </div>

          <div className="bg-white/95 dark:bg-[#330C0F] backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-red-900/60">
            <div className="flex items-center justify-between mb-2.5">
              <label
                htmlFor="manual-qr-input"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-red-100"
              >
                <Keyboard size={14} className="text-[#D32F2F]" />
                <span>Masukkan kode atau tautan QR dari pengurus</span>
              </label>
              <button
                type="button"
                onClick={handlePasteManual}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D32F2F] dark:text-red-300 hover:underline"
              >
                <ClipboardPaste size={12} />
                <span>Paste</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualToken.trim()) handleToken(manualToken);
              }}
              className="flex gap-2"
            >
              <input
                id="manual-qr-input"
                type="text"
                value={manualToken}
                onChange={(e) => handleManualInputChange(e.target.value)}
                placeholder="Tempel kode/link QR di sini..."
                className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-50/70 dark:bg-red-950/50 focus:bg-white dark:focus:bg-red-950/80 text-slate-900 dark:text-white border border-slate-200 dark:border-red-900/70 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30 focus:border-[#D32F2F] transition-all"
              />
              <button
                type="submit"
                disabled={!manualToken.trim()}
                className="bg-gradient-to-r from-[#D32F2F] to-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-red-600/20 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 transition-all shrink-0"
              >
                Cek
              </button>
            </form>
          </div>
        </>
      )}

      {/* STATE 2: VALIDATING */}
      {status === 'validating' && (
        <div className="bg-white/95 dark:bg-[#330C0F] backdrop-blur-md rounded-3xl p-10 shadow-lg shadow-slate-900/5 border border-slate-200/80 dark:border-red-900/60 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/80 border border-red-100 dark:border-red-800/60 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="text-[#D32F2F] animate-spin" size={32} />
          </div>
          <p className="font-bold text-base text-slate-900 dark:text-white">
            Memproses...
          </p>
          <p className="text-xs text-slate-500 dark:text-red-200/75 mt-1">
            Memvalidasi token sesi absensi PMR Wira
          </p>
        </div>
      )}

      {/* STATE 3: VALID & KONFIRMASI */}
      {status === 'valid' && sessionInfo && (
        <div className="bg-white/95 dark:bg-[#330C0F] backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-slate-900/5 border border-emerald-200/90 dark:border-emerald-800/70">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={26} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                <ShieldCheck size={12} />
                <span>Sesi Aktif</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                QR Code Terverifikasi
              </h3>
            </div>
          </div>

          {currentUser?.nama && (
            <div className="mb-3.5 px-3.5 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-200">
              <UserCheck size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">
                Akun: <strong>{currentUser.nama}</strong>
              </span>
            </div>
          )}

          <div className="bg-slate-50/90 dark:bg-red-950/45 rounded-2xl p-4 space-y-2.5 text-sm border border-slate-200/70 dark:border-red-900/50">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-red-200/60 block">
                Nama Kegiatan
              </span>
              <span className="font-bold text-base text-slate-900 dark:text-white mt-0.5 block">
                {sessionInfo.nama_kegiatan}
              </span>
            </div>

            <div className="h-px bg-slate-200/70 dark:bg-red-900/50" />

            <div className="flex items-center gap-2 text-slate-700 dark:text-red-100 text-xs font-medium">
              <Calendar size={14} className="text-[#D32F2F] shrink-0" />
              <span>{formatWitaDate(sessionInfo.tanggal_kegiatan)}</span>
            </div>

            {sessionInfo.jam_mulai && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-red-100 text-xs font-medium">
                <Clock size={14} className="text-[#D32F2F] shrink-0" />
                <span>
                  {sessionInfo.jam_mulai.slice(0, 5)}
                  {sessionInfo.jam_selesai
                    ? ` – ${sessionInfo.jam_selesai.slice(0, 5)}`
                    : ''}{' '}
                  WITA
                </span>
              </div>
            )}

            {sessionInfo.lokasi && (
              <div className="flex items-center gap-2 text-slate-700 dark:text-red-100 text-xs font-medium">
                <MapPin size={14} className="text-[#D32F2F] shrink-0" />
                <span>{sessionInfo.lokasi}</span>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-2.5">
            <button
              type="button"
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
              className="w-full inline-flex items-center justify-center gap-1.5 bg-white dark:bg-red-950/60 text-slate-600 dark:text-red-200 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-red-900/60 hover:bg-slate-50 dark:hover:bg-red-950 active:scale-[0.99] transition-all"
            >
              <RefreshCw size={13} />
              <span>Batal &amp; Pindai Ulang</span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 4: ERROR */}
      {status === 'error' && (
        <div className="bg-white/95 dark:bg-[#330C0F] backdrop-blur-md rounded-3xl p-6 shadow-lg shadow-slate-900/5 border border-red-200/90 dark:border-red-800/70 text-center">
          <div className="w-14 h-14 bg-red-50 dark:bg-red-950/80 border border-red-100 dark:border-red-800/60 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
            <AlertTriangle className="text-red-500" size={28} />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Gagal Memproses QR
          </h3>
          <p className="text-xs sm:text-sm text-red-600 dark:text-red-300 mt-1.5 leading-relaxed">
            {errorMsg}
          </p>
          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              onClick={handleResetScan}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D32F2F] to-red-600 text-white py-3 rounded-2xl text-sm font-semibold shadow-md shadow-red-600/20 hover:brightness-105 active:scale-[0.99] transition-all"
            >
              <RefreshCw size={15} />
              <span>Pindai Ulang</span>
            </button>

            <Link
              href="/absensi/history"
              className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-50 dark:bg-red-950/60 text-slate-600 dark:text-red-200 py-2.5 rounded-xl text-xs font-semibold border border-slate-200/80 dark:border-red-900/60 hover:text-[#D32F2F] transition-all"
            >
              <History size={13} />
              <span>Lihat Riwayat Absensi</span>
            </Link>
          </div>
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
          <Loader2 className="text-[#D32F2F] animate-spin" size={32} />
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}