'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ValidateTokenResult, ApiError } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import { formatWitaDate } from '@/lib/time-client';

const QRScanner = dynamic(
  () => import('@/components/absensi/QRScanner').then((m) => m.QRScanner),
  { ssr: false }
);

function ScanContent() {
  const router = useRouter();
  const params = useSearchParams();
  const tokenFromUrl = params.get('token');

  const [token, setToken] = useState<string | null>(tokenFromUrl);
  const [sessionInfo, setSessionInfo] = useState<ValidateTokenResult | null>(null);
  const [status, setStatus] = useState<'scan' | 'validating' | 'valid' | 'error'>('scan');
  const [errorMsg, setErrorMsg] = useState('');
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/absensi/login');
    }
  }, [router]);

  useEffect(() => {
    if (tokenFromUrl) handleToken(tokenFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenFromUrl]);

  async function handleToken(t: string) {
    setToken(t);
    setStatus('validating');
    try {
      const info = await api.validateToken(t);
      setSessionInfo(info);
      setStatus('valid');
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : 'Token tidak valid.';
      setErrorMsg(msg);
      setStatus('error');
      toast.error(msg);
    }
  }

  async function handleAttend() {
    if (!token) return;
    setStatus('validating');
    try {
      const result = await api.attend(token);
      toast.success('Absensi berhasil!');
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
      const msg = e instanceof ApiError ? e.message : 'Absensi gagal.';
      toast.error(msg);
      setErrorMsg(msg);
      setStatus('error');
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Pindai QR Code</h2>
        <p className="text-sm text-gray-600 mt-1">
          Arahkan kamera ke QR Code yang ditampilkan pengurus
        </p>
      </div>

      {status === 'scan' && (
        <>
          <QRScanner onScan={handleToken} />
          <div className="text-center text-xs text-gray-400">atau</div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="text-xs text-gray-500 block mb-2">Masukkan token manual</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste token di sini"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pmr-red"
              />
              <button
                onClick={() => manualToken && handleToken(manualToken.trim())}
                className="bg-pmr-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-pmr-red-dark"
              >
                Cek
              </button>
            </div>
          </div>
        </>
      )}

      {status === 'validating' && (
        <div className="text-center py-12">
          <Loader2 className="mx-auto text-pmr-red animate-spin mb-3" size={40} />
          <p className="text-gray-600">Memproses...</p>
        </div>
      )}

      {status === 'valid' && sessionInfo && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-200">
          <CheckCircle2 className="text-green-500 mb-2" size={28} />
          <h3 className="font-bold text-gray-900">QR Code Valid</h3>
          <div className="mt-3 space-y-1 text-sm">
            <p><span className="text-gray-500">Kegiatan:</span> <span className="font-semibold">{sessionInfo.nama_kegiatan}</span></p>
            <p><span className="text-gray-500">Tanggal:</span> <span className="font-semibold">{formatWitaDate(sessionInfo.tanggal_kegiatan)}</span></p>
            {sessionInfo.lokasi && <p><span className="text-gray-500">Lokasi:</span> <span className="font-semibold">{sessionInfo.lokasi}</span></p>}
          </div>
          <button
            onClick={handleAttend}
            className="w-full mt-4 bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600"
          >
            Konfirmasi Absensi
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 rounded-2xl p-5 border border-red-200">
          <AlertTriangle className="text-red-500 mb-2" size={28} />
          <h3 className="font-bold text-red-900">Gagal</h3>
          <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
          <button
            onClick={() => { setStatus('scan'); setToken(null); setErrorMsg(''); }}
            className="mt-3 text-sm text-red-700 underline"
          >
            Coba lagi
          </button>
        </div>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-12">
        <Loader2 className="mx-auto text-pmr-red animate-spin" size={32} />
      </div>
    }>
      <ScanContent />
    </Suspense>
  );
}