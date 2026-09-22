import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Truck,
  MapPin,
  FileSpreadsheet,
  Users,
  Database,
  Radio,
  History,
  Menu,
  X,
  LogOut,
  LogIn,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Building2,
  ShoppingBag,
  Activity,
  Timer,
  Award,
  Settings,
  Briefcase,
  Layers,
  Sparkles,
  User,
  ShieldAlert,
  Percent,
  TrendingUp,
  Wrench,
  Fuel,
  Globe,
  Megaphone
} from 'lucide-react';
import { AkkLogo } from './AkkLogo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { UserProfile } from '../types';
import { logisticsStore } from '../services/store';

export type NavTab =
  | 'dashboard'
  | 'operational_dashboard'
  | 'schedules'
  | 'fleets'
  | 'spareparts'
  | 'fuel_efficiency'
  | 'crew_history'
  | 'tracking_eval'
  | 'tracksolid'
  | 'sales_dashboard'
  | 'sales_activities'
  | 'sales_schedules'
  | 'sales_loading_duration'
  | 'sales_skill_matrix'
  | 'sales_jobdesk'
  | 'sales_kpi'
  | 'sales_kpi_individual'
  | 'sales_kpi_fines'
  | 'sales_kpi_nusantara'
  | 'sales_kpi_omset'
  | 'customer_map'
  | 'purchasing_dashboard'
  | 'hr_dashboard'
  | 'finance_dashboard'
  | 'warehouse_dashboard'
  | 'marketing_online'
  | 'marketing_offline'
  | 'activity_log'
  | 'users'
  | 'architecture';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAuth: (defaultTab?: 'login' | 'register') => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAuth,
  isMinimized = false,
  onToggleMinimize
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(logisticsStore.getCurrentUser());
  const [pendingUsersCount, setPendingUsersCount] = useState<number>(logisticsStore.getPendingUsersCount());
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLogistikOpen, setIsLogistikOpen] = useState(true);
  const [isSalesAdminOpen, setIsSalesAdminOpen] = useState(true);
  const [isKpiDropdownOpen, setIsKpiDropdownOpen] = useState(false);
  const [isPurchasingOpen, setIsPurchasingOpen] = useState(true);
  const [isHrOpen, setIsHrOpen] = useState(true);
  const [isFinanceOpen, setIsFinanceOpen] = useState(true);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(true);
  const [isMarketingOpen, setIsMarketingOpen] = useState(true);
  const [isRbacOpen, setIsRbacOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  const isKpiActive = currentTab === 'sales_kpi' || (currentTab && currentTab.startsWith('sales_kpi_'));
  useEffect(() => {
    if (isKpiActive) {
      setIsKpiDropdownOpen(true);
    }
  }, [currentTab, isKpiActive]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return logisticsStore.subscribe(() => {
      setCurrentUser(logisticsStore.getCurrentUser());
      setPendingUsersCount(logisticsStore.getPendingUsersCount());
    });
  }, []);

  const handleTabClick = (tabId: NavTab) => {
    onSelectTab(tabId);
    setIsMobileOpen(false);
  };

  const renderNavItem = (
    tab: NavTab,
    label: string,
    icon: React.ReactNode,
    badge?: React.ReactNode
  ) => {
    const isActive = currentTab === tab;
    return (
      <button
        key={tab}
        onClick={() => handleTabClick(tab)}
        title={isMinimized ? label : undefined}
        className={`group relative w-full flex items-center ${isMinimized ? 'justify-center px-1' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
          isActive
            ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/35 shadow-xs'
            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
              isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          >
            {icon}
          </span>
          {!isMinimized && <span className="truncate animate-in fade-in duration-300">{label}</span>}
        </div>

        {!isMinimized && (
          badge ? (
            badge
          ) : isActive ? (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-xs" />
          ) : null
        )}
      </button>
    );
  };

  const renderSidebarContent = () => (
    <div className="h-full flex flex-col justify-between overflow-y-auto bg-slate-900 border-r border-slate-800/90 selection:bg-amber-500 selection:text-slate-950">
      {/* Brand Header & User Session Card */}
      <div className={`border-b border-slate-800/80 ${isMinimized ? 'p-3 flex flex-col items-center justify-center' : 'p-4'}`}>
        {isMinimized ? (
          <div className="flex flex-col items-center gap-2.5 w-full">
            {/* Centered Monogram Vector Logo */}
            <div
              onClick={() => handleTabClick('dashboard')}
              className="cursor-pointer hover:scale-105 transition-transform"
              title="PT Anugrah Kemasan Kreatif - Klik untuk Dashboard Utama"
            >
              <AkkLogo size="md" showText={false} />
            </div>

            {/* Maximize Sidebar Toggle Button */}
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="p-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700/60 shadow-xs hover:scale-105 transition cursor-pointer"
                title="Perbesar Sidebar (Tampilkan Nama & Menu Lengkap)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Compact User Avatar with Online Dot */}
            <div className="relative mt-1">
              <div
                onClick={() => onOpenAuth('login')}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xs shadow-md cursor-pointer hover:scale-105 transition-transform"
                title={`${currentUser.fullName || 'User'} (${currentUser.role}) - Klik untuk Ganti Akun / Login`}
              >
                {currentUser.fullName ? currentUser.fullName.substring(0, 1).toUpperCase() : 'U'}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                  currentUser.status === 'approved'
                    ? 'bg-emerald-400'
                    : currentUser.status === 'pending'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-400'
                }`}
                title={`Status Akun: ${currentUser.status}`}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between w-full">
              <div
                onClick={() => handleTabClick('dashboard')}
                className="cursor-pointer hover:opacity-95 transition-opacity"
              >
                <AkkLogo size="md" showText={true} />
              </div>
              {onToggleMinimize && (
                <button
                  onClick={onToggleMinimize}
                  className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800/80 transition cursor-pointer"
                  title="Minimalkan Sidebar (Hanya Tampilkan Logo)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* User Session Mini Card */}
            <div className="mt-3.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-2.5 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xs shadow-sm">
                      {currentUser.fullName ? currentUser.fullName.substring(0, 1).toUpperCase() : 'U'}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                        currentUser.status === 'approved'
                          ? 'bg-emerald-400'
                          : currentUser.status === 'pending'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-rose-400'
                      }`}
                      title={`Status: ${currentUser.status}`}
                    />
                  </div>

                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-white truncate max-w-[130px]">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {currentUser.role === 'super_admin' && '👑 Super Admin / Mgr'}
                      {currentUser.role === 'dispatcher' && '🚛 Dispatcher Logistik'}
                      {currentUser.role === 'driver' && '🚚 Kru Supir Utama'}
                      {currentUser.role === 'sales_admin' && '💼 Admin Penjualan'}
                      {currentUser.role === 'purchasing_admin' && '🛒 Admin Pembelian'}
                      {currentUser.role === 'hr_admin' && '👥 HR Admin'}
                      {currentUser.role === 'finance_tax_admin' && '💰 Finance & Tax Admin'}
                      {currentUser.role === 'warehouse_admin' && '📦 Admin Gudang'}
                      {currentUser.role === 'marketing_online' && '🌐 Marketing Online'}
                      {currentUser.role === 'marketing_offline' && '📣 Marketing Offline'}
                    </div>
                  </div>
                </div>

                {/* Approval Badge */}
                <div>
                  {currentUser.status === 'approved' ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Approved
                    </span>
                  ) : currentUser.status === 'pending' ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      Pending
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Ditolak
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Ganti Akun / Login</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  Daftar Baru
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Structured Navigation Menu */}
      <nav className={`${isMinimized ? 'p-2 space-y-2' : 'p-3 space-y-4'} flex-1 overflow-x-hidden`}>
        {/* ============================================================ */}
        {/* MENU UTAMA PALING ATAS: DASHBOARD (RANGKUMAN OPERASIONAL & PENJUALAN) */}
        {/* ============================================================ */}
        <div className="space-y-1 pb-2 border-b border-slate-800/70">
          {!isMinimized && (
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dashboard Utama</span>
              </span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Rangkuman
              </span>
            </div>
          )}
          {renderNavItem(
            'dashboard',
            'Dashboard',
            <LayoutDashboard className="w-4 h-4" />,
            !isMinimized ? (
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                currentTab === 'dashboard'
                  ? 'bg-slate-950/20 text-slate-950 font-black'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}>
                Ops + Sales
              </span>
            ) : undefined
          )}
        </div>

        {/* ============================================================ */}
        {/* BAGIAN 1: LOGISTIK & PENGIRIMAN                             */}
        {/* ============================================================ */}
        {(currentUser.role === 'super_admin' || currentUser.role === 'dispatcher' || currentUser.role === 'driver') && (
          <div className="space-y-1">
            {isMinimized ? (
              <div className="pt-2 pb-1 flex justify-center" title="Logistik & Pengiriman">
                <div className="w-6 h-px bg-slate-800" />
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 mb-1.5">
                <button
                  onClick={() => setIsLogistikOpen(!isLogistikOpen)}
                  className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-amber-400 transition cursor-pointer text-left w-full"
                >
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Logistik & Pengiriman</span>
                  <span className="ml-auto text-slate-500 flex items-center gap-1.5">
                    {isLogistikOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200" />
                    )}
                  </span>
                </button>
              </div>
            )}

            {(!isMinimized ? isLogistikOpen : true) && (
              <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l border-blue-500/25 ml-2.5 my-1' : ''}`}>
                {renderNavItem('operational_dashboard', 'Dashboard Operasional', <Truck className="w-4 h-4" />, <span className="text-[9px] font-medium bg-blue-500/10 text-blue-400 px-1.5 py-0.2 rounded-full border border-blue-500/20">8</span>)}
                {renderNavItem('schedules', 'Jadwal & Penugasan', <Calendar className="w-4 h-4" />)}
                {renderNavItem('fleets', 'Armada & Kru Supir', <Truck className="w-4 h-4" />)}
                {renderNavItem(
                  'fuel_efficiency',
                  'Efisiensi BBM',
                  <Fuel className="w-4 h-4" />
                )}
                {renderNavItem(
                  'spareparts',
                  'Manajemen Sparepart',
                  <Wrench className="w-4 h-4" />
                )}
                {renderNavItem('crew_history', 'Histori & Otorisasi Kru', <History className="w-4 h-4" />)}
                {renderNavItem('tracking_eval', 'Evaluasi Jalur (Excel)', <FileSpreadsheet className="w-4 h-4" />)}
                {renderNavItem(
                  'tracksolid',
                  'Akses Tracksolid GPS',
                  <Radio className="w-4 h-4" />
                )}
              </div>
            )}
          </div>
        )}



        {/* ============================================================ */}
        {/* BAGIAN 1: GUDANG                                            */}
        {/* ============================================================ */}
        {(currentUser.role === 'super_admin' || currentUser.role === 'warehouse_admin') && (
          <div className={`space-y-1 ${!isMinimized ? 'pt-2 border-t border-slate-800/60' : ''}`}>
            {isMinimized ? (
              <div className="pt-2 pb-1 flex justify-center" title="Gudang">
                <div className="w-6 h-px bg-slate-800" />
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 mb-1.5">
                <button
                  onClick={() => setIsWarehouseOpen(!isWarehouseOpen)}
                  className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-amber-400 transition cursor-pointer text-left w-full"
                >
                  <Building2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Gudang</span>
                  <span className="ml-auto">
                    {isWarehouseOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                </button>
              </div>
            )}
            {(!isMinimized ? isWarehouseOpen : true) && (
              <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l border-rose-500/25 ml-2.5 my-1' : ''}`}>
                {renderNavItem('warehouse_dashboard', 'Dashboard Gudang', <Building2 className="w-4 h-4" />)}
              </div>
            )}
          </div>
        )}

        {/* Marketing */}
        {(currentUser.role === 'super_admin' || currentUser.role === 'marketing_online' || currentUser.role === 'marketing_offline') && (
          <div className={`space-y-1 ${!isMinimized ? 'pt-2 border-t border-slate-800/60' : ''}`}>
            {isMinimized ? (
              <div className="pt-2 pb-1 flex justify-center" title="Marketing">
                <div className="w-6 h-px bg-slate-800" />
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 mb-1.5">
                <button
                  onClick={() => setIsMarketingOpen(!isMarketingOpen)}
                  className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-amber-400 transition cursor-pointer text-left w-full"
                >
                  <Megaphone className="w-3.5 h-3.5 text-orange-400" />
                  <span>Marketing</span>
                  <span className="ml-auto">
                    {isMarketingOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                </button>
              </div>
            )}
            {(!isMinimized ? isMarketingOpen : true) && (
              <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l border-orange-500/25 ml-2.5 my-1' : ''}`}>
                {renderNavItem('marketing_online', 'Marketing Online', <Globe className="w-4 h-4" />)}
                {renderNavItem('marketing_offline', 'Marketing Offline', <Megaphone className="w-4 h-4" />)}
                {renderNavItem('customer_map', 'Jaringan Toko Retail & Mitra', <MapPin className="w-4 h-4" />)}
              </div>
            )}
          </div>
        )}

        {/* Admin Penjualan */}
        {(currentUser.role === 'super_admin' || currentUser.role === 'sales_admin') && (
          <div className={`space-y-1 ${!isMinimized ? 'pt-2 border-t border-slate-800/60' : ''}`}>
            {isMinimized ? (
              <div className="pt-2 pb-1 flex justify-center" title="Admin Penjualan">
                <div className="w-6 h-px bg-slate-800" />
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 mb-1.5">
                <button
                  onClick={() => setIsSalesAdminOpen(!isSalesAdminOpen)}
                  className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-amber-400 transition cursor-pointer text-left w-full"
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Penjualan</span>
                  <span className="ml-auto text-slate-500 flex items-center gap-1.5">
                    {isSalesAdminOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200" />
                    )}
                  </span>
                </button>
              </div>
            )}

            {(!isMinimized ? isSalesAdminOpen : true) && (
              <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l border-amber-500/25 ml-2.5 my-1' : ''}`}>
                {renderNavItem('sales_dashboard', 'Dashboard Penjualan', <ShoppingBag className="w-4 h-4" />, <span className="text-[9px] font-medium bg-amber-500/10 text-amber-400 px-1.5 py-0.2 rounded-full border border-amber-500/20">7</span>)}
                {renderNavItem('sales_activities', 'Aktivitas Harian Admin', <Activity className="w-4 h-4" />)}
                {renderNavItem('sales_schedules', 'Jadwal Admin & Produksi', <Calendar className="w-4 h-4" />)}
                {renderNavItem('sales_loading_duration', 'Durasi Muat Admin', <Timer className="w-4 h-4" />)}
                {renderNavItem('sales_skill_matrix', 'Matriks Skill Admin', <Award className="w-4 h-4" />)}
                {renderNavItem('sales_jobdesk', 'Pengaturan SOP & Jobdesk', <Settings className="w-4 h-4" />)}
                
                {isMinimized ? (
                  <>
                    {renderNavItem('sales_kpi_individual', '1. KPI Individu Staf', <User className="w-3.5 h-3.5" />)}
                    {renderNavItem('sales_kpi_fines', '2. Akumulasi Denda', <ShieldAlert className="w-3.5 h-3.5" />)}
                    {renderNavItem('sales_kpi_nusantara', '3. Persentase Kiriman', <Percent className="w-3.5 h-3.5" />)}
                    {renderNavItem('sales_kpi_omset', '4. Omset Admin Penjualan', <TrendingUp className="w-3.5 h-3.5" />)}
                  </>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={() => setIsKpiDropdownOpen(!isKpiDropdownOpen)}
                      className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                        isKpiActive
                          ? 'bg-amber-500/10 text-amber-300 font-bold border border-amber-500/25'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Sparkles className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isKpiActive ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className="truncate">Data KPI</span>
                      </div>
                      {isKpiDropdownOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>

                    {isKpiDropdownOpen && (
                      <div className="space-y-1 pl-4.5 border-l border-amber-500/15 ml-4 my-1">
                        {renderNavItem('sales_kpi_individual', '1. KPI Individu Staf', <User className="w-3.5 h-3.5" />)}
                        {renderNavItem('sales_kpi_fines', '2. Akumulasi Denda', <ShieldAlert className="w-3.5 h-3.5" />)}
                        {renderNavItem('sales_kpi_nusantara', '3. Persentase Kiriman', <Percent className="w-3.5 h-3.5" />)}
                        {renderNavItem('sales_kpi_omset', '4. Omset Admin Penjualan', <TrendingUp className="w-3.5 h-3.5" />)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {/* Finance */}
        {(currentUser.role === 'super_admin' || currentUser.role === 'finance_tax_admin') && (
          <div className={`space-y-1 ${!isMinimized ? 'pt-2 border-t border-slate-800/60' : ''}`}>
            {isMinimized ? (
              <div className="pt-2 pb-1 flex justify-center" title="Finance & Tax">
                <div className="w-6 h-px bg-slate-800" />
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 mb-1.5">
                <button
                  onClick={() => setIsFinanceOpen(!isFinanceOpen)}
                  className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-amber-400 transition cursor-pointer text-left w-full"
                >
                  <Database className="w-3.5 h-3.5 text-rose-400" />
                  <span>Finance & Tax</span>
                  <span className="ml-auto">
                    {isFinanceOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                </button>
              </div>
            )}
            {(!isMinimized ? isFinanceOpen : true) && (
              <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l border-rose-500/25 ml-2.5 my-1' : ''}`}>
                {renderNavItem('finance_dashboard', 'Dashboard Finance', <Database className="w-4 h-4" />)}
              </div>
            )}
          </div>
        )}

        {/* Purchasing */}
        {(currentUser.role === 'super_admin' || currentUser.role === 'purchasing_admin') && (
          <div className={`space-y-1 ${!isMinimized ? 'pt-2 border-t border-slate-800/60' : ''}`}>
            {isMinimized ? (
              <div className="pt-2 pb-1 flex justify-center" title="Admin Pembelian">
                <div className="w-6 h-px bg-slate-800" />
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 mb-1.5">
                <button
                  onClick={() => setIsPurchasingOpen(!isPurchasingOpen)}
                  className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-amber-400 transition cursor-pointer text-left w-full"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-rose-400" />
                  <span>Admin Pembelian</span>
                  <span className="ml-auto">
                    {isPurchasingOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                </button>
              </div>
            )}
            {(!isMinimized ? isPurchasingOpen : true) && (
              <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l border-rose-500/25 ml-2.5 my-1' : ''}`}>
                {renderNavItem('purchasing_dashboard', 'Dashboard Pembelian', <ShoppingBag className="w-4 h-4" />)}
              </div>
            )}
          </div>
        )}

        {/* HR */}
        {(currentUser.role === 'super_admin' || currentUser.role === 'hr_admin') && (
          <div className={`space-y-1 ${!isMinimized ? 'pt-2 border-t border-slate-800/60' : ''}`}>
            {isMinimized ? (
              <div className="pt-2 pb-1 flex justify-center" title="HR">
                <div className="w-6 h-px bg-slate-800" />
              </div>
            ) : (
              <div className="flex items-center justify-between px-2 mb-1.5">
                <button
                  onClick={() => setIsHrOpen(!isHrOpen)}
                  className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-amber-400 transition cursor-pointer text-left w-full"
                >
                  <Users className="w-3.5 h-3.5 text-rose-400" />
                  <span>HR</span>
                  <span className="ml-auto">
                    {isHrOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                </button>
              </div>
            )}
            {(!isMinimized ? isHrOpen : true) && (
              <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l border-rose-500/25 ml-2.5 my-1' : ''}`}>
                {renderNavItem('hr_dashboard', 'Dashboard HR', <Users className="w-4 h-4" />)}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* BAGIAN: PENGGUNA                                            */}
        {/* ============================================================ */}
        <div className={`space-y-1 ${!isMinimized ? 'pt-2 border-t border-slate-800/60' : ''}`}>
          {isMinimized ? (
            <div className="pt-2 pb-1 flex justify-center" title="Pengguna">
              <div className="w-6 h-px bg-slate-800" />
            </div>
          ) : (
            <div className="px-2 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pengguna</span>
            </div>
          )}

          <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l border-indigo-500/25 ml-2.5 my-1' : ''}`}>
            {renderNavItem('activity_log', 'Log Aktivitas Sistem', <History className="w-4 h-4" />)}

            {/* User Management tab with pending badge */}
            {renderNavItem(
              'users',
              'Manajemen User & Approval',
              <Users className="w-4 h-4" />,
              pendingUsersCount > 0 ? (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                  {pendingUsersCount}
                </span>
              ) : undefined
            )}

            {renderNavItem('architecture', 'Skema SQL Supabase', <Database className="w-4 h-4" />)}
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      {isMinimized ? (
        <div className="p-2 border-t border-slate-800/80 bg-slate-950/60 flex flex-col items-center gap-2">
          <ThemeSwitcher variant="icon-only" />
          <button
            onClick={() => {
              logisticsStore.logoutUser();
              onOpenAuth('login');
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition cursor-pointer"
            title="Keluar Sesi (Logout)"
          >
            <LogOut className="w-4 h-4" />
          </button>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="w-full flex items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 border border-slate-700/60 transition cursor-pointer"
              title="Perbesar Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
          {/* Warehouse Status */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-300">AKK Banyuwangi DC</span>
            </div>
            <span className="font-mono text-emerald-400 text-[10px] font-bold">
              {currentTime}
            </span>
          </div>

          {/* Pilihan Tampilan Web (Warna Cerah & Warna Gelap) */}
          <div className="pt-2.5 border-t border-slate-800/70">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Tampilan Web:</span>
              </span>
              <span className="text-[9px] text-amber-400 font-bold">2 Pilihan</span>
            </div>
            <ThemeSwitcher variant="segmented" className="w-full justify-between" />
          </div>

          {/* Quick RBAC Switcher for testing (Collapsible & Compact) */}
          <div className="pt-2 border-t border-slate-800/70">
            <button
              onClick={() => setIsRbacOpen(!isRbacOpen)}
              className="w-full flex items-center justify-between text-[10px] text-slate-300 font-semibold py-1.5 px-2 rounded-lg bg-slate-950/40 hover:bg-slate-900 border border-slate-800/60 transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">Peran: <strong className="text-amber-300">{currentUser.role}</strong></span>
              </span>
              {isRbacOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </button>

            {isRbacOpen && (
              <div className="grid grid-cols-3 gap-1 text-[10px] mt-2 pt-1 border-t border-slate-800/40">
                <button
                  onClick={() => logisticsStore.setCurrentRole('super_admin')}
                  className={`py-1 px-1 rounded border text-center font-bold transition truncate cursor-pointer ${
                    currentUser.role === 'super_admin'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => logisticsStore.setCurrentRole('dispatcher')}
                  className={`py-1 px-1 rounded border text-center font-bold transition truncate cursor-pointer ${
                    currentUser.role === 'dispatcher'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Dispat
                </button>
                <button
                  onClick={() => logisticsStore.setCurrentRole('sales_admin')}
                  className={`py-1 px-1 rounded border text-center font-bold transition truncate cursor-pointer ${
                    currentUser.role === 'sales_admin'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Sales
                </button>
                <button
                  onClick={() => logisticsStore.setCurrentRole('driver')}
                  className={`py-1 px-1 rounded border text-center font-bold transition truncate cursor-pointer ${
                    currentUser.role === 'driver'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Driver
                </button>
                <button
                  onClick={() => logisticsStore.setCurrentRole('purchasing_admin')}
                  className={`py-1 px-1 rounded border text-center font-bold transition truncate cursor-pointer ${
                    currentUser.role === 'purchasing_admin'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Purch
                </button>
                <button
                  onClick={() => logisticsStore.setCurrentRole('hr_admin')}
                  className={`py-1 px-1 rounded border text-center font-bold transition truncate cursor-pointer ${
                    currentUser.role === 'hr_admin'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  HR
                </button>
                <button
                  onClick={() => logisticsStore.setCurrentRole('finance_tax_admin')}
                  className={`py-1 px-1 rounded border text-center font-bold transition truncate cursor-pointer ${
                    currentUser.role === 'finance_tax_admin'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Fin
                </button>
                <button
                  onClick={() => logisticsStore.setCurrentRole('warehouse_admin')}
                  className={`py-1 px-1 rounded border text-center font-bold transition truncate cursor-pointer ${
                    currentUser.role === 'warehouse_admin'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Gudang
                </button>
                <button
                  onClick={() => logisticsStore.setCurrentRole('marketing_online')}
                  className={`py-1 px-1 rounded border text-center font-bold transition truncate cursor-pointer ${
                    currentUser.role === 'marketing_online'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Mkt On
                </button>
                <button
                  onClick={() => logisticsStore.setCurrentRole('marketing_offline')}
                  className={`py-1 px-1 rounded border text-center font-bold transition truncate cursor-pointer ${
                    currentUser.role === 'marketing_offline'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  Mkt Off
                </button>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              logisticsStore.logoutUser();
              onOpenAuth('login');
            }}
            className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi (Logout)</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Top Header (Only visible on small screens to toggle sidebar) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between shadow-xs">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer transition active:scale-95"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <AkkLogo size="sm" showSubtitle={false} />

        <div className="flex items-center gap-2">
          <ThemeSwitcher variant="icon-only" />
          <button
            onClick={() => onOpenAuth('login')}
            className="p-2 rounded-xl bg-slate-800 text-amber-400 cursor-pointer transition active:scale-95"
            title="Masuk / Kelola Akun"
          >
            <LogIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Sidebar (Fixed on lg+) */}
      <aside className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out ${isMinimized ? 'w-20' : 'w-72'}`}>
        {renderSidebarContent()}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-300 ease-out">
            {renderSidebarContent()}
          </div>
        </div>
      )}
    </>
  );
};
