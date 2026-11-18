'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarCheck2,
  MapPin,
  QrCode,
  Clock,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, HistoryResponse, ApiError } from '@/lib/api';
import { isLoggedIn, clearSession } from '@/lib/auth';
import { formatWitaDateTime } from '@/lib/time-client';
import { STATUS_COLORS, StatusKehadiran } from '@/lib/constants';

// Mapping class statis agar aman saat Tailwind production build (Vercel)
const SUMMARY_STYLES = [
  {
    key: 'HADIR',
    label: 'Hadir',
    card: 'bg-emerald-50/90 border-emerald-200/80',
    count: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
  {
    key: 'TERLAMBAT',
    label: 'Terlambat',
    card: 'bg-amber-50/90 border-amber-200/80',
    count: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  {
    key: 'IZIN',
    label: 'Izin',
    card: 'bg-sky-50/90 border-sky-200/80',
    count: 'text-sky-600',
    dot: 'bg-sky-500',
  },
  {
    key: 'SAKIT',
    label: 'Sakit',
    card: 'bg-purple-50/90 border-purple-200/80',
    count: 'text-purple-600',
    dot: 'bg-purple-500',
  },
  {
    key: 'ALPA',
    label: 'Alpa',
    card: 'bg-red-50/90 border-red-200/80',
    count: 'text-red-600',
    dot: 'bg-red-500',
  },
  {
    key: 'TOTAL',
    label: 'Total Sesi',
    card: 'bg-slate-100/90 border-slate-200/80',
    count: 'text-slate-900',
    dot: 'bg-slate-600',
  },
] as const;

const FILTER_TABS = ['SEMUA', 'HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA'] as const;

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_TABS)[number]>('SEMUA');

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

  const filteredData = useMemo(() => {
    if (!history) return [];
    if (activeFilter === 'SEMUA') return history.data;
    return history.data.filter(
      (item) => item.status_kehadiran?.toUpperCase() === activeFilter
    );
  }, [history, activeFilter]);

  const attendanceRate = useMemo(() => {
    if (!history || !history.summary.TOTAL) return 0;
    const presentCount = (history.summary.HADIR ?? 0) + (history.summary.TERLAMBAT ?? 0);
    return Math.round((presentCount / history.summary.TOTAL) * 100);
  }, [history]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-slate-200/80 rounded-3xl" />
        <div className="grid grid-cols-3 gap-2.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100" />
          ))}
        </div>
        <div className="space-y-2.5">
          <div className="h-20 bg-white rounded-2xl border border-slate-100" />
          <div className="h-20 bg-white rounded-2xl border border-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + Tingkat Kehadiran */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 sm:p-6 text-white shadow-lg shadow-slate-900/15">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-pmr-red/25 blur-2xl"
        />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Rekap Presensi Pribadi
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5">
              Riwayat Absensi
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {history?.data.length
                ? `Total ${history.data.length} kegiatan tercatat`
                : 'Belum ada sesi yang tercatat'}
            </p>
          </div>

          {history && history.summary.TOTAL > 0 && (
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-2.5 text-right shrink-0">
              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                <TrendingUp size={12} />
                <span>Kehadiran</span>
              </div>
              <div className="text-2xl font-extrabold font-mono tabular-nums mt-0.5">
                {attendanceRate}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ringkasan Statistik */}
      {history && (
        <div className="grid grid-cols-3 gap-2.5">
          {SUMMARY_STYLES.map(({ key, label, card, count, dot }) => (
            <div
              key={key}
              className={`${card} backdrop-blur-sm border rounded-2xl p-3.5 text-center shadow-2xs transition-transform hover:scale-[1.01]`}
            >
              <div className={`text-2xl font-extrabold font-mono tabular-nums ${count}`}>
                {history.summary[key as keyof typeof history.summary] ?? 0}
              </div>
              <div className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Pills */}
      {history && history.data.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 mr-1 shrink-0">
            <Filter size={12} />
          </span>
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'bg-pmr-red text-white shadow-xs shadow-red-600/20'
                    : 'bg-white/90 text-slate-600 border border-slate-200/80 hover:border-pmr-red/50 hover:text-pmr-red'
                }`}
              >
                {tab === 'SEMUA'
                  ? 'Semua'
                  : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      )}

      {/* Empty State (Belum Ada Data Sama Sekali) */}
      {history?.data.length === 0 && (
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/80 p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
            <CalendarCheck2 className="text-pmr-red" size={30} />
          </div>
          <h3 className="font-bold text-base text-slate-900">Belum Ada Riwayat</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
            Catatan kehadiran latihan rutin maupun kegiatan PMR Anda akan muncul di sini.
          </p>
          <Link
            href="/absensi/scan"
            className="inline-flex items-center gap-2 mt-5 bg-gradient-to-r from-pmr-red to-red-600 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-md shadow-red-600/20 hover:brightness-105 active:scale-[0.98] transition-all"
          >
            <QrCode size={15} />
            <span>Scan QR Sekarang</span>
          </Link>
        </div>
      )}

      {/* Empty State untuk Filter Tertentu */}
      {history && history.data.length > 0 && filteredData.length === 0 && (
        <div className="bg-white/90 rounded-2xl border border-slate-200/70 p-6 text-center text-xs text-slate-500">
          Tidak ada catatan dengan status{' '}
          <strong className="text-slate-700">{activeFilter}</strong>.
        </div>
      )}

      {/* Daftar Riwayat */}
      <div className="space-y-2.5">
        {filteredData.map((item) => (
          <div
            key={item.id}
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xs border border-slate-200/75 hover:border-slate-300/90 transition-all flex justify-between items-start gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm sm:text-base text-slate-900 truncate">
                {item.attendance_sessions?.nama_kegiatan ?? 'Kegiatan PMR'}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} className="text-pmr-red shrink-0" />
                  <span>{formatWitaDateTime(item.waktu_absen)} WITA</span>
                </span>
                {item.attendance_sessions?.lokasi && (
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{item.attendance_sessions.lokasi}</span>
                  </span>
                )}
              </div>
            </div>

            <span
              className={`shrink-0 text-[11px] px-3 py-1 rounded-full font-bold tracking-wide ${
                STATUS_COLORS[item.status_kehadiran as StatusKehadiran] ??
                'bg-slate-100 text-slate-700'
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