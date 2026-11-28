'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  HeartPulse,
  Plus,
  Loader2,
  Download,
  Pencil,
  Trash2,
  Search,
  Calendar,
  Activity,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { exportLogUksExcel } from '@/lib/export-uks-excel';

interface UksLogItem {
  id: number;
  tanggal: string;
  waktu?: string | null;
  nama_pasien: string;
  kelas_pasien: string;
  keluhan: string;
  tindakan: string;
  obat_diberikan?: string | null;
  petugas?: { nama: string; jabatan?: string } | null;
}

export default function PengurusUksPage() {
  const [logs, setLogs] = useState<UksLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filter & Pencarian
  const [filterBulan, setFilterBulan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Tambah Log UKS
  const nowTime = () =>
    new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    waktu: nowTime(),
    nama_pasien: '',
    kelas_pasien: '',
    keluhan: '',
    tindakan: '',
    obat_diberikan: '',
  });

  // Modal Edit Log UKS
  const [editingLog, setEditingLog] = useState<UksLogItem | null>(null);
  const [editForm, setEditForm] = useState({
    tanggal: '',
    waktu: '',
    nama_pasien: '',
    kelas_pasien: '',
    keluhan: '',
    tindakan: '',
    obat_diberikan: '',
  });
  const [updating, setUpdating] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: UksLogItem[] }>('/api/pengurus/uks');
      setLogs(res.data || []);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat catatan pelayanan UKS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const summary = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const monthStr = todayStr.slice(0, 7);
    const hariIni = logs.filter((l) => l.tanggal?.startsWith(todayStr)).length;
    const bulanIni = logs.filter((l) => l.tanggal?.startsWith(monthStr)).length;
    return { total: logs.length, hariIni, bulanIni };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchBulan = !filterBulan || l.tanggal?.startsWith(filterBulan);
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        l.nama_pasien.toLowerCase().includes(q) ||
        (l.kelas_pasien || '').toLowerCase().includes(q) ||
        l.keluhan.toLowerCase().includes(q) ||
        l.tindakan.toLowerCase().includes(q) ||
        (l.obat_diberikan || '').toLowerCase().includes(q) ||
        (l.petugas?.nama || '').toLowerCase().includes(q);
      return matchBulan && matchQuery;
    });
  }, [logs, filterBulan, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch<{ data: UksLogItem }>('/api/pengurus/uks', {
        method: 'POST',
        body: JSON.stringify({
          tanggal: form.tanggal,
          waktu: form.waktu || nowTime(),
          nama_pasien: form.nama_pasien.trim(),
          kelas_pasien: form.kelas_pasien.trim(),
          keluhan: form.keluhan.trim(),
          tindakan: form.tindakan.trim(),
          obat_diberikan: form.obat_diberikan.trim() || null,
        }),
      });
      toast.success('Catatan pelayanan UKS disimpan.');
      setForm({
        tanggal: new Date().toISOString().slice(0, 10),
        waktu: nowTime(),
        nama_pasien: '',
        kelas_pasien: '',
        keluhan: '',
        tindakan: '',
        obat_diberikan: '',
      });
      loadLogs();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menyimpan catatan UKS.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (log: UksLogItem) => {
    setEditingLog(log);
    setEditForm({
      tanggal: log.tanggal?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      waktu: log.waktu ? log.waktu.slice(0, 5) : '',
      nama_pasien: log.nama_pasien,
      kelas_pasien: log.kelas_pasien || '',
      keluhan: log.keluhan,
      tindakan: log.tindakan,
      obat_diberikan: log.obat_diberikan || '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    setUpdating(true);
    try {
      await apiFetch<{ data: UksLogItem }>(
        `/api/pengurus/uks/${editingLog.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            tanggal: editForm.tanggal,
            waktu: editForm.waktu || null,
            nama_pasien: editForm.nama_pasien.trim(),
            kelas_pasien: editForm.kelas_pasien.trim(),
            keluhan: editForm.keluhan.trim(),
            tindakan: editForm.tindakan.trim(),
            obat_diberikan: editForm.obat_diberikan.trim() || null,
          }),
        }
      );
      toast.success(`Log UKS pasien ${editForm.nama_pasien} diperbarui.`);
      setEditingLog(null);
      loadLogs();
    } catch (e: any) {
      toast.error(e.message || 'Gagal memperbarui log UKS.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (log: UksLogItem) => {
    if (
      !window.confirm(
        `Hapus catatan UKS untuk pasien "${log.nama_pasien}" (${log.kelas_pasien})?`
      )
    ) {
      return;
    }
    try {
      await apiFetch(`/api/pengurus/uks/${log.id}`, { method: 'DELETE' });
      toast.success('Catatan pelayanan UKS dihapus.');
      loadLogs();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menghapus catatan UKS.');
    }
  };

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      toast.error('Tidak ada data log UKS untuk diekspor.');
      return;
    }

    const activeFilters: string[] = [];
    if (filterBulan) activeFilters.push(`Bulan: ${filterBulan}`);
    if (searchQuery.trim()) activeFilters.push(`Cari: "${searchQuery.trim()}"`);

    exportLogUksExcel(filteredLogs, {
      unitName: 'PMR Wira Unit SMKN 1 Pringgabaya',
      filterLabel:
        activeFilters.length > 0 ? activeFilters.join(' • ') : undefined,
    });

    toast.success('Laporan Pelayanan UKS (.xlsx) berhasil diunduh.');
  };

  return (
    <div className="space-y-5">
      {/* Header & Tombol Ekspor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
            <HeartPulse className="text-[#D32F2F]" /> Log Pelayanan UKS &amp; P3K
          </h1>
          <p className="text-xs text-slate-500 dark:text-red-200/75">
            Divisi UKS — Pencatatan penanganan pasien siswa di ruang UKS maupun
            piket upacara.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-red-900/60 bg-white dark:bg-[#330C0F] hover:bg-red-50 dark:hover:bg-red-950/70 text-xs font-bold shadow-sm transition self-start sm:self-auto"
        >
          <Download size={15} className="text-[#D32F2F]" />
          <span>Ekspor Excel (.xlsx)</span>
        </button>
      </div>

      {/* Ringkasan Statistik Pasien */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-red-200/75">
            <span>Penanganan Hari Ini</span>
            <Activity size={16} className="text-[#D32F2F]" />
          </div>
          <p className="text-xl font-extrabold mt-1.5">
            {summary.hariIni}{' '}
            <span className="text-xs font-semibold text-slate-400">pasien</span>
          </p>
        </div>
        <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-red-200/75">
            <span>Penanganan Bulan Ini</span>
            <Calendar size={16} className="text-amber-600" />
          </div>
          <p className="text-xl font-extrabold mt-1.5">
            {summary.bulanIni}{' '}
            <span className="text-xs font-semibold text-slate-400">pasien</span>
          </p>
        </div>
        <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-red-200/75">
            <span>Total Riwayat Tercatat</span>
            <HeartPulse size={16} className="text-rose-600" />
          </div>
          <p className="text-xl font-extrabold mt-1.5">
            {summary.total}{' '}
            <span className="text-xs font-semibold text-slate-400">
              kunjungan
            </span>
          </p>
        </div>
      </div>

      {/* Form Input Pelayanan UKS */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs items-end"
      >
        <div>
          <label className="font-bold block mb-1">Tanggal</label>
          <input
            type="date"
            required
            value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
        <div>
          <label className="font-bold block mb-1">Waktu</label>
          <input
            type="time"
            required
            value={form.waktu}
            onChange={(e) => setForm({ ...form, waktu: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
        <div>
          <label className="font-bold block mb-1">Nama Siswa / Pasien</label>
          <input
            required
            placeholder="Nama lengkap pasien"
            value={form.nama_pasien}
            onChange={(e) => setForm({ ...form, nama_pasien: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
        <div>
          <label className="font-bold block mb-1">Kelas</label>
          <input
            required
            placeholder="Misal: XI TKJ 1"
            value={form.kelas_pasien}
            onChange={(e) => setForm({ ...form, kelas_pasien: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
        <div>
          <label className="font-bold block mb-1">Keluhan</label>
          <input
            required
            placeholder="Misal: Pusing, Luka lecet"
            value={form.keluhan}
            onChange={(e) => setForm({ ...form, keluhan: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
        <div>
          <label className="font-bold block mb-1">Tindakan Pertolongan</label>
          <input
            required
            placeholder="Misal: Istirahat, bersihkan luka"
            value={form.tindakan}
            onChange={(e) => setForm({ ...form, tindakan: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
        <div>
          <label className="font-bold block mb-1">Obat / Alat P3K</label>
          <input
            placeholder="Opsional (misal: Paracetamol, Kasa)"
            value={form.obat_diberikan}
            onChange={(e) =>
              setForm({ ...form, obat_diberikan: e.target.value })
            }
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="py-2.5 px-4 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white font-bold inline-flex items-center justify-center gap-1.5"
        >
          {submitting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Plus size={15} />
          )}
          <span>Simpan Log UKS</span>
        </button>
      </form>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={filterBulan}
            onChange={(e) => setFilterBulan(e.target.value)}
            aria-label="Filter Bulan"
            className="px-3 py-1.5 rounded-lg border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
          {filterBulan && (
            <button
              type="button"
              onClick={() => setFilterBulan('')}
              className="text-[11px] font-bold text-[#D32F2F] hover:underline"
            >
              Reset Bulan
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pasien, kelas, keluhan, petugas..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
      </div>

      {/* Tabel Log UKS */}
      <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
        {loading ? (
          <div className="py-10 text-center">
            <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={24} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 dark:text-red-200/75">
            Tidak ada catatan pelayanan UKS yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-red-950/70 font-bold text-slate-500 dark:text-red-200/80">
                <tr>
                  <th className="px-4 py-3">Tanggal &amp; Jam</th>
                  <th className="px-4 py-3">Nama Pasien</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Keluhan</th>
                  <th className="px-4 py-3">Tindakan</th>
                  <th className="px-4 py-3">Obat / P3K</th>
                  <th className="px-4 py-3">Petugas Piket</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-red-900/40">
                {filteredLogs.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-red-950/40 transition"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold">
                        {new Date(l.tanggal).toLocaleDateString('id-ID')}
                      </div>
                      {l.waktu && (
                        <div className="text-[11px] font-mono text-slate-400">
                          {l.waktu.slice(0, 5)} WITA
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">
                      {l.nama_pasien}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {l.kelas_pasien}
                    </td>
                    <td className="px-4 py-3">{l.keluhan}</td>
                    <td className="px-4 py-3">{l.tindakan}</td>
                    <td className="px-4 py-3">{l.obat_diberikan || '-'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-red-200/75 whitespace-nowrap">
                      {l.petugas?.nama || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(l)}
                          title="Edit Catatan UKS"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#D32F2F] hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(l)}
                          title="Hapus Catatan UKS"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-red-200 dark:hover:bg-rose-950"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Edit Log UKS */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleUpdate}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#230709] border border-slate-200 dark:border-red-900/70 p-5 shadow-xl space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-red-900/60 pb-2.5">
              <h2 className="text-base font-extrabold">
                Edit Log UKS: {editingLog.nama_pasien}
              </h2>
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={editForm.tanggal}
                  onChange={(e) =>
                    setEditForm({ ...editForm, tanggal: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Waktu</label>
                <input
                  type="time"
                  value={editForm.waktu}
                  onChange={(e) =>
                    setEditForm({ ...editForm, waktu: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Nama Pasien</label>
                <input
                  required
                  value={editForm.nama_pasien}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nama_pasien: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Kelas</label>
                <input
                  required
                  value={editForm.kelas_pasien}
                  onChange={(e) =>
                    setEditForm({ ...editForm, kelas_pasien: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
            </div>

            <div>
              <label className="font-bold block mb-1">Keluhan</label>
              <input
                required
                value={editForm.keluhan}
                onChange={(e) =>
                  setEditForm({ ...editForm, keluhan: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Tindakan Pertolongan</label>
              <input
                required
                value={editForm.tindakan}
                onChange={(e) =>
                  setEditForm({ ...editForm, tindakan: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Obat / Alat P3K</label>
              <input
                value={editForm.obat_diberikan}
                onChange={(e) =>
                  setEditForm({ ...editForm, obat_diberikan: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-red-900/60 font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-4 py-2 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white font-bold inline-flex items-center gap-1.5"
              >
                {updating && <Loader2 size={14} className="animate-spin" />}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}