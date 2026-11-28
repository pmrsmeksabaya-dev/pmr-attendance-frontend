'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Server,
  Loader2,
  Search,
  RefreshCw,
  Copy,
  Check,
  X,
  RotateCcw,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, OwnerUser, ApiError } from '@/lib/api';
import { getUser, clearSession } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/constants';
import { ThemeToggle } from '@/components/ThemeToggle';

type RoleOption = 'anggota' | 'pengurus' | 'admin' | 'owner';
type RoleFilter = 'ALL' | RoleOption;

const BOT_WA_NUMBER = '6285974335511';

const ROLE_BADGE_STYLES: Record<RoleOption, string> = {
  owner:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/60',
  admin:
    'bg-red-50 text-[#D32F2F] border-red-200 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800/60',
  pengurus:
    'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:border-sky-800/60',
  anggota:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-red-950/50 dark:text-red-200/80 dark:border-red-900/60',
};

function normalizeUserRole(rawRole?: string | null): RoleOption {
  const lower = (rawRole || '').toLowerCase().trim();
  if (lower === 'owner' || lower === 'admin' || lower === 'pengurus') {
    return lower;
  }
  return 'anggota';
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const currentUser = getUser();
  const isOwner = (currentUser?.role || '').toLowerCase() === 'owner';

  const [users, setUsers] = useState<OwnerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [copiedField, setCopiedField] = useState<'api' | 'wa' | null>(null);

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

  const fetchOwnerUsers = useCallback(async () => {
    if (!isOwner) return;
    setLoading(true);
    try {
      const res = await api.getOwnerUsers();
      setUsers(Array.isArray(res) ? res : []);
    } catch (e: any) {
      if (handleUnauthorized(e)) return;
      toast.error(e?.message || 'Gagal memuat daftar user');
    } finally {
      setLoading(false);
    }
  }, [isOwner, handleUnauthorized]);

  useEffect(() => {
    fetchOwnerUsers();
  }, [fetchOwnerUsers]);

  const handleChangeRole = async (userId: string, newRole: RoleOption) => {
    if (updatingUserId) return;
    setUpdatingUserId(userId);
    try {
      await api.updateUserRole(userId, newRole);
      toast.success(`Role berhasil diubah menjadi ${newRole.toUpperCase()}`);
      setUsers((prev) =>
        prev.map((u) =>
          String(u.id) === String(userId) ? { ...u, role: newRole } : u
        )
      );
    } catch (e: any) {
      if (!handleUnauthorized(e)) {
        toast.error(e?.message || 'Gagal mengubah role');
      }
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCopy = async (text: string, field: 'api' | 'wa') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(
        field === 'api'
          ? 'URL Endpoint API disalin'
          : 'Nomor Bot WhatsApp disalin'
      );
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Gagal menyalin ke clipboard');
    }
  };

  const roleCounts = useMemo(() => {
    const counts: Record<RoleFilter, number> = {
      ALL: users.length,
      owner: 0,
      admin: 0,
      pengurus: 0,
      anggota: 0,
    };

    users.forEach((u) => {
      const normalized = normalizeUserRole(u.role);
      counts[normalized] += 1;
    });

    return counts;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      const normalizedRole = normalizeUserRole(u.role);
      if (roleFilter !== 'ALL' && normalizedRole !== roleFilter) {
        return false;
      }

      if (!q) return true;
      const haystack = [u.nama, u.nis, u.kelas, u.email, String(u.id)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, search, roleFilter]);

  const cleanApiHost = API_BASE_URL.replace(/^https?:\/\//, '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pengaturan Sistem
          </h1>
          <p className="text-xs text-slate-500 dark:text-red-200/75 mt-0.5">
            Preferensi antarmuka, informasi layanan, dan manajemen hak akses pengurus PMR.
          </p>
        </div>

        {currentUser && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#330C0F] border border-slate-200/80 dark:border-red-900/60 text-xs self-start sm:self-auto">
            <UserCheck size={14} className="text-[#D32F2F] shrink-0" />
            <span className="font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
              {currentUser.nama}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                ROLE_BADGE_STYLES[normalizeUserRole(currentUser.role)]
              }`}
            >
              {normalizeUserRole(currentUser.role)}
            </span>
          </div>
        )}
      </div>

      {/* Kartu Tampilan & Info Sistem */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              Tema Tampilan Merah PMR
            </h2>
            <p className="text-xs text-slate-500 dark:text-red-200/70 mt-0.5">
              Beralih antara mode Merah Terang dan Merah Marun Gelap
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950 text-[#D32F2F] dark:text-red-300 flex items-center justify-center shrink-0">
              <Server size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Endpoint API &amp; Bot
              </h2>
              <p className="text-xs font-mono text-slate-500 dark:text-red-200/75 truncate mt-0.5">
                {cleanApiHost} • WA: {BOT_WA_NUMBER}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => handleCopy(API_BASE_URL, 'api')}
              title="Salin URL API"
              className="p-2 rounded-xl bg-slate-50 dark:bg-red-950/70 border border-slate-200 dark:border-red-900/60 text-slate-600 dark:text-red-200 hover:border-[#D32F2F] hover:text-[#D32F2F] transition"
            >
              {copiedField === 'api' ? (
                <Check size={14} className="text-emerald-600" />
              ) : (
                <Copy size={14} />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleCopy(BOT_WA_NUMBER, 'wa')}
              title="Salin Nomor WA Bot"
              className="px-2.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/80 text-[#D32F2F] dark:text-red-200 text-[11px] font-bold hover:bg-red-100 dark:hover:bg-red-900 transition"
            >
              {copiedField === 'wa' ? 'WA Tersalin' : 'Salin WA'}
            </button>
          </div>
        </div>
      </div>

      {/* Manajemen Role (Khusus Owner) */}
      {isOwner && (
        <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#D32F2F] shrink-0" />
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Manajemen Hak Akses Role (Owner)
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-red-200/65">
                  Atur hak akses portal Anggota, Pengurus, Admin, dan Owner.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={fetchOwnerUsers}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-red-950/60 border border-slate-200 dark:border-red-900/60 text-xs font-bold text-slate-700 dark:text-red-100 hover:border-[#D32F2F] disabled:opacity-50 self-start sm:self-auto transition"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter Bar Role & Pencarian */}
          <div className="px-5 py-3 bg-slate-50/70 dark:bg-red-950/35 border-b border-slate-100 dark:border-red-900/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: 'ALL', label: 'Semua' },
                  { key: 'owner', label: 'Owner' },
                  { key: 'admin', label: 'Admin' },
                  { key: 'pengurus', label: 'Pengurus' },
                  { key: 'anggota', label: 'Anggota' },
                ] as { key: RoleFilter; label: string }[]
              ).map((tab) => {
                const active = roleFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRoleFilter(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                      active
                        ? 'bg-[#D32F2F] text-white shadow-2xs'
                        : 'bg-white dark:bg-[#330C0F] border border-slate-200/80 dark:border-red-900/60 text-slate-600 dark:text-red-200/80 hover:border-[#D32F2F]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 rounded-full text-[10px] font-mono ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-red-950 text-slate-700 dark:text-red-200'
                      }`}
                    >
                      {roleCounts[tab.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama, NIS, atau kelas..."
                className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-white dark:bg-red-950/50 border border-slate-200 dark:border-red-900/70 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D32F2F]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-red-200"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center">
              <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={24} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-10 px-5 text-center text-xs text-slate-500 dark:text-red-200/65 space-y-2">
              <p>Tidak ada pengguna yang cocok dengan filter aktif.</p>
              {(search.trim() || roleFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setRoleFilter('ALL');
                  }}
                  className="inline-flex items-center gap-1 font-bold text-[#D32F2F] dark:text-red-300 hover:underline"
                >
                  <RotateCcw size={12} />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-red-900/40 max-h-[32rem] overflow-y-auto">
              {filteredUsers.map((u) => {
                const normalizedRole = normalizeUserRole(u.role);
                const isSelf =
                  currentUser?.member_id !== undefined &&
                  String(u.id) === String(currentUser.member_id);
                const isRowUpdating = String(updatingUserId) === String(u.id);

                return (
                  <div
                    key={u.id}
                    className="px-5 py-3.5 flex items-center justify-between gap-4 text-xs hover:bg-red-50/30 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {u.nama || u.email || u.id}
                        </p>
                        {isSelf && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/60 text-[10px] font-bold">
                            Akun Anda
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-red-200/70 truncate mt-0.5">
                        {[u.nis, u.kelas, u.email].filter(Boolean).join(' • ') ||
                          u.id}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isRowUpdating && (
                        <Loader2
                          size={14}
                          className="animate-spin text-[#D32F2F]"
                        />
                      )}
                      <select
                        value={normalizedRole}
                        disabled={isSelf || isRowUpdating}
                        title={
                          isSelf
                            ? 'Tidak dapat mengubah role akun sendiri'
                            : 'Ubah hak akses role'
                        }
                        onChange={(e) =>
                          handleChangeRole(
                            String(u.id),
                            e.target.value as RoleOption
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl border font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#D32F2F] disabled:opacity-60 transition ${
                          ROLE_BADGE_STYLES[normalizedRole]
                        }`}
                      >
                        <option value="anggota">ANGGOTA</option>
                        <option value="pengurus">PENGURUS</option>
                        <option value="admin">ADMIN</option>
                        <option value="owner">OWNER</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}