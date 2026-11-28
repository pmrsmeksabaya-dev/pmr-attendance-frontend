'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  CalendarCheck,
  UserCheck,
  TrendingUp,
  PlusCircle,
  UserPlus,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  QrCode,
  Eye,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  ArrowUpRight,
  ClipboardList,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, AdminStatsResponse, AdminSession, ApiError } from '@/lib/api';
import { getUser, clearSession } from '@/lib/auth';
import { formatWitaDate } from '@/lib/time-client';

export default function AdminDashboardPage() {
  const router = useRouter();
  const user = getUser();
  const currentRole = (user?.role || 'admin').toLowerCase();
  const isOwner = currentRole === 'owner';

  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [recentSessions, setRecentSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const handleUnauthorized = useCallback(
    (err: unknown): boolean => {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        toast.error('Sesi admin telah berakhir, silakan login kembali.');
        router.replace('/admin/login');
        return true;
      }
      return false;
    },
    [router]
  );

  const loadDashboard = useCallback(
    async (silent = false) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [statsRes, sessionsRes] = await Promise.allSettled([
          api.getAdminStats(),
          api.getAdminSessions(),
        ]);

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value);
        } else {
          if (handleUnauthorized(statsRes.reason)) return;
          toast.error(
            statsRes.reason?.message || 'Gagal memuat statistik dashboard'
          );
        }

        if (sessionsRes.status === 'fulfilled') {
          setRecentSessions((sessionsRes.value.data || []).slice(0, 4));
        } else if (handleUnauthorized(sessionsRes.reason)) {
          return;
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [handleUnauthorized]
  );

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  const dailyTrend = stats?.dailyTrend ?? [];
  const maxTrend = Math.max(1, ...dailyTrend.map((item) => item.count));

  const openSessionsCount = useMemo(
    () =>
      recentSessions.filter((s) => (s.status || '').toUpperCase() === 'OPEN')
        .length,
    [recentSessions]
  );

  const attendanceRateToday = useMemo(() => {
    const active = stats?.activeMembers ?? 0;
    const present = stats?.todayPresent ?? 0;
    if (active <= 0 || present <= 0) return 0;
    return Math.min(100, Math.round((present / active) * 100));
  }, [stats]);

  const todayLabel = useMemo(() => formatWitaDate(new Date()), []);

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#D32F2F] via-red-700 to-red-900 rounded-3xl p-6 text-white shadow-lg shadow-red-950/20 ring-1 ring-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"
        />

        <div className="relative space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] font-extrabold uppercase tracking-wider">
              <ShieldCheck size={12} />
              <span>{isOwner ? 'Owner Control' : 'Admin Control'}</span>
            </span>
            <span className="text-[11px] font-medium text-white/85">
              {todayLabel} • WITA
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Halo, {user?.nama || 'Admin PMR'}!
          </h1>
          <p className="text-xs text-white/85 max-w-xl leading-relaxed">
            Ringkasan keaktifan anggota, status sesi QR aktif, dan rekap
            presensi PMR Wira Unit SMKN 1 Pringgabaya.
          </p>
        </div>

        <div className="relative flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={loading || refreshing}
            onClick={() => loadDashboard(true)}
            title="Muat ulang data dashboard"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-50 text-white font-bold text-xs ring-1 ring-white/20 transition"
          >
            <RefreshCw
              size={14}
              className={loading || refreshing ? 'animate-spin' : ''}
            />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/sessions"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#D32F2F] font-extrabold text-xs shadow-sm hover:bg-red-50 transition"
          >
            <PlusCircle size={15} />
            <span>Buat Sesi Absen</span>
          </Link>

          <Link
            href="/admin/members"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs ring-1 ring-white/15 transition"
          >
            <UserPlus size={15} />
            <span>Kelola Anggota</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="py-14 text-center">
          <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={30} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-300 flex items-center justify-center shrink-0">
                  <Users size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 dark:text-red-200/75">
                    Anggota Aktif
                  </p>
                  <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                    {stats?.activeMembers ?? 0}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-red-200/55 mt-0.5">
                    Terdaftar aktif di sistem
                  </p>
                </div>
              </div>
              <Link
                href="/admin/members"
                aria-label="Lihat data anggota"
                className="p-2 rounded-xl text-slate-400 hover:text-[#D32F2F] hover:bg-red-50 dark:hover:bg-red-950 transition shrink-0"
              >
                <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <UserCheck size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 dark:text-red-200/75">
                    Hadir Hari Ini
                  </p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                      {stats?.todayPresent ?? 0}
                    </p>
                    {attendanceRateToday > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        {attendanceRateToday}%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-red-200/55 mt-0.5">
                    Tercatat via QR / manual
                  </p>
                </div>
              </div>
              <Link
                href="/admin/reports"
                aria-label="Lihat laporan kehadiran"
                className="p-2 rounded-xl text-slate-400 hover:text-[#D32F2F] hover:bg-red-50 dark:hover:bg-red-950 transition shrink-0"
              >
                <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <CalendarCheck size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 dark:text-red-200/75">
                    Total Sesi Kegiatan
                  </p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <p className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                      {stats?.totalSessions ?? 0}
                    </p>
                    {openSessionsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        {openSessionsCount} Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-red-200/55 mt-0.5">
                    Latihan &amp; agenda PMR
                  </p>
                </div>
              </div>
              <Link
                href="/admin/sessions"
                aria-label="Kelola sesi absensi"
                className="p-2 rounded-xl text-slate-400 hover:text-[#D32F2F] hover:bg-red-50 dark:hover:bg-red-950 transition shrink-0"
              >
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>

          {/* Grid Utama: Tren Kehadiran 7 Hari + Sesi Terbaru */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* 7-Day Attendance Trend Bar Chart */}
            <div className="lg:col-span-3 bg-white dark:bg-[#330C0F] p-6 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#D32F2F]" />
                  <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Tren Kehadiran 7 Hari Terakhir
                  </h2>
                </div>
                <Link
                  href="/admin/reports"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#D32F2F] dark:text-red-300 hover:underline"
                >
                  <FileSpreadsheet size={14} />
                  <span>Lihat Laporan Lengkap</span>
                </Link>
              </div>

              {dailyTrend.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-xs text-slate-400 dark:text-red-200/60 border border-dashed border-slate-200 dark:border-red-900/50 rounded-2xl">
                  Belum ada data kehadiran dalam 7 hari terakhir.
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-44 pt-4">
                  {dailyTrend.map((item) => {
                    const heightPct = Math.round((item.count / maxTrend) * 100);
                    const shortDate = item.date.slice(5); // MM-DD
                    return (
                      <div
                        key={item.date}
                        title={`${formatWitaDate(item.date)}: ${item.count} hadir`}
                        className="flex flex-col items-center justify-end h-full gap-1.5"
                      >
                        <span className="text-[11px] font-extrabold font-mono text-slate-700 dark:text-red-100">
                          {item.count}
                        </span>
                        <div className="w-full max-w-[44px] h-28 bg-slate-100 dark:bg-red-950/60 rounded-xl flex items-end overflow-hidden p-0.5">
                          <div
                            style={{
                              height: `${Math.max(
                                heightPct,
                                item.count > 0 ? 14 : 5
                              )}%`,
                            }}
                            className={`w-full rounded-lg transition-all duration-300 ${
                              item.count > 0
                                ? 'bg-gradient-to-t from-[#D32F2F] to-red-400'
                                : 'bg-slate-200 dark:bg-red-900/50'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-red-200/70">
                          {shortDate}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sesi Terbaru / Sedang Aktif */}
            <div className="lg:col-span-2 bg-white dark:bg-[#330C0F] p-6 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <QrCode size={18} className="text-[#D32F2F]" />
                    <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Sesi Kegiatan Terbaru
                    </h2>
                  </div>
                  <Link
                    href="/admin/sessions"
                    className="text-xs font-bold text-[#D32F2F] dark:text-red-300 hover:underline"
                  >
                    Semua Sesi
                  </Link>
                </div>

                {recentSessions.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 dark:text-red-200/60 border border-dashed border-slate-200 dark:border-red-900/50 rounded-2xl px-4">
                    Belum ada sesi kegiatan dibuat. Klik <b>Buat Sesi Absen</b>{' '}
                    untuk memulai.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentSessions.map((s) => {
                      const isOpen = (s.status || '').toUpperCase() === 'OPEN';
                      return (
                        <Link
                          key={s.id}
                          href={`/admin/sessions/${s.id}`}
                          className={`group block p-3 rounded-xl border transition-all ${
                            isOpen
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/25 border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400'
                              : 'bg-slate-50/70 dark:bg-red-950/35 border-slate-200/70 dark:border-red-900/50 hover:border-[#D32F2F]/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-[#D32F2F] dark:group-hover:text-red-300 transition-colors">
                              {s.nama_kegiatan}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 ${
                                isOpen
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-200/80 text-slate-600 dark:bg-red-950 dark:text-red-200/75'
                              }`}
                            >
                              {isOpen ? '● OPEN' : 'TUTUP'}
                            </span>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-red-200/70">
                            <span className="inline-flex items-center gap-1 truncate">
                              <Calendar size={11} className="text-[#D32F2F]" />
                              <span>{s.tanggal_kegiatan}</span>
                              {s.waktu_mulai && (
                                <>
                                  <span>•</span>
                                  <Clock size={11} />
                                  <span>{s.waktu_mulai.slice(0, 5)}</span>
                                </>
                              )}
                            </span>

                            <span className="inline-flex items-center gap-1 font-bold text-[#D32F2F] dark:text-red-300 shrink-0">
                              {isOpen ? <QrCode size={12} /> : <Eye size={12} />}
                              <span>{s.jumlah_hadir ?? 0} hadir</span>
                            </span>
                          </div>

                          {s.lokasi && (
                            <p className="mt-1 text-[10px] text-slate-400 dark:text-red-200/55 flex items-center gap-1 truncate">
                              <MapPin size={10} className="shrink-0" />
                              <span className="truncate">{s.lokasi}</span>
                            </p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pintasan Cepat Modul */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Link
              href="/admin/reports"
              className="group bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F] transition flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    Rekap &amp; Export Laporan
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-red-200/70 truncate">
                    Unduh Excel (.xlsx) &amp; cetak PDF
                  </p>
                </div>
              </div>
              <ArrowUpRight
                size={16}
                className="text-slate-400 group-hover:text-[#D32F2F] shrink-0 transition"
              />
            </Link>

            <Link
              href="/pengurus"
              className="group bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F] transition flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <ClipboardList size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    Portal Operasional Pengurus
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-red-200/70 truncate">
                    Verifikasi izin, kas, UKS &amp; inventaris
                  </p>
                </div>
              </div>
              <ArrowUpRight
                size={16}
                className="text-slate-400 group-hover:text-[#D32F2F] shrink-0 transition"
              />
            </Link>

            <Link
              href="/admin/settings"
              className="group bg-white dark:bg-[#330C0F] p-4 rounded-2xl border border-slate-200/80 dark:border-red-900/60 hover:border-[#D32F2F] transition flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-300 flex items-center justify-center shrink-0">
                  <Settings size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {isOwner ? 'Manajemen Role & Sistem' : 'Pengaturan Sistem'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-red-200/70 truncate">
                    {isOwner
                      ? 'Atur hak akses pengurus & tema'
                      : 'Tema tampilan & info server'}
                  </p>
                </div>
              </div>
              <ArrowUpRight
                size={16}
                className="text-slate-400 group-hover:text-[#D32F2F] shrink-0 transition"
              />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}