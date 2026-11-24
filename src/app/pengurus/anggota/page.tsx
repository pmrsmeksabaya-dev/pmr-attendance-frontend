'use client';

import { useEffect, useState } from 'react';
import { Search, Edit3, X, Save, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface MemberFull {
  id: number;
  nis: string;
  nisn: string | null;
  nama: string;
  kelas: string;
  jenis_kelamin: 'L' | 'P';
  nomor_whatsapp: string;
  angkatan: string;
  tempat_lahir: string | null;
  tanggal_lahir: string | null;
  email: string | null;
  nama_orang_tua: string | null;
  no_orang_tua: string | null;
  status_anggota: string;
  golongan_darah: string | null;
  tingkatan_pmr: string | null;
  alergi: string | null;
  persetujuan_orang_tua: boolean;
}

export default function PengurusAnggotaPage() {
  const [members, setMembers] = useState<MemberFull[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MemberFull | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async (q = '') => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: MemberFull[] }>(
        `/api/pengurus/members${q ? `?search=${encodeURIComponent(q)}` : ''}`
      );
      setMembers(res.data || []);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat biodata anggota');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await apiFetch(`/api/pengurus/members/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editing),
      });
      toast.success(`Biodata ${editing.nama} diperbarui.`);
      setEditing(null);
      loadData(search);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold">
            Buku Induk Anggota PMR
          </h1>
          <p className="text-xs text-slate-500 dark:text-red-200/75">
            Sekretaris &amp; Divisi Keanggotaan — Biodata lengkap, kesehatan,
            dan izin orang tua.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadData(search);
          }}
          className="relative w-full sm:w-72"
        >
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari NIS, NISN, Nama, Kelas..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200 dark:border-red-900/70 text-xs focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
          />
        </form>
      </div>
      <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={26} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-red-950/70 text-slate-600 dark:text-red-200/80 font-extrabold">
                <tr>
                  <th className="px-3 py-3">Aksi</th>
                  <th className="px-3 py-3">NIS / NISN</th>
                  <th className="px-3 py-3">Nama Lengkap</th>
                  <th className="px-3 py-3">Kelas</th>
                  <th className="px-3 py-3">L/P</th>
                  <th className="px-3 py-3">No. WA</th>
                  <th className="px-3 py-3">Angkatan</th>
                  <th className="px-3 py-3">TTL</th>
                  <th className="px-3 py-3">Email Aktif</th>
                  <th className="px-3 py-3">Orang Tua &amp; No. HP</th>
                  <th className="px-3 py-3">Goldar</th>
                  <th className="px-3 py-3">Tingkatan</th>
                  <th className="px-3 py-3">Alergi</th>
                  <th className="px-3 py-3">Izin Ortu</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-red-900/40">
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-red-950/30"
                  >
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setEditing(m)}
                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-[#D32F2F] hover:bg-[#D32F2F] hover:text-white transition"
                      >
                        <Edit3 size={13} />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 font-mono">
                      <div className="font-bold">{m.nis}</div>
                      <div className="text-[10px] text-slate-400">
                        {m.nisn || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-bold">{m.nama}</td>
                    <td className="px-3 py-2.5">{m.kelas}</td>
                    <td className="px-3 py-2.5 font-bold">{m.jenis_kelamin}</td>
                    <td className="px-3 py-2.5 font-mono">{m.nomor_whatsapp}</td>
                    <td className="px-3 py-2.5">{m.angkatan}</td>
                    <td className="px-3 py-2.5">
                      {m.tempat_lahir || '-'},{' '}
                      {m.tanggal_lahir
                        ? new Date(m.tanggal_lahir).toLocaleDateString('id-ID')
                        : '-'}
                    </td>
                    <td className="px-3 py-2.5">{m.email || '-'}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold">
                        {m.nama_orang_tua || '-'}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400">
                        {m.no_orang_tua || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-extrabold text-[#D32F2F]">
                      {m.golongan_darah || '-'}
                    </td>
                    <td className="px-3 py-2.5">{m.tingkatan_pmr || 'Wira'}</td>
                    <td className="px-3 py-2.5">
                      {m.alergi ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
                          <AlertTriangle size={11} /> {m.alergi}
                        </span>
                      ) : (
                        <span className="text-slate-400">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                          m.persetujuan_orang_tua
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {m.persetujuan_orang_tua ? 'Ya' : 'Tidak'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                          m.status_anggota === 'AKTIF'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {m.status_anggota}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#2A090C] rounded-3xl p-6 space-y-4 border border-slate-200 dark:border-red-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-red-900/60 pb-3">
              <h2 className="font-extrabold text-base">
                Edit Biodata: {editing.nama}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-red-950"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold block mb-1">NIS</label>
                <input
                  value={editing.nis || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, nis: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">NISN</label>
                <input
                  value={editing.nisn || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, nisn: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Nama Lengkap</label>
                <input
                  value={editing.nama || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, nama: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Kelas</label>
                <input
                  value={editing.kelas || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, kelas: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Jenis Kelamin</label>
                <select
                  value={editing.jenis_kelamin}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      jenis_kelamin: e.target.value as 'L' | 'P',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">No. WhatsApp</label>
                <input
                  value={editing.nomor_whatsapp || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, nomor_whatsapp: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Angkatan</label>
                <input
                  value={editing.angkatan || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, angkatan: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Email Aktif</label>
                <input
                  type="email"
                  value={editing.email || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, email: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Tempat Lahir</label>
                <input
                  value={editing.tempat_lahir || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, tempat_lahir: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Tanggal Lahir</label>
                <input
                  type="date"
                  value={editing.tanggal_lahir || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, tanggal_lahir: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Nama Orang Tua</label>
                <input
                  value={editing.nama_orang_tua || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, nama_orang_tua: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">No. HP Orang Tua</label>
                <input
                  value={editing.no_orang_tua || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, no_orang_tua: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">Golongan Darah</label>
                <select
                  value={editing.golongan_darah || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, golongan_darah: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                >
                  <option value="">Belum diketahui</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Tingkatan PMR</label>
                <select
                  value={editing.tingkatan_pmr || 'Wira'}
                  onChange={(e) =>
                    setEditing({ ...editing, tingkatan_pmr: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                >
                  <option value="Mula">PMR Mula</option>
                  <option value="Madya">PMR Madya</option>
                  <option value="Wira">PMR Wira</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Riwayat Alergi</label>
                <input
                  value={editing.alergi || ''}
                  onChange={(e) =>
                    setEditing({ ...editing, alergi: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                />
              </div>
              <div>
                <label className="font-bold block mb-1">
                  Persetujuan Orang Tua
                </label>
                <select
                  value={editing.persetujuan_orang_tua ? 'YA' : 'TIDAK'}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      persetujuan_orang_tua: e.target.value === 'YA',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                >
                  <option value="YA">Ya (Disetujui)</option>
                  <option value="TIDAK">Tidak / Belum Ada</option>
                </select>
              </div>
              <div>
                <label className="font-bold block mb-1">Status Anggota</label>
                <select
                  value={editing.status_anggota || 'AKTIF'}
                  onChange={(e) =>
                    setEditing({ ...editing, status_anggota: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border bg-slate-50 dark:bg-red-950/50 dark:border-red-900"
                >
                  <option value="AKTIF">AKTIF</option>
                  <option value="NONAKTIF">NONAKTIF</option>
                  <option value="ALUMNI">ALUMNI</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-red-900/60">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-red-950"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#D32F2F] text-white inline-flex items-center gap-1.5"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                <span>Simpan Biodata</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}