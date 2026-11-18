'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  History,
  QrCode,
  LogOut,
  ShieldCheck,
  Users,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ProfileResponse, ApiError } from '@/lib/api';
import { isLoggedIn, getUser, clearSession } from '@/lib/auth';
import { formatWitaDate } from '@/lib/time-client';

const ROLE_BADGES: Record<string, { label: string; style: string }> = {
  owner: {
    label: 'Owner',
    style: 'bg-amber-400/20 text-amber-100 border-amber-300/40',
  },
  admin: {
    label: 'Admin',
    style: 'bg-white/20 text-white border-white/35',
  },
  pengurus: {
    label: 'Pengurus',
    style: 'bg-sky-400/20 text-sky-100 border-sky-300/40',
  },
  anggota: {
    label: 'Anggota',
    style: 'bg-white/15 text-white/95 border-white/25',
  },
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
        <div className="h-52 bg-slate-200/80 rounded-3xl" />
        <div className="grid grid-cols-2 gap-3.5">
          <div className="h-32 bg-slate-200/80 rounded-2xl" />
          <div className="h-32 bg-white rounded-2xl border border-slate-100" />
        </div>
        <div className="h-24 bg-white rounded-2xl border border-slate-100" />
      </div>
    );
  }

  const currentRole = (user?.role || 'anggota').toLowerCase();
  const badge = ROLE_BADGES[currentRole] || ROLE_BADGES.anggota;
  const isStaff = ['pengurus', 'admin', 'owner'].includes(currentRole);

  return (
    <div className="space-y-5">
      {/* HERO CARD: Digital Member ID + Live WITA Clock */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pmr-red via-red-600 to-rose-900 p-6 text-white shadow-xl shadow-red-950/20 ring-1 ring-white/15">
        {/* Dekorasi Ambient Glow & Grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/15 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -left-12 h-44 w-44 rounded-full bg-rose-400/20 blur-2xl"
        />

        {/* Baris Atas: Role Badge & Tombol Logout */}
        <div className="relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md ${badge.style}`}
            >
              <ShieldCheck size={13} />
              {badge.label}
            </span>
            {profile?.angkatan && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/20 text-white/90 border border-white/10">
                Angkatan {profile.angkatan}
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-medium text-white/90 ring-1 ring-white/20 transition-all"
            title="Keluar dari akun"
            aria-label="Logout"
          >
            <LogOut size={14} />
            <span>Keluar</span>
          </button>
        </div>

        {/* Identitas Anggota */}
        <div className="relative mt-4">
          <p className="text-xs font-medium text-white/80">
            Palang Merah Remaja • SMKN 1 Pringgabaya
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-0.5 truncate">
            {profile?.nama ?? user?.nama ?? 'Anggota PMR'}
          </h2>
          {profile && (
            <p className="text-xs sm:text-sm text-white/90 font-medium mt-1">
              {profile.kelas} • {profile.jurusan}
              {profile.jabatan ? ` — ${profile.jabatan}` : ''}
            </p>
          )}
        </div>

        {/* Pembatas Kaca */}
        <div className="relative my-4 h-px bg-gradient-to-r from-white/25 via-white/15 to-transparent" />

        {/* Baris Bawah: Jam Digital WITA & Tanggal */}
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-white/85 font-medium">
              <Calendar size={13} />
              <span>{now ? formatWitaDate(now) : 'Memuat tanggal...'}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight tabular-nums mt-0.5">
              {now
                ? now.toLocaleTimeString('id-ID', {
                    timeZone: 'Asia/Makassar',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false,
                  })
                : '--:--:--'}
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 backdrop-blur-md border border-white/15 text-xs font-semibold text-white/95">
            <Clock size={13} className="text-emerald-300" />
            <span>WITA • Asia/Makassar</span>
          </div>
        </div>
      </section>

      {/* MENU AKSI UTAMA */}
      <section className="grid grid-cols-2 gap-3.5">
        {/* Tombol Scan QR (Primary Action) */}
        <Link
          href="/absensi/scan"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-5 text-white shadow-lg shadow-slate-900/15 hover:shadow-xl active:scale-[0.98] transition-all"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/10 to-transparent"
          />
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pmr-red to-red-600 flex items-center justify-center shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
              <QrCode size={25} className="text-white" />
            </div>
            <ArrowUpRight
              size={18}
              className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
          <div className="mt-4">
            <p className="font-bold text-base tracking-tight">Scan QR</p>
            <p className="text-xs text-slate-300 mt-0.5">Catat kehadiran</p>
          </div>
        </Link>

        {/* Tombol Riwayat */}
        <Link
          href="/absensi/history"
          className="group rounded-2xl bg-white/95 backdrop-blur-sm p-5 shadow-sm border border-slate-200/80 hover:border-pmr-red/60 hover:shadow-md active:scale-[0.98] transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-pmr-red group-hover:bg-pmr-red group-hover:text-white transition-colors">
              <History size={25} />
            </div>
            <ArrowUpRight
              size={18}
              className="text-slate-300 group-hover:text-pmr-red group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
          <div className="mt-4">
            <p className="font-bold text-base tracking-tight text-slate-900">
              Riwayat
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Rekap absensi saya</p>
          </div>
        </Link>
      </section>

      {/* PANEL STAFF (PENGURUS / ADMIN / OWNER) */}
      {isStaff && (
        <Link
          href="/absensi/admin"
          className="group relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm p-4 shadow-sm border border-slate-200/80 hover:border-pmr-red/70 hover:shadow-md active:scale-[0.99] transition-all flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-red-50 border border-red-200/60 flex items-center justify-center text-pmr-red shrink-0 group-hover:scale-105 transition-transform">
              <Users size={21} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-slate-900 text-sm truncate">
                  Panel{' '}
                  {currentRole === 'owner'
                    ? 'Owner & Admin'
                    : 'Pengurus & Admin'}
                </p>
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-50 text-pmr-red text-[10px] font-bold">
                  <Sparkles size={10} />
                  Staff
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Kelola data anggota
                {currentRole === 'owner' ? ' & hak akses role' : ''}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-pmr-red text-slate-400 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
            <ChevronRight size={17} />
          </div>
        </Link>
      )}

      {/* PANDUAN SINGKAT */}
      <section className="rounded-2xl bg-white/85 backdrop-blur-sm border border-slate-200/70 p-4 shadow-2xs">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Cara Melakukan Absensi
        </p>
        <div className="space-y-2.5 text-xs text-slate-700">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-red-50 text-pmr-red font-bold flex items-center justify-center shrink-0 text-[11px] ring-1 ring-red-200/70">
              1
            </span>
            <span>
              Tekan kartu <strong>Scan QR</strong> untuk mengaktifkan kamera
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-red-50 text-pmr-red font-bold flex items-center justify-center shrink-0 text-[11px] ring-1 ring-red-200/70">
              2
            </span>
            <span>
              Arahkan kamera ke QR Code sesi latihan atau kegiatan dari pengurus
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-red-50 text-pmr-red font-bold flex items-center justify-center shrink-0 text-[11px] ring-1 ring-red-200/70">
              3
            </span>
            <span>Kehadiran dan status waktu tercatat otomatis ke sistem</span>
          </div>
        </div>
      </section>
    </div>
  );
}