'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { formatWitaDate, formatWitaTime } from '@/lib/time-client';

export default function ResultPage() {
  const params = useSearchParams();
  const router = useRouter();

  const nama = params.get('nama') || '-';
  const kelas = params.get('kelas') || '-';
  const jk = params.get('jk') || '-';
  const kegiatan = params.get('kegiatan') || '-';
  const tanggal = params.get('tanggal') || '';
  const waktu = params.get('waktu') || '';
  const status = params.get('status') || 'HADIR';

  return (
    <div className="space-y-5">
      <div className="text-center py-6">
        <CheckCircle2 className="mx-auto text-green-500 mb-3" size={64} />
        <h1 className="text-2xl font-bold text-gray-900">ABSENSI BERHASIL</h1>
        <p className="text-gray-600 mt-1">Kehadiran Anda telah tercatat</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
        <Row label="Nama" value={nama} />
        <Row label="Kelas" value={kelas} />
        <Row label="L/P" value={jk} />
        <hr className="border-gray-100" />
        <Row label="Kegiatan" value={kegiatan} />
        {tanggal && <Row label="Tanggal" value={formatWitaDate(tanggal)} />}
        {waktu && (
          <Row
            label="Waktu"
            value={formatWitaTime(waktu)}
            highlight
          />
        )}
        <Row
          label="Status"
          value={status}
          badge={
            status === 'HADIR'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/absensi/history"
          className="bg-white text-center py-3 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:border-pmr-red"
        >
          Lihat Riwayat
        </Link>
        <Link
          href="/absensi"
          className="bg-pmr-red text-white text-center py-3 rounded-xl font-semibold hover:bg-pmr-red-dark"
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
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      {badge ? (
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${badge}`}>
          {value}
        </span>
      ) : (
        <span
          className={`text-sm font-semibold ${
            highlight ? 'text-pmr-red' : 'text-gray-900'
          }`}
        >
          {value}
        </span>
      )}
    </div>
  );
}