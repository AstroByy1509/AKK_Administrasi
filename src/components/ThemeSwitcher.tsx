import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeSwitcherProps {
  variant?: 'segmented' | 'compact' | 'icon-only';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'segmented',
  className = ''
}) => {
  const { theme, setTheme, toggleTheme } = useTheme();

  if (variant === 'icon-only') {
    return (
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Ganti ke Warna Cerah (Light Mode)' : 'Ganti ke Warna Gelap (Dark Mode)'}
        aria-label="Toggle tema tampilan"
        className={`relative p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-xs active:scale-95 ${
          theme === 'dark'
            ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700/80 hover:border-amber-500/40'
            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-400'
        } ${className}`}
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 -rotate-12 hover:rotate-0" />
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 ${
          theme === 'dark'
            ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800 hover:border-slate-700'
            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
        } ${className}`}
      >
        {theme === 'dark' ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Warna Cerah</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Warna Gelap</span>
          </>
        )}
      </button>
    );
  }

  // Segmented 2-choice control (Warna Cerah vs Warna Gelap)
  return (
    <div
      className={`relative inline-flex items-center p-1 rounded-xl border transition-all select-none ${
        theme === 'dark'
          ? 'bg-slate-950 border-slate-800 shadow-inner'
          : 'bg-slate-100/90 border-slate-200/90 shadow-inner'
      } ${className}`}
      role="group"
      aria-label="Pilihan Tema Tampilan Web"
    >
      {/* Tombol Warna Cerah */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200 font-extrabold'
            : theme === 'dark'
            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        title="Aktifkan Tampilan Warna Cerah"
      >
        <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
        <span>Warna Cerah</span>
      </button>

      {/* Tombol Warna Gelap */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          theme === 'dark'
            ? 'bg-slate-850 bg-slate-800 text-amber-300 shadow-xs border border-slate-700/80 font-extrabold'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
        title="Aktifkan Tampilan Warna Gelap"
      >
        <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-amber-400' : 'text-slate-500'}`} />
        <span>Warna Gelap</span>
      </button>
    </div>
  );
};
