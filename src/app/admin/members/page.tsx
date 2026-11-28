'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  UserPlus,
  Upload,
  Download,
  RefreshCw,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  X,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { api, AdminMember, ApiError } from '@/lib/api';
import { clearSession } from '@/lib/auth';
import { MemberFormModal } from '@/components/admin/MemberFormModal';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { extractJurusanFromKelas } from '@/lib/jurusan';

type ExtendedAdminMember = AdminMember & {
  jabatan?: string | null;
  jenis_kelamin?: string | null;
  role?: string | null;
};

const PAGE_LIMIT = 15;

export default function AdminMembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<ExtendedAdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [angkatanFilter, setAngkatanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<AdminMember | null>(null);

  const [memberToArchive, setMemberToArchive] = useState<AdminMember | null>(null);
  const [archiving, setArchiving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAdminMembers({
        page,
        limit: PAGE_LIMIT,
        search: search.trim(),
        kelas: kelasFilter.trim(),
        status: statusFilter,
        angkatan: angkatanFilter.trim(),
      });
      setMembers((res.data || []) as ExtendedAdminMember[]);
      setTotalPages(Math.max(1, res.totalPages || 1));
      setTotal(res.total ?? (res.data ? res.data.length : 0));
    } catch (e: any) {
      if (handleUnauthorized(e)) return;
      toast.error(e?.message || 'Gagal memuat data anggota');
    } finally {
      setLoading(false);
    }
  }, [page, search, kelasFilter, statusFilter, angkatanFilter, handleUnauthorized]);

  useEffect(() => {
    const timer = setTimeout(fetchMembers, 250);
    return () => clearTimeout(timer);
  }, [fetchMembers]);

  const hasActiveFilters = Boolean(
    search.trim() || kelasFilter.trim() || statusFilter || angkatanFilter.trim()
  );

  const handleResetFilters = () => {
    setPage(1);
    setSearch('');
    setKelasFilter('');
    setAngkatanFilter('');
    setStatusFilter('');
  };

  const confirmArchiveMember = async () => {
    if (!memberToArchive) return;
    setArchiving(true);
    try {
      await api.archiveAdminMember(memberToArchive.id);
      toast.success(`Anggota ${memberToArchive.nama} berhasil dinonaktifkan`);
      setMemberToArchive(null);
      fetchMembers();
    } catch (e: any) {
      if (handleUnauthorized(e)) return;
      toast.error(e?.message || 'Gagal menonaktifkan anggota');
    } finally {
      setArchiving(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const res = await api.importAdminMembers(file);
      const insertedCount = res.inserted ?? res.imported ?? res.success ?? 0;
      const failedCount = res.failed ?? 0;
      toast.success(
        `Import selesai: ${insertedCount} berhasil, ${failedCount} gagal`
      );
      if (page !== 1) {
        setPage(1);
      } else {
        fetchMembers();
      }
    } catch (err: any) {
      if (!handleUnauthorized(err)) {
        toast.error(err?.message || 'Gagal mengimpor file CSV/Excel');
      }
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await api.getAdminMembers({
        page: 1,
        limit: 1000,
        search: search.trim(),
        kelas: kelasFilter.trim(),
        status: statusFilter,
        angkatan: angkatanFilter.trim(),
      });

      const list = (res.data || []) as ExtendedAdminMember[];
      if (list.length === 0) {
        toast.error('Tidak ada data anggota untuk diekspor.');
        return;
      }

      const rows = list.map((m, idx) => {
        const rawJurusan =
          m.jurusan && m.jurusan.trim() !== '' && m.jurusan.trim() !== '-'
            ? m.jurusan
            : m.kelas;
        const displayJurusan = extractJurusanFromKelas(rawJurusan) || '-';

        return {
          No: idx + 1,
          NIS: m.nis,
          'Nama Lengkap': m.nama,
          'Jenis Kelamin': m.jenis_kelamin || '-',
          Kelas: m.kelas,
          Jurusan: displayJurusan,
          Angkatan: m.angkatan || '-',
          Jabatan: m.jabatan || 'Anggota',
          'Nomor WhatsApp': m.nomor_whatsapp || '-',
          'Sync Bot (LID)': m.lid ? 'Tertaut' : 'Belum Chat Bot',
          'Status Anggota': m.status_anggota || 'NONAKTIF',
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 5 },
        { wch: 14 },
        { wch: 28 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 11 },
        { wch: 18 },
        { wch: 18 },
        { wch: 16 },
        { wch: 15 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Anggota PMR');
      const dateStr = new Date().toISOString().slice(0, 10);
      const statusSuffix = statusFilter ? `_${statusFilter}` : '';
      XLSX.writeFile(wb, `Data_Anggota_PMR_Wira${statusSuffix}_${dateStr}.xlsx`);
      toast.success(`Berhasil mengekspor ${list.length} data anggota (.xlsx).`);
    } catch (err: any) {
      if (!handleUnauthorized(err)) {
        toast.error(err?.message || 'Gagal mengekspor data anggota');
      }
    } finally {
      setExporting(false);
    }
  };

  const renderStatusBadge = (status?: string | null) => {
    const upper = (status || '').toUpperCase();
    if (upper === 'AKTIF') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60">
          AKTIF
        </span>
      );
    }
    if (upper === 'ALUMNI') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800/60">
          ALUMNI
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-red-950/70 dark:text-red-200/80 dark:border-red-900/60">
        {upper || 'NONAKTIF'}
      </span>
    );
  };

  const startItem = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const endItem = Math.min(page * PAGE_LIMIT, total);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Data Anggota PMR
          </h1>
          <p className="text-xs text-slate-500 dark:text-red-200/75 mt-0.5">
            Total terdaftar:{' '}
            <span className="font-bold text-[#D32F2F] dark:text-red-300">
              {total}
            </span>{' '}
            anggota
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={fetchMembers}
            title="Muat ulang data & status LID"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200 dark:border-red-900/60 text-xs font-bold text-slate-700 dark:text-red-100 hover:border-[#D32F2F] disabled:opacity-50 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden md:inline">Refresh</span>
          </button>

          <button
            type="button"
            disabled={exporting || total === 0}
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200 dark:border-red-900/60 text-xs font-bold text-slate-700 dark:text-red-100 hover:border-[#D32F2F] disabled:opacity-50 transition"
          >
            {exporting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            <span>Export Excel</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200 dark:border-red-900/60 text-xs font-bold text-slate-700 dark:text-red-100 hover:border-[#D32F2F] disabled:opacity-50 transition"
          >
            {importing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Upload size={15} />
            )}
            <span>Import CSV / Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingMember(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition"
          >
            <UserPlus size={15} />
            <span>Tambah Anggota</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Cari NIS, Nama, atau No. WA..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setSearch('');
                }}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-red-200"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <input
            type="text"
            value={kelasFilter}
            onChange={(e) => {
              setPage(1);
              setKelasFilter(e.target.value);
            }}
            placeholder="Filter Kelas (mis: XI TJKT 1)"
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
          />

          <input
            type="number"
            value={angkatanFilter}
            onChange={(e) => {
              setPage(1);
              setAngkatanFilter(e.target.value);
            }}
            placeholder="Angkatan (mis: 2026)"
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
          />

          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
          >
            <option value="">Semua Status</option>
            <option value="AKTIF">AKTIF</option>
            <option value="NONAKTIF">NONAKTIF</option>
            <option value="ALUMNI">ALUMNI</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-red-200/70">
            <span>Menampilkan hasil penyaringan data anggota.</span>
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

      {/* Table */}
      <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-50/70 dark:bg-red-950/70 border-b border-slate-200 dark:border-red-900/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-red-200">
                <th className="py-3.5 px-4 whitespace-nowrap">NIS</th>
                <th className="py-3.5 px-4">Nama</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Kelas</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Jurusan</th>
                <th className="py-3.5 px-4 whitespace-nowrap">No. WA &amp; Sync</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-red-900/40 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={24} />
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-slate-400 dark:text-red-200/60"
                  >
                    Tidak ada data anggota yang sesuai filter.
                  </td>
                </tr>
              ) : (
                members.map((m) => {
                  const rawJurusan =
                    m.jurusan && m.jurusan.trim() !== '' && m.jurusan.trim() !== '-'
                      ? m.jurusan
                      : m.kelas;
                  const displayJurusan = extractJurusanFromKelas(rawJurusan) || '-';

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-red-50/30 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-red-100 whitespace-nowrap">
                        {m.nis}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div>{m.nama}</div>
                        <span className="block text-[10px] font-normal text-slate-400 dark:text-red-200/65">
                          Angkatan {m.angkatan || '-'}
                          {m.jabatan ? ` • ${m.jabatan}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 dark:text-red-100/90">
                        {m.kelas}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-red-100 whitespace-nowrap">
                        {displayJurusan}
                      </td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <div className="text-slate-800 dark:text-red-100">
                          {m.nomor_whatsapp || '-'}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-sans font-medium ${
                            m.lid
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {m.lid ? (
                            <>
                              <CheckCircle2 size={10} /> LID Tertaut
                            </>
                          ) : (
                            <>
                              <XCircle size={10} /> Belum Chat Bot
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderStatusBadge(m.status_anggota)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMember({
                                ...m,
                                jurusan: displayJurusan === '-' ? '' : displayJurusan,
                              });
                              setModalOpen(true);
                            }}
                            className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/70 dark:text-amber-300 dark:hover:bg-amber-900/70 transition"
                            title="Edit Anggota"
                          >
                            <Pencil size={14} />
                          </button>
                          {m.status_anggota === 'AKTIF' && (
                            <button
                              type="button"
                              onClick={() => setMemberToArchive(m)}
                              className="p-2 rounded-lg bg-red-50 text-[#D32F2F] hover:bg-red-100 dark:bg-red-950/80 dark:text-red-300 dark:hover:bg-red-900/70 transition"
                              title="Nonaktifkan Anggota"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-red-900/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 dark:text-red-200/70">
            Menampilkan <b>{startItem}</b>–<b>{endItem}</b> dari <b>{total}</b>{' '}
            anggota (Hal. <b>{page}</b>/{totalPages})
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Halaman sebelumnya"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-red-900/60 text-slate-700 dark:text-red-100 hover:border-[#D32F2F] hover:text-[#D32F2F] disabled:opacity-40 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Halaman berikutnya"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-red-900/60 text-slate-700 dark:text-red-100 hover:border-[#D32F2F] hover:text-[#D32F2F] disabled:opacity-40 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah / Edit */}
      <MemberFormModal
        open={modalOpen}
        member={editingMember}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchMembers}
      />

      {/* Modal Konfirmasi Nonaktifkan Anggota */}
      <ConfirmModal
        open={Boolean(memberToArchive)}
        title="Nonaktifkan Anggota PMR?"
        detailBadge={
          memberToArchive
            ? `${memberToArchive.nama} • NIS: ${memberToArchive.nis} (${memberToArchive.kelas})`
            : undefined
        }
        description="Status anggota ini akan diubah menjadi NONAKTIF dan tidak akan muncul dalam daftar absensi aktif berikutnya. Riwayat absensi lama tetap tersimpan aman."
        confirmText="Ya, Nonaktifkan"
        loading={archiving}
        onConfirm={confirmArchiveMember}
        onClose={() => setMemberToArchive(null)}
      />
    </div>
  );
}