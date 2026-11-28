'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays,
  FileText,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Info,
  Stethoscope,
  FileCheck2,
  History,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, IzinRequestItem } from '@/lib/api';
import { isLoggedIn, clearSession } from '@/lib/auth';
import { formatWitaDate, formatWitaDateTime } from '@/lib/time-client';

type MyIzinDisplayItem = IzinRequestItem & {
  keterangan?: string | null;
  review_note?: string | null;
  reviewed_at?: string | null;
};

type StatusFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Mengambil tanggal hari ini dalam format YYYY-MM-DD sesuai zona waktu WITA (Asia/Makassar)
 * agar tidak bergeser mundur 1 hari pada pukul 00:00 - 08:00 WITA.
 */
function getTodayWitaDate(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export default function MemberIzinPage() {
  const router = useRouter();
  const [history, setHistory] = useState<MyIzinDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [form, setForm] = useState({
    tanggal: getTodayWitaDate(),
    jenis: 'IZIN' as 'IZIN' | 'SAKIT',
    alasan: '',
  });

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getMyIzin();
      const rawList = Array.isArray(res?.data) ? res.data : [];
      const normalized: MyIzinDisplayItem[] = rawList.map((item: any) => ({
        ...item,
        tanggal: item.tanggal || item.tanggal_izin || '',
        tanggal_izin: item.tanggal_izin || item.tanggal || '',
        jenis: String(item.jenis || 'IZIN').toUpperCase(),
        alasan: item.alasan ?? item.keterangan ?? '',
        status: String(item.status || 'PENDING').toUpperCase(),
      }));
      setHistory(normalized);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        toast.error('Sesi login telah berakhir, silakan masuk kembali.');
        router.replace('/absensi/login');
        return;
      }
      toast.error(err?.message || 'Gagal memuat riwayat izin.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/absensi/login');
      return;
    }
    loadHistory();
  }, [router, loadHistory]);

  const counts = useMemo(() => {
    return history.reduce(
      (acc, item) => {
        acc.ALL += 1;
        const st = (item.status || 'PENDING').toUpperCase();
        if (st === 'PENDING') acc.PENDING += 1;
        else if (st === 'APPROVED') acc.APPROVED += 1;
        else if (st === 'REJECTED') acc.REJECTED += 1;
        return acc;
      },
      { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 }
    );
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (statusFilter === 'ALL') return history;
    return history.filter(
      (item) => (item.status || 'PENDING').toUpperCase() === statusFilter
    );
  }, [history, statusFilter]);

  const existingSameDateSubmission = useMemo(() => {
    if (!form.tanggal) return null;
    return (
      history.find((item) => {
        const itemDate = (item.tanggal || item.tanggal_izin || '').slice(0, 10);
        const st = (item.status || 'PENDING').toUpperCase();
        return (
          itemDate === form.tanggal && (st === 'PENDING' || st === 'APPROVED')
        );
      }) || null
    );
  }, [history, form.tanggal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAlasan = form.alasan.trim();

    if (!form.tanggal) {
      toast.error('Pilih tanggal kegiatan atau latihan terlebih dahulu.');
      return;
    }

    if (cleanAlasan.length < 5) {
      toast.error('Tuliskan alasan izin/sakit minimal 5 karakter.');
      return;
    }

    try {
      setSubmitting(true);
      await api.submitIzin({
        tanggal: form.tanggal,
        tanggal_izin: form.tanggal,
        jenis: form.jenis,
        alasan: cleanAlasan,
      });

      toast.success('Pengajuan terkirim! Menunggu verifikasi Pengurus.');
      setForm((prev) => ({ ...prev, alasan: '' }));
      setStatusFilter('ALL');
      await loadHistory();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        toast.error('Sesi login telah berakhir, silakan masuk kembali.');
        router.replace('/absensi/login');
        return;
      }
      toast.error(err?.message || 'Gagal mengirim pengajuan izin.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    const normalized = (status || 'PENDING').toUpperCase();
    if (normalized === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/60">
          <CheckCircle2 className="h-3.5 w-3.5" /> Disetujui
        </span>
      );
    }
    if (normalized === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-200/80 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800/60">
          <XCircle className="h-3.5 w-3.5" /> Ditolak
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200/80 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/60">
        <Clock className="h-3.5 w-3.5" /> Menunggu Verifikasi
      </span>
    );
  };

  const trimmedLen = form.alasan.trim().length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/80 border border-red-200/70 dark:border-red-800/60 text-[#D32F2F] dark:text-red-200 text-[11px] font-bold mb-1.5">
            <FileCheck2 className="h-3.5 w-3.5" />
            <span>Presensi PMR Wira SMKN 1 Pringgabaya</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Pengajuan Izin &amp; Sakit
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-red-200/75 mt-1 leading-relaxed">
            Ajukan ketidakhadiran latihan atau piket UKS. Status otomatis
            tersinkron ke rekap absensi setelah disetujui pengurus.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <Link
            href="/absensi"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200/80 dark:border-red-900/60 text-xs font-bold text-slate-700 dark:text-red-100 hover:border-[#D32F2F]/50 hover:text-[#D32F2F] transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Beranda</span>
          </Link>

          <Link
            href="/absensi/history"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200/80 dark:border-red-900/60 text-xs font-bold text-slate-700 dark:text-red-100 hover:border-[#D32F2F]/50 hover:text-[#D32F2F] transition"
          >
            <History className="h-3.5 w-3.5" />
            <span>Riwayat</span>
          </Link>
        </div>
      </div>

      {/* Form Pengajuan */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 sm:p-6 shadow-sm backdrop-blur-md dark:border-red-900/60 dark:bg-[#330C0F]"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="izin-tanggal"
              className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-red-100"
            >
              <CalendarDays className="h-4 w-4 text-[#D32F2F]" />
              <span>Tanggal Kegiatan / Latihan</span>
            </label>
            <input
              id="izin-tanggal"
              type="date"
              required
              disabled={submitting}
              value={form.tanggal}
              onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-[#D32F2F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/25 disabled:opacity-60 dark:border-red-900/70 dark:bg-[#230709] dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-red-100">
              Kategori Ketidakhadiran
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setForm({ ...form, jenis: 'IZIN' })}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-extrabold transition ${
                  form.jenis === 'IZIN'
                    ? 'bg-[#D32F2F] text-white shadow-md shadow-red-600/20'
                    : 'border border-slate-200 bg-slate-50/80 text-slate-700 hover:border-[#D32F2F]/40 dark:border-red-900/60 dark:bg-[#230709] dark:text-red-200'
                }`}
              >
                <Info className="h-4 w-4" />
                <span>IZIN</span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => setForm({ ...form, jenis: 'SAKIT' })}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-extrabold transition ${
                  form.jenis === 'SAKIT'
                    ? 'bg-[#D32F2F] text-white shadow-md shadow-red-600/20'
                    : 'border border-slate-200 bg-slate-50/80 text-slate-700 hover:border-[#D32F2F]/40 dark:border-red-900/60 dark:bg-[#230709] dark:text-red-200'
                }`}
              >
                <Stethoscope className="h-4 w-4" />
                <span>SAKIT</span>
              </button>
            </div>
          </div>
        </div>

        {existingSameDateSubmission && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              Anda sudah memiliki pengajuan{' '}
              <strong>{existingSameDateSubmission.jenis}</strong> pada tanggal
              ini dengan status{' '}
              <strong>
                {existingSameDateSubmission.status === 'APPROVED'
                  ? 'Disetujui'
                  : 'Menunggu Verifikasi'}
              </strong>
              .
            </span>
          </div>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="izin-alasan"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-red-100"
            >
              <FileText className="h-4 w-4 text-[#D32F2F]" />
              <span>Alasan / Keterangan Lengkap</span>
            </label>
            <span
              className={`text-[11px] font-mono ${
                trimmedLen > 0 && trimmedLen < 5
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-400 dark:text-red-200/60'
              }`}
            >
              {form.alasan.length}/500
            </span>
          </div>
          <textarea
            id="izin-alasan"
            rows={3}
            required
            maxLength={500}
            disabled={submitting}
            placeholder={
              form.jenis === 'SAKIT'
                ? 'Contoh: Demam dan pusing sejak tadi malam, saat ini sedang beristirahat di rumah.'
                : 'Contoh: Ada keperluan keluarga mendadak di luar daerah sehingga belum bisa mengikuti latihan.'
            }
            value={form.alasan}
            onChange={(e) => setForm({ ...form, alasan: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-sm text-slate-900 focus:border-[#D32F2F] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/25 disabled:opacity-60 dark:border-red-900/70 dark:bg-[#230709] dark:text-white"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <p className="text-[11px] text-slate-500 dark:text-red-200/70">
            Pastikan tanggal sesuai dengan jadwal sesi latihan/piket yang diikuti.
          </p>
          <button
            type="submit"
            disabled={submitting || trimmedLen < 5}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#D32F2F] to-red-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-red-600/20 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>{submitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan'}</span>
          </button>
        </div>
      </form>

      {/* Riwayat Pengajuan */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Riwayat Pengajuan Saya
          </h2>
          <button
            type="button"
            onClick={loadHistory}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-[#330C0F] border border-slate-200/80 dark:border-red-900/60 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-red-100 hover:text-[#D32F2F] disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>
        </div>

        {/* Filter Status Pill */}
        {history.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(
              [
                { key: 'ALL', label: 'Semua' },
                { key: 'PENDING', label: 'Menunggu' },
                { key: 'APPROVED', label: 'Disetujui' },
                { key: 'REJECTED', label: 'Ditolak' },
              ] as const
            ).map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition shrink-0 ${
                    active
                      ? 'bg-[#D32F2F] text-white shadow-xs'
                      : 'bg-white dark:bg-[#330C0F] text-slate-600 dark:text-red-100/80 border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F]/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-red-950 text-slate-600 dark:text-red-200'
                    }`}
                  >
                    {counts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-6 text-sm text-slate-500 dark:border-red-900/60 dark:bg-[#330C0F] dark:text-red-200/70">
            <Loader2 className="h-4 w-4 animate-spin text-[#D32F2F]" />
            <span>Memuat riwayat pengajuan...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-7 text-center text-xs sm:text-sm text-slate-500 dark:border-red-900/60 dark:bg-[#330C0F] dark:text-red-200/75">
            Belum ada riwayat pengajuan izin atau sakit.
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 text-center text-xs text-slate-500 dark:border-red-900/60 dark:bg-[#330C0F] dark:text-red-200/75 space-y-2">
            <p>Tidak ada pengajuan pada kategori filter yang dipilih.</p>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="font-bold text-[#D32F2F] dark:text-red-300 hover:underline"
            >
              Tampilkan Semua Pengajuan
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => {
              const displayDate = item.tanggal || item.tanggal_izin;
              const displayReason = item.alasan || item.keterangan || '-';
              const reviewerNote = item.catatan_pengurus || item.review_note;
              const verifiedTimestamp =
                item.reviewed_at ||
                (item.status !== 'PENDING' ? item.updated_at : null);

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-2xs dark:border-red-900/60 dark:bg-[#330C0F] sm:flex-row sm:items-start"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {displayDate ? formatWitaDate(displayDate) : '-'}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold ${
                          item.jenis === 'SAKIT'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200/70 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60'
                            : 'bg-sky-50 text-sky-700 border border-sky-200/70 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60'
                        }`}
                      >
                        {item.jenis}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-red-100/85 leading-relaxed">
                      {displayReason}
                    </p>

                    {reviewerNote && (
                      <div className="rounded-xl bg-slate-50 dark:bg-[#230709] border border-slate-200/70 dark:border-red-900/50 px-3 py-2 text-xs text-slate-600 dark:text-red-200/80">
                        <span className="font-bold text-slate-800 dark:text-red-100">
                          Catatan Pengurus:{' '}
                        </span>
                        <span>{reviewerNote}</span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 dark:text-red-200/55">
                      Diajukan: {formatWitaDateTime(item.created_at)} WITA
                      {verifiedTimestamp
                        ? ` • Diverifikasi: ${formatWitaDateTime(verifiedTimestamp)} WITA`
                        : ''}
                    </p>
                  </div>

                  <div className="shrink-0 self-start">
                    {renderStatusBadge(item.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}