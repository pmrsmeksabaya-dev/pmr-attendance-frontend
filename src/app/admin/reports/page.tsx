'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Printer,
  Filter,
  Loader2,
  Download,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, AdminSession, ApiError } from '@/lib/api';
import {
  API_BASE_URL,
  STATUS_COLORS,
  StatusKehadiran,
} from '@/lib/constants';
import { getJwt, clearSession } from '@/lib/auth';
import { formatWitaDate, formatWitaTime } from '@/lib/time-client';
import { OrgLogos } from '@/components/OrgLogos';

interface ReportRow {
  id: string | number;
  waktu_absen?: string | null;
  status_kehadiran?: string | null;
  keterangan?: string | null;
  attendance_sessions?: {
    nama_kegiatan?: string;
    tanggal_kegiatan?: string;
    lokasi?: string;
  } | null;
  members?: {
    nis?: string;
    nama?: string;
    kelas?: string;
    jurusan?: string;
  } | null;
}

const STATUS_FILTER_OPTIONS = [
  'ALL',
  'HADIR',
  'TERLAMBAT',
  'IZIN',
  'SAKIT',
  'ALPA',
] as const;

type StatusFilterType = (typeof STATUS_FILTER_OPTIONS)[number];

export default function AdminReportsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [kelas, setKelas] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');

  const handleUnauthorized = useCallback(
    (err: unknown): boolean => {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        toast.error('Sesi admin telah berakhir, silakan login kembali.');
        router.replace('/admin/login');
        return true;
      }
      return false;
    },
    [router]
  );

  useEffect(() => {
    api
      .getAdminSessions()
      .then((res) => setSessions(res.data || []))
      .catch((err) => {
        handleUnauthorized(err);
      });
  }, [handleUnauthorized]);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAdminReports({
        startDate,
        endDate,
        sessionId,
        kelas: kelas.trim(),
      });
      setRows((res.data || []) as ReportRow[]);
    } catch (e: any) {
      if (handleUnauthorized(e)) return;
      toast.error(e?.message || 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, sessionId, kelas, handleUnauthorized]);

  useEffect(() => {
    const timer = setTimeout(fetchPreview, 250);
    return () => clearTimeout(timer);
  }, [fetchPreview]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.TOTAL += 1;
        const st = (r.status_kehadiran || '').toUpperCase();
        if (st === 'HADIR') acc.HADIR += 1;
        else if (st === 'TERLAMBAT') acc.TERLAMBAT += 1;
        else if (st === 'IZIN') acc.IZIN += 1;
        else if (st === 'SAKIT') acc.SAKIT += 1;
        else if (st === 'ALPA') acc.ALPA += 1;
        return acc;
      },
      { TOTAL: 0, HADIR: 0, TERLAMBAT: 0, IZIN: 0, SAKIT: 0, ALPA: 0 }
    );
  }, [rows]);

  const displayedRows = useMemo(() => {
    if (statusFilter === 'ALL') return rows;
    return rows.filter(
      (r) => (r.status_kehadiran || '').toUpperCase() === statusFilter
    );
  }, [rows, statusFilter]);

  const hasActiveFilters = Boolean(
    startDate || endDate || sessionId || kelas.trim() || statusFilter !== 'ALL'
  );

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSessionId('');
    setKelas('');
    setStatusFilter('ALL');
  };

  const handleDownloadExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const qs = new URLSearchParams();
      if (startDate) qs.set('startDate', startDate);
      if (endDate) qs.set('endDate', endDate);
      if (sessionId) qs.set('sessionId', sessionId);
      if (kelas.trim()) qs.set('kelas', kelas.trim());

      const token = getJwt();
      const res = await fetch(
        `${API_BASE_URL}/api/admin/reports/export?${qs.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (res.status === 401) {
        clearSession();
        toast.error('Sesi admin telah berakhir, silakan login kembali.');
        router.replace('/admin/login');
        return;
      }

      if (!res.ok) {
        let msg = 'Gagal mengunduh file Excel';
        try {
          const errJson = await res.json();
          if (errJson?.message) msg = errJson.message;
        } catch {
          // Abaikan jika respons bukan JSON
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const todayWita = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Makassar',
      }).format(new Date());

      a.href = url;
      a.download = `laporan-absensi-pmr-${todayWita}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('File Excel (.xlsx) berhasil diunduh');
    } catch (e: any) {
      toast.error(e?.message || 'Gagal export file Excel');
    } finally {
      setExporting(false);
    }
  };

  const selectedSession = useMemo(
    () => sessions.find((s) => String(s.id) === String(sessionId)),
    [sessions, sessionId]
  );

  return (
    <div className="space-y-5">
      {/* Kop Laporan Khusus Mode Cetak / PDF */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <OrgLogos size="md" />
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Palang Merah Remaja (PMR) Wira
            </p>
            <h2 className="text-lg font-extrabold text-slate-900">
              SMKN 1 PRINGGABAYA
            </h2>
            <p className="text-[11px] text-slate-500">
              Laporan Rekapitulasi Presensi Anggota
            </p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-300 flex flex-wrap justify-between gap-2 text-[11px] text-slate-700">
          <span>
            Periode:{' '}
            <strong>
              {startDate ? formatWitaDate(startDate) : 'Awal'} s/d{' '}
              {endDate ? formatWitaDate(endDate) : 'Sekarang'}
            </strong>
            {selectedSession
              ? ` • Kegiatan: ${selectedSession.nama_kegiatan}`
              : ''}
            {kelas.trim() ? ` • Kelas: ${kelas.trim()}` : ''}
          </span>
          <span>Total Data: {displayedRows.length} baris</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Laporan Rekap Absensi
          </h1>
          <p className="text-xs text-slate-500 dark:text-red-200/75 mt-0.5">
            Filter data kehadiran, pratinjau hasil, lalu ekspor ke Excel (.xlsx) atau cetak PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={fetchPreview}
            title="Muat ulang data laporan"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200 dark:border-red-900/60 text-xs font-bold text-slate-700 dark:text-red-100 hover:border-[#D32F2F] disabled:opacity-50 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden md:inline">Refresh</span>
          </button>

          <button
            type="button"
            disabled={exporting || rows.length === 0}
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition"
          >
            {exporting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={15} />
            )}
            <span>{exporting ? 'Menyiapkan Excel...' : 'Export Excel (.xlsx)'}</span>
          </button>

          <button
            type="button"
            disabled={displayedRows.length === 0}
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition"
          >
            <Printer size={15} />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60 space-y-3 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-red-200/80 mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-red-200/80 mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-red-200/80 mb-1">
              Kegiatan
            </label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
            >
              <option value="">Semua Kegiatan</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.tanggal_kegiatan} — {s.nama_kegiatan}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-red-200/80 mb-1">
              Kelas
            </label>
            <div className="relative">
              <input
                type="text"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                placeholder="Contoh: XI TJKT 1"
                className="w-full pl-3 pr-7 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              />
              {kelas && (
                <button
                  type="button"
                  onClick={() => setKelas('')}
                  aria-label="Hapus filter kelas"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-red-200"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-red-200/80 mb-1">
              Status Kehadiran
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
            >
              <option value="ALL">Semua Status</option>
              <option value="HADIR">HADIR</option>
              <option value="TERLAMBAT">TERLAMBAT</option>
              <option value="IZIN">IZIN</option>
              <option value="SAKIT">SAKIT</option>
              <option value="ALPA">ALPA</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-red-200/70">
            <span>Menampilkan hasil laporan sesuai filter aktif.</span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 font-bold text-[#D32F2F] dark:text-red-300 hover:underline"
            >
              <RotateCcw size={12} />
              <span>Reset Filter</span>
            </button>
          </div>
        )}
      </div>

      {/* Ringkasan Statistik Cepat */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 print:grid-cols-6">
          {[
            {
              key: 'ALL' as const,
              label: 'Total Data',
              value: summary.TOTAL,
              color: 'text-slate-900 dark:text-white',
            },
            {
              key: 'HADIR' as const,
              label: 'Hadir',
              value: summary.HADIR,
              color: 'text-emerald-600 dark:text-emerald-400',
            },
            {
              key: 'TERLAMBAT' as const,
              label: 'Terlambat',
              value: summary.TERLAMBAT,
              color: 'text-amber-600 dark:text-amber-400',
            },
            {
              key: 'IZIN' as const,
              label: 'Izin',
              value: summary.IZIN,
              color: 'text-sky-600 dark:text-sky-400',
            },
            {
              key: 'SAKIT' as const,
              label: 'Sakit',
              value: summary.SAKIT,
              color: 'text-purple-600 dark:text-purple-400',
            },
            {
              key: 'ALPA' as const,
              label: 'Alpa',
              value: summary.ALPA,
              color: 'text-red-600 dark:text-red-400',
            },
          ].map((stat) => {
            const isSelected = statusFilter === stat.key;
            return (
              <button
                key={stat.key}
                type="button"
                onClick={() =>
                  setStatusFilter((prev) =>
                    prev === stat.key && stat.key !== 'ALL' ? 'ALL' : stat.key
                  )
                }
                className={`bg-white dark:bg-[#330C0F] rounded-2xl border p-3 text-center transition print:border-slate-300 ${
                  isSelected
                    ? 'border-[#D32F2F] ring-2 ring-[#D32F2F]/30'
                    : 'border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F]/50'
                }`}
              >
                <div
                  className={`text-lg sm:text-xl font-extrabold font-mono tabular-nums ${stat.color}`}
                >
                  {stat.value}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-red-200/75 mt-0.5">
                  {stat.label}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Preview Table */}
      <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden print:border-slate-300 print:rounded-none">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-red-900/40 flex items-center justify-between text-xs print:hidden">
          <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <Filter size={14} className="text-[#D32F2F]" />
            <span>
              Preview Data ({displayedRows.length}
              {statusFilter !== 'ALL' ? ` dari ${rows.length}` : ''} baris)
            </span>
          </span>
          <span className="text-slate-400 dark:text-red-200/60 flex items-center gap-1">
            <Download size={12} /> Format .xlsx siap unduh
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-50/70 dark:bg-red-950/70 border-b border-slate-200 dark:border-red-900/60 text-[11px] font-extrabold uppercase text-slate-600 dark:text-red-200 print:bg-slate-100 print:text-slate-900">
                <th className="py-3 px-4 whitespace-nowrap">Tanggal</th>
                <th className="py-3 px-4">Kegiatan</th>
                <th className="py-3 px-4 whitespace-nowrap">NIS</th>
                <th className="py-3 px-4">Nama Anggota</th>
                <th className="py-3 px-4 whitespace-nowrap">Kelas</th>
                <th className="py-3 px-4 whitespace-nowrap">Waktu (WITA)</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-red-900/40 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={24} />
                  </td>
                </tr>
              ) : displayedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-slate-400 dark:text-red-200/60"
                  >
                    Tidak ada data kehadiran pada rentang filter ini.
                  </td>
                </tr>
              ) : (
                displayedRows.map((r) => {
                  const statusUpper = (r.status_kehadiran || 'HADIR').toUpperCase();
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-red-50/30 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-mono whitespace-nowrap text-slate-700 dark:text-red-100/90">
                        {r.attendance_sessions?.tanggal_kegiatan || '-'}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-red-100">
                        {r.attendance_sessions?.nama_kegiatan || '-'}
                      </td>
                      <td className="py-2.5 px-4 font-mono whitespace-nowrap text-slate-700 dark:text-red-100/90">
                        {r.members?.nis || '-'}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                        {r.members?.nama || '-'}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap text-slate-700 dark:text-red-100/90">
                        {r.members?.kelas || '-'}
                      </td>
                      <td className="py-2.5 px-4 font-mono whitespace-nowrap text-slate-600 dark:text-red-200/80">
                        {r.waktu_absen ? formatWitaTime(r.waktu_absen) : '-'}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            STATUS_COLORS[statusUpper as StatusKehadiran] ??
                            'bg-slate-100 text-slate-700 dark:bg-red-950 dark:text-red-200'
                          }`}
                        >
                          {statusUpper}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}