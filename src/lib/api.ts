'use client';

import { API_BASE_URL } from './constants';
import { getJwt, clearSession } from './auth';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  auth?: boolean; // default: true (kirim JWT)
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { auth = true, headers = {}, ...rest } = options;

  const isFormData =
    typeof FormData !== 'undefined' && rest.body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const jwt = getJwt();
    if (jwt) finalHeaders['Authorization'] = `Bearer ${jwt}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  // Kalau 401 → session expired (kecuali saat sedang memanggil endpoint verify-magic)
  if (res.status === 401 && !path.includes('/api/auth/verify-magic')) {
    clearSession();
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else if (currentPath.startsWith('/pengurus')) {
        window.location.href = '/pengurus/login';
      } else {
        window.location.href = '/absensi/login';
      }
    }
    throw new ApiError('Sesi login kedaluwarsa. Silakan login ulang.', 401);
  }

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new ApiError(
      data?.error || data?.message || 'Request gagal.',
      res.status
    );
  }

  return data as T;
}

// ============================================================
// ENDPOINT INTERFACES
// ============================================================

export type LoginPortal = 'member' | 'admin' | 'pengurus';

export interface ValidateTokenResult {
  session_id: number;
  activity_id: number | null;
  nama_kegiatan: string;
  tanggal_kegiatan: string;
  waktu_mulai: string;
  lokasi: string | null;
}

export interface AttendanceResult {
  id: number;
  session_id: number;
  member_id: number;
  nama: string;
  kelas: string;
  jenis_kelamin: string;
  nama_kegiatan: string;
  tanggal_kegiatan: string;
  waktu_absen: string;
  status_kehadiran: string;
}

export interface HistoryItem {
  id: number;
  waktu_absen: string;
  status_kehadiran: string;
  attendance_sessions: {
    nama_kegiatan: string;
    tanggal_kegiatan: string;
    lokasi: string | null;
  };
}

export interface HistoryResponse {
  data: HistoryItem[];
  summary: {
    HADIR: number;
    TERLAMBAT: number;
    IZIN: number;
    SAKIT: number;
    ALPA: number;
    TOTAL: number;
  };
}

export interface ProfileResponse {
  id: number;
  nama: string;
  kelas: string;
  jurusan: string;
  jenis_kelamin: string;
  nomor_whatsapp: string;
  jabatan: string | null;
  angkatan: string;
  status_anggota: string;
}

export interface AdminMember {
  id: number;
  nis?: string | null;
  nama: string;
  kelas: string;
  jurusan: string;
  jenis_kelamin: 'L' | 'P' | string;
  nomor_whatsapp: string;
  lid?: string | null;
  jid?: string | null;
  jabatan?: string | null;
  angkatan: string;
  email?: string | null;
  keterangan?: string | null;
  status_anggota?: string;
}

export interface CreateMemberPayload {
  nis: string;
  nama: string;
  kelas: string;
  jurusan: string;
  jenis_kelamin: 'L' | 'P';
  nomor_whatsapp: string;
  jabatan?: string;
  angkatan: string;
  email?: string;
  password?: string;
  keterangan?: string;
}

export interface AdminStatsResponse {
  activeMembers: number;
  totalSessions: number;
  todayPresent: number;
  dailyTrend: { date: string; count: number }[];
}

export interface AdminSession {
  id: number;
  nama_kegiatan: string;
  tanggal_kegiatan: string;
  waktu_mulai: string;
  lokasi: string | null;
  status: 'OPEN' | 'CLOSED' | string;
  jumlah_hadir?: number;
  qr_token?: string;
}

export interface OwnerUser {
  id: string; // UUID Supabase Auth
  email?: string | null;
  nama?: string | null;
  nis?: string | null;
  kelas?: string | null;
  created_at?: string;
  role: 'anggota' | 'pengurus' | 'admin' | 'owner' | 'none';
}

// ============================================================
// API CLIENT
// ============================================================

export const api = {
  // Auth (mendukung isolasi portal: member | admin | pengurus)
  verifyMagic: (token: string, portal: LoginPortal = 'member') =>
    apiFetch<{
      jwt: string;
      user: { member_id: number; nama: string; role: string };
    }>('/api/auth/verify-magic', {
      method: 'POST',
      body: JSON.stringify({ token, portal }),
      auth: false,
    }),

  // Public (butuh JWT)
  validateToken: (token: string) =>
    apiFetch<ValidateTokenResult>('/api/public/validate-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  attend: (token: string) =>
    apiFetch<AttendanceResult>('/api/public/attend', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  getHistory: () => apiFetch<HistoryResponse>('/api/public/me/history'),

  getProfile: () => apiFetch<ProfileResponse>('/api/public/me/profile'),

  // Admin & Pengurus — Dashboard Stats
  getAdminStats: () => apiFetch<AdminStatsResponse>('/api/admin/stats'),

  // Admin & Pengurus — Members
  getAdminMembers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    kelas?: string;
    angkatan?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    qs.set('limit', String(params?.limit ?? 20));
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    if (params?.kelas) qs.set('kelas', params.kelas);
    if (params?.angkatan) qs.set('angkatan', params.angkatan);
    return apiFetch<{
      data: AdminMember[];
      total?: number;
      page?: number;
      totalPages?: number;
    }>(`/api/admin/members?${qs.toString()}`);
  },

  createAdminMember: (payload: CreateMemberPayload) =>
    apiFetch<AdminMember>('/api/admin/members', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAdminMember: (
    id: number,
    payload: Partial<CreateMemberPayload> & { status_anggota?: string }
  ) =>
    apiFetch<AdminMember>(`/api/admin/members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  archiveAdminMember: (id: number) =>
    apiFetch<AdminMember>(`/api/admin/members/${id}`, {
      method: 'DELETE',
    }),

  importAdminMembers: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch<{ imported?: number; message?: string; [key: string]: any }>(
      '/api/admin/members/import',
      {
        method: 'POST',
        body: formData,
      }
    );
  },

  // Admin — Sessions
  getAdminSessions: () =>
    apiFetch<{ data: AdminSession[] }>('/api/admin/sessions'),

  createAdminSession: (payload: {
    nama_kegiatan: string;
    tanggal_kegiatan: string;
    waktu_mulai: string;
    lokasi?: string;
    batas_terlambat_menit?: number;
  }) =>
    apiFetch<AdminSession>('/api/admin/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAdminSessionDetail: (id: number) =>
    apiFetch<{
      session: AdminSession;
      qr_token: string | null;
      present: any[];
      absent: any[];
    }>(`/api/admin/sessions/${id}`),

  closeAdminSession: (id: number) =>
    apiFetch<AdminSession>(`/api/admin/sessions/${id}/close`, {
      method: 'POST',
    }),

  deleteAdminSession: (id: number) =>
    apiFetch<{ success: boolean; id: number }>(`/api/admin/sessions/${id}`, {
      method: 'DELETE',
    }),

  // Admin — Reports
  getAdminReports: (params: {
    startDate?: string;
    endDate?: string;
    sessionId?: string;
    kelas?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params.startDate) qs.set('startDate', params.startDate);
    if (params.endDate) qs.set('endDate', params.endDate);
    if (params.sessionId) qs.set('sessionId', params.sessionId);
    if (params.kelas) qs.set('kelas', params.kelas);
    return apiFetch<{ data: any[] }>(`/api/admin/reports?${qs.toString()}`);
  },

  // Owner
  getOwnerUsers: () => apiFetch<OwnerUser[]>('/api/owner/users'),

  updateUserRole: (
    userId: string,
    role: 'anggota' | 'pengurus' | 'admin' | 'owner'
  ) =>
    apiFetch<{ ok: boolean; userId: string; role: string }>(
      `/api/owner/users/${userId}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }
    ),
};