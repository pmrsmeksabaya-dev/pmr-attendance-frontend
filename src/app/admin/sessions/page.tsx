'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  RefreshCw,
  Search,
  RotateCcw,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, AdminSession, ApiError } from '@/lib/api';
import { getUser, clearSession } from '@/lib/auth';
import { formatWitaDate } from '@/lib/time-client';
import { ConfirmModal } from '@/components/admin/ConfirmModal';

type SessionFilterStatus = 'ALL' | 'OPEN' | 'CLOSED';

function getTodayWita(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
  }).format(new Date());
}

export default function AdminSessionsPage() {
  const router = useRouter();
  const currentUser = getUser();
  const isOwner = (currentUser?.role || '').toLowerCase() === 'owner';

  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SessionFilterStatus>('ALL');

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [sessionToDelete, setSessionToDelete] = useState<AdminSession | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    nama_kegiatan: '',
    tanggal_kegiatan: getTodayWita(),
    waktu_mulai: '15:00',
    lokasi: 'Lapangan SMKN 1 Pringgabaya',
    batas_terlambat_menit: 15,
  });

  const handleUnauthorized = useCallback(
    (err: unknown): boolean => {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        toast.error('Sesi admin telah berakhir, silakan login kembali.');
        router.replace('/admin/login');
        return true;
      }
      return false;
    },
    [router]
  );

  const loadSessions = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await api.getAdminSessions();
        setSessions(res.data || []);
      } catch (e: any) {
        if (handleUnauthorized(e)) return;
        toast.error(e?.message || 'Gagal memuat daftar sesi');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [handleUnauthorized]
  );

  useEffect(() => {
    loadSessions(false);
  }, [loadSessions]);

  const stats = useMemo(() => {
    let openCount = 0;
    let closedCount = 0;

    sessions.forEach((s) => {
      if ((s.status || '').toUpperCase() === 'OPEN') {
        openCount += 1;
      } else {
        closedCount += 1;
      }
    });

    return {
      total: sessions.length,
      openCount,
      closedCount,
    };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sessions.filter((s) => {
      const isOpen = (s.status || '').toUpperCase() === 'OPEN';
      if (statusFilter === 'OPEN' && !isOpen) return false;
      if (statusFilter === 'CLOSED' && isOpen) return false;

      if (!q) return true;
      const nama = (s.nama_kegiatan || '').toLowerCase();
      const lokasi = (s.lokasi || '').toLowerCase();
      const idStr = `#${s.id}`;
      return nama.includes(q) || lokasi.includes(q) || idStr.includes(q);
    });
  }, [sessions, search, statusFilter]);

  const handleOpenCreateModal = () => {
    setForm((prev) => ({
      ...prev,
      tanggal_kegiatan: getTodayWita(),
    }));
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_kegiatan.trim()) {
      toast.error('Nama kegiatan wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createAdminSession({
        ...form,
        nama_kegiatan: form.nama_kegiatan.trim(),
        lokasi: form.lokasi.trim(),
        batas_terlambat_menit: Math.max(0, Number(form.batas_terlambat_menit) || 0),
      });

      toast.success('Sesi absensi baru berhasil dibuka!');
      setCreateOpen(false);
      setForm((prev) => ({
        ...prev,
        nama_kegiatan: '',
        tanggal_kegiatan: getTodayWita(),
      }));

      const raw = res as any;
      const createdId = raw?.data?.id ?? raw?.session?.id ?? raw?.id;
      if (createdId) {
        router.push(`/admin/sessions/${createdId}`);
        return;
      }

      loadSessions(true);
    } catch (err: any) {
      if (!handleUnauthorized(err)) {
        toast.error(err?.message || 'Gagal membuat sesi');
      }
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
      setSessions((prev) =>
        prev.filter((item) => item.id !== sessionToDelete.id)
      );
      setSessionToDelete(null);
    } catch (err: any) {
      if (!handleUnauthorized(err)) {
        toast.error(err?.message || 'Gagal menghapus sesi');
      }
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(search.trim() || statusFilter !== 'ALL');

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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading || refreshing}
            onClick={() => loadSessions(true)}
            title="Muat ulang daftar sesi"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200 dark:border-red-900/60 text-xs font-bold text-slate-700 dark:text-red-100 hover:border-[#D32F2F] disabled:opacity-50 transition"
          >
            <RefreshCw
              size={14}
              className={loading || refreshing ? 'animate-spin' : ''}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 bg-[#D32F2F] hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md shadow-red-600/20 transition"
          >
            <PlusCircle size={16} />
            <span>Buat Sesi Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Status & Pencarian */}
      <div className="bg-white dark:bg-[#330C0F] p-3.5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'ALL' as const, label: 'Semua Sesi', count: stats.total },
            { key: 'OPEN' as const, label: 'Aktif (OPEN)', count: stats.openCount },
            { key: 'CLOSED' as const, label: 'Ditutup', count: stats.closedCount },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  active
                    ? 'bg-[#D32F2F] text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-red-950/60 text-slate-600 dark:text-red-200/80 hover:bg-red-50 dark:hover:bg-red-950'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/80 dark:bg-red-900/70 text-slate-700 dark:text-red-200'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kegiatan atau lokasi..."
            className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-red-200"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Grid Cards Sesi */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={28} />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-[#330C0F] rounded-2xl p-10 text-center border border-slate-200 dark:border-red-900/60 text-sm text-slate-500 dark:text-red-200/70 space-y-2">
          {sessions.length === 0 ? (
            <p>
              Belum ada sesi absensi. Klik <b>Buat Sesi Baru</b> untuk memulai.
            </p>
          ) : (
            <>
              <p>Tidak ada sesi absensi yang cocok dengan filter aktif.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#D32F2F] dark:text-red-300 hover:underline"
                >
                  <RotateCcw size={12} />
                  <span>Reset Filter</span>
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((s) => {
            const isOpen = (s.status || '').toUpperCase() === 'OPEN';
            return (
              <div
                key={s.id}
                className={`bg-white dark:bg-[#330C0F] rounded-2xl p-5 border shadow-2xs flex flex-col justify-between gap-4 transition-colors ${
                  isOpen
                    ? 'border-emerald-200/90 dark:border-emerald-800/60'
                    : 'border-slate-200/80 dark:border-red-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-red-200/55">
                      #{s.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isOpen
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-red-950/80 dark:text-red-200/75 dark:border-red-900/60'
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
                      <span>{formatWitaDate(s.tanggal_kegiatan)}</span>
                    </p>
                    {s.waktu_mulai && (
                      <p className="flex items-center gap-2">
                        <Clock size={14} className="text-[#D32F2F] shrink-0" />
                        <span>Mulai {s.waktu_mulai.slice(0, 5)} WITA</span>
                      </p>
                    )}
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
                        className="p-2 rounded-xl bg-red-100/80 dark:bg-red-950 text-[#D32F2F] dark:text-red-300 hover:bg-[#D32F2F] hover:text-white transition"
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
            onClick={() => !submitting && setCreateOpen(false)}
          />
          <div className="relative z-10 w-full sm:max-w-md bg-white dark:bg-[#330C0F] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-red-900/60 overflow-hidden">
            <div className="bg-gradient-to-r from-[#D32F2F] to-red-800 px-5 py-4 text-white flex items-center justify-between">
              <h2 className="font-extrabold text-base">Buat Sesi Absensi Baru</h2>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setCreateOpen(false)}
                aria-label="Tutup modal"
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                  Nama Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  value={form.nama_kegiatan}
                  onChange={(e) =>
                    setForm({ ...form, nama_kegiatan: e.target.value })
                  }
                  placeholder="Contoh: Latihan Rutin Pertolongan Pertama"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.tanggal_kegiatan}
                    onChange={(e) =>
                      setForm({ ...form, tanggal_kegiatan: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                    Jam Mulai (WITA) *
                  </label>
                  <input
                    type="time"
                    required
                    value={form.waktu_mulai}
                    onChange={(e) =>
                      setForm({ ...form, waktu_mulai: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    value={form.lokasi}
                    onChange={(e) =>
                      setForm({ ...form, lokasi: e.target.value })
                    }
                    placeholder="Lapangan SMKN 1 Pringgabaya"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-red-100 mb-1">
                    <Timer size={12} className="text-[#D32F2F]" />
                    <span>Toleransi (Mnt)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={180}
                    value={form.batas_terlambat_menit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        batas_terlambat_menit: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-red-200/70 hover:bg-slate-100 dark:hover:bg-red-950 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-red-600/20 transition"
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