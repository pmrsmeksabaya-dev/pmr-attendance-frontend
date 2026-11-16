'use client';

import { STORAGE_KEYS } from './constants';

export interface AuthUser {
  member_id: number;
  nama: string;
  role: 'anggota' | 'pengurus' | 'admin' | 'owner';
}

export function saveSession(jwt: string, user: AuthUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.JWT, jwt);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function getJwt(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.JWT);
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.JWT);
  localStorage.removeItem(STORAGE_KEYS.USER);
}

export function isLoggedIn(): boolean {
  return !!getJwt();
}