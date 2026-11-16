'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, History, QrCode, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { api, ProfileResponse, ApiError } from '@/lib/api';
import { isLoggedIn, getUser, clearSession } from '@/lib/auth';
import { formatWitaDate } from '@/lib/time-client';

export default function BerandaPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const user = getUser();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/absensi/login');
      return;
    }
    api
      .getProfile()
      .then(setProfile)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) return;
        toast.error(e.message);
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    clearSession();
    toast.success('Logout berhasil');
    router.push('/absensi/login');
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Memuat data...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">Selamat datang,</p>
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
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pmr-red to-pmr-red-dark rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
          <Calendar size={14} />
          <span>{formatWitaDate(now)}</span>
        </div>
        <div className="text-4xl font-bold tracking-tight tabular-nums">
          {now.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })}
        </div>
        <div className="text-xs text-white/60 mt-1">WITA (Asia/Makassar)</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/absensi/scan"
          className="bg-pmr-red text-white rounded-2xl p-5 shadow-sm hover:bg-pmr-red-dark transition-colors text-center"
        >
          <QrCode className="mx-auto mb-2" size={32} />
          <p className="font-semibold">Scan QR</p>
          <p className="text-xs text-white/80 mt-1">Mulai absensi</p>
        </Link>
        <Link
          href="/absensi/history"
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-pmr-red transition-colors text-center"
        >
          <History className="mx-auto mb-2 text-pmr-red" size={32} />
          <p className="font-semibold text-gray-900">Riwayat</p>
          <p className="text-xs text-gray-500 mt-1">Absensi saya</p>
        </Link>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-900">
        <p className="font-semibold mb-2">📖 Petunjuk Penggunaan</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Klik tombol "Scan QR" untuk absensi</li>
          <li>Arahkan kamera ke QR Code dari pengurus</li>
          <li>Absensi tercatat otomatis</li>
        </ol>
      </div>
    </div>
  );
}