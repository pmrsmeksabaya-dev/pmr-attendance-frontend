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
  ClipboardList,
  ShieldAlert,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowUpRight,
  FilePlus2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, ProfileResponse, ApiError } from '@/lib/api';
import { isLoggedIn, getUser, clearSession } from '@/lib/auth';
import { formatWitaDate } from '@/lib/time-client';
import { formatKelasJurusan } from '@/lib/jurusan';

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
        <div className="h-52 bg-slate-200/80 dark:bg-red-950/60 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          <div className="col-span-2 sm:col-span-1 h-32 bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-100 dark:border-red-900/50" />
          <div className="h-32 bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-100 dark:border-red-900/50" />
          <div className="h-32 bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-100 dark:border-red-900/50" />
        </div>
        <div className="h-24 bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-100 dark:border-red-900/50" />
      </div>
    );
  }

  const currentRole = (user?.role || 'anggota').toLowerCase();
  const badge = ROLE_BADGES[currentRole] || ROLE_BADGES.anggota;
  const canAccessPengurus = ['pengurus', 'admin', 'owner'].includes(currentRole);
  const canAccessAdmin = ['admin', 'owner'].includes(currentRole);

  const kelasJurusanLabel = profile
    ? formatKelasJurusan(profile.kelas, profile.jurusan)
    : '';

  return (
    <div className="space-y-5">
      {/* HERO CARD: Digital Member ID + Live WITA Clock */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#D32F2F] via-red-700 to-red-950 p-6 text-white shadow-xl shadow-red-950/25 ring-1 ring-white/15">
        {/* Dekorasi Ambient Glow */}
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
          <div className="flex flex-wrap items-center gap-2">
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
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white/95 ring-1 ring-white/20 transition-all shrink-0"
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
            Palang Merah Remaja Wira • SMKN 1 Pringgabaya
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-0.5 truncate">
            {profile?.nama ?? user?.nama ?? 'Anggota PMR'}
          </h2>
          {profile && (
            <p className="text-xs sm:text-sm text-white/90 font-medium mt-1">
              {kelasJurusanLabel}
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
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        {/* Tombol Scan QR */}
        <Link
          href="/absensi/scan"
          className="col-span-2 sm:col-span-1 group rounded-2xl bg-white/95 dark:bg-[#330C0F] backdrop-blur-sm p-5 shadow-sm border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F]/60 dark:hover:border-red-700 hover:shadow-md active:scale-[0.98] transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/80 border border-red-100 dark:border-red-800/60 flex items-center justify-center text-[#D32F2F] dark:text-red-300 group-hover:bg-[#D32F2F] group-hover:text-white transition-colors">
              <QrCode size={24} />
            </div>
            <ArrowUpRight
              size={18}
              className="text-slate-300 dark:text-red-200/40 group-hover:text-[#D32F2F] dark:group-hover:text-red-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
          <div className="mt-4">
            <p className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
              Scan QR
            </p>
            <p className="text-xs text-slate-500 dark:text-red-200/75 mt-0.5">
              Catat kehadiran sesi
            </p>
          </div>
        </Link>

        {/* Tombol Riwayat */}
        <Link
          href="/absensi/history"
          className="group rounded-2xl bg-white/95 dark:bg-[#330C0F] backdrop-blur-sm p-5 shadow-sm border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F]/60 dark:hover:border-red-700 hover:shadow-md active:scale-[0.98] transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/80 border border-red-100 dark:border-red-800/60 flex items-center justify-center text-[#D32F2F] dark:text-red-300 group-hover:bg-[#D32F2F] group-hover:text-white transition-colors">
              <History size={24} />
            </div>
            <ArrowUpRight
              size={18}
              className="text-slate-300 dark:text-red-200/40 group-hover:text-[#D32F2F] dark:group-hover:text-red-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
          <div className="mt-4">
            <p className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
              Riwayat
            </p>
            <p className="text-xs text-slate-500 dark:text-red-200/75 mt-0.5">
              Rekap absensi saya
            </p>
          </div>
        </Link>

        {/* Tombol Ajukan Izin */}
        <Link
          href="/absensi/izin"
          className="group rounded-2xl bg-white/95 dark:bg-[#330C0F] backdrop-blur-sm p-5 shadow-sm border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F]/60 dark:hover:border-red-700 hover:shadow-md active:scale-[0.98] transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/80 border border-red-100 dark:border-red-800/60 flex items-center justify-center text-[#D32F2F] dark:text-red-300 group-hover:bg-[#D32F2F] group-hover:text-white transition-colors">
              <FilePlus2 size={24} />
            </div>
            <ArrowUpRight
              size={18}
              className="text-slate-300 dark:text-red-200/40 group-hover:text-[#D32F2F] dark:group-hover:text-red-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
            />
          </div>
          <div className="mt-4">
            <p className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
              Ajukan Izin
            </p>
            <p className="text-xs text-slate-500 dark:text-red-200/75 mt-0.5">
              Izin &amp; sakit latihan
            </p>
          </div>
        </Link>
      </section>

      {/* PINTASAN PORTAL PENGURUS & ADMIN */}
      {canAccessPengurus && (
        <section className="space-y-2.5">
          <Link
            href="/pengurus"
            className="group relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#330C0F] backdrop-blur-sm p-4 shadow-sm border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F]/70 dark:hover:border-red-700 hover:shadow-md active:scale-[0.99] transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-50 to-red-50 dark:from-red-950 dark:to-rose-950 border border-red-200/60 dark:border-red-800/60 flex items-center justify-center text-[#D32F2F] dark:text-red-300 shrink-0 group-hover:scale-105 transition-transform">
                <ClipboardList size={21} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                    Portal Pengurus PMR
                  </p>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-300 text-[10px] font-bold shrink-0">
                    <Sparkles size={10} />
                    Operasional
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-red-200/75 truncate mt-0.5">
                  Kelola sesi QR, verifikasi izin, kas, inventaris &amp; log UKS
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-red-950 group-hover:bg-[#D32F2F] text-slate-400 dark:text-red-200/70 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
              <ChevronRight size={17} />
            </div>
          </Link>

          {canAccessAdmin && (
            <Link
              href="/admin"
              className="group relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#330C0F] backdrop-blur-sm p-4 shadow-sm border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F]/70 dark:hover:border-red-700 hover:shadow-md active:scale-[0.99] transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-50 to-red-50 dark:from-red-950 dark:to-rose-950 border border-red-200/60 dark:border-red-800/60 flex items-center justify-center text-[#D32F2F] dark:text-red-300 shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldAlert size={21} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                      Portal Admin &amp; Pembina
                    </p>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[10px] font-bold shrink-0">
                      <ShieldCheck size={10} />
                      {currentRole === 'owner' ? 'Owner' : 'Admin'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-red-200/75 truncate mt-0.5">
                    Manajemen data anggota
                    {currentRole === 'owner' ? ', hak akses role' : ''} &amp; rekap
                    sistem
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-red-950 group-hover:bg-[#D32F2F] text-slate-400 dark:text-red-200/70 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                <ChevronRight size={17} />
              </div>
            </Link>
          )}
        </section>
      )}

      {/* PANDUAN SINGKAT */}
      <section className="rounded-2xl bg-white/90 dark:bg-[#330C0F] backdrop-blur-sm border border-slate-200/75 dark:border-red-900/60 p-4 sm:p-5 shadow-2xs">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-red-200/60 mb-3">
          Cara Melakukan Absensi
        </p>
        <div className="space-y-2.5 text-xs text-slate-700 dark:text-red-100/85">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-300 font-bold flex items-center justify-center shrink-0 text-[11px] ring-1 ring-red-200/70 dark:ring-red-800/60">
              1
            </span>
            <span>
              Tekan kartu <strong>Scan QR</strong> untuk mengaktifkan kamera
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-300 font-bold flex items-center justify-center shrink-0 text-[11px] ring-1 ring-red-200/70 dark:ring-red-800/60">
              2
            </span>
            <span>
              Arahkan kamera ke QR Code sesi latihan atau kegiatan dari pengurus
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-300 font-bold flex items-center justify-center shrink-0 text-[11px] ring-1 ring-red-200/70 dark:ring-red-800/60">
              3
            </span>
            <span>Kehadiran dan status waktu tercatat otomatis ke sistem</span>
          </div>
        </div>
      </section>
    </div>
  );
}