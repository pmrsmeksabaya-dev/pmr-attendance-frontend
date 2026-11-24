'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  UserX,
  RefreshCw,
  Loader2,
  Copy,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, AdminSession } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { ConfirmModal } from '@/components/admin/ConfirmModal';

export default function AdminSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Number(params.id);

  const currentUser = getUser();
  const isOwner = (currentUser?.role || '').toLowerCase() === 'owner';

  const [session, setSession] = useState<AdminSession | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [present, setPresent] = useState<any[]>([]);
  const [absent, setAbsent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminSessionDetail(sessionId);
      setSession(res.session);
      setQrToken(res.qr_token);
      setPresent(res.present);
      setAbsent(res.absent);
    } catch (e: any) {
      toast.error(e.message || 'Gagal memuat detail sesi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const confirmCloseSession = async () => {
    setClosing(true);
    try {
      await api.closeAdminSession(sessionId);
      toast.success('Sesi absensi berhasil ditutup');
      setCloseModalOpen(false);
      fetchDetail();
    } catch (e: any) {
      toast.error(e.message || 'Gagal menutup sesi');
    } finally {
      setClosing(false);
    }
  };

  const confirmDeleteSession = async () => {
    setDeleting(true);
    try {
      await api.deleteAdminSession(sessionId);
      toast.success('Sesi absensi berhasil dihapus');
      setDeleteModalOpen(false);
      router.replace('/admin/sessions');
    } catch (e: any) {
      toast.error(e.message || 'Gagal menghapus sesi');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={32} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-slate-500">Sesi tidak ditemukan.</p>
        <button
          type="button"
          onClick={() => router.push('/admin/sessions')}
          className="mt-3 text-xs font-bold text-[#D32F2F] underline"
        >
          Kembali ke daftar sesi
        </button>
      </div>
    );
  }

  const isOpen = session.status === 'OPEN';
  const scanUrl = qrToken
    ? `https://pmr-attendance.vercel.app/absensi/scan?token=${qrToken}`
    : '';

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/sessions"
            className="p-2.5 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200 dark:border-red-900/60 hover:border-[#D32F2F]"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {session.nama_kegiatan}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isOpen
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {session.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-red-200/75">
              {session.tanggal_kegiatan} • {session.waktu_mulai} WITA • {session.lokasi || '-'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchDetail}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200 dark:border-red-900/60 text-xs font-bold"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>

          {isOpen && (
            <button
              type="button"
              onClick={() => setCloseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20"
            >
              <Lock size={14} />
              <span>Tutup Sesi</span>
            </button>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              title="Hapus Sesi (Khusus Owner)"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-100/80 dark:bg-red-950 text-[#D32F2F] hover:bg-[#D32F2F] hover:text-white text-xs font-bold transition"
            >
              <Trash2 size={14} />
              <span>Hapus</span>
            </button>
          )}
        </div>
      </div>

      {/* QR Code Card saat Sesi Aktif */}
      {isOpen && qrToken && (
        <div className="bg-white dark:bg-[#330C0F] rounded-3xl p-6 border border-slate-200/80 dark:border-red-900/60 flex flex-col sm:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-2xl border-2 border-[#D32F2F] shrink-0">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                qrToken
              )}`}
              alt="QR Code Sesi Absensi"
              className="w-44 h-44 object-contain"
            />
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-red-50 text-[#D32F2F] text-[11px] font-extrabold">
              SCAN UNTUK ABSENSI
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Tampilkan QR Code ini kepada Anggota
            </h2>
            <p className="text-xs text-slate-500 dark:text-red-200/75 max-w-md">
              Anggota dapat membuka menu <b>Scan QR</b> di portal PMR Attendance untuk mencatat kehadiran secara otomatis.
            </p>
            <div className="pt-1 flex flex-wrap justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(scanUrl);
                  toast.success('Link scan disalin ke clipboard');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 text-[#D32F2F] text-xs font-bold hover:bg-red-100"
              >
                <Copy size={13} />
                <span>Salin Link Scan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dua Kolom: Hadir & Tidak Hadir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Daftar Hadir */}
        <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
          <div className="px-5 py-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-slate-100 dark:border-red-900/40 flex items-center justify-between">
            <span className="font-extrabold text-xs text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 size={15} /> Sudah Hadir ({present.length})
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-red-900/40 max-h-96 overflow-y-auto">
            {present.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">Belum ada yang absen.</p>
            ) : (
              present.map((r: any) => (
                <div key={r.id} className="px-5 py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{r.members?.nama}</p>
                    <p className="text-[11px] text-slate-500">
                      {r.members?.nis} • {r.members?.kelas}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        r.status_kehadiran === 'TERLAMBAT'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {r.status_kehadiran}
                    </span>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {new Date(r.waktu_absen).toLocaleTimeString('id-ID', {
                        timeZone: 'Asia/Makassar',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Daftar Tidak Hadir */}
        <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
          <div className="px-5 py-3.5 bg-red-50/70 dark:bg-red-950/50 border-b border-slate-100 dark:border-red-900/40 flex items-center justify-between">
            <span className="font-extrabold text-xs text-[#D32F2F] flex items-center gap-1.5">
              <UserX size={15} /> Belum / Tidak Hadir ({absent.length})
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-red-900/40 max-h-96 overflow-y-auto">
            {absent.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">Semua anggota aktif hadir!</p>
            ) : (
              absent.map((m: any) => (
                <div key={m.id} className="px-5 py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{m.nama}</p>
                    <p className="text-[11px] text-slate-500">
                      {m.nis} • {m.kelas}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-red-50 text-[#D32F2F] text-[10px] font-bold">
                    ALPA / BELUM
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Tutup Sesi */}
      <ConfirmModal
        open={closeModalOpen}
        title="Tutup Sesi Absensi Sekarang?"
        detailBadge={`#${session.id} • ${session.nama_kegiatan}`}
        description="Setelah sesi ditutup, token QR akan dinonaktifkan dan anggota tidak dapat melakukan scan absensi lagi pada kegiatan ini."
        confirmText="Ya, Tutup Sesi"
        loading={closing}
        onConfirm={confirmCloseSession}
        onClose={() => setCloseModalOpen(false)}
      />

      {/* Modal Konfirmasi Hapus Sesi (Khusus Owner) */}
      <ConfirmModal
        open={deleteModalOpen}
        title="Hapus Sesi Absensi Permanen?"
        detailBadge={`#${session.id} • ${session.nama_kegiatan} (${session.tanggal_kegiatan})`}
        description="Tindakan ini tidak dapat dibatalkan. Seluruh riwayat kehadiran anggota dan token QR yang terhubung dengan sesi ini akan ikut terhapus permanen."
        confirmText="Ya, Hapus Sesi"
        loading={deleting}
        onConfirm={confirmDeleteSession}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}