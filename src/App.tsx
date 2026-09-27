import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { DashboardOverview } from './components/DashboardOverview';
import { ScheduleManagement } from './components/ScheduleManagement';
import { FleetCrewManagement } from './components/FleetCrewManagement';
import { SparePartManagement } from './components/SparePartManagement';
import { FuelEfficiencyManagement } from './components/FuelEfficiencyManagement';
import { CrewDeliveryHistoryView } from './components/CrewDeliveryHistoryView';
import { UserManagement } from './components/UserManagement';
import { ExcelTrackingEvaluator } from './components/ExcelTrackingEvaluator';
import { CustomerMapping } from './components/CustomerMapping';
import { TracksolidGateway } from './components/TracksolidGateway';
import { FleetFormCenter } from './components/FleetFormCenter';
import { SupabaseSqlArchitecture } from './components/SupabaseSqlArchitecture';
import { SalesAdminHub, SalesAdminSubTab } from './components/sales/SalesAdminHub';
import { SalesKpi } from './components/sales/SalesKpi';
import { PurchasingStockAnalysis } from './components/purchasing/PurchasingStockAnalysis';
import { HelpDeskChat } from './components/HelpDeskChat';
import { AuthModal } from './components/AuthModal';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { SystemActivityLog } from './components/SystemActivityLog';
import { DepartmentDashboard } from './components/DepartmentDashboard';
import { MarketingDashboard } from './components/MarketingDashboard';
import { RetailStore, UserProfile } from './types';
import { logisticsStore } from './services/store';
import { ShieldCheck, Clock, AlertTriangle, LogIn, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { useToast } from './context/ToastContext';

const LiveClockBadge: React.FC = () => {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
  );

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
    };
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-slate-300 font-mono text-xs shadow-inner">
      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>{time}</span>
    </div>
  );
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [preselectedStore, setPreselectedStore] = useState<RetailStore | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<UserProfile>(logisticsStore.getCurrentUser());
  const [isSidebarMinimized, setIsSidebarMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('akk_sidebar_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const { notifications, setOnNavigateCallback, setIsDrawerOpen } = useToast();
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    setOnNavigateCallback((tab) => setCurrentTab(tab as NavTab));
  }, [setOnNavigateCallback]);

  const toggleSidebar = () => {
    setIsSidebarMinimized(prev => {
      const next = !prev;
      try {
        localStorage.setItem('akk_sidebar_minimized', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    return logisticsStore.subscribe(() => {
      setCurrentUser(logisticsStore.getCurrentUser());
    });
  }, []);

  const getTabTitle = (tab: NavTab): string => {
    switch (tab) {
      case 'dashboard': return 'Dashboard Eksekutif (Rangkuman Operasional & Penjualan)';
      case 'operational_dashboard': return 'Dashboard Logistik & Operasional';
      case 'schedules': return 'Manajemen Jadwal Pengiriman & Muat';
      case 'fleets': return 'Manajemen Armada & Kru Supir';
      case 'spareparts': return 'Manajemen Stok & Pemakaian Sparepart';
      case 'fuel_efficiency': return 'Efisiensi Bahan Bakar (BBM) & Konsumsi Armada';
      case 'crew_history': return 'Riwayat Pengiriman & Audit SLA Kru';
      case 'tracking_eval': return 'Audit Evaluasi Muat & Bongkar (Excel)';
      case 'tracksolid': return 'Integrasi GPS Tracksolid Pro';
      case 'fleet_forms': return 'Formulir Operasional Armada';
      case 'sales_dashboard': return 'Sales Hub: Dashboard & SLA Penjualan';
      case 'sales_activities': return 'Sales Hub: Aktivitas Harian Admin';
      case 'sales_schedules': return 'Sales Hub: Jadwal Produksi & Kirim';
      case 'sales_loading_duration': return 'Sales Hub: Durasi Muat Real-Time';
      case 'sales_skill_matrix': return 'Sales Hub: Matriks Keterampilan Admin';
      case 'sales_jobdesk': return 'Sales Hub: Konfigurasi SOP & Jobdesk';
      case 'sales_kpi': return 'Sales Hub: Data Kinerja & KPI Penjualan';
      case 'sales_kpi_individual': return 'KPI Individu Masing-masing Admin Penjualan';
      case 'sales_kpi_fines': return 'Data Akumulasi Denda Checker';
      case 'sales_kpi_nusantara': return 'Persentase Kiriman Nusantara';
      case 'sales_kpi_omset': return 'Omset Admin Penjualan';
      case 'hr_dashboard': return 'Dashboard Departemen HR';
      case 'finance_dashboard': return 'Dashboard Departemen Finance & Tax';
      case 'warehouse_dashboard': return 'Dashboard Departemen Gudang';
      case 'purchasing_dashboard': return 'Dashboard Departemen Adm. Pembelian';
      case 'purchasing_stock_overview': return 'Analisa Stok: Ringkasan & Status';
      case 'purchasing_stock_forecast': return 'Analisa Stok: Prediksi Kebutuhan';
      case 'marketing_online': return 'Departemen Marketing: Prospek & Proaktif Online';
      case 'marketing_offline': return 'Departemen Marketing: Canvasing & Kunjungan Offline';
      case 'activity_log': return 'Audit Log & Aktivitas Sistem';
      case 'customer_map': return 'Pemetaan Toko Retail & Mitra';
      case 'users': return 'Approval & Manajemen Pengguna';
      case 'architecture': return 'Arsitektur Database Supabase SQL';
      default: return 'Sistem Operasional AKK';
    }
  };

  const handleScheduleForStore = (store: RetailStore) => {
    setPreselectedStore(store);
    setCurrentTab('schedules');
  };

  const handleOpenAuth = (defaultTab: 'login' | 'register' = 'login') => {
    setAuthDefaultTab(defaultTab);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Sidebar Navigation - Left Rail (Fixed on Desktop, Drawer on Mobile) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAuth={handleOpenAuth}
        isMinimized={isSidebarMinimized}
        onToggleMinimize={toggleSidebar}
      />

      {/* Main Content Area with offset for Sidebar */}
      <div className={`flex-1 flex flex-col min-h-screen w-full transition-all duration-300 ${isSidebarMinimized ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Desktop Top Header Bar with Theme Switcher & Operational Title */}
        <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-6 lg:px-8 items-center justify-between shadow-xs">
          <div className="flex items-center gap-3.5">
            {/* Quick Toggle Button for Sidebar Minimization */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-amber-400 transition cursor-pointer shadow-xs active:scale-95 flex items-center justify-center"
              title={isSidebarMinimized ? "Perlebar Sidebar (Tampilkan Nama & Menu Lengkap)" : "Minimalkan Sidebar (Hanya Tampilkan Logo Saja)"}
              aria-label="Toggle Sidebar Size"
            >
              {isSidebarMinimized ? <ChevronRight className="w-4 h-4 text-amber-400" /> : <ChevronLeft className="w-4 h-4 text-slate-400" />}
            </button>

            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>PT ANUGRAH KEMASAN KREATIF</span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-amber-500 font-semibold">BANYUWANGI HUB</span>
              </div>
              <h1 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                <span>{getTabTitle(currentTab)}</span>
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live System
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Prominent 2-Choice Theme Switcher: Warna Cerah vs Warna Gelap */}
            <div className="flex items-center gap-2 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 shadow-inner">
              <span className="text-[11px] font-bold text-slate-400 pl-2 hidden xl:inline">Tampilan Web:</span>
              <ThemeSwitcher variant="segmented" />
            </div>

            {/* Live Time Badge */}
            <LiveClockBadge />

            {/* Notification Bell Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="relative p-2 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-amber-400 transition cursor-pointer shadow-inner flex items-center justify-center active:scale-95"
              title="Pusat Notifikasi Admin & Simulasi Logistik"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-slate-950 ring-2 ring-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Quick Profile Pill */}
            <button
              onClick={() => handleOpenAuth('login')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer shadow-inner"
              title="Ganti Akun atau Kelola Sesi"
            >
              <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="font-semibold max-w-[100px] truncate">{currentUser.fullName}</span>
            </button>
          </div>
        </header>

        {/* Pending Approval Top Banner Alert if current user is pending */}
        {currentUser.status === 'pending' && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2 mt-14 lg:mt-0">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span>
                <strong>Perhatian:</strong> Akun Anda (<em>{currentUser.fullName}</em>) saat ini berstatus <strong>Menunggu Persetujuan (Pending Approval)</strong> dari Manager Operasional AKK.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  logisticsStore.approveUser(currentUser.id);
                }}
                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] shadow transition cursor-pointer"
              >
                Simulasi: Setujui Sekarang
              </button>
              <button
                onClick={() => setCurrentTab('users')}
                className="underline hover:text-white text-[11px]"
              >
                Lihat Menu Approval &rarr;
              </button>
            </div>
          </div>
        )}

        <main className={`flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 ${
          currentUser.status === 'pending' ? 'pt-4' : 'pt-18 lg:pt-6'
        }`}>
          {currentTab === 'dashboard' && (
            <ExecutiveDashboard onNavigate={(tab) => setCurrentTab(tab as NavTab)} />
          )}

          {currentTab === 'operational_dashboard' && (
            <DashboardOverview onNavigate={(tab) => setCurrentTab(tab as NavTab)} />
          )}

          {currentTab === 'schedules' && (
            <ScheduleManagement
              preselectedStore={preselectedStore}
              onClearPreselectedStore={() => setPreselectedStore(null)}
            />
          )}

          {currentTab === 'fleets' && (
            <FleetCrewManagement
              onNavigateToSpareParts={() => setCurrentTab('spareparts')}
              onNavigateToFuelEfficiency={() => setCurrentTab('fuel_efficiency')}
              onNavigateToTracksolid={() => setCurrentTab('tracksolid')}
            />
          )}

          {currentTab === 'spareparts' && (
            <SparePartManagement onNavigateToFleets={() => setCurrentTab('fleets')} />
          )}

          {currentTab === 'fuel_efficiency' && (
            <FuelEfficiencyManagement onNavigateToFleets={() => setCurrentTab('fleets')} />
          )}

          {currentTab === 'crew_history' && (
            <CrewDeliveryHistoryView />
          )}

          {currentTab === 'users' && (
            <UserManagement />
          )}

          {currentTab === 'tracking_eval' && (
            <ExcelTrackingEvaluator />
          )}

          {currentTab === 'customer_map' && (
            <CustomerMapping onScheduleForStore={handleScheduleForStore} />
          )}

          {currentTab === 'tracksolid' && (
            <TracksolidGateway />
          )}

          {currentTab === 'fleet_forms' && (
            <FleetFormCenter />
          )}

          {currentTab === 'sales_dashboard' && (
            <SalesAdminHub
              activeSubTab="dashboard"
              onSelectSubTab={(sub) => setCurrentTab(('sales_' + sub) as NavTab)}
            />
          )}

          {currentTab === 'sales_activities' && (
            <SalesAdminHub
              activeSubTab="activities"
              onSelectSubTab={(sub) => setCurrentTab(('sales_' + sub) as NavTab)}
            />
          )}

          {currentTab === 'sales_schedules' && (
            <SalesAdminHub
              activeSubTab="schedules"
              onSelectSubTab={(sub) => setCurrentTab(('sales_' + sub) as NavTab)}
            />
          )}

          {currentTab === 'sales_loading_duration' && (
            <SalesAdminHub
              activeSubTab="loading_duration"
              onSelectSubTab={(sub) => setCurrentTab(('sales_' + sub) as NavTab)}
            />
          )}

          {currentTab === 'sales_skill_matrix' && (
            <SalesAdminHub
              activeSubTab="skill_matrix"
              onSelectSubTab={(sub) => setCurrentTab(('sales_' + sub) as NavTab)}
            />
          )}

          {currentTab === 'sales_jobdesk' && (
            <SalesAdminHub
              activeSubTab="jobdesk"
              onSelectSubTab={(sub) => setCurrentTab(('sales_' + sub) as NavTab)}
            />
          )}

          {(currentTab === 'sales_kpi' || (currentTab && currentTab.startsWith('sales_kpi_'))) && (
            <SalesKpi defaultTab={currentTab} onChangeTab={(tab) => setCurrentTab(tab as NavTab)} />
          )}

          {currentTab === 'activity_log' && (
            <SystemActivityLog />
          )}

          {currentTab === 'hr_dashboard' && (
            <DepartmentDashboard dashboardType="hr" />
          )}
          {currentTab === 'finance_dashboard' && (
            <DepartmentDashboard dashboardType="finance" />
          )}
          {currentTab === 'warehouse_dashboard' && (
            <DepartmentDashboard dashboardType="warehouse" />
          )}
          {currentTab === 'purchasing_dashboard' && (
            <DepartmentDashboard dashboardType="purchasing" />
          )}
          {currentTab === 'purchasing_stock_overview' && (
            <PurchasingStockAnalysis tab="overview" />
          )}
          {currentTab === 'purchasing_stock_forecast' && (
            <PurchasingStockAnalysis tab="forecast" />
          )}

          {(currentTab === 'marketing_online' || currentTab === 'marketing_offline') && (
            <MarketingDashboard activeTab={currentTab} />
          )}

          {currentTab === 'architecture' && (
            <SupabaseSqlArchitecture />
          )}
        </main>

        {/* Enterprise AKK Footer */}
        <footer className="bg-slate-950 border-t border-slate-900 py-6 text-slate-500 text-xs text-center mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
              <span>PT Anugrah Kemasan Kreatif &bull; Sistem Distribusi & Manajemen Operasional</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-[11px]">
              <span>Next.js App Router</span>
              <span>Supabase RLS & PostgreSQL</span>
              <span>Tracksolid Telematics</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Authentication Modal (Login & Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultTab={authDefaultTab}
      />
      <HelpDeskChat />
    </div>
  );
}
