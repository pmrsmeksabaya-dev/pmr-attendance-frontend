'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Loader2,
  History,
  Home,
  ShieldCheck,
  Clock,
  Calendar,
  User,
  Award,
  MapPin,
  Copy,
  Check,
  AlertTriangle,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatWitaDate, formatWitaTime } from '@/lib/time-client';
import { STATUS_COLORS, StatusKehadiran } from '@/lib/constants';
import { isLoggedIn, getUser } from '@/lib/auth';
import { OrgLogos } from '@/components/OrgLogos';

function formatJenisKelamin(raw: string): string {
  const upper = raw.trim().toUpperCase();
  if (upper === 'L') return 'Laki-laki';
  if (upper === 'P') return 'Perempuan';
  return raw || '-';
}

function ResultContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const sessionUser = getUser();
  const rawNama = params.get('nama') || '';
  const nama = rawNama || sessionUser?.nama || '';
  const kelas = params.get('kelas') || '-';
  const jk = formatJenisKelamin(params.get('jk') || '-');
  const kegiatan = params.get('kegiatan') || '';
  const lokasi = params.get('lokasi') || '';
  const tanggal = params.get('tanggal') || '';
  const waktu = params.get('waktu') || '';
  const status = (params.get('status') || 'HADIR').toUpperCase();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/absensi/login');
      return;
    }
    // Jika halaman dibuka langsung tanpa parameter hasil scan, kembalikan ke beranda
    if (!rawNama && !kegiatan) {
      router.replace('/absensi');
    }
  }, [rawNama, kegiatan, router]);

  if (!rawNama && !kegiatan) {
    return (
      <div className="flex items-center justify-center py-14">
        <Loader2 className="text-[#D32F2F] animate-spin" size={32} />
      </div>
    );
  }

  const isLate = status === 'TERLAMBAT';
  const isPresent = status === 'HADIR';

  const bannerGradient = isLate
    ? 'from-amber-500 via-orange-600 to-amber-700'
    : isPresent
      ? 'from-emerald-500 via-green-600 to-teal-700'
      : 'from-[#D32F2F] via-rose-700 to-red-900';

  const badgeStyle =
    STATUS_COLORS[status as StatusKehadiran] ??
    (isPresent
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800/70'
      : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800/70');

  const buildReceiptText = () => {
    const lines = [
      '*BUKTI PRESENSI PMR WIRA SMKN 1 PRINGGABAYA*',
      `• Nama: ${nama}`,
      `• Kelas: ${kelas}`,
      `• Kegiatan: ${kegiatan}`,
      lokasi ? `• Lokasi: ${lokasi}` : null,
      tanggal ? `• Tanggal: ${formatWitaDate(tanggal)}` : null,
      waktu ? `• Waktu Scan: ${formatWitaTime(waktu)} WITA` : null,
      `• Status: *${status}*`,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleCopyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(buildReceiptText());
      setCopied(true);
      toast.success('Bukti absensi disalin ke clipboard');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Gagal menyalin bukti absensi');
    }
  };

  const handleShareReceipt = async () => {
    const text = buildReceiptText();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Bukti Presensi PMR Wira SMKN 1 Pringgabaya',
          text,
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    await handleCopyReceipt();
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Kartu Bukti Kehadiran Bergaya Digital Receipt */}
      <div className="relative overflow-hidden bg-white/95 dark:bg-[#330C0F] backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 dark:border-red-900/60">
        {/* Top Banner Sukses */}
        <div
          className={`relative bg-gradient-to-br ${bannerGradient} px-6 pt-6 pb-8 text-center text-white`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/15 blur-2xl"
          />

          {/* Tiga Logo Resmi dengan Background Putih Permanen */}
          <div className="relative mb-3.5">
            <OrgLogos size="sm" shape="circle" />
          </div>

          <div className="relative w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl ring-1 ring-white/35 flex items-center justify-center mx-auto mb-3 shadow-lg">
            {isLate ? (
              <AlertTriangle className="text-white" size={32} />
            ) : (
              <CheckCircle2 className="text-white" size={34} />
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/15 text-[11px] font-semibold tracking-wide uppercase mb-1.5">
            <ShieldCheck size={12} />
            <span>Tercatat di Sistem</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {isLate ? 'Absensi Tercatat (Terlambat)' : 'Absensi Berhasil'}
          </h1>
          <p className="text-xs sm:text-sm text-white/85 mt-1">
            Bukti kehadiran digital PMR Wira SMKN 1 Pringgabaya
          </p>
        </div>

        {/* Garis Sobekan Tiket (Perforated Divider) */}
        <div className="relative flex items-center justify-between -mt-3 px-0">
          <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-[#230709] border-r border-slate-200/80 dark:border-red-900/60 -ml-3" />
          <div className="flex-1 border-t-2 border-dashed border-slate-200 dark:border-red-900/60 mx-2" />
          <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-[#230709] border-l border-slate-200/80 dark:border-red-900/60 -mr-3" />
        </div>

        {/* Detail Informasi Peserta & Kegiatan */}
        <div className="p-5 sm:p-6 pt-4 space-y-4">
          {/* Blok Identitas */}
          <div className="bg-slate-50/80 dark:bg-red-950/45 rounded-2xl p-4 border border-slate-200/60 dark:border-red-900/50 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-red-200/60">
                <User size={12} className="text-[#D32F2F]" />
                <span>Data Anggota</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-red-950 border border-slate-200/80 dark:border-red-800/60 text-[11px] font-bold text-slate-600 dark:text-red-200 hover:text-[#D32F2F] transition"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Tersalin
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Salin</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShareReceipt}
                  title="Bagikan bukti presensi"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-900/70 border border-red-200/80 dark:border-red-800/60 text-[11px] font-bold text-[#D32F2F] dark:text-red-200 hover:bg-red-100 transition"
                >
                  <Share2 size={12} />
                  <span>Bagikan</span>
                </button>
              </div>
            </div>

            <Row label="Nama Lengkap" value={nama} bold />
            <Row label="Kelas" value={kelas} />
            <Row label="Jenis Kelamin" value={jk} />
          </div>

          {/* Blok Detail Kegiatan */}
          <div className="bg-slate-50/80 dark:bg-red-950/45 rounded-2xl p-4 border border-slate-200/60 dark:border-red-900/50 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-red-200/60">
              <Award size={12} className="text-[#D32F2F]" />
              <span>Detail Sesi Kegiatan</span>
            </div>
            <Row label="Kegiatan" value={kegiatan} bold />
            {lokasi && (
              <Row
                label="Lokasi"
                value={lokasi}
                icon={<MapPin size={13} className="text-slate-400 shrink-0" />}
              />
            )}
            {tanggal && (
              <Row
                label="Tanggal"
                value={formatWitaDate(tanggal)}
                icon={<Calendar size={13} className="text-slate-400 shrink-0" />}
              />
            )}
            {waktu && (
              <Row
                label="Waktu Scan"
                value={`${formatWitaTime(waktu)} WITA`}
                highlight
                mono
                icon={<Clock size={13} className="text-[#D32F2F] shrink-0" />}
              />
            )}
            <Row label="Status" value={status} badge={badgeStyle} />
          </div>
        </div>
      </div>

      {/* Tombol Navigasi */}
      <div className="grid grid-cols-2 gap-3.5">
        <Link
          href="/absensi/history"
          className="inline-flex items-center justify-center gap-2 bg-white/95 dark:bg-[#330C0F] text-slate-700 dark:text-red-100 py-3.5 px-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60 text-sm font-semibold shadow-2xs hover:border-[#D32F2F]/60 hover:text-[#D32F2F] active:scale-[0.98] transition-all"
        >
          <History size={16} />
          <span>Lihat Riwayat</span>
        </Link>
        <Link
          href="/absensi"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#D32F2F] to-red-600 text-white py-3.5 px-4 rounded-2xl text-sm font-semibold shadow-md shadow-red-600/20 hover:brightness-105 active:scale-[0.98] transition-all"
        >
          <Home size={16} />
          <span>Ke Beranda</span>
        </Link>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  bold,
  mono,
  badge,
  icon,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  bold?: boolean;
  mono?: boolean;
  badge?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs sm:text-sm text-slate-500 dark:text-red-200/75 shrink-0">
        {label}
      </span>
      {badge ? (
        <span
          className={`text-xs px-3 py-1 rounded-full font-bold border shrink-0 ${badge}`}
        >
          {value}
        </span>
      ) : (
        <span
          className={`inline-flex items-center justify-end gap-1.5 min-w-0 text-xs sm:text-sm text-right break-words ${
            highlight
              ? 'text-[#D32F2F] dark:text-red-300 font-bold'
              : bold
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-800 dark:text-red-100 font-semibold'
          } ${mono ? 'font-mono tabular-nums' : ''}`}
        >
          {icon}
          <span className="break-words">{value}</span>
        </span>
      )}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-14">
          <Loader2 className="text-[#D32F2F] animate-spin" size={32} />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}