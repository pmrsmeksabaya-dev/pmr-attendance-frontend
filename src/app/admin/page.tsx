'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  CalendarCheck,
  UserCheck,
  TrendingUp,
  PlusCircle,
  UserPlus,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, AdminStatsResponse } from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function AdminDashboardPage() {
  const user = getUser();
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAdminStats()
      .then((res) => setStats(res))
      .catch((e: any) => toast.error(e.message || 'Gagal memuat statistik'))
      .finally(() => setLoading(false));
  }, []);

  const maxTrend = Math.max(
    1,
    ...(stats?.dailyTrend ?? []).map((item) => item.count)
  );

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="bg-gradient-to-r from-[#D32F2F] to-red-800 rounded-3xl p-6 text-white shadow-lg shadow-red-600/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold mb-2">
            DASHBOARD PENGURUS &amp; ADMIN
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Halo, {user?.nama || 'Admin PMR'}!
          </h1>
          <p className="text-xs text-white/85 mt-1">
            Ringkasan keaktifan anggota dan rekap sesi absensi PMR Wira SMKN 1 Pringgabaya.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/sessions"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#D32F2F] font-extrabold text-xs shadow-sm hover:bg-red-50 transition"
          >
            <PlusCircle size={15} />
            <span>Buat Sesi Absen</span>
          </Link>
          <Link
            href="/admin/members"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition"
          >
            <UserPlus size={15} />
            <span>Kelola Anggota</span>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={28} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950 text-[#D32F2F] flex items-center justify-center shrink-0">
                <Users size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-red-200/75">
                  Anggota Aktif
                </p>
                <p className="text-2xl font-extrabold mt-0.5">
                  {stats?.activeMembers ?? 0}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                <UserCheck size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-red-200/75">
                  Hadir Hari Ini
                </p>
                <p className="text-2xl font-extrabold mt-0.5">
                  {stats?.todayPresent ?? 0}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                <CalendarCheck size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-red-200/75">
                  Total Sesi Kegiatan
                </p>
                <p className="text-2xl font-extrabold mt-0.5">
                  {stats?.totalSessions ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* 7-Day Attendance Trend Bar Chart */}
          <div className="bg-white dark:bg-[#330C0F] p-6 rounded-2xl border border-slate-200/80 dark:border-red-900/60">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-[#D32F2F]" />
                <h2 className="font-extrabold text-sm">
                  Tren Kehadiran 7 Hari Terakhir
                </h2>
              </div>
              <Link
                href="/admin/reports"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#D32F2F] hover:underline"
              >
                <FileSpreadsheet size={14} />
                <span>Lihat Laporan Lengkap</span>
              </Link>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pt-4">
              {(stats?.dailyTrend ?? []).map((item) => {
                const heightPct = Math.round((item.count / maxTrend) * 100);
                const shortDate = item.date.slice(5); // MM-DD
                return (
                  <div
                    key={item.date}
                    className="flex flex-col items-center justify-end h-full gap-1.5"
                  >
                    <span className="text-[11px] font-extrabold text-slate-700 dark:text-red-100">
                      {item.count}
                    </span>
                    <div className="w-full max-w-[44px] h-28 bg-slate-100 dark:bg-red-950/60 rounded-xl flex items-end overflow-hidden">
                      <div
                        style={{ height: `${Math.max(heightPct, item.count > 0 ? 12 : 4)}%` }}
                        className="w-full bg-gradient-to-t from-[#D32F2F] to-red-400 rounded-xl transition-all duration-300"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-red-200/70">
                      {shortDate}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}