'use client';

import { useEffect, useId, useState } from 'react';
import { X, Loader2, Save, Phone, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api, AdminMember } from '@/lib/api';
import {
  JURUSAN_OPTIONS,
  extractJurusanFromKelas,
  formatKelasJurusan,
} from '@/lib/jurusan';

interface MemberFormModalProps {
  open: boolean;
  member: AdminMember | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Menormalkan nomor WhatsApp ke format internasional tanpa tanda '+' (628xxxx)
 * agar sinkron dengan format JID WhatsApp Bot PMR.
 */
function normalizeWhatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith('8')) {
    return `62${digits}`;
  }
  return digits;
}

export function MemberFormModal({
  open,
  member,
  onClose,
  onSuccess,
}: MemberFormModalProps) {
  const isEdit = Boolean(member);
  const titleId = useId();
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
        member.jurusan &&
        member.jurusan.trim() !== '' &&
        member.jurusan.trim() !== '-'
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

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  const normalizedWaPreview = normalizeWhatsappNumber(form.nomor_whatsapp);
  const hasCustomJurusan =
    Boolean(form.jurusan) &&
    !JURUSAN_OPTIONS.some((opt) => opt.value === form.jurusan);

  const kelasJurusanPreview =
    form.kelas.trim() !== ''
      ? formatKelasJurusan(form.kelas.trim().toUpperCase(), form.jurusan)
      : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanWa = normalizeWhatsappNumber(form.nomor_whatsapp);
    if (cleanWa.length < 10 || cleanWa.length > 15) {
      toast.error(
        'Nomor WhatsApp tidak valid (gunakan 10–15 digit, misal 628314...)'
      );
      return;
    }

    setLoading(true);
    const cleanKelas = form.kelas.trim().toUpperCase();
    const rawJurusan = form.jurusan.trim() || cleanKelas;
    const finalJurusan = extractJurusanFromKelas(rawJurusan);

    try {
      if (isEdit && member) {
        await api.updateAdminMember(member.id, {
          nama: form.nama.trim(),
          kelas: cleanKelas,
          jurusan: finalJurusan,
          jenis_kelamin: form.jenis_kelamin,
          nomor_whatsapp: cleanWa,
          angkatan: String(form.angkatan).trim(),
          status_anggota: form.status_anggota,
        });
        toast.success(`Data ${form.nama.trim()} berhasil diperbarui`);
      } else {
        await api.createAdminMember({
          nis: form.nis.trim(),
          nama: form.nama.trim(),
          kelas: cleanKelas,
          jurusan: finalJurusan,
          jenis_kelamin: form.jenis_kelamin,
          nomor_whatsapp: cleanWa,
          angkatan: String(form.angkatan).trim(),
        });
        toast.success(`Anggota ${form.nama.trim()} berhasil ditambahkan`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan data anggota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-[#330C0F] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-red-900/60 overflow-hidden max-h-[92dvh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D32F2F] to-red-800 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 id={titleId} className="font-extrabold text-base">
              {isEdit ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
            </h2>
            <p className="text-[11px] text-white/85">
              {isEdit
                ? `NIS: ${member?.nis}`
                : 'Akun login & role anggota otomatis dibuat'}
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label="Tutup form anggota"
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-40 transition"
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
                inputMode="numeric"
                required
                disabled={isEdit || loading}
                value={form.nis}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nis: e.target.value.replace(/[^a-zA-Z0-9.-]/g, ''),
                  })
                }
                placeholder="Contoh: 241051"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm font-mono text-slate-900 dark:text-white disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                Angkatan *
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                disabled={loading}
                minLength={4}
                maxLength={4}
                value={form.angkatan}
                onChange={(e) =>
                  setForm({
                    ...form,
                    angkatan: e.target.value.replace(/\D/g, ''),
                  })
                }
                placeholder="2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
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
              disabled={loading}
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Nama lengkap siswa"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
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
                disabled={loading}
                value={form.kelas}
                onChange={(e) => {
                  const nextKelas = e.target.value;
                  const detected = extractJurusanFromKelas(nextKelas);
                  const isKnownJurusan = JURUSAN_OPTIONS.some(
                    (opt) => opt.value === detected
                  );

                  setForm((prev) => ({
                    ...prev,
                    kelas: nextKelas,
                    jurusan:
                      nextKelas.trim() === ''
                        ? ''
                        : isKnownJurusan
                          ? detected
                          : prev.jurusan,
                  }));
                }}
                placeholder="Contoh: XII-RPL 2"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                <span>Jurusan *</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#D32F2F] dark:text-red-300">
                  <Sparkles size={10} /> Otomatis
                </span>
              </label>
              <select
                required
                disabled={loading}
                value={form.jurusan}
                onChange={(e) => setForm({ ...form, jurusan: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              >
                <option value="">-- Pilih Jurusan --</option>
                {hasCustomJurusan && (
                  <option value={form.jurusan}>{form.jurusan}</option>
                )}
                {JURUSAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {kelasJurusanPreview && (
            <p className="text-[11px] text-slate-500 dark:text-red-200/75 -mt-1.5">
              Tampilan profil:{' '}
              <span className="font-semibold text-slate-800 dark:text-white">
                {kelasJurusanPreview}
              </span>
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                <Phone size={11} className="text-[#D32F2F]" />
                <span>No. WhatsApp *</span>
              </label>
              <input
                type="tel"
                required
                disabled={loading}
                value={form.nomor_whatsapp}
                onChange={(e) =>
                  setForm({ ...form, nomor_whatsapp: e.target.value })
                }
                placeholder="08314xxxxxxx / 628314..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              />
              {form.nomor_whatsapp.trim() !== '' &&
                normalizedWaPreview !== form.nomor_whatsapp.trim() && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                    Disimpan sebagai: {normalizedWaPreview}
                  </p>
                )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                Jenis Kelamin
              </label>
              <select
                disabled={loading}
                value={form.jenis_kelamin}
                onChange={(e) =>
                  setForm({
                    ...form,
                    jenis_kelamin: e.target.value as 'L' | 'P',
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
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
                disabled={loading}
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
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
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-red-200 hover:bg-slate-100 dark:hover:bg-red-950 disabled:opacity-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-red-600/20 disabled:opacity-50 transition"
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