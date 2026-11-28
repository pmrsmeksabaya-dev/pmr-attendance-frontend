'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Plus,
  Loader2,
  Download,
  Pencil,
  Trash2,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { exportLaporanKasExcel } from '@/lib/export-kas-excel';

interface KasRecord {
  id: number;
  tanggal: string;
  jenis: 'MASUK' | 'KELUAR';
  kategori: string;
  keterangan: string;
  nominal: number;
  pencatat?: { nama: string; jabatan?: string } | null;
}

const KATEGORI_OPTIONS = [
  'Kas Rutin',
  'Donasi / Dana Sekolah',
  'Obat & P3K',
  'Perlengkapan',
  'Konsumsi Kegiatan',
  'Lainnya',
];

export default function PengurusKeuanganPage() {
  const [rows, setRows] = useState<KasRecord[]>([]);
  const [summary, setSummary] = useState({
    totalMasuk: 0,
    totalKeluar: 0,
    saldo: 0,
  });
  const [loading, setLoading] = useState(true);

  // State Form Tambah Cepat
  const [tanggal, setTanggal] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [jenis, setJenis] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [kategori, setKategori] = useState('Kas Rutin');
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // State Filter & Pencarian
  const [filterJenis, setFilterJenis] = useState<'ALL' | 'MASUK' | 'KELUAR'>('ALL');
  const [filterBulan, setFilterBulan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // State Modal Edit
  const [editingRow, setEditingRow] = useState<KasRecord | null>(null);
  const [editForm, setEditForm] = useState({
    tanggal: '',
    jenis: 'MASUK' as 'MASUK' | 'KELUAR',
    kategori: 'Kas Rutin',
    keterangan: '',
    nominal: '',
  });
  const [updating, setUpdating] = useState(false);

  const loadKas = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: KasRecord[]; summary: typeof summary }>(
        '/api/pengurus/kas'
      );
      setRows(res.data || []);
      setSummary(res.summary || { totalMasuk: 0, totalKeluar: 0, saldo: 0 });
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat data kas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKas();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const matchJenis = filterJenis === 'ALL' || r.jenis === filterJenis;
      const matchBulan = !filterBulan || r.tanggal?.startsWith(filterBulan);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.keterangan.toLowerCase().includes(q) ||
        r.kategori.toLowerCase().includes(q) ||
        (r.pencatat?.nama || '').toLowerCase().includes(q);
      return matchJenis && matchBulan && matchSearch;
    });
  }, [rows, filterJenis, filterBulan, searchQuery]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keterangan.trim() || Number(nominal) < 100) {
      toast.error('Isi keterangan dan nominal minimal Rp100.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/api/pengurus/kas', {
        method: 'POST',
        body: JSON.stringify({
          tanggal,
          jenis,
          kategori,
          keterangan: keterangan.trim(),
          nominal: Number(nominal),
        }),
      });
      toast.success('Transaksi kas tercatat.');
      setKeterangan('');
      setNominal('');
      loadKas();
    } catch (e: any) {
      toast.error(e.message || 'Gagal mencatat transaksi.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (row: KasRecord) => {
    setEditingRow(row);
    setEditForm({
      tanggal: row.tanggal?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      jenis: row.jenis,
      kategori: row.kategori,
      keterangan: row.keterangan,
      nominal: String(row.nominal),
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;
    if (!editForm.keterangan.trim() || Number(editForm.nominal) < 100) {
      toast.error('Isi keterangan dan nominal minimal Rp100.');
      return;
    }

    setUpdating(true);
    try {
      await apiFetch(`/api/pengurus/kas/${editingRow.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          tanggal: editForm.tanggal,
          jenis: editForm.jenis,
          kategori: editForm.kategori,
          keterangan: editForm.keterangan.trim(),
          nominal: Number(editForm.nominal),
        }),
      });
      toast.success('Transaksi kas diperbarui.');
      setEditingRow(null);
      loadKas();
    } catch (e: any) {
      toast.error(e.message || 'Gagal memperbarui transaksi.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (row: KasRecord) => {
    if (
      !window.confirm(
        `Hapus transaksi "${row.keterangan}" (${formatRp(Number(row.nominal))})?`
      )
    ) {
      return;
    }

    try {
      await apiFetch(`/api/pengurus/kas/${row.id}`, {
        method: 'DELETE',
      });
      toast.success('Transaksi kas dihapus.');
      loadKas();
    } catch (e: any) {
      toast.error(
        e.message || 'Gagal menghapus transaksi (memerlukan akses Admin/Owner).'
      );
    }
  };

  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      toast.error('Tidak ada data transaksi untuk diekspor.');
      return;
    }

    const activeFilters: string[] = [];
    if (filterJenis !== 'ALL') activeFilters.push(`Jenis: ${filterJenis}`);
    if (filterBulan) activeFilters.push(`Bulan: ${filterBulan}`);
    if (searchQuery.trim()) activeFilters.push(`Cari: "${searchQuery.trim()}"`);

    exportLaporanKasExcel(filteredRows, {
      unitName: 'PMR Wira Unit SMKN 1 Pringgabaya',
      filterLabel:
        activeFilters.length > 0 ? activeFilters.join(' • ') : undefined,
    });

    toast.success('Laporan Kas PMR (.xlsx) berhasil diunduh.');
  };

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-5">
      {/* Header & Tombol Ekspor */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold">
            Kas &amp; Keuangan PMR
          </h1>
          <p className="text-xs text-slate-500 dark:text-red-200/75">
            Bendahara PMR — Pencatatan uang kas rutin, donasi, dan belanja
            operasional.
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-red-200/75">
            <span>Total Pemasukan</span>
            <ArrowDownCircle size={18} className="text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 mt-2">
            {formatRp(summary.totalMasuk)}
          </p>
        </div>
        <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-red-200/75">
            <span>Total Pengeluaran</span>
            <ArrowUpCircle size={18} className="text-rose-600" />
          </div>
          <p className="text-xl font-extrabold text-rose-600 mt-2">
            {formatRp(summary.totalKeluar)}
          </p>
        </div>
        <div className="bg-gradient-to-r from-[#D32F2F] to-red-800 text-white p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-xs font-bold text-white/80">
            <span>Saldo Kas Aktif</span>
            <Wallet size={18} />
          </div>
          <p className="text-2xl font-extrabold mt-2">
            {formatRp(summary.saldo)}
          </p>
        </div>
      </div>

      {/* Form Input Cepat */}
      <form
        onSubmit={handleAdd}
        className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end text-xs"
      >
        <div>
          <label className="font-bold block mb-1">Tanggal</label>
          <input
            type="date"
            required
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
        <div>
          <label className="font-bold block mb-1">Jenis</label>
          <select
            value={jenis}
            onChange={(e) => setJenis(e.target.value as 'MASUK' | 'KELUAR')}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          >
            <option value="MASUK">Pemasukan (+)</option>
            <option value="KELUAR">Pengeluaran (-)</option>
          </select>
        </div>
        <div>
          <label className="font-bold block mb-1">Kategori</label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          >
            {KATEGORI_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-bold block mb-1">Keterangan</label>
          <input
            required
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Misal: Kas latihan Kamis"
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
        <div>
          <label className="font-bold block mb-1">Nominal (Rp)</label>
          <input
            type="number"
            min={100}
            required
            value={nominal}
            onChange={(e) => setNominal(e.target.value)}
            placeholder="50000"
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
          <span>Catat Kas</span>
        </button>
      </form>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'MASUK', 'KELUAR'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterJenis(tab)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                filterJenis === tab
                  ? 'bg-[#D32F2F] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-red-50 dark:bg-red-950/60 dark:text-red-200'
              }`}
            >
              {tab === 'ALL' ? 'Semua' : tab}
            </button>
          ))}
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

        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari keterangan, kategori..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
      </div>

      {/* Tabel Riwayat Transaksi */}
      <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
        {loading ? (
          <div className="py-10 text-center">
            <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={24} />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 dark:text-red-200/75">
            Tidak ada transaksi kas yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-red-950/70 font-bold text-slate-500 dark:text-red-200/80">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">Pencatat</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-red-900/40">
                {filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-red-950/40 transition"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(r.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          r.jenis === 'MASUK'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                        }`}
                      >
                        {r.jenis}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{r.kategori}</td>
                    <td className="px-4 py-3">{r.keterangan}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-red-200/75 whitespace-nowrap">
                      {r.pencatat?.nama || '-'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-extrabold whitespace-nowrap ${
                        r.jenis === 'MASUK'
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {r.jenis === 'MASUK' ? '+' : '-'}{' '}
                      {formatRp(Number(r.nominal))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          title="Edit Transaksi"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#D32F2F] hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r)}
                          title="Hapus Transaksi (Admin/Owner)"
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

      {/* Modal Edit Transaksi */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#230709] border border-slate-200 dark:border-red-900/70 p-5 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold">Edit Transaksi Kas</h2>
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
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
                  <label className="font-bold block mb-1">Jenis</label>
                  <select
                    value={editForm.jenis}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        jenis: e.target.value as 'MASUK' | 'KELUAR',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                  >
                    <option value="MASUK">Pemasukan (+)</option>
                    <option value="KELUAR">Pengeluaran (-)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Kategori</label>
                <select
                  value={editForm.kategori}
                  onChange={(e) =>
                    setEditForm({ ...editForm, kategori: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                >
                  {KATEGORI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold block mb-1">Keterangan</label>
                <input
                  required
                  value={editForm.keterangan}
                  onChange={(e) =>
                    setEditForm({ ...editForm, keterangan: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  min={100}
                  required
                  value={editForm.nominal}
                  onChange={(e) =>
                    setEditForm({ ...editForm, nominal: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
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
        </div>
      )}
    </div>
  );
}