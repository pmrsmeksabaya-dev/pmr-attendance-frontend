'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api, AdminMember } from '@/lib/api';
import { extractJurusanFromKelas } from '@/lib/jurusan';

interface MemberFormModalProps {
  open: boolean;
  member: AdminMember | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function MemberFormModal({
  open,
  member,
  onClose,
  onSuccess,
}: MemberFormModalProps) {
  const isEdit = Boolean(member);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nis: '',
    nama: '',
    kelas: '',
    jurusan: '',
    jenis_kelamin: 'L' as 'L' | 'P',
    nomor_whatsapp: '',
    angkatan: String(new Date().getFullYear()),
    status_anggota: 'AKTIF' as 'AKTIF' | 'NONAKTIF' | 'ALUMNI',
  });

  useEffect(() => {
    if (member) {
      const currentStatus = member.status_anggota || 'AKTIF';
      const rawJurusan =
        member.jurusan && member.jurusan.trim() !== '' && member.jurusan.trim() !== '-'
          ? member.jurusan
          : member.kelas;
      const resolvedJurusan = extractJurusanFromKelas(rawJurusan);

      setForm({
        nis: member.nis || '',
        nama: member.nama || '',
        kelas: member.kelas || '',
        jurusan: resolvedJurusan,
        jenis_kelamin: member.jenis_kelamin === 'P' ? 'P' : 'L',
        nomor_whatsapp: member.nomor_whatsapp || '',
        angkatan: String(member.angkatan || new Date().getFullYear()),
        status_anggota:
          currentStatus === 'NONAKTIF' || currentStatus === 'ALUMNI'
            ? currentStatus
            : 'AKTIF',
      });
    } else {
      setForm({
        nis: '',
        nama: '',
        kelas: '',
        jurusan: '',
        jenis_kelamin: 'L',
        nomor_whatsapp: '',
        angkatan: String(new Date().getFullYear()),
        status_anggota: 'AKTIF',
      });
    }
  }, [member, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const rawJurusan = form.jurusan.trim() || form.kelas.trim();
    const finalJurusan = extractJurusanFromKelas(rawJurusan);

    try {
      if (isEdit && member) {
        await api.updateAdminMember(member.id, {
          nama: form.nama.trim(),
          kelas: form.kelas.trim(),
          jurusan: finalJurusan,
          jenis_kelamin: form.jenis_kelamin,
          nomor_whatsapp: form.nomor_whatsapp.trim(),
          angkatan: String(form.angkatan).trim(),
          status_anggota: form.status_anggota,
        });
        toast.success(`Data ${form.nama} berhasil diperbarui`);
      } else {
        await api.createAdminMember({
          nis: form.nis.trim(),
          nama: form.nama.trim(),
          kelas: form.kelas.trim(),
          jurusan: finalJurusan,
          jenis_kelamin: form.jenis_kelamin,
          nomor_whatsapp: form.nomor_whatsapp.trim(),
          angkatan: String(form.angkatan).trim(),
        });
        toast.success(`Anggota ${form.nama} berhasil ditambahkan`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data anggota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-xs"
        onClick={onClose}
      />

      <div className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-[#330C0F] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-red-900/60 overflow-hidden max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D32F2F] to-red-800 px-5 py-4 text-white flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-base">
              {isEdit ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
            </h2>
            <p className="text-[11px] text-white/80">
              {isEdit
                ? `NIS: ${member?.nis}`
                : 'Akun login & role anggota otomatis dibuat'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                NIS *
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                value={form.nis}
                onChange={(e) => setForm({ ...form, nis: e.target.value })}
                placeholder="Contoh: 241051"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                Angkatan *
              </label>
              <input
                type="text"
                required
                minLength={4}
                maxLength={4}
                value={form.angkatan}
                onChange={(e) => setForm({ ...form, angkatan: e.target.value })}
                placeholder="2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
              Nama Lengkap *
            </label>
            <input
              type="text"
              required
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Nama lengkap siswa"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                Kelas *
              </label>
              <input
                type="text"
                required
                value={form.kelas}
                onChange={(e) => {
                  const nextKelas = e.target.value;
                  setForm({
                    ...form,
                    kelas: nextKelas,
                    jurusan: extractJurusanFromKelas(nextKelas),
                  });
                }}
                placeholder="Contoh: XII TKJ 3"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                Jurusan (Otomatis) *
              </label>
              <input
                type="text"
                required
                value={form.jurusan}
                onChange={(e) => setForm({ ...form, jurusan: e.target.value })}
                placeholder="Contoh: TKJ / Tesha"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                No. WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={form.nomor_whatsapp}
                onChange={(e) =>
                  setForm({ ...form, nomor_whatsapp: e.target.value })
                }
                placeholder="628314xxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                Jenis Kelamin
              </label>
              <select
                value={form.jenis_kelamin}
                onChange={(e) =>
                  setForm({
                    ...form,
                    jenis_kelamin: e.target.value as 'L' | 'P',
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                Status Anggota
              </label>
              <select
                value={form.status_anggota}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status_anggota: e.target.value as
                      | 'AKTIF'
                      | 'NONAKTIF'
                      | 'ALUMNI',
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              >
                <option value="AKTIF">AKTIF</option>
                <option value="NONAKTIF">NONAKTIF</option>
                <option value="ALUMNI">ALUMNI</option>
              </select>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-red-200 hover:bg-slate-100 dark:hover:bg-red-950"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-red-600/20 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Anggota'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}