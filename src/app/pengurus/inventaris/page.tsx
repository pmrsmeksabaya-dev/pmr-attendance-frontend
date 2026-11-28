'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Package,
  Plus,
  Loader2,
  Download,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Boxes,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { exportInventarisExcel } from '@/lib/export-inventaris-excel';

interface InventarisItem {
  id: number;
  kode_barang: string;
  nama_barang: string;
  kategori: string;
  jumlah_total: number;
  jumlah_baik: number;
  jumlah_rusak: number;
  lokasi_simpan: string;
  catatan?: string | null;
  updated_at?: string;
}

const KATEGORI_OPTIONS: { value: string; label: string }[] = [
  {
    value: 'Alat Medis & P3K',
    label: 'Alat Medis & P3K (Tensimeter, Stetoskop, Bidai, Tas P3K)',
  },
  {
    value: 'Obat-obatan & Bahan Habis Pakai',
    label: 'Obat-obatan & Habis Pakai (Kasa, Plester, Antiseptik)',
  },
  {
    value: 'Alat Evakuasi & Tandu',
    label: 'Alat Evakuasi & Tandu (Tandu Lipat, Spinal, Tali)',
  },
  {
    value: 'Tenda & Perlengkapan Lapangan',
    label: 'Tenda & Lapangan (Tenda Regu, Matras, Velbed)',
  },
  {
    value: 'Atribut & Seragam PMR',
    label: 'Atribut & Seragam PMR (Rompi, Slayer, Topi, Bendera)',
  },
  {
    value: 'Elektronik & Komunikasi',
    label: 'Elektronik & Komunikasi (HT, Megaphone, Senter)',
  },
  {
    value: 'Kesekretariatan & ATK',
    label: 'Kesekretariatan & ATK (Papan Data, Stempel, Buku)',
  },
  {
    value: 'Perlengkapan Umum & Lainnya',
    label: 'Perlengkapan Umum & Lainnya',
  },
];

const DEFAULT_KATEGORI = KATEGORI_OPTIONS[0].value;

export default function PengurusInventarisPage() {
  const [items, setItems] = useState<InventarisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filter & Pencarian
  const [filterKategori, setFilterKategori] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Tambah Alat
  const [form, setForm] = useState({
    kode_barang: '',
    nama_barang: '',
    kategori: DEFAULT_KATEGORI,
    jumlah_baik: '1',
    jumlah_rusak: '0',
    lokasi_simpan: 'Ruang UKS PMR',
    catatan: '',
  });

  // Modal Edit Alat
  const [editingItem, setEditingItem] = useState<InventarisItem | null>(null);
  const [editForm, setEditForm] = useState({
    kode_barang: '',
    nama_barang: '',
    kategori: DEFAULT_KATEGORI,
    jumlah_baik: '0',
    jumlah_rusak: '0',
    lokasi_simpan: '',
    catatan: '',
  });
  const [updating, setUpdating] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: InventarisItem[] }>(
        '/api/pengurus/inventaris'
      );
      setItems(res.data || []);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat data inventaris.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Gabungkan daftar kategori standar dengan kategori lama jika masih ada di database
  const allFilterCategories = useMemo(() => {
    const standardValues = KATEGORI_OPTIONS.map((k) => k.value);
    const legacyValues = items
      .map((i) => i.kategori)
      .filter((kat): kat is string => Boolean(kat) && !standardValues.includes(kat));
    return Array.from(new Set([...standardValues, ...legacyValues]));
  }, [items]);

  const summary = useMemo(() => {
    const totalJenis = items.length;
    const totalUnit = items.reduce((s, i) => s + Number(i.jumlah_total || 0), 0);
    const totalBaik = items.reduce((s, i) => s + Number(i.jumlah_baik || 0), 0);
    const totalRusak = items.reduce((s, i) => s + Number(i.jumlah_rusak || 0), 0);
    return { totalJenis, totalUnit, totalBaik, totalRusak };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchKat =
        filterKategori === 'ALL' || item.kategori === filterKategori;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.kode_barang.toLowerCase().includes(q) ||
        item.nama_barang.toLowerCase().includes(q) ||
        (item.kategori || '').toLowerCase().includes(q) ||
        (item.lokasi_simpan || '').toLowerCase().includes(q);
      return matchKat && matchQuery;
    });
  }, [items, filterKategori, searchQuery]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const baik = Math.max(0, Number(form.jumlah_baik) || 0);
    const rusak = Math.max(0, Number(form.jumlah_rusak) || 0);

    if (baik + rusak <= 0) {
      toast.error('Jumlah baik atau rusak minimal 1 unit.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch<{ data: InventarisItem }>('/api/pengurus/inventaris', {
        method: 'POST',
        body: JSON.stringify({
          kode_barang: form.kode_barang.trim().toUpperCase(),
          nama_barang: form.nama_barang.trim(),
          kategori: form.kategori,
          jumlah_total: baik + rusak,
          jumlah_baik: baik,
          jumlah_rusak: rusak,
          lokasi_simpan: form.lokasi_simpan.trim() || 'Ruang UKS PMR',
          catatan: form.catatan.trim() || null,
        }),
      });
      toast.success('Barang inventaris ditambahkan.');
      setForm({
        kode_barang: '',
        nama_barang: '',
        kategori: DEFAULT_KATEGORI,
        jumlah_baik: '1',
        jumlah_rusak: '0',
        lokasi_simpan: 'Ruang UKS PMR',
        catatan: '',
      });
      loadItems();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menambah inventaris.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (item: InventarisItem) => {
    setEditingItem(item);
    setEditForm({
      kode_barang: item.kode_barang,
      nama_barang: item.nama_barang,
      kategori: item.kategori || DEFAULT_KATEGORI,
      jumlah_baik: String(item.jumlah_baik),
      jumlah_rusak: String(item.jumlah_rusak),
      lokasi_simpan: item.lokasi_simpan || '',
      catatan: item.catatan || '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const baik = Math.max(0, Number(editForm.jumlah_baik) || 0);
    const rusak = Math.max(0, Number(editForm.jumlah_rusak) || 0);

    setUpdating(true);
    try {
      await apiFetch<{ data: InventarisItem }>(
        `/api/pengurus/inventaris/${editingItem.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            kode_barang: editForm.kode_barang.trim().toUpperCase(),
            nama_barang: editForm.nama_barang.trim(),
            kategori: editForm.kategori,
            jumlah_total: baik + rusak,
            jumlah_baik: baik,
            jumlah_rusak: rusak,
            lokasi_simpan: editForm.lokasi_simpan.trim(),
            catatan: editForm.catatan.trim() || null,
          }),
        }
      );
      toast.success(`Inventaris ${editForm.nama_barang} diperbarui.`);
      setEditingItem(null);
      loadItems();
    } catch (e: any) {
      toast.error(e.message || 'Gagal memperbarui inventaris.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (item: InventarisItem) => {
    if (
      !window.confirm(
        `Hapus barang "${item.nama_barang}" [${item.kode_barang}] dari inventaris?`
      )
    ) {
      return;
    }

    try {
      await apiFetch(`/api/pengurus/inventaris/${item.id}`, {
        method: 'DELETE',
      });
      toast.success('Barang inventaris dihapus.');
      loadItems();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menghapus inventaris.');
    }
  };

  const handleExportExcel = () => {
    if (filteredItems.length === 0) {
      toast.error('Tidak ada data inventaris untuk diekspor.');
      return;
    }

    const activeFilters: string[] = [];
    if (filterKategori !== 'ALL') activeFilters.push(`Kategori: ${filterKategori}`);
    if (searchQuery.trim()) activeFilters.push(`Cari: "${searchQuery.trim()}"`);

    exportInventarisExcel(filteredItems, {
      unitName: 'PMR Wira Unit SMKN 1 Pringgabaya',
      filterLabel:
        activeFilters.length > 0 ? activeFilters.join(' • ') : undefined,
    });

    toast.success('Laporan Inventaris (.xlsx) berhasil diunduh.');
  };

  const formTotalPreview =
    Math.max(0, Number(form.jumlah_baik) || 0) +
    Math.max(0, Number(form.jumlah_rusak) || 0);

  const isLegacyEditKategori =
    Boolean(editForm.kategori) &&
    !KATEGORI_OPTIONS.some((opt) => opt.value === editForm.kategori);

  return (
    <div className="space-y-5">
      {/* Header & Ekspor Excel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
            <Package className="text-[#D32F2F]" /> Inventaris Logistik &amp; Alat
            PMR
          </h1>
          <p className="text-xs text-slate-500 dark:text-red-200/75">
            Divisi Perlengkapan — Pendataan tandu, tas P3K, tensimeter, dan
            atribut PMR.
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

      {/* Ringkasan Kondisi Stok */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-red-200/75">
            <span>Jenis Barang</span>
            <Boxes size={16} className="text-[#D32F2F]" />
          </div>
          <p className="text-xl font-extrabold mt-1.5">{summary.totalJenis}</p>
        </div>
        <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-red-200/75">
            <span>Total Unit</span>
            <Package size={16} className="text-slate-600 dark:text-red-200" />
          </div>
          <p className="text-xl font-extrabold mt-1.5">{summary.totalUnit}</p>
        </div>
        <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-red-200/75">
            <span>Kondisi Baik</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 mt-1.5">
            {summary.totalBaik}
          </p>
        </div>
        <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-red-200/75">
            <span>Kondisi Rusak</span>
            <AlertCircle size={16} className="text-rose-600" />
          </div>
          <p className="text-xl font-extrabold text-rose-600 mt-1.5">
            {summary.totalRusak}
          </p>
        </div>
      </div>

      {/* Form Tambah Alat */}
      <form
        onSubmit={handleAdd}
        className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs items-end"
      >
        <div>
          <label className="font-bold block mb-1">Kode Barang</label>
          <input
            required
            placeholder="Misal: PMR-001"
            value={form.kode_barang}
            onChange={(e) => setForm({ ...form, kode_barang: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900 uppercase"
          />
        </div>
        <div>
          <label className="font-bold block mb-1">Nama Barang</label>
          <input
            required
            placeholder="Misal: Tandu Lipat"
            value={form.nama_barang}
            onChange={(e) => setForm({ ...form, nama_barang: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
        <div>
          <label className="font-bold block mb-1">Kategori Barang</label>
          <select
            value={form.kategori}
            onChange={(e) => setForm({ ...form, kategori: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900 font-medium"
          >
            {KATEGORI_OPTIONS.map((kat) => (
              <option key={kat.value} value={kat.value}>
                {kat.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-bold block mb-1">Lokasi Simpan</label>
          <input
            required
            placeholder="Ruang UKS PMR"
            value={form.lokasi_simpan}
            onChange={(e) =>
              setForm({ ...form, lokasi_simpan: e.target.value })
            }
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
        <div>
          <label className="font-bold block mb-1">Kondisi Baik</label>
          <input
            type="number"
            min={0}
            required
            value={form.jumlah_baik}
            onChange={(e) => setForm({ ...form, jumlah_baik: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
        <div>
          <label className="font-bold block mb-1">Kondisi Rusak</label>
          <input
            type="number"
            min={0}
            required
            value={form.jumlah_rusak}
            onChange={(e) => setForm({ ...form, jumlah_rusak: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
        <div>
          <label className="font-bold block mb-1">
            Catatan (Total Otomatis: {formTotalPreview})
          </label>
          <input
            placeholder="Opsional (misal: Tas merah)"
            value={form.catatan}
            onChange={(e) => setForm({ ...form, catatan: e.target.value })}
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
          <span>Tambah Alat</span>
        </button>
      </form>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="filter-kategori" className="font-bold text-slate-600 dark:text-red-200">
            Filter Kategori:
          </label>
          <select
            id="filter-kategori"
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900 font-bold"
          >
            <option value="ALL">Semua Kategori ({items.length})</option>
            {allFilterCategories.map((kat) => (
              <option key={kat} value={kat}>
                {kat}
              </option>
            ))}
          </select>
          {filterKategori !== 'ALL' && (
            <button
              type="button"
              onClick={() => setFilterKategori('ALL')}
              className="text-[11px] font-bold text-[#D32F2F] hover:underline"
            >
              Reset
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
            placeholder="Cari kode, nama, kategori, lokasi..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
          />
        </div>
      </div>

      {/* Tabel Inventaris */}
      <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
        {loading ? (
          <div className="py-10 text-center">
            <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={24} />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 dark:text-red-200/75">
            Tidak ada barang inventaris yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-red-950/70 font-bold text-slate-500 dark:text-red-200/80">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Barang</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Baik</th>
                  <th className="px-4 py-3">Rusak</th>
                  <th className="px-4 py-3">Lokasi</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-red-900/40">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-red-950/40 transition"
                  >
                    <td className="px-4 py-3 font-mono font-bold whitespace-nowrap">
                      {item.kode_barang}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold">{item.nama_barang}</div>
                      {item.catatan && (
                        <div className="text-[11px] text-slate-400">
                          {item.catatan}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-red-50/80 dark:bg-red-950/70 text-[#B71C1C] dark:text-red-200 font-semibold text-[11px]">
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">{item.jumlah_total}</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">
                      {item.jumlah_baik}
                    </td>
                    <td className="px-4 py-3 text-rose-600 font-bold">
                      {item.jumlah_rusak}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.lokasi_simpan}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          title="Edit Barang"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#D32F2F] hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          title="Hapus Barang"
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

      {/* Modal Edit Barang Inventaris */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleUpdate}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#230709] border border-slate-200 dark:border-red-900/70 p-5 shadow-xl space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-red-900/60 pb-2.5">
              <h2 className="text-base font-extrabold">
                Edit Inventaris: {editingItem.kode_barang}
              </h2>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="font-bold block mb-1">Kode Barang</label>
              <input
                required
                value={editForm.kode_barang}
                onChange={(e) =>
                  setEditForm({ ...editForm, kode_barang: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900 uppercase"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Kategori Barang</label>
              <select
                value={editForm.kategori}
                onChange={(e) =>
                  setEditForm({ ...editForm, kategori: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900 font-medium"
              >
                {isLegacyEditKategori && (
                  <option value={editForm.kategori}>
                    {editForm.kategori} (Kategori Lama)
                  </option>
                )}
                {KATEGORI_OPTIONS.map((kat) => (
                  <option key={kat.value} value={kat.value}>
                    {kat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold block mb-1">Nama Barang</label>
              <input
                required
                value={editForm.nama_barang}
                onChange={(e) =>
                  setEditForm({ ...editForm, nama_barang: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Kondisi Baik</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={editForm.jumlah_baik}
                  onChange={(e) =>
                    setEditForm({ ...editForm, jumlah_baik: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Kondisi Rusak</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={editForm.jumlah_rusak}
                  onChange={(e) =>
                    setEditForm({ ...editForm, jumlah_rusak: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
            </div>

            <div>
              <label className="font-bold block mb-1">Lokasi Simpan</label>
              <input
                required
                value={editForm.lokasi_simpan}
                onChange={(e) =>
                  setEditForm({ ...editForm, lokasi_simpan: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Catatan</label>
              <input
                value={editForm.catatan}
                onChange={(e) =>
                  setEditForm({ ...editForm, catatan: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
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