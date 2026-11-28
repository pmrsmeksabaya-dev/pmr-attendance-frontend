'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  MessageSquareText,
  UserCheck,
  Calendar,
  ExternalLink,
  Phone,
  Filter,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface IzinMemberInfo {
  id: number;
  nis?: string | null;
  nama: string;
  kelas?: string | null;
  jurusan?: string | null;
  nomor_whatsapp?: string | null;
}

interface IzinReviewerInfo {
  nama?: string | null;
}

export interface PengurusIzinItem {
  id: number;
  member_id: number;
  session_id?: number | null;
  tanggal?: string | null;
  tanggal_izin?: string | null;
  jenis: 'IZIN' | 'SAKIT' | string;
  alasan?: string | null;
  keterangan?: string | null;
  bukti_url?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  catatan_pengurus?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
  created_at?: string | null;
  member?: IzinMemberInfo | null;
  members?: IzinMemberInfo | null;
  reviewer?: IzinReviewerInfo | null;
}

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';
type JenisFilter = 'ALL' | 'IZIN' | 'SAKIT';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
).replace(/\/$/, '');

function extractJwtFromValue(raw: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const jwtRegex = /^"?(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)"?$/;
  const directMatch = trimmed.match(jwtRegex);
  if (directMatch) return directMatch[1];

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const candidate =
        parsed?.jwt ||
        parsed?.token ||
        parsed?.access_token ||
        parsed?.accessToken ||
        parsed?.session?.access_token ||
        parsed?.session?.token;
      if (typeof candidate === 'string' && candidate.startsWith('eyJ')) {
        return candidate.trim();
      }
    } catch {
      // Abaikan jika bukan JSON valid
    }
  }
  return '';
}

function getStoredToken(): string {
  if (typeof window === 'undefined') return '';

  const priorityKeys = [
    'pmr_pengurus_token',
    'pmr_admin_token',
    'pmr_token',
    'pmr_jwt',
    'pengurus_token',
    'admin_token',
    'pmr_session',
    'pmr_auth',
    'token',
    'jwt',
    'auth_token',
    'access_token',
  ];

  for (const key of priorityKeys) {
    const found =
      extractJwtFromValue(localStorage.getItem(key)) ||
      extractJwtFromValue(sessionStorage.getItem(key));
    if (found) return found;
  }

  for (const storage of [localStorage, sessionStorage]) {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (!k) continue;
      const found = extractJwtFromValue(storage.getItem(k));
      if (found) return found;
    }
  }

  return '';
}

function formatTanggalIndonesia(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const clean = String(dateStr).slice(0, 10);
  const parsed = new Date(`${clean}T00:00:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return clean;

  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Makassar',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function formatWaktuPengajuan(isoStr?: string | null): string {
  if (!isoStr) return '';
  const parsed = new Date(isoStr);
  if (Number.isNaN(parsed.getTime())) return '';

  return (
    new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed) + ' WITA'
  );
}

const STATUS_BADGE_MAP: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: 'Menunggu Verifikasi',
    className:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/60',
  },
  APPROVED: {
    label: 'Disetujui',
    className:
      'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/60',
  },
  REJECTED: {
    label: 'Ditolak',
    className:
      'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800/60',
  },
};

export default function PengurusIzinPage() {
  const [items, setItems] = useState<PengurusIzinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [jenisFilter, setJenisFilter] = useState<JenisFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notesById, setNotesById] = useState<Record<number, string>>({});
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchIzinList = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const token = getStoredToken();
      const res = await fetch(`${API_BASE_URL}/api/pengurus/izin?status=ALL`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Sesi login pengurus berakhir atau tidak ditemukan. Silakan masuk kembali.'
        );
      }
      if (!res.ok) {
        throw new Error(
          payload?.error ||
            payload?.message ||
            `Gagal memuat daftar izin (${res.status})`
        );
      }

      const list: PengurusIzinItem[] = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

      setItems(list);
      setNotesById((prev) => {
        const next = { ...prev };
        for (const item of list) {
          if (next[item.id] === undefined && item.catatan_pengurus) {
            next[item.id] = item.catatan_pengurus;
          }
        }
        return next;
      });
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat data pengajuan izin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIzinList();
  }, [fetchIzinList]);

  const counts = useMemo(() => {
    const summary = { ALL: items.length, PENDING: 0, APPROVED: 0, REJECTED: 0 };
    for (const item of items) {
      const st = String(item.status || 'PENDING').toUpperCase();
      if (st === 'PENDING') summary.PENDING += 1;
      else if (st === 'APPROVED') summary.APPROVED += 1;
      else if (st === 'REJECTED') summary.REJECTED += 1;
    }
    return summary;
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const st = String(item.status || 'PENDING').toUpperCase();
      const jn = String(item.jenis || 'IZIN').toUpperCase();
      const member = item.member || item.members;

      if (statusFilter !== 'ALL' && st !== statusFilter) return false;
      if (jenisFilter !== 'ALL' && jn !== jenisFilter) return false;

      if (!q) return true;

      const nama = (member?.nama || '').toLowerCase();
      const nis = (member?.nis || '').toLowerCase();
      const kelas = (member?.kelas || '').toLowerCase();
      const jurusan = (member?.jurusan || '').toLowerCase();
      const alasan = (item.alasan || item.keterangan || '').toLowerCase();

      return (
        nama.includes(q) ||
        nis.includes(q) ||
        kelas.includes(q) ||
        jurusan.includes(q) ||
        alasan.includes(q)
      );
    });
  }, [items, statusFilter, jenisFilter, searchQuery]);

  const handleVerify = async (
    item: PengurusIzinItem,
    nextStatus: 'APPROVED' | 'REJECTED'
  ) => {
    try {
      setSubmittingId(item.id);
      const token = getStoredToken();
      const catatan = (notesById[item.id] || '').trim();

      const res = await fetch(`${API_BASE_URL}/api/pengurus/izin/${item.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: nextStatus,
          catatan_pengurus: catatan || undefined,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error(
          'Sesi login pengurus berakhir atau tidak ditemukan. Silakan masuk kembali.'
        );
      }
      if (!res.ok) {
        throw new Error(
          payload?.error ||
            payload?.message ||
            'Gagal memproses verifikasi izin.'
        );
      }

      const memberName = (item.member || item.members)?.nama || 'Anggota';
      toast.success(
        nextStatus === 'APPROVED'
          ? `Pengajuan ${item.jenis} ${memberName} disetujui & disinkronkan ke absensi.`
          : `Pengajuan ${item.jenis} ${memberName} ditolak.`
      );

      const updatedRow = payload?.data;
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                ...(updatedRow && typeof updatedRow === 'object' ? updatedRow : {}),
                status: nextStatus,
                catatan_pengurus: catatan || null,
                reviewed_at: updatedRow?.reviewed_at || new Date().toISOString(),
              }
            : row
        )
      );
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat verifikasi izin.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner — Gradasi Merah PMR senada dengan Kartu Kas */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#D32F2F] via-[#B71C1C] to-[#8E1C1C] p-5 sm:p-6 text-white shadow-lg shadow-red-900/15 border border-red-400/25">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl"
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <ClipboardCheck size={22} className="text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-red-100/90">
                Administrasi &amp; Kesekretariatan
              </p>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mt-0.5">
                Verifikasi Izin &amp; Sakit Anggota
              </h1>
              <p className="text-xs text-red-50/90 mt-1">
                Persetujuan izin otomatis memperbarui status kehadiran anggota pada sesi kegiatan tanggal terkait.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchIzinList(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-bold text-white transition shrink-0 self-start sm:self-center disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Memuat...' : 'Segarkan'}</span>
          </button>
        </div>
      </div>

      {/* Kartu Ringkasan Status (Tanpa warna hitam) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`rounded-2xl p-4 text-left border transition-all ${
            statusFilter === 'ALL'
              ? 'bg-gradient-to-r from-[#D32F2F] to-[#991B1B] text-white border-[#B71C1C] shadow-md shadow-red-600/20'
              : 'bg-white dark:bg-[#2A090C] text-[#991B1B] dark:text-white border-red-200/80 dark:border-red-900/50 hover:border-[#D32F2F]/50'
          }`}
        >
          <p className="text-xs font-semibold opacity-85">Total Pengajuan</p>
          <p className="text-2xl font-extrabold font-mono mt-1">{counts.ALL}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('PENDING')}
          className={`rounded-2xl p-4 text-left border transition-all ${
            statusFilter === 'PENDING'
              ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
              : 'bg-amber-50/85 dark:bg-amber-950/35 text-amber-900 dark:text-amber-200 border-amber-200/80 dark:border-amber-800/50 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold opacity-85">Menunggu</p>
            <Clock size={15} className="opacity-80" />
          </div>
          <p className="text-2xl font-extrabold font-mono mt-1">
            {counts.PENDING}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('APPROVED')}
          className={`rounded-2xl p-4 text-left border transition-all ${
            statusFilter === 'APPROVED'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20'
              : 'bg-emerald-50/85 dark:bg-emerald-950/35 text-emerald-900 dark:text-emerald-200 border-emerald-200/80 dark:border-emerald-800/50 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold opacity-85">Disetujui</p>
            <CheckCircle2 size={15} className="opacity-80" />
          </div>
          <p className="text-2xl font-extrabold font-mono mt-1">
            {counts.APPROVED}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('REJECTED')}
          className={`rounded-2xl p-4 text-left border transition-all ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/20'
              : 'bg-rose-50/85 dark:bg-rose-950/35 text-rose-900 dark:text-rose-200 border-rose-200/80 dark:border-rose-800/50 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold opacity-85">Ditolak</p>
            <XCircle size={15} className="opacity-80" />
          </div>
          <p className="text-2xl font-extrabold font-mono mt-1">
            {counts.REJECTED}
          </p>
        </button>
      </div>

      {/* Bar Pencarian & Filter Jenis */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama anggota, NIS, kelas, atau alasan izin..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-[#2A090C] border border-slate-200 dark:border-red-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Hapus pencarian"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-white dark:bg-[#2A090C] p-1 rounded-xl border border-slate-200 dark:border-red-900/60 shrink-0">
          <span className="pl-2 text-slate-400">
            <Filter size={13} />
          </span>
          {(['ALL', 'IZIN', 'SAKIT'] as const).map((jn) => (
            <button
              key={jn}
              type="button"
              onClick={() => setJenisFilter(jn)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                jenisFilter === jn
                  ? 'bg-[#D32F2F] text-white shadow-xs'
                  : 'text-slate-600 dark:text-red-100/80 hover:bg-red-50 dark:hover:bg-red-950'
              }`}
            >
              {jn === 'ALL' ? 'Semua' : jn}
            </button>
          ))}
        </div>
      </div>

      {/* Daftar Pengajuan Izin */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="h-36 rounded-2xl bg-white dark:bg-[#2A090C] border border-slate-200/70 dark:border-red-900/50"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-[#2A090C] border border-slate-200/80 dark:border-red-900/60 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/70 border border-red-100 dark:border-red-800/50 flex items-center justify-center mx-auto mb-3">
            <ClipboardCheck size={26} className="text-[#D32F2F]" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Tidak Ada Data Pengajuan
          </h3>
          <p className="text-xs text-slate-500 dark:text-red-200/70 mt-1 max-w-md mx-auto">
            {items.length === 0
              ? 'Belum ada anggota yang mengirimkan pengajuan izin atau sakit.'
              : 'Tidak ditemukan pengajuan yang sesuai dengan filter atau kata kunci pencarian.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => {
            const member = item.member || item.members;
            const upperStatus = String(item.status || 'PENDING').toUpperCase();
            const upperJenis = String(item.jenis || 'IZIN').toUpperCase();
            const badge =
              STATUS_BADGE_MAP[upperStatus] || STATUS_BADGE_MAP.PENDING;
            const targetDate = item.tanggal_izin || item.tanggal;
            const reasonText = item.alasan || item.keterangan || '-';
            const isPending = upperStatus === 'PENDING';
            const isBusy = submittingId === item.id;
            const waClean = String(member?.nomor_whatsapp || '').replace(
              /\D/g,
              ''
            );

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white dark:bg-[#2A090C] border border-slate-200/85 dark:border-red-900/60 p-4 sm:p-5 shadow-2xs transition hover:border-red-200 dark:hover:border-red-700/70 space-y-3.5"
              >
                {/* Bar Atas: Identitas Anggota + Badge Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                        {member?.nama || `Anggota #${item.member_id}`}
                      </h3>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          upperJenis === 'SAKIT'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        }`}
                      >
                        {upperJenis}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-red-200/75 mt-1">
                      {member?.kelas && (
                        <span className="font-semibold text-slate-700 dark:text-red-100">
                          {member.kelas}
                          {member.jurusan ? ` • ${member.jurusan}` : ''}
                        </span>
                      )}
                      {member?.nis && <span>NIS: {member.nis}</span>}
                      <span className="inline-flex items-center gap-1 text-[#D32F2F] dark:text-red-300 font-semibold">
                        <Calendar size={12} />
                        <span>
                          Tanggal Izin: {formatTanggalIndonesia(targetDate)}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    {waClean.length >= 10 && (
                      <a
                        href={`https://wa.me/${waClean}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Hubungi via WhatsApp"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60 transition"
                      >
                        <Phone size={11} />
                        <span>WA</span>
                      </a>
                    )}
                    <span
                      className={`text-[11px] font-bold px-3 py-1 rounded-full border ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>

                {/* Kotak Alasan & Lampiran */}
                <div className="rounded-xl bg-red-50/40 dark:bg-red-950/45 border border-red-100/80 dark:border-red-900/50 p-3 text-xs space-y-1.5">
                  <p className="text-slate-700 dark:text-red-100/90 leading-relaxed">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Alasan:
                    </span>{' '}
                    {reasonText}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-red-200/60 pt-1">
                    <span>
                      Diajukan: {formatWaktuPengajuan(item.created_at) || '-'}
                    </span>

                    {item.bukti_url && (
                      <a
                        href={item.bukti_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#D32F2F] dark:text-red-300 hover:underline"
                      >
                        <ExternalLink size={12} />
                        <span>Lihat Bukti Lampiran</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Panel Verifikasi Pengurus */}
                {isPending ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                    <div className="relative flex-1">
                      <MessageSquareText
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={notesById[item.id] ?? ''}
                        onChange={(e) =>
                          setNotesById((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="Catatan pengurus (opsional, misal: Semoga lekas sembuh)..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-red-950/50 border border-slate-200 dark:border-red-900/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleVerify(item, 'APPROVED')}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        <span>{isBusy ? 'Menyimpan...' : 'Setujui'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleVerify(item, 'REJECTED')}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        <span>Tolak</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-red-200/70 pt-0.5">
                    <span className="inline-flex items-center gap-1.5">
                      <UserCheck size={13} className="text-emerald-600" />
                      <span>
                        Diverifikasi
                        {item.reviewer?.nama
                          ? ` oleh ${item.reviewer.nama}`
                          : ''}
                        {item.reviewed_at
                          ? ` (${formatWaktuPengajuan(item.reviewed_at)})`
                          : ''}
                      </span>
                    </span>

                    {item.catatan_pengurus && (
                      <span className="italic text-slate-600 dark:text-red-200/80">
                        Catatan: &ldquo;{item.catatan_pengurus}&rdquo;
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}