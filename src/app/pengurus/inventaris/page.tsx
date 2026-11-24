'use client';

import { useEffect, useState } from 'react';
import { Package, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export default function PengurusInventarisPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    kode_barang: '',
    nama_barang: '',
    kategori: 'Medis/P3K',
    jumlah_total: '1',
    jumlah_baik: '1',
    jumlah_rusak: '0',
    lokasi_simpan: 'Ruang UKS PMR',
  });

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: any[] }>('/api/pengurus/inventaris');
      setItems(res.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/pengurus/inventaris', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast.success('Barang inventaris ditambahkan.');
      setForm({
        kode_barang: '',
        nama_barang: '',
        kategori: 'Medis/P3K',
        jumlah_total: '1',
        jumlah_baik: '1',
        jumlah_rusak: '0',
        lokasi_simpan: 'Ruang UKS PMR',
      });
      loadItems();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-5">
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
      <form
        onSubmit={handleAdd}
        className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
      >
        <input
          required
          placeholder="Kode (misal: PMR-001)"
          value={form.kode_barang}
          onChange={(e) => setForm({ ...form, kode_barang: e.target.value })}
          className="px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
        />
        <input
          required
          placeholder="Nama Barang (misal: Tandu Lipat)"
          value={form.nama_barang}
          onChange={(e) => setForm({ ...form, nama_barang: e.target.value })}
          className="px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
        />
        <select
          value={form.kategori}
          onChange={(e) => setForm({ ...form, kategori: e.target.value })}
          className="px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
        >
          <option value="Medis/P3K">Medis / P3K</option>
          <option value="Evakuasi">Evakuasi</option>
          <option value="Atribut">Atribut &amp; Bendera</option>
          <option value="Kesekretariatan">Kesekretariatan</option>
        </select>
        <input
          required
          type="number"
          min={1}
          placeholder="Jumlah Total"
          value={form.jumlah_total}
          onChange={(e) =>
            setForm({
              ...form,
              jumlah_total: e.target.value,
              jumlah_baik: e.target.value,
            })
          }
          className="px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
        />
        <input
          type="number"
          min={0}
          placeholder="Kondisi Baik"
          value={form.jumlah_baik}
          onChange={(e) => setForm({ ...form, jumlah_baik: e.target.value })}
          className="px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
        />
        <input
          type="number"
          min={0}
          placeholder="Kondisi Rusak"
          value={form.jumlah_rusak}
          onChange={(e) => setForm({ ...form, jumlah_rusak: e.target.value })}
          className="px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
        />
        <input
          placeholder="Lokasi Simpan"
          value={form.lokasi_simpan}
          onChange={(e) =>
            setForm({ ...form, lokasi_simpan: e.target.value })
          }
          className="px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
        />
        <button
          type="submit"
          className="py-2.5 px-4 rounded-xl bg-[#D32F2F] text-white font-bold inline-flex items-center justify-center gap-1.5"
        >
          <Plus size={15} /> Tambah Alat
        </button>
      </form>
      <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
        {loading ? (
          <div className="py-10 text-center">
            <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={24} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-red-950/70 font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Nama Barang</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Baik</th>
                  <th className="px-4 py-3">Rusak</th>
                  <th className="px-4 py-3">Lokasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-red-900/40">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-mono font-bold">
                      {item.kode_barang}
                    </td>
                    <td className="px-4 py-3 font-bold">{item.nama_barang}</td>
                    <td className="px-4 py-3">{item.kategori}</td>
                    <td className="px-4 py-3 font-bold">{item.jumlah_total}</td>
                    <td className="px-4 py-3 text-emerald-600 font-bold">
                      {item.jumlah_baik}
                    </td>
                    <td className="px-4 py-3 text-rose-600 font-bold">
                      {item.jumlah_rusak}
                    </td>
                    <td className="px-4 py-3">{item.lokasi_simpan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}