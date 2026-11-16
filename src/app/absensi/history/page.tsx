'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api, HistoryResponse, ApiError } from '@/lib/api';
import { isLoggedIn } from '@/lib/auth';
import { formatWitaDateTime } from '@/lib/time-client';
import { STATUS_COLORS, StatusKehadiran } from '@/lib/constants';

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/absensi/login');
      return;
    }
    api
      .getHistory()
      .then(setHistory)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) return;
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="mx-auto text-pmr-red animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Riwayat Absensi</h2>

      {/* Ringkasan */}
      {history && (
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ['HADIR', 'green'],
              ['TERLAMBAT', 'yellow'],
              ['IZIN', 'blue'],
              ['SAKIT', 'purple'],
              ['ALPA', 'red'],
              ['TOTAL', 'gray'],
            ] as const
          ).map(([key, color]) => (
            <div
              key={key}
              className={`bg-${color}-50 border border-${color}-200 rounded-xl p-3 text-center`}
            >
              <div className={`text-2xl font-bold text-${color}-600`}>
                {history.summary[key as keyof typeof history.summary]}
              </div>
              <div className="text-xs text-gray-600">{key}</div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {history?.data.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Belum ada riwayat absensi.
        </div>
      )}

      <div className="space-y-2">
        {history?.data.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-gray-900">
                {item.attendance_sessions.nama_kegiatan}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatWitaDateTime(item.waktu_absen)}
              </p>
              {item.attendance_sessions.lokasi && (
                <p className="text-xs text-gray-400 mt-0.5">
                  📍 {item.attendance_sessions.lokasi}
                </p>
              )}
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full font-semibold ${
                STATUS_COLORS[item.status_kehadiran as StatusKehadiran]
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