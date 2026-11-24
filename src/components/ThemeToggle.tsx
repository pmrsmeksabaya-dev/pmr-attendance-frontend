'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pmr_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('pmr_theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ganti Tema"
      title={dark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Merah Marun Gelap'}
      className="p-2 rounded-xl bg-slate-100 dark:bg-red-950/80 text-slate-700 dark:text-red-100 border border-slate-200 dark:border-red-900/60 hover:border-[#D32F2F] transition"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}