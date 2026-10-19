import React, { useState } from 'react';
import { AkkLogo } from './AkkLogo';
import { LogIn, UserPlus, KeyRound, Mail, User, Building, Phone, ShieldCheck, Clock, CheckCircle2, AlertCircle, X, Sparkles, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register Form
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'spv_logistik' as UserRole,
    department: 'Gudang Distribusi Packaging Banyuwangi',
    password: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const user = logisticsStore.loginUser(loginEmail, loginPassword);
    if (!user) {
      setErrorMsg('Username/Email atau Password salah. Silakan periksa kembali.');
      return;
    }

    setSuccessMsg(user.role === 'super_admin' ? 'Berhasil masuk sebagai Super Admin' : `Berhasil masuk sebagai ${user.fullName}`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleQuickLogin = (email: string) => {
    const user = logisticsStore.loginUser(email);
    if (user) {
      setSuccessMsg(user.role === 'super_admin' ? 'Berhasil masuk sebagai Super Admin' : `Berhasil login sebagai ${user.fullName}`);
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

    setSuccessMsg(`Pendaftaran berhasil! Akun "${newUser.fullName}" terdaftar dan menunggu persetujuan (Pending Approval) Super Admin.`);
    setTimeout(() => {
      setTab('login');
      setSuccessMsg('Pendaftaran berhasil! Silakan masuk menggunakan email dan password Anda setelah akun disetujui Super Admin.');
    }, 1200);
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
              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Email / Username</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="admin atau nama@gmail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                      title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                >
                  Masuk ke Portal AKK
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bayu Dimas Permana"
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
                    placeholder="nama@gmail.com"
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
                <div className="relative">
                  <label className="text-slate-300 font-semibold block mb-1">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div className="relative">
                  <label className="text-slate-300 font-semibold block mb-1">Konfirmasi Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ulangi password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Approval Notice */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong className="block text-amber-300 font-bold">Prosedur Verifikasi Akun AKK:</strong>
                  Pendaftaran akun baru wajib disetujui (di-approve) oleh Super Admin PT Anugrah Kemasan Kreatif sebelum mendapatkan otorisasi akses menu.
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
