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
  Search,
  Download,
  FilePlus2,
  ReceiptText,
  Info,
  ChevronDown,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { api, HistoryResponse, ApiError } from '@/lib/api';
import { isLoggedIn, clearSession, getUser } from '@/lib/auth';
import { formatWitaDateTime } from '@/lib/time-client';
import { STATUS_COLORS, StatusKehadiran } from '@/lib/constants';

// Mapping class statis agar aman saat Tailwind production build (Vercel) + Dark Mode
const SUMMARY_STYLES = [
  {
    key: 'HADIR',
    label: 'Hadir',
    card: 'bg-emerald-50/90 border-emerald-200/80 dark:bg-emerald-950/40 dark:border-emerald-800/60',
    activeRing: 'ring-2 ring-emerald-500',
    count: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  {
    key: 'TERLAMBAT',
    label: 'Terlambat',
    card: 'bg-amber-50/90 border-amber-200/80 dark:bg-amber-950/40 dark:border-amber-800/60',
    activeRing: 'ring-2 ring-amber-500',
    count: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  {
    key: 'IZIN',
    label: 'Izin',
    card: 'bg-sky-50/90 border-sky-200/80 dark:bg-sky-950/40 dark:border-sky-800/60',
    activeRing: 'ring-2 ring-sky-500',
    count: 'text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
  },
  {
    key: 'SAKIT',
    label: 'Sakit',
    card: 'bg-purple-50/90 border-purple-200/80 dark:bg-purple-950/40 dark:border-purple-800/60',
    activeRing: 'ring-2 ring-purple-500',
    count: 'text-purple-600 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
  {
    key: 'ALPA',
    label: 'Alpa',
    card: 'bg-red-50/90 border-red-200/80 dark:bg-red-950/50 dark:border-red-800/60',
    activeRing: 'ring-2 ring-red-500',
    count: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
  },
  {
    key: 'TOTAL',
    label: 'Total Sesi',
    card: 'bg-slate-100/90 border-slate-300/80 dark:bg-[#330C0F] dark:border-red-900/60',
    activeRing: 'ring-2 ring-slate-700 dark:ring-red-300',
    count: 'text-slate-900 dark:text-white',
    dot: 'bg-slate-600 dark:bg-red-300',
  },
] as const;

const FILTER_TABS = ['SEMUA', 'HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPA'] as const;

/**
 * Mengambil format YYYY-MM dalam zona waktu WITA (Asia/Makassar)
 * agar pencocokan filter bulan akurat dan tidak tergeser selisih UTC.
 */
function getWitaYearMonth(isoOrDate?: string | null): string {
  if (!isoOrDate) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate.trim())) {
    return isoOrDate.trim().slice(0, 7);
  }
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoOrDate.slice(0, 7);
  }
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(parsed);
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    if (year && month) return `${year}-${month}`;
  } catch {
    // Fallback jika Intl timezone tidak tersedia
  }
  return isoOrDate.slice(0, 7);
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<(typeof FILTER_TABS)[number]>('SEMUA');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [showStatusGuide, setShowStatusGuide] = useState(false);

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
    const q = searchQuery.toLowerCase().trim();

    return history.data.filter((item) => {
      const matchStatus =
        activeFilter === 'SEMUA' ||
        item.status_kehadiran?.toUpperCase() === activeFilter;

      const sessionTanggal = (
        item.attendance_sessions as { tanggal_kegiatan?: string } | undefined
      )?.tanggal_kegiatan;
      const itemYearMonth =
        getWitaYearMonth(sessionTanggal) || getWitaYearMonth(item.waktu_absen);
      const matchMonth = !filterBulan || itemYearMonth === filterBulan;

      const kegiatan = (item.attendance_sessions?.nama_kegiatan || '').toLowerCase();
      const lokasi = (item.attendance_sessions?.lokasi || '').toLowerCase();
      const ket = ((item as { keterangan?: string | null }).keterangan || '').toLowerCase();
      const matchSearch =
        !q || kegiatan.includes(q) || lokasi.includes(q) || ket.includes(q);

      return matchStatus && matchMonth && matchSearch;
    });
  }, [history, activeFilter, filterBulan, searchQuery]);

  const attendanceRate = useMemo(() => {
    if (!history || !history.summary.TOTAL) return 0;
    const presentCount = (history.summary.HADIR ?? 0) + (history.summary.TERLAMBAT ?? 0);
    return Math.round((presentCount / history.summary.TOTAL) * 100);
  }, [history]);

  const handleCardFilter = (key: (typeof SUMMARY_STYLES)[number]['key']) => {
    if (key === 'TOTAL') {
      setActiveFilter('SEMUA');
      return;
    }
    setActiveFilter((prev) => (prev === key ? 'SEMUA' : key));
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.error('Tidak ada data riwayat absensi untuk diekspor.');
      return;
    }

    const rows = filteredData.map((item, idx) => ({
      No: idx + 1,
      'Nama Kegiatan': item.attendance_sessions?.nama_kegiatan ?? 'Kegiatan PMR',
      Lokasi: item.attendance_sessions?.lokasi ?? '-',
      'Waktu Absen (WITA)': item.waktu_absen
        ? formatWitaDateTime(item.waktu_absen)
        : '-',
      'Status Kehadiran': item.status_kehadiran,
      Keterangan: (item as { keterangan?: string | null }).keterangan || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 30 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 28 },
    ];

    const currentUser = getUser();
    const safeMemberName = (currentUser?.nama || 'Anggota')
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '_');

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Absensi');
    const suffix = filterBulan || new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Rekap_Absensi_PMR_${safeMemberName}_${suffix}.xlsx`);
    toast.success('Rekap Absensi (.xlsx) berhasil diunduh.');
  };

  const buildReceiptHref = (item: HistoryResponse['data'][number]): string => {
    const currentUser = getUser() as {
      nama?: string;
      kelas?: string;
      jenis_kelamin?: string;
    } | null;
    const session = item.attendance_sessions as
      | {
          nama_kegiatan?: string;
          lokasi?: string;
          tanggal_kegiatan?: string;
        }
      | undefined;

    const qs = new URLSearchParams({
      nama: currentUser?.nama || 'Anggota PMR',
      kelas: currentUser?.kelas || '-',
      jk: currentUser?.jenis_kelamin || '-',
      kegiatan: session?.nama_kegiatan || 'Kegiatan PMR',
      waktu: item.waktu_absen || '',
      status: (item.status_kehadiran || 'HADIR').toUpperCase(),
    });

    if (session?.lokasi) qs.set('lokasi', session.lokasi);
    if (session?.tanggal_kegiatan) qs.set('tanggal', session.tanggal_kegiatan);

    return `/absensi/result?${qs.toString()}`;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-red-100/80 dark:bg-red-950/60 rounded-3xl" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-100 dark:border-red-900/50"
            />
          ))}
        </div>
        <div className="space-y-2.5">
          <div className="h-20 bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-100 dark:border-red-900/50" />
          <div className="h-20 bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-100 dark:border-red-900/50" />
        </div>
      </div>
    );
  }

  const rateBarColor =
    attendanceRate >= 80
      ? 'bg-emerald-400'
      : attendanceRate >= 60
        ? 'bg-amber-400'
        : 'bg-rose-300';

  return (
    <div className="space-y-5">
      {/* Header + Tingkat Kehadiran + Aksi Cepat (Gradasi Merah Marun PMR) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#8E1C1C] via-[#6B1216] to-[#3B090C] p-5 sm:p-6 text-white shadow-lg shadow-red-950/15 border border-red-800/40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-rose-400/20 blur-2xl"
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-200/90">
              Rekap Presensi Pribadi
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-0.5">
              Riwayat Absensi
            </h2>
            <p className="text-xs text-rose-100/80 mt-1">
              {history?.data.length
                ? `Total ${history.data.length} kegiatan PMR tercatat`
                : 'Belum ada sesi latihan atau kegiatan yang tercatat'}
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            {history && history.summary.TOTAL > 0 && (
              <div className="bg-white/12 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 text-right shrink-0 min-w-[126px]">
                <div className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-200">
                  <TrendingUp size={12} />
                  <span>Kehadiran</span>
                </div>
                <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums mt-0.5">
                  {attendanceRate}%
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${rateBarColor}`}
                    style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bar Tombol Aksi Cepat */}
        <div className="relative mt-4 pt-3.5 border-t border-white/15 flex flex-wrap items-center gap-2">
          <Link
            href="/absensi/scan"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#991B1B] hover:bg-rose-50 text-xs font-extrabold shadow-sm transition"
          >
            <QrCode size={14} />
            <span>Scan QR</span>
          </Link>
          <Link
            href="/absensi/izin"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/12 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition"
          >
            <FilePlus2 size={14} />
            <span>Ajukan Izin</span>
          </Link>
          {history && history.data.length > 0 && (
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/12 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition ml-auto"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Unduh Excel</span>
              <span className="sm:hidden">.xlsx</span>
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan Statistik (Klik kartu untuk filter cepat) */}
      {history && (
        <div className="space-y-2">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {SUMMARY_STYLES.map(({ key, label, card, activeRing, count, dot }) => {
              const isSelected =
                (key === 'TOTAL' && activeFilter === 'SEMUA') ||
                activeFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCardFilter(key)}
                  className={`${card} ${
                    isSelected ? activeRing : ''
                  } backdrop-blur-sm border rounded-2xl p-3 text-center shadow-2xs transition-all hover:scale-[1.02] cursor-pointer`}
                >
                  <div
                    className={`text-xl sm:text-2xl font-extrabold font-mono tabular-nums ${count}`}
                  >
                    {history.summary[key as keyof typeof history.summary] ?? 0}
                  </div>
                  <div className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-red-100/80 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    <span>{label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Cara Kerja Terlambat & Alpa (Collapsible) */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowStatusGuide((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-red-200/75 hover:text-[#D32F2F] transition"
            >
              <Info size={13} />
              <span>Cara pencatatan Terlambat & Alpa</span>
              <ChevronDown
                size={13}
                className={`transition-transform ${showStatusGuide ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {showStatusGuide && (
            <div className="rounded-2xl bg-white/95 dark:bg-[#330C0F] border border-slate-200/80 dark:border-red-900/60 p-3.5 text-xs text-slate-600 dark:text-red-100/85 space-y-1.5 shadow-2xs">
              <p>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  • Terlambat:
                </span>{' '}
                Tercatat otomatis apabila Anda melakukan Scan QR melewati batas waktu toleransi yang ditetapkan panitia setelah kegiatan dimulai.
              </p>
              <p>
                <span className="font-bold text-red-600 dark:text-red-400">
                  • Alpa:
                </span>{' '}
                Tercatat otomatis ketika sesi kegiatan telah ditutup tanpa pemindaian QR maupun pengajuan Izin/Sakit yang disetujui pengurus.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Filter Pills + Pencarian + Filter Bulan */}
      {history && history.data.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-red-200/60 mr-1 shrink-0">
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
                      ? 'bg-[#D32F2F] text-white shadow-xs shadow-red-600/20'
                      : 'bg-white/90 dark:bg-[#330C0F] text-slate-600 dark:text-red-100/80 border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F]/50 hover:text-[#D32F2F]'
                  }`}
                >
                  {tab === 'SEMUA'
                    ? 'Semua'
                    : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 text-xs">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kegiatan atau lokasi..."
                className="w-full pl-8 pr-8 py-2 rounded-xl border border-slate-200/80 dark:border-red-900/60 bg-white/95 dark:bg-[#330C0F] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="month"
                value={filterBulan}
                onChange={(e) => setFilterBulan(e.target.value)}
                aria-label="Filter Bulan"
                className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200/80 dark:border-red-900/60 bg-white/95 dark:bg-[#330C0F] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              />
              {filterBulan && (
                <button
                  type="button"
                  onClick={() => setFilterBulan('')}
                  className="px-2.5 py-2 rounded-xl bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-200 font-bold shrink-0"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State (Belum Ada Data Sama Sekali) */}
      {history?.data.length === 0 && (
        <div className="bg-white/95 dark:bg-[#330C0F] backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-red-900/60 p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/70 border border-red-100 dark:border-red-800/60 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
            <CalendarCheck2 className="text-[#D32F2F]" size={30} />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Belum Ada Riwayat
          </h3>
          <p className="text-xs text-slate-500 dark:text-red-200/75 mt-1 max-w-xs mx-auto leading-relaxed">
            Catatan kehadiran latihan rutin maupun kegiatan PMR Anda akan muncul di sini.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
            <Link
              href="/absensi/scan"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#D32F2F] to-red-600 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-md shadow-red-600/20 hover:brightness-105 active:scale-[0.98] transition-all"
            >
              <QrCode size={15} />
              <span>Scan QR Sekarang</span>
            </Link>
            <Link
              href="/absensi/izin"
              className="inline-flex items-center gap-2 bg-slate-100 dark:bg-red-950 text-slate-700 dark:text-red-100 text-xs font-semibold px-4 py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-red-900 transition-all"
            >
              <FilePlus2 size={15} />
              <span>Ajukan Izin</span>
            </Link>
          </div>
        </div>
      )}

      {/* Empty State untuk Filter Tertentu */}
      {history && history.data.length > 0 && filteredData.length === 0 && (
        <div className="bg-white/90 dark:bg-[#330C0F] rounded-2xl border border-slate-200/70 dark:border-red-900/60 p-6 text-center text-xs text-slate-500 dark:text-red-200/75 space-y-2">
          <p>
            Tidak ada catatan presensi yang cocok dengan filter{' '}
            <strong className="text-slate-700 dark:text-white">{activeFilter}</strong>
            {filterBulan ? ` pada bulan ${filterBulan}` : ''}.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveFilter('SEMUA');
              setSearchQuery('');
              setFilterBulan('');
            }}
            className="text-[#D32F2F] dark:text-red-300 font-bold hover:underline"
          >
            Tampilkan Semua Riwayat
          </button>
        </div>
      )}

      {/* Daftar Riwayat */}
      <div className="space-y-2.5">
        {filteredData.map((item) => {
          const keterangan = (item as { keterangan?: string | null }).keterangan;
          const upperStatus = (item.status_kehadiran || '').toUpperCase();
          const hasDigitalReceipt =
            upperStatus === 'HADIR' || upperStatus === 'TERLAMBAT';
          const sessionTanggal = (
            item.attendance_sessions as { tanggal_kegiatan?: string } | undefined
          )?.tanggal_kegiatan;

          return (
            <div
              key={item.id}
              className="bg-white/95 dark:bg-[#330C0F] backdrop-blur-sm rounded-2xl p-4 shadow-2xs border border-slate-200/75 dark:border-red-900/60 hover:border-slate-300/90 dark:hover:border-red-700/70 transition-all flex justify-between items-start gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                  {item.attendance_sessions?.nama_kegiatan ?? 'Kegiatan PMR'}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-red-200/75 mt-1.5">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} className="text-[#D32F2F] shrink-0" />
                    <span>
                      {item.waktu_absen
                        ? `${formatWitaDateTime(item.waktu_absen)} WITA`
                        : sessionTanggal || 'Tercatat otomatis oleh sistem'}
                    </span>
                  </span>
                  {item.attendance_sessions?.lokasi && (
                    <span className="inline-flex items-center gap-1 text-slate-500 dark:text-red-200/70">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">
                        {item.attendance_sessions.lokasi}
                      </span>
                    </span>
                  )}
                </div>
                {keterangan && (
                  <p className="text-[11px] text-slate-500 dark:text-red-200/65 mt-1.5 bg-slate-50 dark:bg-red-950/50 px-2.5 py-1 rounded-lg inline-block">
                    Catatan: {keterangan}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span
                  className={`text-[11px] px-3 py-1 rounded-full font-bold tracking-wide ${
                    STATUS_COLORS[item.status_kehadiran as StatusKehadiran] ??
                    'bg-slate-100 text-slate-700 dark:bg-red-950 dark:text-red-200'
                  }`}
                >
                  {item.status_kehadiran}
                </span>

                {hasDigitalReceipt && (
                  <Link
                    href={buildReceiptHref(item)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D32F2F] dark:text-red-300 hover:underline"
                  >
                    <ReceiptText size={12} />
                    <span>Bukti</span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}