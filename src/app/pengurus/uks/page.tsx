'use client';

import { useEffect, useState } from 'react';
import { HeartPulse, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

export default function PengurusUksPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nama_pasien: '',
    kelas_pasien: '',
    keluhan: '',
    tindakan: '',
    obat_diberikan: '',
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: any[] }>('/api/pengurus/uks');
      setLogs(res.data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/pengurus/uks', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast.success('Catatan pelayanan UKS disimpan.');
      setForm({
        nama_pasien: '',
        kelas_pasien: '',
        keluhan: '',
        tindakan: '',
        obat_diberikan: '',
      });
      loadLogs();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
          <HeartPulse className="text-[#D32F2F]" /> Log Pelayanan UKS &amp; P3K
        </h1>
        <p className="text-xs text-slate-500 dark:text-red-200/75">
          Divisi UKS — Pencatatan penanganan pasien siswa di ruang UKS maupun
          piket upacara.
        </p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
      >
        <input
          required
          placeholder="Nama Siswa / Pasien"
          value={form.nama_pasien}
          onChange={(e) => setForm({ ...form, nama_pasien: e.target.value })}
          className="px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
        />
        <input
          required
          placeholder="Kelas (misal: XI TKJ 1)"
          value={form.kelas_pasien}
          onChange={(e) => setForm({ ...form, kelas_pasien: e.target.value })}
          className="px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
        />
        <input
          required
          placeholder="Keluhan (misal: Pusing, Luka lecet)"
          value={form.keluhan}
          onChange={(e) => setForm({ ...form, keluhan: e.target.value })}
          className="px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
        />
        <input
          required
          placeholder="Tindakan Pertolongan"
          value={form.tindakan}
          onChange={(e) => setForm({ ...form, tindakan: e.target.value })}
          className="px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
        />
        <input
          placeholder="Obat / Alat yang digunakan"
          value={form.obat_diberikan}
          onChange={(e) =>
            setForm({ ...form, obat_diberikan: e.target.value })
          }
          className="px-3 py-2.5 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
        />
        <button
          type="submit"
          className="py-2.5 px-4 rounded-xl bg-[#D32F2F] text-white font-bold inline-flex items-center justify-center gap-1.5"
        >
          <Plus size={15} /> Simpan Log UKS
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
                  <th className="px-4 py-3">Nama Pasien</th>
                  <th className="px-4 py-3">Kelas</th>
                  <th className="px-4 py-3">Keluhan</th>
                  <th className="px-4 py-3">Tindakan</th>
                  <th className="px-4 py-3">Obat / P3K</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-red-900/40">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-3">
                      {new Date(l.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 font-bold">{l.nama_pasien}</td>
                    <td className="px-4 py-3">{l.kelas_pasien}</td>
                    <td className="px-4 py-3">{l.keluhan}</td>
                    <td className="px-4 py-3">{l.tindakan}</td>
                    <td className="px-4 py-3">{l.obat_diberikan || '-'}</td>
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