import React, { useState } from 'react';
import { AkkLogo } from './AkkLogo';
import { LogIn, UserPlus, KeyRound, Mail, User, Building, Phone, ShieldCheck, Clock, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { logisticsStore } from '../services/store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login'
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register Form
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'dispatcher' as UserRole,
    department: 'Gudang Distribusi Packaging Banyuwangi',
    password: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const user = logisticsStore.loginUser(loginEmail);
    if (!user) {
      setErrorMsg('Email tidak ditemukan. Silakan periksa kembali atau daftar akun baru.');
      return;
    }

    setSuccessMsg(`Berhasil masuk sebagai ${user.fullName}`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleQuickLogin = (email: string) => {
    const user = logisticsStore.loginUser(email);
    if (user) {
      setSuccessMsg(`Berhasil login sebagai ${user.fullName}`);
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (registerData.password && registerData.password !== registerData.confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }

    const existing = logisticsStore.getUsers().find(u => u.email.toLowerCase() === registerData.email.toLowerCase());
    if (existing) {
      setErrorMsg('Email tersebut sudah terdaftar di sistem AKK.');
      return;
    }

    const newUser = logisticsStore.registerUser({
      fullName: registerData.fullName,
      email: registerData.email,
      phone: registerData.phone,
      role: registerData.role,
      department: registerData.department,
      notes: 'Pendaftaran mandiri melalui portal AKK - Menunggu verifikasi'
    });

    setSuccessMsg(`Pendaftaran berhasil! Akun Anda (${newUser.fullName}) kini berstatus Menunggu Persetujuan (Pending Approval) oleh Manager Operasional AKK.`);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Brand Header */}
        <div className="p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800 text-center">
          <div className="flex justify-center mb-3">
            <AkkLogo size="lg" />
          </div>
          <p className="text-slate-400 text-xs mt-2 max-w-md mx-auto">
            Portal Akses Logistik Terintegrasi & Pengiriman Luar Pulau PT Anugrah Kemasan Kreatif.
          </p>

          {/* Tab Switcher */}
          <div className="flex items-center justify-center gap-2 mt-5 bg-slate-950 p-1 rounded-xl border border-slate-800 max-w-xs mx-auto">
            <button
              onClick={() => { setTab('login'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
                tab === 'login'
                  ? 'bg-amber-600 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk (Login)</span>
            </button>
            <button
              onClick={() => { setTab('register'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
                tab === 'register'
                  ? 'bg-amber-600 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Daftar Akun</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {tab === 'login' ? (
            <div className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Email Karyawan</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="nama@akk-packaging.co.id"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  Masuk ke Portal AKK
                </button>
              </form>

              {/* Quick Login Presets */}
              <div className="pt-4 border-t border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Pilih Akun Cepat (Simulasi Peran):</span>
                  <span className="text-[10px] text-amber-400">1-Click Test</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left text-[11px]">
                  <button
                    onClick={() => handleQuickLogin('admin.logistik@akk-packaging.co.id')}
                    className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition"
                  >
                    <div className="font-bold text-amber-400 flex items-center gap-1">
                      <span>👑 Super Admin</span>
                    </div>
                    <div className="text-slate-300 text-[10px] mt-0.5 truncate">Bayu Novianto Dimas Permana, S.Si</div>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('planner.jawa@akk-packaging.co.id')}
                    className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition"
                  >
                    <div className="font-bold text-blue-400 flex items-center gap-1">
                      <span>🚛 Dispatcher</span>
                    </div>
                    <div className="text-slate-300 text-[10px] mt-0.5 truncate">Dewi Anggraini, S.Log</div>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('driver.zainul@akk-packaging.co.id')}
                    className="p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition"
                  >
                    <div className="font-bold text-emerald-400 flex items-center gap-1">
                      <span>🚚 Supir / Driver</span>
                    </div>
                    <div className="text-slate-300 text-[10px] mt-0.5 truncate">Zainul Agustiar (Driver)</div>
                  </button>

                  <button
                    onClick={() => handleQuickLogin('bayu.nugroho@akk-packaging.co.id')}
                    className="p-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-left transition"
                  >
                    <div className="font-bold text-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>⏳ Akun Pending</span>
                    </div>
                    <div className="text-slate-300 text-[10px] mt-0.5 truncate">Bayu Nugroho (Menunggu)</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bayu Nugroho, S.T."
                    value={registerData.fullName}
                    onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="nama@akk-packaging.co.id"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+62 812-..."
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Peran Diajukan</label>
                  <select
                    value={registerData.role}
                    onChange={(e) => setRegisterData({ ...registerData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="dispatcher">Dispatcher / Planner</option>
                    <option value="driver">Kru Supir Ekspedisi</option>
                    <option value="super_admin">Manager Operasional</option>
                    <option value="marketing_online">Marketing Online</option>
                    <option value="marketing_offline">Marketing Offline</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Departemen / Unit</label>
                  <input
                    type="text"
                    required
                    value={registerData.department}
                    onChange={(e) => setRegisterData({ ...registerData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Konfirmasi Password</label>
                  <input
                    type="password"
                    placeholder="Ulangi password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Approval Notice */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong className="block text-amber-300 font-bold">Prosedur Verifikasi Akun AKK:</strong>
                  Pendaftaran akun baru wajib disetujui (di-approve) oleh Manager Operasional / Administrator Pusat PT Anugrah Kemasan Kreatif sebelum mendapatkan otorisasi pengiriman.
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                Kirim Pendaftaran Akun
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
