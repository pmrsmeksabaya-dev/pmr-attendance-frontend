'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { exportToExcel } from '@/lib/exportExcel';

interface AuditLogEntry {
  id: string;
  actor_nama: string;
  actor_role: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT';
  module: 'KAS' | 'UKS' | 'INVENTARIS' | 'ANGGOTA' | 'IZIN';
  summary: string;
  created_at: string;
}

const ACTION_BADGE: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  UPDATE: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  DELETE: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  APPROVE: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  REJECT: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

export default function PengurusAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
  try {
    setLoading(true);
    const res = await apiFetch<{ data: AuditLogEntry[] }>(
      `/api/pengurus/audit-logs?module=${moduleFilter}&limit=100`
    );
    setLogs(res.data || []);
  } catch (err: any) {
    toast.error(err.message || 'Gagal memuat audit log.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    loadLogs();
  }, [moduleFilter]);

  const handleExport = () => {
    exportToExcel('Audit_Log_PMR_Wira', 'Audit Log', logs, [
      { header: 'Waktu', key: (r) => new Date(r.created_at).toLocaleString('id-ID'), width: 22 },
      { header: 'Pelaku', key: 'actor_nama', width: 22 },
      { header: 'Role', key: 'actor_role', width: 12 },
      { header: 'Modul', key: 'module', width: 14 },
      { header: 'Aksi', key: 'action', width: 12 },
      { header: 'Ringkasan Aktivitas', key: 'summary', width: 50 },
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <ShieldCheck className="h-6 w-6 text-[#D32F2F]" />
            Audit Log & Keamanan Operasional
          </h1>
          <p className="text-sm text-gray-600 dark:text-red-200/70">
            Jejak rekam otomatis seluruh perubahan data di Portal Pengurus & Bot WhatsApp.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadLogs}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 hover:bg-red-50 dark:border-red-900/50 dark:bg-[#330C0F] dark:text-red-100"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D32F2F] px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Download className="h-4 w-4" />
            Ekspor Log
          </button>
        </div>
      </div>

      {/* Filter Modul */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'KAS', 'UKS', 'INVENTARIS', 'IZIN', 'ANGGOTA'].map((mod) => (
          <button
            key={mod}
            onClick={() => setModuleFilter(mod)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              moduleFilter === mod
                ? 'bg-[#D32F2F] text-white'
                : 'border border-red-100 bg-white text-gray-700 hover:bg-red-50 dark:border-red-900/40 dark:bg-[#330C0F] dark:text-red-200'
            }`}
          >
            {mod === 'ALL' ? 'Semua Modul' : mod}
          </button>
        ))}
      </div>

      {/* List Log */}
      <div className="overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm dark:border-red-900/40 dark:bg-[#330C0F]">
        <div className="divide-y divide-red-100/70 dark:divide-red-900/30">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-red-200/70">Memuat jejak audit...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-red-200/70">Belum ada aktivitas tercatat.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${ACTION_BADGE[log.action] || ''}`}>
                      {log.action}
                    </span>
                    <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-[#D32F2F] dark:bg-[#230709] dark:text-red-300">
                      {log.module}
                    </span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-white">{log.actor_nama}</span>
                    <span className="text-[11px] uppercase text-gray-400">({log.actor_role})</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-red-100">{log.summary}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-gray-500 dark:text-red-200/60">
                  {new Date(log.created_at).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}