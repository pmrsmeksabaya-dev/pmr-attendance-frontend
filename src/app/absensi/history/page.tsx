'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CalendarCheck2, MapPin, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { api, HistoryResponse, ApiError } from '@/lib/api';
import { isLoggedIn, clearSession } from '@/lib/auth';
import { formatWitaDateTime } from '@/lib/time-client';
import { STATUS_COLORS, StatusKehadiran } from '@/lib/constants';

// Mapping class statis agar tidak hilang saat Tailwind production build (Vercel)
const SUMMARY_STYLES = [
  {
    key: 'HADIR',
    label: 'Hadir',
    card: 'bg-green-50 border-green-200',
    count: 'text-green-600',
  },
  {
    key: 'TERLAMBAT',
    label: 'Terlambat',
    card: 'bg-yellow-50 border-yellow-200',
    count: 'text-yellow-600',
  },
  {
    key: 'IZIN',
    label: 'Izin',
    card: 'bg-blue-50 border-blue-200',
    count: 'text-blue-600',
  },
  {
    key: 'SAKIT',
    label: 'Sakit',
    card: 'bg-purple-50 border-purple-200',
    count: 'text-purple-600',
  },
  {
    key: 'ALPA',
    label: 'Alpa',
    card: 'bg-red-50 border-red-200',
    count: 'text-red-600',
  },
  {
    key: 'TOTAL',
    label: 'Total',
    card: 'bg-gray-100 border-gray-200',
    count: 'text-gray-800',
  },
] as const;

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/absensi/login');
      return;
    }

    api
      .getHistory()
      .then(setHistory)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          clearSession();
          toast.error('Sesi login telah berakhir, silakan masuk kembali.');
          router.replace('/absensi/login');
          return;
        }
        toast.error(e.message || 'Gagal memuat riwayat absensi');
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <Loader2 className="text-pmr-red animate-spin mb-3" size={32} />
        <p className="text-sm">Memuat riwayat absensi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Riwayat Absensi</h2>
        {history && history.data.length > 0 && (
          <span className="text-xs font-medium text-gray-500">
            {history.data.length} catatan
          </span>
        )}
      </div>

      {/* Ringkasan Statistik */}
      {history && (
        <div className="grid grid-cols-3 gap-2.5">
          {SUMMARY_STYLES.map(({ key, label, card, count }) => (
            <div
              key={key}
              className={`${card} border rounded-2xl p-3.5 text-center shadow-2xs`}
            >
              <div className={`text-2xl font-bold tabular-nums ${count}`}>
                {history.summary[key as keyof typeof history.summary] ?? 0}
              </div>
              <div className="text-xs font-medium text-gray-600 mt-0.5">
                {label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {history?.data.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <CalendarCheck2 className="text-pmr-red" size={28} />
          </div>
          <h3 className="font-semibold text-gray-900">Belum Ada Riwayat</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
            Catatan kehadiran latihan maupun kegiatan PMR Anda akan muncul di sini.
          </p>
          <Link
            href="/absensi/scan"
            className="inline-flex items-center gap-2 mt-5 bg-pmr-red text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-pmr-red-dark transition"
          >
            <QrCode size={15} />
            Scan QR Sekarang
          </Link>
        </div>
      )}

      {/* Daftar Riwayat */}
      <div className="space-y-2.5">
        {history?.data.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-start gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-900 truncate">
                {item.attendance_sessions?.nama_kegiatan ?? 'Kegiatan PMR'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatWitaDateTime(item.waktu_absen)}
              </p>
              {item.attendance_sessions?.lokasi && (
                <p className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{item.attendance_sessions.lokasi}</span>
                </p>
              )}
            </div>
            <span
              className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold ${
                STATUS_COLORS[item.status_kehadiran as StatusKehadiran] ??
                'bg-gray-100 text-gray-700'
              }`}
            >
              {item.status_kehadiran}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}