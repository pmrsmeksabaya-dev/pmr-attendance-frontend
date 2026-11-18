'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, History, QrCode, LogOut, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api, ProfileResponse, ApiError } from '@/lib/api';
import { isLoggedIn, getUser, clearSession } from '@/lib/auth';
import { formatWitaDate } from '@/lib/time-client';

const ROLE_BADGES: Record<string, { label: string; style: string }> = {
  owner: { label: 'Owner', style: 'bg-amber-100 text-amber-800 border-amber-200' },
  admin: { label: 'Admin', style: 'bg-red-100 text-pmr-red border-red-200' },
  pengurus: { label: 'Pengurus', style: 'bg-blue-100 text-blue-800 border-blue-200' },
  anggota: { label: 'Anggota', style: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function BerandaPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/absensi/login');
      return;
    }

    api
      .getProfile()
      .then(setProfile)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          clearSession();
          toast.error('Sesi login telah berakhir, silakan masuk kembali.');
          router.replace('/absensi/login');
          return;
        }
        toast.error(e.message || 'Gagal memuat profil');
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    clearSession();
    toast.success('Logout berhasil');
    router.replace('/absensi/login');
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-white rounded-2xl border border-gray-100" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 bg-gray-200 rounded-2xl" />
          <div className="h-28 bg-white rounded-2xl border border-gray-100" />
        </div>
      </div>
    );
  }

  const currentRole = (user?.role || 'anggota').toLowerCase();
  const badge = ROLE_BADGES[currentRole] || ROLE_BADGES.anggota;

  return (
    <div className="space-y-5">
      {/* Kartu Profil Anggota */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">Selamat datang,</p>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.style}`}
              >
                <ShieldCheck size={11} />
                {badge.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-1">
              {profile?.nama ?? user?.nama ?? 'Anggota'}
            </h2>
            {profile && (
              <p className="text-sm text-gray-600 mt-1">
                {profile.kelas} • {profile.jurusan}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-pmr-red transition-colors"
            title="Keluar dari akun"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Kartu Jam Digital WITA */}
      <div className="bg-gradient-to-br from-pmr-red to-pmr-red-dark rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 text-white/85 text-sm mb-1">
          <Calendar size={14} />
          <span>{now ? formatWitaDate(now) : 'Memuat tanggal...'}</span>
        </div>
        <div className="text-4xl font-bold tracking-tight tabular-nums">
          {now
            ? now.toLocaleTimeString('id-ID', {
                timeZone: 'Asia/Makassar',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })
            : '--.--.--'}
        </div>
        <div className="text-xs text-white/70 mt-1">WITA (Asia/Makassar)</div>
      </div>

      {/* Menu Utama */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/absensi/scan"
          className="bg-pmr-red text-white rounded-2xl p-5 shadow-sm hover:bg-pmr-red-dark active:scale-[0.99] transition-all text-center flex flex-col items-center justify-center"
        >
          <QrCode className="mb-2" size={32} />
          <p className="font-semibold">Scan QR</p>
          <p className="text-xs text-white/80 mt-1">Mulai absensi</p>
        </Link>
        <Link
          href="/absensi/history"
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-pmr-red active:scale-[0.99] transition-all text-center flex flex-col items-center justify-center"
        >
          <History className="mb-2 text-pmr-red" size={32} />
          <p className="font-semibold text-gray-900">Riwayat</p>
          <p className="text-xs text-gray-500 mt-1">Absensi saya</p>
        </Link>
      </div>

      {/* Panduan Singkat */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-900">
        <p className="font-semibold mb-2">📖 Petunjuk Penggunaan</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Klik tombol <strong>&ldquo;Scan QR&rdquo;</strong> untuk membuka kamera</li>
          <li>Arahkan kamera ke QR Code sesi latihan/kegiatan dari pengurus</li>
          <li>Kehadiran Anda akan tercatat secara otomatis</li>
        </ol>
      </div>
    </div>
  );
}