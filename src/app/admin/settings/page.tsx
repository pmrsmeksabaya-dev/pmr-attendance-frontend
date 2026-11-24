'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Server, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, OwnerUser } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminSettingsPage() {
  const currentUser = getUser();
  const isOwner = (currentUser?.role || '').toLowerCase() === 'owner';

  const [users, setUsers] = useState<OwnerUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOwner) return;
    setLoading(true);
    api
      .getOwnerUsers()
      .then((res) => setUsers(Array.isArray(res) ? res : []))
      .catch((e: any) => toast.error(e.message || 'Gagal memuat daftar user'))
      .finally(() => setLoading(false));
  }, [isOwner]);

  const handleChangeRole = async (
    userId: string,
    newRole: 'anggota' | 'pengurus' | 'admin' | 'owner'
  ) => {
    try {
      await api.updateUserRole(userId, newRole);
      toast.success(`Role berhasil diubah menjadi ${newRole.toUpperCase()}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (e: any) {
      toast.error(e.message || 'Gagal mengubah role');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Pengaturan Sistem
        </h1>
        <p className="text-xs text-slate-500 dark:text-red-200/75 mt-0.5">
          Preferensi antarmuka dan manajemen hak akses pengurus PMR.
        </p>
      </div>

      {/* Kartu Tampilan & Info Sistem */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm">Tema Tampilan Merah PMR</h2>
            <p className="text-xs text-slate-500 dark:text-red-200/70 mt-0.5">
              Beralih antara mode Merah Terang dan Merah Marun Gelap
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="bg-white dark:bg-[#330C0F] p-5 rounded-2xl border border-slate-200/80 dark:border-red-900/60 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950 text-[#D32F2F] flex items-center justify-center shrink-0">
            <Server size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm">Endpoint API &amp; Bot</h2>
            <p className="text-xs font-mono text-slate-500 truncate">
              api.pmr-smeksabaya.my.id • WA: 6285974335511
            </p>
          </div>
        </div>
      </div>

      {/* Manajemen Role (Khusus Owner) */}
      {isOwner && (
        <div className="bg-white dark:bg-[#330C0F] rounded-2xl border border-slate-200/80 dark:border-red-900/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-red-900/40 flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#D32F2F]" />
            <h2 className="font-extrabold text-sm">
              Manajemen Hak Akses Role (Owner)
            </h2>
          </div>

          {loading ? (
            <div className="py-10 text-center">
              <Loader2 className="animate-spin mx-auto text-[#D32F2F]" size={24} />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-red-900/40">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="px-5 py-3.5 flex items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {u.nama || u.email || u.id}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {[u.nis, u.kelas, u.email].filter(Boolean).join(' • ') ||
                        u.id}
                    </p>
                  </div>

                  <select
                    value={u.role === 'none' ? 'anggota' : u.role}
                    onChange={(e) =>
                      handleChangeRole(
                        u.id,
                        e.target.value as
                          | 'anggota'
                          | 'pengurus'
                          | 'admin'
                          | 'owner'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-red-950/60 border border-slate-200 dark:border-red-900/70 font-bold text-xs"
                  >
                    <option value="anggota">ANGGOTA</option>
                    <option value="pengurus">PENGURUS</option>
                    <option value="admin">ADMIN</option>
                    <option value="owner">OWNER</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}