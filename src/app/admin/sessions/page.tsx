'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Calendar,
  Clock,
  MapPin,
  Users,
  Eye,
  X,
  Loader2,
  QrCode,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, AdminSession } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { ConfirmModal } from '@/components/admin/ConfirmModal';

export default function AdminSessionsPage() {
  const currentUser = getUser();
  const isOwner = (currentUser?.role || '').toLowerCase() === 'owner';

  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [sessionToDelete, setSessionToDelete] = useState<AdminSession | null>(null);
  const [deleting, setDeleting] = useState(false);

  const todayWita = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
  }).format(new Date());

  const [form, setForm] = useState({
    nama_kegiatan: '',
    tanggal_kegiatan: todayWita,
    waktu_mulai: '15:00',
    lokasi: 'Lapangan SMKN 1 Pringgabaya',
    batas_terlambat_menit: 15,
  });

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminSessions();
      setSessions(res.data);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat daftar sesi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createAdminSession(form);
      toast.success('Sesi absensi baru berhasil dibuat!');
      setCreateOpen(false);
      setForm({ ...form, nama_kegiatan: '' });
      loadSessions();
    } catch (err: any) {
      toast.error(err.message || 'Gagal membuat sesi');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;

    setDeleting(true);
    try {
      await api.deleteAdminSession(sessionToDelete.id);
      toast.success(`Sesi "${sessionToDelete.nama_kegiatan}" berhasil dihapus`);
      setSessions((prev) => prev.filter((item) => item.id !== sessionToDelete.id));
      setSessionToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus sesi');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Sesi Absensi Kegiatan
          </h1>
          <p className="text-xs text-slate-500 dark:text-red-200/75 mt-0.5">
            Kelola jadwal latihan/kegiatan, tampilkan QR Code, dan pantau kehadiran langsung.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-red-600/20 transition"
        >
          <PlusCircle size={16} />
          <span>Buat Sesi Baru</span>
        </button>
      </div>

      {/* Grid Cards Sesi */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={28} />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white dark:bg-[#330C0F] rounded-2xl p-10 text-center border border-slate-200 dark:border-red-900/60 text-sm text-slate-500">
          Belum ada sesi absensi. Klik <b>Buat Sesi Baru</b> untuk memulai.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((s) => {
            const isOpen = s.status === 'OPEN';
            return (
              <div
                key={s.id}
                className="bg-white dark:bg-[#330C0F] rounded-2xl p-5 border border-slate-200/80 dark:border-red-900/60 shadow-2xs flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      #{s.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isOpen
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isOpen ? '● AKTIF (OPEN)' : 'DITUTUP'}
                    </span>
                  </div>

                  <h2 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-2">
                    {s.nama_kegiatan}
                  </h2>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-red-200/80">
                    <p className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#D32F2F] shrink-0" />
                      <span>{s.tanggal_kegiatan}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock size={14} className="text-[#D32F2F] shrink-0" />
                      <span>Mulai {s.waktu_mulai} WITA</span>
                    </p>
                    {s.lokasi && (
                      <p className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#D32F2F] shrink-0" />
                        <span className="truncate">{s.lokasi}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-red-900/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-red-100">
                    <Users size={15} className="text-[#D32F2F]" />
                    <span>{s.jumlah_hadir ?? 0} Hadir</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/sessions/${s.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/80 text-[#D32F2F] dark:text-red-200 hover:bg-[#D32F2F] hover:text-white font-bold text-xs transition"
                    >
                      {isOpen ? <QrCode size={14} /> : <Eye size={14} />}
                      <span>{isOpen ? 'QR & Detail' : 'Lihat Rekap'}</span>
                    </Link>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setSessionToDelete(s)}
                        title="Hapus Sesi (Khusus Owner)"
                        className="p-2 rounded-xl bg-red-100/80 dark:bg-red-950 text-[#D32F2F] hover:bg-[#D32F2F] hover:text-white transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Konfirmasi Hapus Sesi */}
      <ConfirmModal
        open={Boolean(sessionToDelete)}
        title="Hapus Sesi Absensi Permanen?"
        detailBadge={
          sessionToDelete
            ? `#${sessionToDelete.id} • ${sessionToDelete.nama_kegiatan} (${sessionToDelete.tanggal_kegiatan})`
            : undefined
        }
        description="Tindakan ini tidak dapat dibatalkan. Seluruh riwayat kehadiran anggota dan token QR yang terhubung dengan sesi ini akan ikut terhapus permanen."
        confirmText="Ya, Hapus Sesi"
        loading={deleting}
        onConfirm={confirmDeleteSession}
        onClose={() => setSessionToDelete(null)}
      />

      {/* Modal Buat Sesi Baru */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-xs"
            onClick={() => setCreateOpen(false)}
          />
          <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-[#330C0F] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-red-900/60 overflow-hidden">
            <div className="bg-gradient-to-r from-[#D32F2F] to-red-800 px-5 py-4 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-base">Buat Sesi Absensi Baru</h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold mb-1">Nama Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={form.nama_kegiatan}
                  onChange={(e) => setForm({ ...form, nama_kegiatan: e.target.value })}
                  placeholder="Contoh: Latihan Rutin Pertolongan Pertama"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={form.tanggal_kegiatan}
                    onChange={(e) => setForm({ ...form, tanggal_kegiatan: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Jam Mulai *</label>
                  <input
                    type="time"
                    required
                    value={form.waktu_mulai}
                    onChange={(e) => setForm({ ...form, waktu_mulai: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">Lokasi</label>
                <input
                  type="text"
                  value={form.lokasi}
                  onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  <span>Buka Sesi Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}