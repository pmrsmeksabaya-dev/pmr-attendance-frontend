'use client';

import { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Filter,
  Loader2,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, AdminSession } from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';
import { getJwt } from '@/lib/auth';

export default function AdminReportsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [kelas, setKelas] = useState('');

  useEffect(() => {
    api
      .getAdminSessions()
      .then((res) => setSessions(res.data))
      .catch(() => {});
  }, []);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminReports({
        startDate,
        endDate,
        sessionId,
        kelas,
      });
      setRows(res.data);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, sessionId, kelas]);

  const handleDownloadExcel = async () => {
    setExporting(true);
    try {
      const qs = new URLSearchParams();
      if (startDate) qs.set('startDate', startDate);
      if (endDate) qs.set('endDate', endDate);
      if (sessionId) qs.set('sessionId', sessionId);
      if (kelas) qs.set('kelas', kelas);

      const token = getJwt();
      const res = await fetch(
        `${API_BASE_URL}/api/admin/reports/export?${qs.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!res.ok) throw new Error('Gagal mengunduh file Excel');
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
      toast.error(e.message || 'Gagal export file Excel');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Laporan Rekap Absensi
          </h1>
          <p className="text-xs text-slate-500 dark:text-red-200/75 mt-0.5">
            Filter data kehadiran, pratinjau hasil, lalu ekspor ke Excel (.xlsx) atau cetak PDF.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            type="button"
            disabled={exporting}
            onClick={handleDownloadExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold shadow-sm transition"
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
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Printer size={15} />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Kegiatan</label>
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs"
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
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Kelas</label>
          <input
            type="text"
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            placeholder="Contoh: XI TJKT 1"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs"
          />
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-red-900/40 flex items-center justify-between text-xs">
          <span className="font-bold flex items-center gap-1.5">
            <Filter size={14} className="text-[#D32F2F]" />
            Preview Data ({rows.length} baris)
          </span>
          <span className="text-slate-400 flex items-center gap-1">
            <Download size={12} /> Format .xlsx siap unduh
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-50/70 dark:bg-red-950/70 border-b border-slate-200 dark:border-red-900/60 text-[11px] font-extrabold uppercase text-slate-600 dark:text-red-200">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kegiatan</th>
                <th className="py-3 px-4">NIS</th>
                <th className="py-3 px-4">Nama Anggota</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-red-900/40 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={24} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Tidak ada data kehadiran pada rentang filter ini.
                  </td>
                </tr>
              ) : (
                rows.map((r: any) => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-4 font-mono">
                      {r.attendance_sessions?.tanggal_kegiatan}
                    </td>
                    <td className="py-2.5 px-4 font-semibold">
                      {r.attendance_sessions?.nama_kegiatan}
                    </td>
                    <td className="py-2.5 px-4 font-mono">{r.members?.nis}</td>
                    <td className="py-2.5 px-4 font-bold">{r.members?.nama}</td>
                    <td className="py-2.5 px-4">{r.members?.kelas}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          r.status_kehadiran === 'HADIR'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {r.status_kehadiran}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}