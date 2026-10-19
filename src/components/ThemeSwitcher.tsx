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
        title={theme === 'dark' ? 'Ganti ke Warna Cerah (Neumorphic Light)' : 'Ganti ke Warna Gelap (Neumorphic Dark)'}
        aria-label="Toggle tema tampilan"
        className={`relative p-2.5 rounded-xl neu-button transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
          theme === 'dark'
            ? 'text-amber-400 hover:text-amber-300 hover:shadow-[0_0_12px_rgba(245,158,11,0.5)]'
            : 'text-indigo-600 hover:text-indigo-700 hover:shadow-[0_0_12px_rgba(79,70,229,0.4)]'
        } ${className}`}
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-300 -rotate-12 hover:rotate-0 drop-shadow-[0_0_6px_rgba(79,70,229,0.6)]" />
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl neu-button text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
          theme === 'dark'
            ? 'text-slate-200 hover:text-amber-300'
            : 'text-slate-700 hover:text-indigo-600'
        } ${className}`}
      >
        {theme === 'dark' ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]" />
            <span>Warna Cerah</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-indigo-600 drop-shadow-[0_0_4px_rgba(79,70,229,0.8)]" />
            <span>Warna Gelap</span>
          </>
        )}
      </button>
    );
  }

  // Segmented 2-choice control (Tactile Neumorphic Soft UI)
  return (
    <div
      className={`relative inline-flex items-center p-1 rounded-2xl neu-pressed select-none transition-all ${className}`}
      role="group"
      aria-label="Pilihan Tema Tampilan Web"
    >
      {/* Tombol Warna Cerah */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
          theme === 'light'
            ? 'neu-flat-sm text-slate-900 font-extrabold border border-white/80 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Aktifkan Tampilan Neumorphic Cerah"
      >
        <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]' : 'text-slate-400'}`} />
        <span>Cerah</span>
      </button>

      {/* Tombol Warna Gelap */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
          theme === 'dark'
            ? 'neu-flat-sm text-amber-300 font-extrabold border border-amber-400/30 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title="Aktifkan Tampilan Neumorphic Gelap"
      >
        <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-cyan-400 drop-shadow-[0_0_6px_rgba(0,242,254,0.8)]' : 'text-slate-500'}`} />
        <span>Gelap</span>
      </button>
    </div>
  );
};
