import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Truck,
  MapPin,
  FileSpreadsheet,
  FileText,
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
  Megaphone,
  Smartphone,
  Download,
  Zap,
  KeyRound,
  ShieldCheck,
  Video,
  Brush,
  BarChart3
} from 'lucide-react';
import { AkkLogo } from './AkkLogo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { AndroidApkDownloadModal } from './AndroidApkDownloadModal';
import { UserProfile } from '../types';
import { logisticsStore } from '../services/store';
import { driverReportService } from '../services/driverReportService';
import { canAccess } from '../utils/rbac';

export type NavTab =
  | 'dashboard'
  | 'driver_portal'
  | 'driver_reports'
  | 'analytics_reports'
  | 'operational_dashboard'
  | 'schedules'
  | 'fleets'
  | 'spareparts'
  | 'fuel_efficiency'
  | 'crew_history'
  | 'tracking_eval'
  | 'tracksolid'
  | 'fleet_forms'
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
  | 'purchasing_stock_overview'
  | 'purchasing_stock_forecast'
  | 'hr_dashboard'
  | 'ga_security'
  | 'ga_hk'
  | 'ga_aset'
  | 'training_videos'
  | 'training_karyawan'
  | 'finance_dashboard'
  | 'warehouse_dashboard'
  | 'marketing_online'
  | 'marketing_offline'
  | 'activity_log'
  | 'users'
  | 'architecture'
  | 'e2e_testing';

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
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [isLogistikOpen, setIsLogistikOpen] = useState(true);
  const [isSalesAdminOpen, setIsSalesAdminOpen] = useState(true);
  const [isKpiDropdownOpen, setIsKpiDropdownOpen] = useState(false);
  const [isPurchasingOpen, setIsPurchasingOpen] = useState(true);
  const [isPurchasingStockOpen, setIsPurchasingStockOpen] = useState(false);
  const [isHrOpen, setIsHrOpen] = useState(true);
  const [isFinanceOpen, setIsFinanceOpen] = useState(true);
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(true);
  const [isMarketingOpen, setIsMarketingOpen] = useState(true);
  const [isRbacOpen, setIsRbacOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);
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
    const updateReports = () => {
      try {
        const reps = driverReportService.getReports();
        setPendingReportsCount(reps.filter(r => r.status === 'pending').length);
      } catch {}
    };
    updateReports();
    window.addEventListener('driver-report-updated', updateReports);
    return () => window.removeEventListener('driver-report-updated', updateReports);
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

  /**
   * Render Navigation Item with Neon UI Experience V2 Animations
   * - Neumorphic pressed state on active
   * - Smooth neon sweep and slide animation on hover
   * - Glowing vertical neon indicator bar on active item
   * - Subtle cyber neon icon glow
   */
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
        className={`group relative w-full flex items-center ${
          isMinimized ? 'justify-center px-1' : 'justify-between px-3'
        } py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200 ease-out select-none ${
          isActive
            ? 'neu-pressed bg-gradient-to-r from-amber-500/20 via-cyan-500/10 to-transparent text-amber-300 font-bold border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
            : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 hover:translate-x-1 hover:border-cyan-500/30 hover:shadow-[0_0_14px_rgba(6,182,212,0.2)] border border-transparent'
        }`}
      >
        {/* Neon Indicator Vertical Bar (Active Glow V2) */}
        {isActive && (
          <span
            className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-amber-400 via-cyan-400 to-emerald-400 shadow-[0_0_10px_rgba(245,158,11,0.9),0_0_18px_rgba(6,182,212,0.7)]"
            aria-hidden="true"
          />
        )}

        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`shrink-0 transition-all duration-200 ${
              isActive
                ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                : 'text-slate-400 group-hover:text-cyan-400 group-hover:scale-115 group-hover:rotate-3 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
            }`}
          >
            {icon}
          </span>
          {!isMinimized && (
            <span
              className={`truncate transition-colors duration-200 ${
                isActive ? 'text-amber-200 font-bold' : 'group-hover:text-cyan-200'
              }`}
            >
              {label}
            </span>
          )}
        </div>

        {!isMinimized && (
          badge ? (
            badge
          ) : isActive ? (
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-pulse" />
          ) : null
        )}
      </button>
    );
  };

  const renderSidebarContent = () => (
    <div className="h-full flex flex-col justify-between overflow-y-auto sidebar-neon-v2 bg-slate-900/95 border-r border-slate-800/90 neu-flat selection:bg-amber-500 selection:text-slate-950">
      {/* Brand Header & User Session Card with Neon V2 Glow */}
      <div className={`border-b border-slate-800/80 ${isMinimized ? 'p-3 flex flex-col items-center justify-center' : 'p-4'}`}>
        {isMinimized ? (
          <div className="flex flex-col items-center gap-2.5 w-full">
            {/* Centered Monogram Vector Logo with Neon Pulse */}
            <div
              onClick={() => handleTabClick('dashboard')}
              className="cursor-pointer hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
              title="PT Anugrah Kemasan Kreatif - Klik untuk Dashboard Utama"
            >
              <AkkLogo size="md" showText={false} />
            </div>

            {/* Neon V2 Mini Badge */}
            <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider text-cyan-300 bg-cyan-950/70 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.4)]">
              V2
            </span>

            {/* Maximize Sidebar Toggle Button with Neumorphic Elevation */}
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="p-1.5 rounded-xl neu-button text-amber-400 hover:text-cyan-300 border border-slate-700/60 shadow-xs hover:scale-110 transition cursor-pointer"
                title="Perbesar Sidebar (Tampilkan Nama & Menu Lengkap)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Compact User Avatar with Neon Ring */}
            <div className="relative mt-1">
              <div
                onClick={() => onOpenAuth('login')}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-md cursor-pointer hover:scale-110 hover:shadow-[0_0_12px_rgba(245,158,11,0.8)] transition-all"
                title={`${currentUser.fullName || 'User'} (${currentUser.role}) - Klik untuk Ganti Akun / Login`}
              >
                {currentUser.fullName ? currentUser.fullName.substring(0, 1).toUpperCase() : 'U'}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 shadow-[0_0_6px_currentColor] ${
                  currentUser.status === 'approved'
                    ? 'bg-emerald-400 text-emerald-400'
                    : currentUser.status === 'pending'
                    ? 'bg-amber-400 text-amber-400 animate-pulse'
                    : 'bg-rose-400 text-rose-400'
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
                <AkkLogo size="sm" showSubtitle={true} />
              </div>

              {/* Neon UI Experience V2 Badge */}
              <div className="flex items-center gap-1.5">
                <span className="relative flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-950/70 border border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.45)]">
                  <Zap className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                  <span>NEON V2</span>
                </span>
                {onToggleMinimize && (
                  <button
                    onClick={onToggleMinimize}
                    className="p-1 rounded-lg neu-button text-slate-400 hover:text-amber-400 border border-slate-700/60 transition cursor-pointer"
                    title="Minimalkan Sidebar (Hanya Ikon Saja)"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* User Session Profile Card in Neumorphic Style */}
            <div className="mt-3 p-3 rounded-2xl neu-flat-sm border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-amber-500 to-cyan-500 flex items-center justify-center font-black text-slate-950 text-xs shadow-md">
                      {currentUser.fullName ? currentUser.fullName.substring(0, 1).toUpperCase() : 'U'}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 shadow-[0_0_6px_currentColor] ${
                        currentUser.status === 'approved'
                          ? 'bg-emerald-400 text-emerald-400'
                          : currentUser.status === 'pending'
                          ? 'bg-amber-400 text-amber-400 animate-pulse'
                          : 'bg-rose-400 text-rose-400'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {currentUser.role === 'super_admin' && '👑 Super Admin / Mgr'}
                      {currentUser.role === 'spv_logistik' && '🚛 Dispatcher Logistik'}
                      {currentUser.role === 'driver' && '🚚 Kru Supir Utama'}
                      {currentUser.role === 'sales_admin' && '💼 Admin Penjualan'}
                      {currentUser.role === 'purchasing_admin' && '🛒 Admin Pembelian'}
                      {currentUser.role === 'hr_admin' && '👥 HR Admin'}
                      {currentUser.role === 'finance_tax_admin' && '💰 Finance & Tax Admin'}
                      {currentUser.role === 'warehouse_admin' && '📦 Admin Gudang'}
                      {currentUser.role === 'marketing_online' && '🌐 Marketing Online'}
                      {currentUser.role === 'marketing_offline' && '📣 Marketing Offline'}
                      {currentUser.role === 'crew_helper' && '🤝 Kru Helper'}
                    </div>
                  </div>
                </div>

                {/* Approval Badge with Neon Pill */}
                <div>
                  {currentUser.status === 'approved' ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                      Approved
                    </span>
                  ) : currentUser.status === 'pending' ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse">
                      Pending
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      Ditolak
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-amber-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition cursor-pointer"
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
        {/* MENU UTAMA PALING ATAS: DASHBOARD                            */}
        {/* ============================================================ */}
        <div className="space-y-1 pb-2 border-b border-slate-800/70">
          {!isMinimized && (
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 neon-text-amber">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dashboard Utama</span>
              </span>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                Rangkuman
              </span>
            </div>
          )}

          {renderNavItem(
            'dashboard',
            'Dashboard Eksekutif',
            <LayoutDashboard className="w-4 h-4" />,
            !isMinimized ? (
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  currentTab === 'dashboard'
                    ? 'bg-slate-950/60 text-amber-300 font-black border border-amber-400/50'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                Ops + Sales
              </span>
            ) : undefined
          )}
        </div>

        {/* ============================================================ */}
        {/* BAGIAN 1: LOGISTIK & PENGIRIMAN                             */}
        {/* ============================================================ */}
        {(() => {
          const canLogisticsPortal = canAccess(currentUser, 'logistics', 'portal_driver');
          const canLogisticsReports = canAccess(currentUser, 'logistics', 'monitoring_sla');
          const canLogisticsOps = canAccess(currentUser, 'logistics', 'dashboard_logistik');
          const canLogisticsSched = canAccess(currentUser, 'logistics', 'rencana_rute');
          const canLogisticsFleets = canAccess(currentUser, 'logistics', 'armada_ceklis');
          const canLogisticsTrack = canAccess(currentUser, 'logistics', 'live_map');
          const hasLogistics = canLogisticsPortal || canLogisticsReports || canLogisticsOps || canLogisticsSched || canLogisticsFleets || canLogisticsTrack;

          if (!hasLogistics) return null;

          return (
            <div className="space-y-1">
              {isMinimized ? (
                <div className="pt-2 pb-1 flex justify-center" title="Logistik & Pengiriman">
                  <div className="w-6 h-px bg-slate-800" />
                </div>
              ) : (
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <button
                    onClick={() => setIsLogistikOpen(!isLogistikOpen)}
                    className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-cyan-300 transition cursor-pointer text-left w-full"
                  >
                    <Truck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Logistik & Pengiriman</span>
                    <span className="ml-auto text-slate-500 flex items-center gap-1.5">
                      {isLogistikOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200" />
                      )}
                    </span>
                  </button>
                </div>
              )}

              {(!isMinimized ? isLogistikOpen : true) && (
                <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l-2 border-cyan-500/30 ml-2.5 my-1 shadow-[0_0_8px_rgba(6,182,212,0.15)]' : ''}`}>
                  {canLogisticsPortal && renderNavItem(
                    'driver_portal',
                    'Portal Driver Mobile',
                    <Smartphone className="w-4 h-4 text-emerald-400" />,
                    <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                      Mobile View
                    </span>
                  )}
                  {canLogisticsReports && renderNavItem(
                    'driver_reports',
                    'Laporan Kiriman Kru',
                    <MapPin className="w-4 h-4 text-rose-400" />,
                    pendingReportsCount > 0 ? (
                      <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse">
                        {pendingReportsCount} Baru
                      </span>
                    ) : undefined
                  )}
                  {canLogisticsOps && renderNavItem('operational_dashboard', 'Dashboard Operasional', <Truck className="w-4 h-4" />)}
                  {canLogisticsOps && renderNavItem('analytics_reports', 'Analitik Armada & Kru', <BarChart3 className="w-4 h-4 text-amber-400" />)}
                  {canLogisticsSched && renderNavItem('schedules', 'Jadwal & Penugasan', <Calendar className="w-4 h-4" />)}
                  {canLogisticsFleets && renderNavItem('fleets', 'Armada & Kru Supir', <Truck className="w-4 h-4" />)}
                  {canLogisticsFleets && renderNavItem('fuel_efficiency', 'Efisiensi BBM', <Fuel className="w-4 h-4" />)}
                  {canLogisticsFleets && renderNavItem('spareparts', 'Manajemen Sparepart', <Wrench className="w-4 h-4" />)}
                  {canLogisticsFleets && renderNavItem('crew_history', 'Histori & Otorisasi Kru', <History className="w-4 h-4" />)}
                  {canLogisticsReports && renderNavItem('tracking_eval', 'Evaluasi Jalur (Excel)', <FileSpreadsheet className="w-4 h-4" />)}
                  {canLogisticsTrack && renderNavItem('tracksolid', 'Akses Tracksolid GPS', <Radio className="w-4 h-4" />)}
                  {canLogisticsFleets && renderNavItem('fleet_forms', 'Formulir Armada', <FileText className="w-4 h-4" />)}
                </div>
              )}
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/* BAGIAN 2: ADMIN PENJUALAN                                   */}
        {/* ============================================================ */}
        {(() => {
          const canSalesDash = canAccess(currentUser, 'sales_admin', 'dashboard_penjualan');
          const canSalesActs = canAccess(currentUser, 'sales_admin', 'aktivitas_harian');
          const canSalesSched = canAccess(currentUser, 'sales_admin', 'jadwal_admin');
          const canSalesDur = canAccess(currentUser, 'sales_admin', 'durasi_muat');
          const canSalesMat = canAccess(currentUser, 'sales_admin', 'matriks_skil');
          const canSalesJob = canAccess(currentUser, 'sales_admin', 'pengaturan_sop');
          const canSalesKpi = canAccess(currentUser, 'sales_admin', 'data_kpi');
          const hasSales = canSalesDash || canSalesActs || canSalesSched || canSalesDur || canSalesMat || canSalesJob || canSalesKpi;

          if (!hasSales) return null;

          return (
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
                        <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 text-amber-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200" />
                      )}
                    </span>
                  </button>
                </div>
              )}

              {(!isMinimized ? isSalesAdminOpen : true) && (
                <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l-2 border-amber-500/30 ml-2.5 my-1 shadow-[0_0_8px_rgba(245,158,11,0.15)]' : ''}`}>
                  {canSalesDash && renderNavItem('sales_dashboard', 'Dashboard Penjualan', <ShoppingBag className="w-4 h-4" />)}
                  {canSalesActs && renderNavItem('sales_activities', 'Aktivitas Harian Admin', <Activity className="w-4 h-4" />)}
                  {canSalesSched && renderNavItem('sales_schedules', 'Jadwal Admin & Produksi', <Calendar className="w-4 h-4" />)}
                  {canSalesDur && renderNavItem('sales_loading_duration', 'Durasi Muat Admin', <Timer className="w-4 h-4" />)}
                  {canSalesMat && renderNavItem('sales_skill_matrix', 'Matriks Skill Admin', <Award className="w-4 h-4" />)}
                  {canSalesJob && renderNavItem('sales_jobdesk', 'Pengaturan SOP & Jobdesk', <Settings className="w-4 h-4" />)}

                  {canSalesKpi && (
                    <div className="space-y-1">
                      <button
                        onClick={() => setIsKpiDropdownOpen(!isKpiDropdownOpen)}
                        className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          isKpiActive
                            ? 'neu-pressed bg-amber-500/15 text-amber-300 font-bold border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                            : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/50 hover:translate-x-1 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Sparkles className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-115 ${isKpiActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'}`} />
                          <span className="truncate">Data KPI Penjualan</span>
                        </div>
                        {isKpiDropdownOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>

                      {isKpiDropdownOpen && (
                        <div className="space-y-1 pl-3 border-l-2 border-amber-500/25 ml-3 my-1">
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
          );
        })()}

        {/* ============================================================ */}
        {/* BAGIAN 3: GUDANG                                            */}
        {/* ============================================================ */}
        {(() => {
          const canWh = canAccess(currentUser, 'warehouse', 'stok_barang') || canAccess(currentUser, 'warehouse', 'permintaan_barang') || canAccess(currentUser, 'warehouse', 'opname_stok') || canAccess(currentUser, 'warehouse', 'ceklis_muat');
          if (!canWh) return null;

          return (
            <div className={`space-y-1 ${!isMinimized ? 'pt-2 border-t border-slate-800/60' : ''}`}>
              {isMinimized ? (
                <div className="pt-2 pb-1 flex justify-center" title="Gudang">
                  <div className="w-6 h-px bg-slate-800" />
                </div>
              ) : (
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <button
                    onClick={() => setIsWarehouseOpen(!isWarehouseOpen)}
                    className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-cyan-300 transition cursor-pointer text-left w-full"
                  >
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Gudang</span>
                    <span className="ml-auto">
                      {isWarehouseOpen ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                </div>
              )}

              {(!isMinimized ? isWarehouseOpen : true) && (
                <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l-2 border-cyan-500/30 ml-2.5 my-1' : ''}`}>
                  {renderNavItem('warehouse_dashboard', 'Dashboard Gudang', <Building2 className="w-4 h-4" />)}
                </div>
              )}
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/* BAGIAN 4: MARKETING                                         */}
        {/* ============================================================ */}
        {(() => {
          const canMkt = canAccess(currentUser, 'marketing', 'kampanye') || canAccess(currentUser, 'marketing', 'leads_pipeline') || canAccess(currentUser, 'marketing', 'laporan_kunjungan');
          if (!canMkt) return null;

          return (
            <div className={`space-y-1 ${!isMinimized ? 'pt-2 border-t border-slate-800/60' : ''}`}>
              {isMinimized ? (
                <div className="pt-2 pb-1 flex justify-center" title="Marketing">
                  <div className="w-6 h-px bg-slate-800" />
                </div>
              ) : (
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <button
                    onClick={() => setIsMarketingOpen(!isMarketingOpen)}
                    className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-emerald-400 transition cursor-pointer text-left w-full"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Marketing</span>
                    <span className="ml-auto">
                      {isMarketingOpen ? <ChevronDown className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                </div>
              )}

              {(!isMinimized ? isMarketingOpen : true) && (
                <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l-2 border-emerald-500/30 ml-2.5 my-1' : ''}`}>
                  {canAccess(currentUser, 'marketing', 'kampanye') && renderNavItem('marketing_online', 'Marketing Online', <Globe className="w-4 h-4" />)}
                  {canAccess(currentUser, 'marketing', 'leads_pipeline') && renderNavItem('marketing_offline', 'Marketing Offline', <Megaphone className="w-4 h-4" />)}
                  {canAccess(currentUser, 'marketing', 'laporan_kunjungan') && renderNavItem('customer_map', 'Jaringan Toko & Mitra', <MapPin className="w-4 h-4" />)}
                </div>
              )}
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/* BAGIAN 5: ADMIN PEMBELIAN (PURCHASING)                      */}
        {/* ============================================================ */}
        {(() => {
          const canPur = canAccess(currentUser, 'purchasing', 'permintaan_pembelian') || canAccess(currentUser, 'purchasing', 'po_vendor') || canAccess(currentUser, 'purchasing', 'evaluasi_harga');
          if (!canPur) return null;

          return (
            <div className={`space-y-1 ${!isMinimized ? 'pt-2 border-t border-slate-800/60' : ''}`}>
              {isMinimized ? (
                <div className="pt-2 pb-1 flex justify-center" title="Admin Pembelian">
                  <div className="w-6 h-px bg-slate-800" />
                </div>
              ) : (
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <button
                    onClick={() => setIsPurchasingOpen(!isPurchasingOpen)}
                    className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-purple-400 transition cursor-pointer text-left w-full"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                    <span>Admin Pembelian</span>
                    <span className="ml-auto">
                      {isPurchasingOpen ? <ChevronDown className="w-3.5 h-3.5 text-purple-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                </div>
              )}

              {(!isMinimized ? isPurchasingOpen : true) && (
                <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l-2 border-purple-500/30 ml-2.5 my-1' : ''}`}>
                  {canAccess(currentUser, 'purchasing', 'permintaan_pembelian') && renderNavItem('purchasing_dashboard', 'Dashboard Pembelian', <ShoppingBag className="w-4 h-4" />)}

                  {canAccess(currentUser, 'purchasing', 'po_vendor') && (
                    <div className="space-y-1">
                      <button
                        onClick={() => setIsPurchasingStockOpen(!isPurchasingStockOpen)}
                        className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          currentTab === 'purchasing_stock_overview' || currentTab === 'purchasing_stock_forecast'
                            ? 'neu-pressed bg-purple-500/15 text-purple-300 font-bold border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                            : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/40 hover:translate-x-1 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Layers className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-115 ${currentTab === 'purchasing_stock_overview' || currentTab === 'purchasing_stock_forecast' ? 'text-purple-400' : 'text-slate-400'}`} />
                          <span className="truncate">Analisa Stok</span>
                        </div>
                        {isPurchasingStockOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>

                      {isPurchasingStockOpen && (
                        <div className="space-y-1 pl-3 border-l-2 border-purple-500/25 ml-3 my-1">
                          {renderNavItem('purchasing_stock_overview', 'Ringkasan Stok', <Database className="w-3.5 h-3.5" />)}
                          {renderNavItem('purchasing_stock_forecast', 'Prediksi Kebutuhan', <TrendingUp className="w-3.5 h-3.5" />)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/* BAGIAN 6: FINANCE & TAX                                      */}
        {/* ============================================================ */}
        {(() => {
          const canFin = canAccess(currentUser, 'finance_tax', 'kas_bank') || canAccess(currentUser, 'finance_tax', 'faktur_pajak') || canAccess(currentUser, 'finance_tax', 'rekonsiliasi') || canAccess(currentUser, 'finance_tax', 'laba_rugi');
          if (!canFin) return null;

          return (
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
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    <span>Finance & Tax</span>
                    <span className="ml-auto">
                      {isFinanceOpen ? <ChevronDown className="w-3.5 h-3.5 text-amber-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                </div>
              )}

              {(!isMinimized ? isFinanceOpen : true) && (
                <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l-2 border-amber-500/30 ml-2.5 my-1' : ''}`}>
                  {renderNavItem('finance_dashboard', 'Dashboard Finance', <Database className="w-4 h-4" />)}
                </div>
              )}
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/* BAGIAN 7: HR                                                */}
        {/* ============================================================ */}
        {(() => {
          const canHr = canAccess(currentUser, 'hr', 'hr_data_karyawan') || canAccess(currentUser, 'hr', 'hr_gaji_kpi') || canAccess(currentUser, 'hr', 'ga_security') || canAccess(currentUser, 'hr', 'ga_hk') || canAccess(currentUser, 'hr', 'ga_aset') || canAccess(currentUser, 'hr', 'td_video_training') || canAccess(currentUser, 'hr', 'td_training_karyawan');
          if (!canHr) return null;

          return (
            <div className={`space-y-1 ${!isMinimized ? 'pt-2 border-t border-slate-800/60' : ''}`}>
              {isMinimized ? (
                <div className="pt-2 pb-1 flex justify-center" title="HR">
                  <div className="w-6 h-px bg-slate-800" />
                </div>
              ) : (
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <button
                    onClick={() => setIsHrOpen(!isHrOpen)}
                    className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hover:text-indigo-400 transition cursor-pointer text-left w-full"
                  >
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Human Resources</span>
                    <span className="ml-auto">
                      {isHrOpen ? <ChevronDown className="w-3.5 h-3.5 text-indigo-400" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </span>
                  </button>
                </div>
              )}

              {(!isMinimized ? isHrOpen : true) && (
                <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l-2 border-indigo-500/30 ml-2.5 my-1' : ''}`}>
                  {canAccess(currentUser, 'hr', 'hr_data_karyawan') && (
                    <>
                      <div className="text-[9px] font-black uppercase tracking-wider text-indigo-300/80 px-2 pt-1">
                        1. HR
                      </div>
                      {renderNavItem('hr_dashboard', 'Dashboard & Presensi', <Users className="w-4 h-4" />)}
                    </>
                  )}

                  {canAccess(currentUser, 'hr', 'ga_security') && (
                    <>
                      <div className="text-[9px] font-black uppercase tracking-wider text-indigo-300/80 px-2 pt-2 border-t border-slate-800/50">
                        2. General Affair (GA)
                      </div>
                      {renderNavItem('ga_security', 'Security (Keamanan)', <ShieldAlert className="w-4 h-4" />)}
                      {renderNavItem('ga_hk', 'HK (Housekeeping)', <Brush className="w-4 h-4" />)}
                      {renderNavItem('ga_aset', 'Aset (Inventaris Pabrik)', <Building2 className="w-4 h-4" />)}
                    </>
                  )}

                  {canAccess(currentUser, 'hr', 'td_video_training') && (
                    <>
                      <div className="text-[9px] font-black uppercase tracking-wider text-indigo-300/80 px-2 pt-2 border-t border-slate-800/50">
                        3. Training &amp; Dev
                      </div>
                      {renderNavItem('training_videos', 'Video Training SOP', <Video className="w-4 h-4" />)}
                      {renderNavItem('training_karyawan', 'Training Karyawan', <Award className="w-4 h-4" />)}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* ============================================================ */}
        {/* BAGIAN 8: PENGGUNA & ARSITEKTUR                              */}
        {/* ============================================================ */}
        {(() => {
          const canSysLog = canAccess(currentUser, 'sistem_pengguna', 'log_aktivitas_sistem');
          const canSysUsers = canAccess(currentUser, 'sistem_pengguna', 'daftar_pengguna') || canAccess(currentUser, 'sistem_pengguna', 'persetujuan_akun');
          const canSysArch = canAccess(currentUser, 'sistem_pengguna', 'manajemen_hak_akses');
          const hasSys = canSysLog || canSysUsers || canSysArch;

          if (!hasSys) return null;

          return (
            <div className={`space-y-1 ${!isMinimized ? 'pt-2 border-t border-slate-800/60' : ''}`}>
              {!isMinimized && (
                <div className="px-2 mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sistem & Pengguna</span>
                </div>
              )}

              <div className={`space-y-1 ${!isMinimized ? 'pl-2 border-l-2 border-indigo-500/30 ml-2.5 my-1' : ''}`}>
                {canSysLog && renderNavItem('activity_log', 'Log Aktivitas Sistem', <History className="w-4 h-4" />)}
                {canSysUsers && renderNavItem(
                  'users',
                  'Manajemen User & Approval',
                  <Users className="w-4 h-4" />,
                  pendingUsersCount > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse">
                      {pendingReportsCount}
                    </span>
                  ) : undefined
                )}
                {canSysUsers && renderNavItem('e2e_testing', 'Pengujian E2E & Simulasi', <ShieldCheck className="w-4 h-4 text-emerald-400" />)}
                {canSysArch && renderNavItem('architecture', 'Skema SQL Supabase', <Database className="w-4 h-4" />)}
              </div>
            </div>
          );
        })()}
      </nav>

      {/* Sidebar Footer with Tactile Neumorphism and Neon V2 Accents */}
      {isMinimized ? (
        <div className="p-2 border-t border-slate-800/80 bg-slate-950/70 neu-pressed-sm flex flex-col items-center gap-2">
          <ThemeSwitcher variant="icon-only" />

          {/* Unduh APK Android Driver Mobile (Minimized) with Neon Pulse */}
          <button
            onClick={() => setIsApkModalOpen(true)}
            className="p-2 rounded-xl neu-button text-emerald-400 hover:text-emerald-300 border border-emerald-500/40 hover:shadow-[0_0_12px_rgba(16,185,129,0.5)] transition-all cursor-pointer"
            title="Unduh Berkas APK Android (v1.0.4) untuk Portal Driver & Helper Mobile"
          >
            <Smartphone className="w-4 h-4" />
          </button>

          {/* Keluar Sesi / Logout (Minimized) */}
          <button
            onClick={() => {
              logisticsStore.logoutUser();
              onOpenAuth('login');
            }}
            className="p-2 rounded-xl neu-button text-slate-400 hover:text-rose-400 hover:border-rose-500/50 hover:shadow-[0_0_12px_rgba(244,63,94,0.4)] transition-all cursor-pointer"
            title="Keluar Sesi (Logout)"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="w-full flex items-center justify-center p-2 rounded-xl neu-button text-amber-400 border border-slate-700/60 transition cursor-pointer"
              title="Perbesar Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/70 neu-pressed-sm space-y-3">
          {/* DC Status & Neon Clock */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-300">AKK Banyuwangi DC</span>
            </div>
            <span className="font-mono text-cyan-400 text-[10px] font-bold tabular-nums neon-text-cyan">
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
              <span className="text-[9px] text-cyan-400 font-mono font-bold">Neumorphic</span>
            </div>
            <ThemeSwitcher variant="segmented" className="w-full justify-between" />
          </div>


          {/* Unduh APK Android Driver Mobile (Neon UI V2 Card) */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <button
              type="button"
              onClick={() => setIsApkModalOpen(true)}
              className="relative overflow-hidden w-full p-2.5 rounded-2xl neu-flat-sm bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-emerald-500/20 hover:from-emerald-500/25 hover:to-cyan-500/25 border border-emerald-400/50 hover:border-emerald-400 text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_22px_rgba(16,185,129,0.5)] group cursor-pointer"
              title="Unduh Berkas APK Android (v1.0.4) untuk Portal Driver & Helper Mobile"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-transform shrink-0">
                  <Smartphone className="w-4 h-4 animate-pulse" />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-[11px] font-black text-emerald-300 leading-tight truncate flex items-center gap-1.5">
                    <span>Unduh APK Android</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/50 font-mono">v1.0.4</span>
                  </div>
                  <div className="text-[9.5px] text-slate-400 truncate leading-tight mt-0.5">
                    Signed & Aligned APK Driver
                  </div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-all shrink-0 shadow-xs">
                <Download className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Fitur Keluar atau Log Out dengan Neumorphic Depth */}
            <button
              type="button"
              onClick={() => {
                logisticsStore.logoutUser();
                onOpenAuth('login');
              }}
              className="w-full py-2.5 px-3 rounded-xl neu-button hover:border-rose-500/50 text-slate-400 hover:text-rose-300 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer group"
              title="Keluar Sesi / Log Out dari Sistem PT AKK"
            >
              <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Keluar (Log Out)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between neu-flat">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-xl neu-button text-slate-300 hover:text-cyan-400 cursor-pointer transition active:scale-95"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
        </button>
        <AkkLogo size="sm" showSubtitle={false} />
        <div className="flex items-center gap-2">
          <ThemeSwitcher variant="icon-only" />
          <button
            onClick={() => onOpenAuth('login')}
            className="p-2 rounded-xl neu-button text-amber-400 cursor-pointer transition active:scale-95 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
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


      {/* Android APK Download Modal for Driver Mobile */}
      <AndroidApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />
    </>
  );
};
