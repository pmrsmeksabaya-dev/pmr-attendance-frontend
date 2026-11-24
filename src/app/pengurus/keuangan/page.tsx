'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Plus,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export default function PengurusKeuanganPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalMasuk: 0,
    totalKeluar: 0,
    saldo: 0,
  });
  const [loading, setLoading] = useState(true);
  const [jenis, setJenis] = useState<'MASUK' | 'KELUAR'>('MASUK');
  const [kategori, setKategori] = useState('Kas Rutin');
  const [keterangan, setKeterangan] = useState('');
  const [nominal, setNominal] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadKas = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: any[]; summary: any }>(
        '/api/pengurus/kas'
      );
      setRows(res.data || []);
      setSummary(res.summary || { totalMasuk: 0, totalKeluar: 0, saldo: 0 });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKas();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch('/api/pengurus/kas', {
        method: 'POST',
        body: JSON.stringify({
          jenis,
          kategori,
          keterangan,
          nominal: Number(nominal),
        }),
      });
      toast.success('Transaksi kas tercatat.');
      setKeterangan('');
      setNominal('');
      loadKas();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold">
          Kas &amp; Keuangan PMR
        </h1>
        <p className="text-xs text-slate-500 dark:text-red-200/75">
          Bendahara PMR — Pencatatan uang kas rutin, donasi, dan belanja
          operasional.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Pemasukan</span>
            <ArrowDownCircle size={18} className="text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 mt-2">
            {formatRp(summary.totalMasuk)}
          </p>
        </div>
        <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
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
      <form
        onSubmit={handleAdd}
        className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs"
      >
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
            <option value="Kas Rutin">Kas Rutin</option>
            <option value="Donasi / Dana Sekolah">Donasi / Dana Sekolah</option>
            <option value="Obat & P3K">Obat &amp; P3K</option>
            <option value="Perlengkapan">Perlengkapan</option>
            <option value="Konsumsi Kegiatan">Konsumsi Kegiatan</option>
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
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-red-900/40">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      {new Date(r.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          r.jenis === 'MASUK'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {r.jenis}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{r.kategori}</td>
                    <td className="px-4 py-3">{r.keterangan}</td>
                    <td
                      className={`px-4 py-3 text-right font-extrabold ${
                        r.jenis === 'MASUK'
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {r.jenis === 'MASUK' ? '+' : '-'} {formatRp(r.nominal)}
                    </td>
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