'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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
  Check,
  Trash2,
  Maximize2,
  X,
  Search,
  Download,
  Calendar,
  Clock,
  MapPin,
  QrCode,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { api, AdminSession, ApiError } from '@/lib/api';
import { getUser, clearSession } from '@/lib/auth';
import { formatWitaDate, formatWitaTime } from '@/lib/time-client';
import { STATUS_COLORS, StatusKehadiran } from '@/lib/constants';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { OrgLogos } from '@/components/OrgLogos';

interface PresentRow {
  id: string | number;
  waktu_absen?: string | null;
  status_kehadiran?: string | null;
  keterangan?: string | null;
  members?: {
    id?: string | number;
    nis?: string;
    nama?: string;
    kelas?: string;
    jurusan?: string;
  } | null;
}

interface AbsentMemberRow {
  id: string | number;
  nis?: string;
  nama?: string;
  kelas?: string;
  jurusan?: string;
  status_kehadiran?: string | null;
}

export default function AdminSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Number(params.id);

  const currentUser = getUser();
  const isOwner = (currentUser?.role || '').toLowerCase() === 'owner';

  const [session, setSession] = useState<AdminSession | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [present, setPresent] = useState<PresentRow[]>([]);
  const [absent, setAbsent] = useState<AbsentMemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [memberSearch, setMemberSearch] = useState('');
  const [copiedType, setCopiedType] = useState<'url' | 'token' | null>(null);
  const [qrFullscreen, setQrFullscreen] = useState(false);

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const fetchDetail = useCallback(
    async (silent = false) => {
      if (!sessionId || Number.isNaN(sessionId)) {
        setLoading(false);
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await api.getAdminSessionDetail(sessionId);
        setSession(res.session);
        setQrToken(res.qr_token);
        setPresent((res.present || []) as PresentRow[]);
        setAbsent((res.absent || []) as AbsentMemberRow[]);
      } catch (e: any) {
        if (handleUnauthorized(e)) return;
        toast.error(e?.message || 'Gagal memuat detail sesi');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [sessionId, handleUnauthorized]
  );

  useEffect(() => {
    fetchDetail(false);
  }, [fetchDetail]);

  const confirmCloseSession = async () => {
    setClosing(true);
    try {
      await api.closeAdminSession(sessionId);
      toast.success('Sesi absensi berhasil ditutup');
      setCloseModalOpen(false);
      setQrFullscreen(false);
      fetchDetail(true);
    } catch (e: any) {
      if (!handleUnauthorized(e)) {
        toast.error(e?.message || 'Gagal menutup sesi');
      }
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
      if (!handleUnauthorized(e)) {
        toast.error(e?.message || 'Gagal menghapus sesi');
      }
      setDeleting(false);
    }
  };

  const filteredPresent = useMemo(() => {
    const q = memberSearch.toLowerCase().trim();
    if (!q) return present;
    return present.filter((r) => {
      const nama = (r.members?.nama || '').toLowerCase();
      const nis = (r.members?.nis || '').toLowerCase();
      const kelas = (r.members?.kelas || '').toLowerCase();
      return nama.includes(q) || nis.includes(q) || kelas.includes(q);
    });
  }, [present, memberSearch]);

  const filteredAbsent = useMemo(() => {
    const q = memberSearch.toLowerCase().trim();
    if (!q) return absent;
    return absent.filter((m) => {
      const nama = (m.nama || '').toLowerCase();
      const nis = (m.nis || '').toLowerCase();
      const kelas = (m.kelas || '').toLowerCase();
      return nama.includes(q) || nis.includes(q) || kelas.includes(q);
    });
  }, [absent, memberSearch]);

  const stats = useMemo(() => {
    const totalMembers = present.length + absent.length;
    const lateCount = present.filter(
      (r) => (r.status_kehadiran || '').toUpperCase() === 'TERLAMBAT'
    ).length;
    const onTimeCount = present.length - lateCount;
    const rate =
      totalMembers > 0 ? Math.round((present.length / totalMembers) * 100) : 0;

    return {
      totalMembers,
      onTimeCount,
      lateCount,
      rate,
    };
  }, [present, absent]);

  const handleCopy = async (text: string, type: 'url' | 'token') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      toast.success(
        type === 'url'
          ? 'Link scan disalin ke clipboard'
          : 'Token QR disalin ke clipboard'
      );
      setTimeout(() => setCopiedType(null), 2200);
    } catch {
      toast.error('Gagal menyalin ke clipboard');
    }
  };

  const handleExportSessionExcel = () => {
    if (!session) return;
    if (present.length === 0 && absent.length === 0) {
      toast.error('Belum ada data anggota pada sesi ini.');
      return;
    }

    const rows: Record<string, string | number>[] = [];
    let no = 1;

    present.forEach((r) => {
      rows.push({
        No: no++,
        NIS: r.members?.nis || '-',
        'Nama Anggota': r.members?.nama || '-',
        Kelas: r.members?.kelas || '-',
        'Status Kehadiran': (r.status_kehadiran || 'HADIR').toUpperCase(),
        'Waktu Scan (WITA)': r.waktu_absen
          ? formatWitaTime(r.waktu_absen)
          : '-',
        Keterangan: r.keterangan || '-',
      });
    });

    absent.forEach((m) => {
      rows.push({
        No: no++,
        NIS: m.nis || '-',
        'Nama Anggota': m.nama || '-',
        Kelas: m.kelas || '-',
        'Status Kehadiran': (m.status_kehadiran || 'ALPA / BELUM').toUpperCase(),
        'Waktu Scan (WITA)': '-',
        Keterangan: '-',
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 5 },
      { wch: 14 },
      { wch: 28 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 26 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Presensi Sesi');
    const safeTitle = session.nama_kegiatan
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .slice(0, 30);
    XLSX.writeFile(
      wb,
      `Absensi_${safeTitle}_${session.tanggal_kegiatan}.xlsx`
    );
    toast.success('Rekap presensi sesi (.xlsx) berhasil diunduh.');
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
      <div className="text-center py-12 bg-white dark:bg-[#330C0F] rounded-3xl border border-slate-200/80 dark:border-red-900/60 p-6">
        <p className="text-sm font-semibold text-slate-600 dark:text-red-100">
          Sesi absensi tidak ditemukan.
        </p>
        <button
          type="button"
          onClick={() => router.push('/admin/sessions')}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#D32F2F] dark:text-red-300 underline"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke daftar sesi</span>
        </button>
      </div>
    );
  }

  const isOpen = session.status === 'OPEN';
  const scanUrl = qrToken
    ? `https://pmr-attendance.vercel.app/absensi/scan?token=${qrToken}`
    : '';
  const qrImageUrl = qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
        qrToken
      )}`
    : '';

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <Link
            href="/admin/sessions"
            aria-label="Kembali ke daftar sesi"
            className="p-2.5 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200 dark:border-red-900/60 text-slate-700 dark:text-red-100 hover:border-[#D32F2F] shrink-0 transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
                {session.nama_kegiatan}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  isOpen
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60'
                    : 'bg-slate-200 text-slate-700 dark:bg-red-950 dark:text-red-200/80'
                }`}
              >
                {session.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-red-200/75 mt-1">
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} className="text-[#D32F2F]" />
                <span>{formatWitaDate(session.tanggal_kegiatan)}</span>
              </span>
              {session.waktu_mulai && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} className="text-[#D32F2F]" />
                  <span>{session.waktu_mulai.slice(0, 5)} WITA</span>
                </span>
              )}
              {session.lokasi && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  <span>{session.lokasi}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={refreshing}
            onClick={() => fetchDetail(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200 dark:border-red-900/60 text-xs font-bold text-slate-700 dark:text-red-100 hover:border-[#D32F2F] disabled:opacity-50 transition"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportSessionExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200 dark:border-red-900/60 text-xs font-bold text-slate-700 dark:text-red-100 hover:border-[#D32F2F] transition"
          >
            <Download size={14} />
            <span>Export Excel</span>
          </button>

          {isOpen && (
            <button
              type="button"
              onClick={() => setCloseModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-100/80 dark:bg-red-950 text-[#D32F2F] dark:text-red-200 hover:bg-[#D32F2F] hover:text-white text-xs font-bold transition"
            >
              <Trash2 size={14} />
              <span>Hapus</span>
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan Kehadiran Sesi */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 p-4">
          <p className="text-[11px] font-bold text-slate-500 dark:text-red-200/70">
            Total Hadir
          </p>
          <p className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {present.length}
            <span className="text-xs font-normal text-slate-400 ml-1">
              / {stats.totalMembers}
            </span>
          </p>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-red-950 overflow-hidden mt-2">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 p-4">
          <p className="text-[11px] font-bold text-slate-500 dark:text-red-200/70">
            Tepat Waktu
          </p>
          <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-1">
            {stats.onTimeCount}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-red-200/55 mt-1">
            Status HADIR
          </p>
        </div>

        <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 p-4">
          <p className="text-[11px] font-bold text-slate-500 dark:text-red-200/70">
            Terlambat
          </p>
          <p className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {stats.lateCount}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-red-200/55 mt-1">
            Melewati batas waktu
          </p>
        </div>

        <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 p-4">
          <p className="text-[11px] font-bold text-slate-500 dark:text-red-200/70">
            Belum / Tidak Hadir
          </p>
          <p className="text-2xl font-extrabold font-mono text-[#D32F2F] dark:text-red-400 mt-1">
            {absent.length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-red-200/55 mt-1">
            Persentase hadir: {stats.rate}%
          </p>
        </div>
      </div>

      {/* QR Code Card saat Sesi Aktif */}
      {isOpen && qrToken && (
        <div className="bg-white dark:bg-[#330C0F] rounded-3xl p-6 border border-slate-200/80 dark:border-red-900/60 flex flex-col sm:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-2xl border-2 border-[#D32F2F] shadow-sm shrink-0">
            <img
              src={qrImageUrl}
              alt="QR Code Sesi Absensi"
              className="w-44 h-44 object-contain"
            />
          </div>

          <div className="space-y-2.5 text-center sm:text-left min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/80 border border-red-200/70 dark:border-red-800/60 text-[#D32F2F] dark:text-red-200 text-[11px] font-extrabold">
              <QrCode size={12} />
              <span>SCAN UNTUK ABSENSI</span>
            </div>

            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Tampilkan QR Code ini kepada Anggota
            </h2>
            <p className="text-xs text-slate-500 dark:text-red-200/75 max-w-lg leading-relaxed">
              Anggota dapat membuka menu <b>Scan QR</b> di portal PMR Attendance
              atau memasukkan kode token manual{' '}
              <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#230709] font-mono font-bold text-[#D32F2F] dark:text-red-300">
                {qrToken}
              </code>{' '}
              untuk mencatat kehadiran.
            </p>

            <div className="pt-1 flex flex-wrap justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => handleCopy(scanUrl, 'url')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-200 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900 transition"
              >
                {copiedType === 'url' ? (
                  <Check size={13} className="text-emerald-600" />
                ) : (
                  <Copy size={13} />
                )}
                <span>
                  {copiedType === 'url' ? 'Link Tersalin' : 'Salin Link Scan'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(qrToken, 'token')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#230709] border border-slate-200 dark:border-red-900/60 text-slate-700 dark:text-red-100 text-xs font-bold hover:border-[#D32F2F] transition"
              >
                {copiedType === 'token' ? (
                  <Check size={13} className="text-emerald-600" />
                ) : (
                  <Copy size={13} />
                )}
                <span>
                  {copiedType === 'token' ? 'Token Tersalin' : 'Salin Token'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQrFullscreen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D32F2F] hover:bg-red-700 text-white text-xs font-bold shadow-xs transition"
              >
                <Maximize2 size={13} />
                <span>Layar Penuh</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Pencarian Peserta */}
      <div className="relative max-w-md">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          placeholder="Cari nama, NIS, atau kelas anggota..."
          className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200/80 dark:border-red-900/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
        />
        {memberSearch && (
          <button
            type="button"
            onClick={() => setMemberSearch('')}
            aria-label="Hapus pencarian"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-red-200"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dua Kolom: Hadir & Tidak Hadir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Daftar Hadir */}
        <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
          <div className="px-5 py-3.5 bg-emerald-50/70 dark:bg-emerald-950/35 border-b border-slate-100 dark:border-red-900/40 flex items-center justify-between">
            <span className="font-extrabold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 size={15} /> Sudah Hadir ({filteredPresent.length}
              {memberSearch ? ` / ${present.length}` : ''})
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-red-900/40 max-h-96 overflow-y-auto">
            {filteredPresent.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400 dark:text-red-200/60">
                {memberSearch
                  ? 'Tidak ada anggota hadir yang cocok dengan pencarian.'
                  : 'Belum ada yang absen.'}
              </p>
            ) : (
              filteredPresent.map((r) => {
                const statusUpper = (
                  r.status_kehadiran || 'HADIR'
                ).toUpperCase();
                return (
                  <div
                    key={r.id}
                    className="px-5 py-3 flex items-center justify-between gap-3 text-xs hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {r.members?.nama || '-'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-red-200/70">
                        {r.members?.nis || '-'} • {r.members?.kelas || '-'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          STATUS_COLORS[statusUpper as StatusKehadiran] ??
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {statusUpper}
                      </span>
                      {r.waktu_absen && (
                        <p className="text-[10px] font-mono text-slate-400 dark:text-red-200/60 mt-0.5">
                          {formatWitaTime(r.waktu_absen)} WITA
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Daftar Tidak Hadir */}
        <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
          <div className="px-5 py-3.5 bg-red-50/70 dark:bg-red-950/50 border-b border-slate-100 dark:border-red-900/40 flex items-center justify-between">
            <span className="font-extrabold text-xs text-[#D32F2F] dark:text-red-300 flex items-center gap-1.5">
              <UserX size={15} /> Belum / Tidak Hadir ({filteredAbsent.length}
              {memberSearch ? ` / ${absent.length}` : ''})
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-red-900/40 max-h-96 overflow-y-auto">
            {filteredAbsent.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400 dark:text-red-200/60">
                {memberSearch
                  ? 'Tidak ada anggota belum hadir yang cocok dengan pencarian.'
                  : 'Semua anggota aktif hadir!'}
              </p>
            ) : (
              filteredAbsent.map((m) => (
                <div
                  key={m.id}
                  className="px-5 py-3 flex items-center justify-between gap-3 text-xs hover:bg-red-50/20 dark:hover:bg-red-950/20 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {m.nama || '-'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-red-200/70">
                      {m.nis || '-'} • {m.kelas || '-'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-300 border border-red-200/60 dark:border-red-800/60 text-[10px] font-bold shrink-0">
                    ALPA / BELUM
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal QR Layar Penuh untuk Proyektor */}
      {qrFullscreen && isOpen && qrToken && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setQrFullscreen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-[#330C0F] rounded-3xl border border-slate-200 dark:border-red-900/70 p-6 sm:p-8 text-center shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setQrFullscreen(false)}
              aria-label="Tutup tampilan layar penuh"
              className="absolute right-4 top-4 p-2 rounded-xl bg-slate-100 dark:bg-red-950 text-slate-600 dark:text-red-200 hover:bg-red-100 hover:text-[#D32F2F] transition"
            >
              <X size={18} />
            </button>

            <OrgLogos size="md" />

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-200 text-[11px] font-extrabold uppercase tracking-wider">
                Presensi PMR Wira SMKN 1 Pringgabaya
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                {session.nama_kegiatan}
              </h3>
              <p className="text-xs text-slate-500 dark:text-red-200/75 mt-0.5">
                {formatWitaDate(session.tanggal_kegiatan)}
                {session.lokasi ? ` • ${session.lokasi}` : ''}
              </p>
            </div>

            <div className="bg-white p-4 rounded-3xl border-4 border-[#D32F2F] inline-block shadow-md">
              <img
                src={qrImageUrl}
                alt="QR Code Layar Penuh"
                className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#230709] border border-slate-200/80 dark:border-red-900/60">
              <p className="text-[11px] text-slate-500 dark:text-red-200/70">
                Kode Token Manual:
              </p>
              <p className="text-lg font-mono font-extrabold tracking-widest text-[#D32F2F] dark:text-red-300 mt-0.5">
                {qrToken}
              </p>
            </div>
          </div>
        </div>
      )}

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