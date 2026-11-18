'use client';

import { useEffect, Suspense } from 'react';
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
} from 'lucide-react';
import { formatWitaDate, formatWitaTime } from '@/lib/time-client';
import { STATUS_COLORS, StatusKehadiran } from '@/lib/constants';
import { isLoggedIn } from '@/lib/auth';

function ResultContent() {
  const params = useSearchParams();
  const router = useRouter();

  const nama = params.get('nama') || '';
  const kelas = params.get('kelas') || '-';
  const jk = params.get('jk') || '-';
  const kegiatan = params.get('kegiatan') || '';
  const tanggal = params.get('tanggal') || '';
  const waktu = params.get('waktu') || '';
  const status = (params.get('status') || 'HADIR').toUpperCase();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/absensi/login');
      return;
    }
    // Jika halaman dibuka langsung tanpa parameter hasil scan, kembalikan ke beranda
    if (!nama && !kegiatan) {
      router.replace('/absensi');
    }
  }, [nama, kegiatan, router]);

  if (!nama && !kegiatan) {
    return (
      <div className="flex items-center justify-center py-14">
        <Loader2 className="text-pmr-red animate-spin" size={32} />
      </div>
    );
  }

  const badgeStyle =
    STATUS_COLORS[status as StatusKehadiran] ??
    (status === 'HADIR'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : 'bg-amber-100 text-amber-800 border-amber-200');

  return (
    <div className="space-y-5">
      {/* Kartu Bukti Kehadiran Bergaya Digital Receipt */}
      <div className="relative overflow-hidden bg-white/95 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80">
        {/* Top Banner Sukses */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 px-6 pt-7 pb-8 text-center text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/15 blur-2xl"
          />
          <div className="relative w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl ring-1 ring-white/35 flex items-center justify-center mx-auto mb-3 shadow-lg">
            <CheckCircle2 className="text-white" size={38} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/15 text-[11px] font-semibold tracking-wide uppercase mb-1.5">
            <ShieldCheck size={12} />
            <span>Tercatat di Sistem</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Absensi Berhasil
          </h1>
          <p className="text-xs sm:text-sm text-white/85 mt-1">
            Bukti kehadiran digital PMR Wira SMKN 1 Pringgabaya
          </p>
        </div>

        {/* Garis Sobekan Tiket (Perforated Divider) */}
        <div className="relative flex items-center justify-between -mt-3 px-0">
          <div className="w-6 h-6 rounded-full bg-slate-50 border-r border-slate-200/80 -ml-3" />
          <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-2" />
          <div className="w-6 h-6 rounded-full bg-slate-50 border-l border-slate-200/80 -mr-3" />
        </div>

        {/* Detail Informasi Peserta & Kegiatan */}
        <div className="p-6 pt-4 space-y-4">
          {/* Blok Identitas */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <User size={12} className="text-pmr-red" />
              <span>Data Anggota</span>
            </div>
            <Row label="Nama Lengkap" value={nama} bold />
            <Row label="Kelas" value={kelas} />
            <Row label="Jenis Kelamin" value={jk} />
          </div>

          {/* Blok Detail Kegiatan */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Award size={12} className="text-pmr-red" />
              <span>Detail Sesi Kegiatan</span>
            </div>
            <Row label="Kegiatan" value={kegiatan} bold />
            {tanggal && (
              <Row
                label="Tanggal"
                value={formatWitaDate(tanggal)}
                icon={<Calendar size={13} className="text-slate-400" />}
              />
            )}
            {waktu && (
              <Row
                label="Waktu Scan"
                value={`${formatWitaTime(waktu)} WITA`}
                highlight
                mono
                icon={<Clock size={13} className="text-pmr-red" />}
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
          className="inline-flex items-center justify-center gap-2 bg-white/95 text-slate-700 py-3.5 px-4 rounded-2xl border border-slate-200/80 text-sm font-semibold shadow-2xs hover:border-pmr-red/60 hover:text-pmr-red active:scale-[0.98] transition-all"
        >
          <History size={16} />
          <span>Lihat Riwayat</span>
        </Link>
        <Link
          href="/absensi"
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pmr-red to-red-600 text-white py-3.5 px-4 rounded-2xl text-sm font-semibold shadow-md shadow-red-600/20 hover:brightness-105 active:scale-[0.98] transition-all"
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
    <div className="flex justify-between items-center gap-4">
      <span className="text-xs sm:text-sm text-slate-500 shrink-0">{label}</span>
      {badge ? (
        <span
          className={`text-xs px-3 py-1 rounded-full font-bold border ${badge}`}
        >
          {value}
        </span>
      ) : (
        <span
          className={`inline-flex items-center gap-1.5 text-xs sm:text-sm text-right break-words ${
            highlight
              ? 'text-pmr-red font-bold'
              : bold
              ? 'text-slate-900 font-bold'
              : 'text-slate-800 font-semibold'
          } ${mono ? 'font-mono tabular-nums' : ''}`}
        >
          {icon}
          <span>{value}</span>
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
          <Loader2 className="text-pmr-red animate-spin" size={32} />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}