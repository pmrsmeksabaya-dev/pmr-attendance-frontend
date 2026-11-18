'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
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
      <div className="text-center py-12">
        <Loader2 className="mx-auto text-pmr-red animate-spin" size={32} />
      </div>
    );
  }

  const badgeStyle =
    STATUS_COLORS[status as StatusKehadiran] ??
    (status === 'HADIR' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700');

  return (
    <div className="space-y-5">
      {/* Header Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="text-green-500" size={44} />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          ABSENSI BERHASIL
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Kehadiran Anda telah tercatat otomatis
        </p>
      </div>

      {/* Kartu Detail Bukti Kehadiran */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-3.5">
        <Row label="Nama" value={nama} />
        <Row label="Kelas" value={kelas} />
        <Row label="Jenis Kelamin" value={jk} />

        <hr className="border-gray-100" />

        <Row label="Kegiatan" value={kegiatan} />
        {tanggal && <Row label="Tanggal" value={formatWitaDate(tanggal)} />}
        {waktu && <Row label="Waktu Absen" value={`${formatWitaTime(waktu)} WITA`} highlight />}
        <Row label="Status" value={status} badge={badgeStyle} />
      </div>

      {/* Tombol Navigasi */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/absensi/history"
          className="bg-white text-center py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-pmr-red hover:text-pmr-red transition"
        >
          Lihat Riwayat
        </Link>
        <Link
          href="/absensi"
          className="bg-pmr-red text-white text-center py-3 rounded-xl text-sm font-semibold hover:bg-pmr-red-dark transition"
        >
          Ke Beranda
        </Link>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  badge,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  badge?: string;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      {badge ? (
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${badge}`}>
          {value}
        </span>
      ) : (
        <span
          className={`text-sm font-semibold text-right break-words ${
            highlight ? 'text-pmr-red' : 'text-gray-900'
          }`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-12">
          <Loader2 className="mx-auto text-pmr-red animate-spin" size={32} />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}