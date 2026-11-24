'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Search,
  UserPlus,
  Upload,
  Pencil,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, AdminMember } from '@/lib/api';
import { MemberFormModal } from '@/components/admin/MemberFormModal';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { extractJurusanFromKelas } from '@/lib/jurusan';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

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

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminMembers({
        page,
        limit: 15,
        search,
        kelas: kelasFilter,
        status: statusFilter,
        angkatan: angkatanFilter,
      });
      setMembers(res.data || []);
      setTotalPages(Math.max(1, res.totalPages || 1));
      setTotal(res.total ?? (res.data ? res.data.length : 0));
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat data anggota');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchMembers, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, kelasFilter, statusFilter, angkatanFilter]);

  const confirmArchiveMember = async () => {
    if (!memberToArchive) return;
    setArchiving(true);
    try {
      await api.archiveAdminMember(memberToArchive.id);
      toast.success(`Anggota ${memberToArchive.nama} berhasil dinonaktifkan`);
      setMemberToArchive(null);
      fetchMembers();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menonaktifkan anggota');
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
      toast.success(
        `Import selesai: ${res.inserted ?? res.imported ?? res.success ?? 0} berhasil, ${res.failed ?? 0} gagal`
      );
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengimpor file CSV/Excel');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Data Anggota PMR
          </h1>
          <p className="text-xs text-slate-500 dark:text-red-200/75 mt-0.5">
            Total terdaftar: <span className="font-bold text-[#D32F2F]">{total}</span> anggota
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200 dark:border-red-900/60 text-xs font-bold text-slate-700 dark:text-red-100 hover:border-[#D32F2F] transition"
          >
            {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
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
      <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-2 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Cari NIS, Nama, atau No. WA..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
          />
        </div>

        <input
          type="text"
          value={kelasFilter}
          onChange={(e) => {
            setPage(1);
            setKelasFilter(e.target.value);
          }}
          placeholder="Filter Kelas (mis: XI TJKT 1)"
          className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
        />

        <input
          type="number"
          value={angkatanFilter}
          onChange={(e) => {
            setPage(1);
            setAngkatanFilter(e.target.value);
          }}
          placeholder="Angkatan (mis: 2026)"
          className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
        >
          <option value="">Semua Status</option>
          <option value="AKTIF">AKTIF</option>
          <option value="NONAKTIF">NONAKTIF</option>
          <option value="ALUMNI">ALUMNI</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-red-50/70 dark:bg-red-950/70 border-b border-slate-200 dark:border-red-900/60 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-red-200">
                <th className="py-3.5 px-4">NIS</th>
                <th className="py-3.5 px-4">Nama</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Jurusan</th>
                <th className="py-3.5 px-4">No. WA &amp; Sync</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
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
                  <td colSpan={7} className="py-10 text-center text-slate-400">
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
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-red-100">
                        {m.nis}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {m.nama}
                        <span className="block text-[10px] font-normal text-slate-400">
                          Angkatan {m.angkatan}
                        </span>
                      </td>
                      <td className="py-3 px-4">{m.kelas}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-red-100">
                        {displayJurusan}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div>{m.nomor_whatsapp || '-'}</div>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] ${
                            m.lid ? 'text-emerald-600' : 'text-amber-500'
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
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            m.status_anggota === 'AKTIF'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {m.status_anggota}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
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
                            className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          {m.status_anggota === 'AKTIF' && (
                            <button
                              type="button"
                              onClick={() => setMemberToArchive(m)}
                              className="p-2 rounded-lg bg-red-50 text-[#D32F2F] hover:bg-red-100 transition"
                              title="Nonaktifkan"
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
        <div className="px-4 py-3 border-t border-slate-100 dark:border-red-900/40 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-red-200/70">
            Halaman <b>{page}</b> dari <b>{totalPages}</b>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-red-900/60 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-red-900/60 disabled:opacity-40"
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