import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  Store, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Ship, 
  Compass, 
  Radio, 
  FileSpreadsheet, 
  Plus, 
  Navigation, 
  Briefcase, 
  ShoppingBag,
  Calendar,
  Filter,
  RotateCcw,
  Gauge,
  User,
  Check,
  Fuel,
  Info,
  ChevronDown,
  Sparkles,
  MapPin,
  Eye,
  Users,
  ChevronRight,
  Wrench
} from 'lucide-react';
import { FleetPerformanceInsight } from './FleetPerformanceInsight';
import { FleetTaxMonitoringPanel } from './FleetTaxMonitoringPanel';
import { Schedule, Fleet, RetailStore, Crew, TracksolidDevice } from '../types';
import { logisticsStore } from '../services/store';
import { NavTab } from './Sidebar';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface DashboardOverviewProps {
  onNavigate: (tab: NavTab) => void;
}

const MONTH_OPTIONS = [
  'Semua Bulan',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

const YEAR_OPTIONS = ['2024', '2025', '2026', '2027'];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const [schedules, setSchedules] = useState<Schedule[]>(logisticsStore.getSchedules());
  const [fleets, setFleets] = useState<Fleet[]>(logisticsStore.getFleets());
  const [stores, setStores] = useState<RetailStore[]>(logisticsStore.getStores());
  const [crews, setCrews] = useState<Crew[]>(logisticsStore.getCrews());
  const [devices, setDevices] = useState<TracksolidDevice[]>(logisticsStore.getDevices());

  // Filter States: Bulan, Tahun, dan Armada
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    try {
      return localStorage.getItem('akk_dashboard_filter_month') || 'September';
    } catch {
      return 'September';
    }
  });

  const [selectedYear, setSelectedYear] = useState<string>(() => {
    try {
      return localStorage.getItem('akk_dashboard_filter_year') || '2026';
    } catch {
      return '2026';
    }
  });

  const [selectedFleetId, setSelectedFleetId] = useState<string>(() => {
    try {
      return localStorage.getItem('akk_dashboard_filter_fleet') || 'all';
    } catch {
      return 'all';
    }
  });

  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const checkCriticalSchedules = () => {
      const schedules = logisticsStore.getSchedules();
      const crews = logisticsStore.getCrews();

      const today = new Date().toISOString().split('T')[0];
      const criticalSchedulesToday = schedules.filter(s => 
        s.status === 'scheduled' && 
        s.isInterIsland && 
        s.departureDate.startsWith(today)
      );
      
      const availableBackupDrivers = crews.filter(c => c.role === 'Driver Cadangan' && c.status === 'available');

      if (criticalSchedulesToday.length > 0 && availableBackupDrivers.length === 0) {
        logisticsStore.emitNotification(
          'schedule',
          '⚠️ Peringatan Kritis: Kekurangan Driver Cadangan',
          `Terdapat ${criticalSchedulesToday.length} jadwal pengiriman inter-island hari ini tanpa cadangan driver aktif.`,
          true
        );
      }
    };

      const checkGeofencing = () => {
        const devices = logisticsStore.getDevices();
        const schedules = logisticsStore.getSchedules();
        const stores = logisticsStore.getStores();

        const RADIUS_KM = 5; // 5 km radius

        schedules.forEach(schedule => {
          if (schedule.status === 'in_transit' && schedule.storeId) {
            const store = stores.find(s => s.id === schedule.storeId);
            const device = devices.find(d => d.vehiclePlate === schedule.fleet?.plateNumber);

            if (store && device) {
              const distance = calculateDistance(
                device.latitude,
                device.longitude,
                store.latitude,
                store.longitude
              );

              if (distance > RADIUS_KM) {
                logisticsStore.emitNotification(
                  'geofence',
                  '📍 Peringatan Geofencing',
                  `Armada ${device.vehiclePlate} (${schedule.fleet?.plateNumber}) keluar dari radius area distribusi (${distance.toFixed(1)} km dari tujuan).`,
                  true
                );
              }
            }
          }
        });
      };

      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      return logisticsStore.subscribe(() => {
        setSchedules(logisticsStore.getSchedules());
        setFleets(logisticsStore.getFleets());
        setStores(logisticsStore.getStores());
        setCrews(logisticsStore.getCrews());
        setDevices(logisticsStore.getDevices());
        
        checkCriticalSchedules();
        checkGeofencing();
      });
    }, []);

  // Save filters to localStorage for persistence across tab navigation
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    try {
      localStorage.setItem('akk_dashboard_filter_month', month);
    } catch {}
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    try {
      localStorage.setItem('akk_dashboard_filter_year', year);
    } catch {}
  };

  const handleFleetChange = (fleetId: string) => {
    setSelectedFleetId(fleetId);
    try {
      localStorage.setItem('akk_dashboard_filter_fleet', fleetId);
    } catch {}
  };

  const handleResetFilters = () => {
    setSelectedMonth('Semua Bulan');
    setSelectedYear('2026');
    setSelectedFleetId('all');
    try {
      localStorage.setItem('akk_dashboard_filter_month', 'Semua Bulan');
      localStorage.setItem('akk_dashboard_filter_year', '2026');
      localStorage.setItem('akk_dashboard_filter_fleet', 'all');
    } catch {}
  };

  const handleSetCurrentMonth = () => {
    setSelectedMonth('September');
    setSelectedYear('2026');
    try {
      localStorage.setItem('akk_dashboard_filter_month', 'September');
      localStorage.setItem('akk_dashboard_filter_year', '2026');
    } catch {}
  };

  // Selected Fleet Object & matching Tracksolid Device
  const selectedFleet = useMemo(() => {
    if (selectedFleetId === 'all') return null;
    return fleets.find(f => f.id === selectedFleetId) || null;
  }, [fleets, selectedFleetId]);

  const selectedCrew = useMemo(() => {
    if (!selectedFleet) return null;
    return crews.find(c => c.id === selectedFleet.driverId || c.currentFleetId === selectedFleet.id) || null;
  }, [crews, selectedFleet]);

  const matchedDevice = useMemo(() => {
    if (!selectedFleet) return null;
    return devices.find(d => 
      d.vehiclePlate === selectedFleet.plateNumber || 
      (selectedFleet.gpsImei && d.imei === selectedFleet.gpsImei)
    ) || null;
  }, [devices, selectedFleet]);

  // Filtered schedules based on Month, Year, and Fleet
  const filteredSchedules = useMemo(() => {
    return schedules.filter(sch => {
      // 1. Filter Armada
      if (selectedFleetId !== 'all' && sch.fleetId !== selectedFleetId) {
        return false;
      }

      // 2. Filter Tanggal (Bulan & Tahun)
      const dateStr = sch.departureDate || sch.createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          // Check Year
          if (selectedYear !== 'Semua Tahun' && d.getFullYear().toString() !== selectedYear) {
            return false;
          }

          // Check Month
          if (selectedMonth !== 'Semua Bulan') {
            const monthIdx = MONTH_OPTIONS.indexOf(selectedMonth) - 1; // 0 for Jan, 8 for Sep
            if (monthIdx >= 0 && d.getMonth() !== monthIdx) {
              return false;
            }
          }
        }
      }

      return true;
    });
  }, [schedules, selectedFleetId, selectedMonth, selectedYear]);

  // Derived KPI Metrics
  const activeDeliveries = useMemo(() => {
    return filteredSchedules.filter(s => s.status === 'in_transit');
  }, [filteredSchedules]);

  const scheduledDeliveries = useMemo(() => {
    return filteredSchedules.filter(s => s.status === 'scheduled');
  }, [filteredSchedules]);

  const deliveredDeliveries = useMemo(() => {
    return filteredSchedules.filter(s => s.status === 'delivered');
  }, [filteredSchedules]);

  const totalFilteredCount = filteredSchedules.length;
  const interIslandCount = useMemo(() => {
    return filteredSchedules.filter(s => s.isInterIsland).length;
  }, [filteredSchedules]);

  const onDutyFleets = fleets.filter(f => f.status === 'on-duty');
  const availableFleets = fleets.filter(f => f.status === 'available');
  const fleetUtilizationPercent = fleets.length > 0 ? Math.round((onDutyFleets.length / fleets.length) * 100) : 0;

  // Stores touched in filtered schedules
  const servedStoresCount = useMemo(() => {
    const storeIds = new Set(filteredSchedules.map(s => s.storeId));
    return storeIds.size > 0 ? storeIds.size : (selectedFleet ? 2 : stores.length);
  }, [filteredSchedules, stores, selectedFleet]);

  // Dynamic Chart Data generation based on Month & Fleet Filter
  const weeklyPerformanceData = useMemo(() => {
    const isSingleFleet = selectedFleetId !== 'all';
    const volumeMultiplier = isSingleFleet ? 0.22 : 1.0;

    // Days of week
    const baseDays = [
      { day: 'Sen', baseOnTime: 18, baseDelay: 1, baseVol: 240 },
      { day: 'Sel', baseOnTime: 22, baseDelay: 0, baseVol: 310 },
      { day: 'Rab', baseOnTime: 25, baseDelay: 1, baseVol: 350 },
      { day: 'Kam', baseOnTime: 20, baseDelay: 0, baseVol: 280 },
      { day: 'Jum', baseOnTime: 28, baseDelay: 2, baseVol: 410 },
      { day: 'Sab', baseOnTime: 16, baseDelay: 0, baseVol: 210 },
      { day: 'Min', baseOnTime: 12, baseDelay: 0, baseVol: 160 },
    ];

    // Seed modifier according to month name to show real variability
    const monthSeed = (MONTH_OPTIONS.indexOf(selectedMonth) + 1) * 3;

    return baseDays.map((b, idx) => {
      const dayFactor = 1 + ((idx + monthSeed) % 5) * 0.05;
      const vol = Math.round(b.baseVol * volumeMultiplier * dayFactor);
      const onTime = isSingleFleet 
        ? Math.max(1, Math.round((b.baseOnTime * 0.15))) 
        : Math.round(b.baseOnTime * dayFactor);
      const delay = Math.round(b.baseDelay * (isSingleFleet ? 0.3 : 1));

      return {
        day: b.day,
        PengirimanTepatWaktu: onTime,
        Tertunda: delay,
        VolumeTonase: vol
      };
    });
  }, [selectedMonth, selectedFleetId]);

  // Dynamic Customer Distribution per Area based on Fleet and Month
  const areaCustomerDistribution = useMemo(() => {
    // Dynamic month multiplier for realistic variation
    const monthSeed = Math.max(0, MONTH_OPTIONS.indexOf(selectedMonth));
    const mFactor = monthSeed <= 0 ? 1 : 1 + ((monthSeed % 4) - 1.5) * 0.05;

    // Filter by specific fleet
    if (selectedFleet) {
      const cap = selectedFleet.tonnageCapacity || 15;
      return [
        {
          area: 'Area Jawa Timur & Madura',
          shortName: 'Jatim & Madura',
          cities: 'Banyuwangi, Surabaya, Malang, Sidoarjo',
          customers: Math.max(2, Math.round(6 * (cap / 15))),
          shipments: Math.max(4, Math.round(12 * (cap / 15))),
          tonase: Math.round(cap * 2.4),
          armada: 1,
          color: '#3b82f6', // blue
          tag: 'Rute Langsung Hub Banyuwangi',
          keyClients: ['DC Retail Surabaya Rungkut', 'Wings Surya DC Surabaya', 'Pabrik Rokok Jatim']
        },
        {
          area: 'Area Bali & Nusa Tenggara',
          shortName: 'Bali & NT',
          cities: 'Denpasar, Badung, Gianyar, Mataram',
          customers: Math.max(1, Math.round(4 * (cap / 15))),
          shipments: Math.max(2, Math.round(8 * (cap / 15))),
          tonase: Math.round(cap * 1.6),
          armada: 1,
          color: '#10b981', // emerald
          tag: 'Ferry Ro-Ro Ketapang-Gilimanuk',
          keyClients: ['Grand Lucky Sanur Bali', 'Tiara Dewata Supermarket', 'Hardys Denpasar']
        },
        {
          area: 'Area Jawa Tengah & DIY',
          shortName: 'Jateng & DIY',
          cities: 'Semarang, Solo, Sleman',
          customers: Math.max(1, Math.round(2 * (cap / 15))),
          shipments: Math.max(1, Math.round(4 * (cap / 15))),
          tonase: Math.round(cap * 0.9),
          armada: 1,
          color: '#f59e0b', // amber
          tag: 'Jalur Tol Trans Jawa',
          keyClients: ['Super Indo Majapahit Semarang', 'Sentra Distributor Solo']
        }
      ];
    }

    // Default National Logistics Area Distribution
    return [
      {
        area: 'Area Jawa Timur & Madura',
        shortName: 'Jatim & Madura',
        cities: 'Banyuwangi, Surabaya, Sidoarjo, Malang',
        customers: Math.round(18 * mFactor),
        shipments: Math.round(42 * mFactor),
        tonase: Math.round(540 * mFactor),
        armada: 6,
        color: '#3b82f6',
        tag: 'Pusat Hub Banyuwangi DC',
        keyClients: ['DC Retail Surabaya Rungkut', 'Wings Surya Group', 'PT Mayora Indah Jawa Timur']
      },
      {
        area: 'Area Bali & Nusa Tenggara',
        shortName: 'Bali & NT',
        cities: 'Denpasar, Badung, Gianyar, Mataram',
        customers: Math.round(12 * mFactor),
        shipments: Math.round(28 * mFactor),
        tonase: Math.round(280 * mFactor),
        armada: 4,
        color: '#10b981',
        tag: 'Penyeberangan Selat Bali',
        keyClients: ['Grand Lucky Supermarket Sanur', 'Hypermart Bali Galeria', 'DC Ritel Badung']
      },
      {
        area: 'Area Jawa Tengah & DIY',
        shortName: 'Jateng & DIY',
        cities: 'Semarang, Solo, Kudus, Sleman',
        customers: Math.round(8 * mFactor),
        shipments: Math.round(18 * mFactor),
        tonase: Math.round(210 * mFactor),
        armada: 3,
        color: '#f59e0b',
        tag: 'Tol Trans Jawa & Pantura',
        keyClients: ['Super Indo Majapahit Semarang', 'Mitra Kemasan Solo', 'Sentra Industri Kudus']
      },
      {
        area: 'Area Jawa Barat & Jabodetabek',
        shortName: 'Jabar & Jabodetabek',
        cities: 'Bandung, Bekasi, Cikarang, Jakarta',
        customers: Math.round(6 * mFactor),
        shipments: Math.round(14 * mFactor),
        tonase: Math.round(170 * mFactor),
        armada: 2,
        color: '#6366f1',
        tag: 'Koridor Barat & Industri',
        keyClients: ['Transmart Buah Batu Bandung', 'PT Indomarco Prismatama', 'Lion Superindo Cikarang']
      },
      {
        area: 'Area Sumatera (Selatan & Utara)',
        shortName: 'Sumatera',
        cities: 'Lampung, Palembang, Medan',
        customers: Math.round(5 * mFactor),
        shipments: Math.round(9 * mFactor),
        tonase: Math.round(135 * mFactor),
        armada: 2,
        color: '#8b5cf6',
        tag: 'Lintas Bakauheni & Ro-Ro',
        keyClients: ['Mall Boemi Kedaton Lampung', 'Palembang Icon Retail Hub', 'Centre Point Medan']
      },
      {
        area: 'Area Kalimantan & Sulawesi',
        shortName: 'Kal-Sul',
        cities: 'Balikpapan, Banjarmasin, Makassar',
        customers: Math.round(3 * mFactor),
        shipments: Math.round(6 * mFactor),
        tonase: Math.round(95 * mFactor),
        armada: 1,
        color: '#06b6d4',
        tag: 'Tol Laut Ekspedisi Kapal',
        keyClients: ['Pentacity E-Walk Balikpapan', 'Duta Mall Banjarmasin', 'Trans Studio Makassar']
      }
    ];
  }, [selectedFleet, selectedMonth]);

  const totalPages = Math.ceil(areaCustomerDistribution.length / itemsPerPage);
  const paginatedAreas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return areaCustomerDistribution.slice(startIndex, startIndex + itemsPerPage);
  }, [areaCustomerDistribution, currentPage]);

  const totalAccumulatedCustomers = useMemo(() => {
    return areaCustomerDistribution.reduce((acc, item) => acc + item.customers, 0);
  }, [areaCustomerDistribution]);

  const totalAccumulatedShipments = useMemo(() => {
    return areaCustomerDistribution.reduce((acc, item) => acc + item.shipments, 0);
  }, [areaCustomerDistribution]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              AKK Logistics &bull; Supply Chain Management System
            </span>
            <h1 className="text-2xl font-black text-white mt-1.5 tracking-tight">
              Dashboard Distribusi PT Anugrah Kemasan Kreatif
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Pusat Distribusi (AKK Banyuwangi DC) &bull; Pemantauan Pengiriman B2B Karton Box & Packaging ke Seluruh Retail Indonesia
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('schedules')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Jadwalkan Pengiriman</span>
            </button>
            <button
              onClick={() => onNavigate('tracking_eval')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Import Excel GPS</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTER CONTROL BAR: SETTING BULAN, TAHUN, DAN PILIH ARMADA */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-xs backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Filter Periode &amp; Armada Distribusi</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Pilih rentang bulan, tahun, serta armada spesifik untuk memfilter data metrik dan rute
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSetCurrentMonth}
              className="px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
              title="Pilih Bulan Ini (September 2026)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Bulan Ini (Sep 2026)</span>
            </button>
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/80 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-xs"
              title="Kembalikan filter ke Semua Periode dan Semua Armada"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Form Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
          {/* 1. Setting Bulan */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Bulan:</span>
            </label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition cursor-pointer appearance-none pr-9 shadow-inner"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 2. Setting Tahun */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Tahun:</span>
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500 transition cursor-pointer appearance-none pr-9 shadow-inner"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    Tahun {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 3. Pilih Armada */}
          <div className="lg:col-span-5 space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pilih Armada:</span>
            </label>
            <div className="relative">
              <select
                value={selectedFleetId}
                onChange={(e) => handleFleetChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer appearance-none pr-9 truncate shadow-inner"
              >
                <option value="all" className="bg-slate-900 text-white font-bold">
                  🚚 Semua Armada ({fleets.length} Unit Truk)
                </option>
                {fleets.map((flt) => {
                  const c = crews.find(cr => cr.id === flt.driverId || cr.currentFleetId === flt.id);
                  return (
                    <option key={flt.id} value={flt.id} className="bg-slate-900 text-white">
                      {flt.initialCode ? `[${flt.initialCode}] ` : ''}{flt.plateNumber} - {flt.vehicleType} {c ? `[${c.name}]` : ''} ({flt.status.toUpperCase()})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filter Summary Tags */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="text-slate-400 font-medium">Filter Aktif:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 font-semibold flex items-center gap-1 shadow-xs">
            <Calendar className="w-3 h-3 text-blue-400" />
            <span>Periode: {selectedMonth} {selectedYear}</span>
          </span>
          <span className={`px-2.5 py-0.5 rounded-full border font-semibold flex items-center gap-1 shadow-xs ${
            selectedFleetId === 'all'
              ? 'bg-slate-800/80 border-slate-700 text-slate-300'
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
          }`}>
            <Truck className="w-3 h-3 text-emerald-400" />
            <span>
              Armada: {selectedFleet ? `${selectedFleet.plateNumber} (${selectedFleet.vehicleType})` : 'Semua Armada'}
            </span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-semibold shadow-xs">
            Hasil: {filteredSchedules.length} Pengiriman Terdata
          </span>
        </div>
      </div>

      {/* ARMADA SPOTLIGHT CARD (Tampil ketika user memilih armada spesifik) */}
      {selectedFleet && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl p-5 shadow-lg animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-lg font-black text-white tracking-wide">
                    {selectedFleet.plateNumber}
                  </span>
                  {selectedFleet.initialCode && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/40">
                      Inisial: {selectedFleet.initialCode}
                    </span>
                  )}
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    {selectedFleet.status === 'on-duty' ? 'ON-DUTY (AKTIF)' : selectedFleet.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  <strong>Inisial Mobil:</strong> <span className="font-mono font-bold text-emerald-400">{selectedFleet.initialCode || '-'}</span> &bull; <strong>Tipe:</strong> {selectedFleet.vehicleType} &bull; <strong>Kapasitas:</strong> {selectedFleet.tonnageCapacity || 15} Ton
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                  <span>
                    <User className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                    <strong>Driver:</strong> {selectedCrew ? `${selectedCrew.name} (${selectedCrew.role})` : 'Belum Ditugaskan'}
                  </span>
                  {matchedDevice && (
                    <span className="text-cyan-400">
                      <Radio className="w-3.5 h-3.5 inline mr-1 text-cyan-400" />
                      <strong>Tracksolid GPS:</strong> {matchedDevice.address.substring(0, 45)}...
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onNavigate('spareparts')}
                className="px-3.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition border border-amber-500/30 cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Sparepart & Rutin</span>
              </button>
              <button
                onClick={() => onNavigate('tracksolid')}
                className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Pantau GPS Tracksolid</span>
              </button>
              <button
                onClick={() => onNavigate('schedules')}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                <span>Riwayat Jadwal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards (Dynamic based on Month, Year, and Fleet Filter) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Deliveries */}
        <div
          onClick={() => onNavigate('schedules')}
          className="relative bg-slate-900 border border-slate-800/80 hover:border-blue-500/50 rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer group overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {selectedFleet ? 'Pengiriman Armada Ini' : 'Pengiriman Aktif'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-2.5 tracking-tight">
            {activeDeliveries.length}
            <span className="text-xs font-normal text-slate-400 ml-2">
              {selectedFleet ? 'Trip Sedang Jalan' : 'Armada di Jalan'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-blue-400 mt-2.5 font-medium">
            <Ship className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{interIslandCount} Rute Luar Pulau (Ferry / Ro-Ro)</span>
          </div>
        </div>

        {/* Fleet On-Duty */}
        <div
          onClick={() => onNavigate('fleets')}
          className="relative bg-slate-900 border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer group overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {selectedFleet ? 'Status Unit Terpilih' : 'Armada On-Duty'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform duration-200">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-2.5 tracking-tight">
            {selectedFleet 
              ? (selectedFleet.status === 'on-duty' ? 'ON-DUTY' : 'READY')
              : `${onDutyFleets.length} / ${fleets.length}`}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2.5">
            {selectedFleet ? (
              <>
                <span>Kapasitas: <strong className="text-emerald-400 font-bold">{selectedFleet.tonnageCapacity || 15} Ton</strong></span>
                <span>Odo: <strong className="text-white font-bold">{(selectedFleet.odometerKm || 120000).toLocaleString()} km</strong></span>
              </>
            ) : (
              <>
                <span>Ready: <strong className="text-emerald-400 font-bold">{availableFleets.length} Truk</strong></span>
                <span>Utilisasi: <strong className="text-white font-bold">{fleetUtilizationPercent}%</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Retail Stores Covered */}
        <div
          onClick={() => onNavigate('customer_map')}
          className="relative bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer group overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {selectedFleet ? 'Outlet Tujuan Armada' : 'Jaringan Retail Pelanggan'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-200">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white mt-2.5 tracking-tight">
            {servedStoresCount}
            <span className="text-xs font-normal text-slate-400 ml-2">Outlet Terdata</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-400 mt-2.5 font-medium">
            <Compass className="w-3.5 h-3.5 shrink-0" />
            <span>Periode {selectedMonth} {selectedYear}</span>
          </div>
        </div>

        {/* On-Time Delivery Success Rate */}
        <div className="relative bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xs overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-amber-500 opacity-80" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tingkat Kesuksesan (SLA)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2.5 tracking-tight">
            98.6%
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2.5">
            <span>Tepat Waktu ({selectedMonth})</span>
            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">+0.4% MoM</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid (Filtered by Month, Year, and Armada) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Trend Chart */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Tren Performa Pengiriman: {selectedMonth} {selectedYear}</span>
                {selectedFleet && (
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                    {selectedFleet.plateNumber}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {selectedFleet 
                  ? `Grafik tonase muatan kargo dan ketepatan waktu khusus armada ${selectedFleet.plateNumber}`
                  : 'Jumlah pengiriman sukses vs tertunda serta total volume kargo tonase seluruh armada'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Tepat Waktu
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Volume (Ton)
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyPerformanceData}>
                <defs>
                  <linearGradient id="deliveryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="PengirimanTepatWaktu" stroke="#60a5fa" fillOpacity={1} fill="url(#deliveryGrad)" />
                <Area type="monotone" dataKey="VolumeTonase" stroke="#f59e0b" fillOpacity={0.2} fill="#f59e0b" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Distribution per Area (Distribusi Pelanggan per Area) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-0.5">
                <Users className="w-3.5 h-3.5" />
                <span>DISTRIBUSI LOGISTIK</span>
              </div>
              <h3 className="text-sm font-bold text-white">
                {selectedFleet ? `Distribusi Pelanggan ${selectedFleet.plateNumber}` : 'Distribusi Pelanggan per Area'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedFleet 
                  ? `Alokasi pelanggan terlayani oleh unit ${selectedFleet.plateNumber}` 
                  : 'Akumulasi pelanggan & jadwal distribusi tim logistik'}
              </p>
            </div>

            {/* Akumulasi Badge */}
            <div className="text-right shrink-0 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Akumulasi</div>
              <div className="text-sm font-black text-amber-400">
                {totalAccumulatedCustomers} <span className="text-[10px] font-normal text-slate-400">Pelanggan</span>
              </div>
            </div>
          </div>

          {/* Quick Summary Pill for Logistics & Customer Accumulation */}
          <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 text-center">
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Akumulasi Klien</div>
              <div className="text-xs font-black text-white mt-0.5">{totalAccumulatedCustomers} Toko / B2B</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Total Kirim</div>
              <div className="text-xs font-black text-blue-400 mt-0.5">{totalAccumulatedShipments} Ritase</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Cakupan Area</div>
              <div className="text-xs font-black text-emerald-400 mt-0.5">{areaCustomerDistribution.length} Wilayah</div>
            </div>
          </div>

          {/* Area List with Customer Accumulation and Logistics Dispatch Bars */}
          <div className="space-y-3 pt-1">
            {paginatedAreas.map(item => {
              const percent = totalAccumulatedCustomers > 0 
                ? Math.round((item.customers / totalAccumulatedCustomers) * 100)
                : 0;
              const isExpanded = expandedArea === item.area;

              return (
                <div 
                  key={item.area} 
                  onClick={() => setExpandedArea(isExpanded ? null : item.area)}
                  className="p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800/60 transition cursor-pointer space-y-1.5"
                >
                  <div className="flex justify-between items-baseline text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-slate-200 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-white truncate">{item.area}</span>
                    </div>
                    <div className="font-mono text-xs shrink-0 text-right">
                      <span className="font-bold text-amber-400">{item.customers} Pelanggan</span>
                      <span className="text-slate-400 text-[11px] ml-1.5">({item.shipments} Kirim)</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 px-0.5">
                    <span className="truncate">{item.cities}</span>
                    <span className="shrink-0 font-medium text-slate-300">{percent}% dari total</span>
                  </div>

                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.max(5, percent)}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>

                  {/* Expandable Key Customers & Logistics Info */}
                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] space-y-1.5 animate-fadeIn">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold uppercase tracking-wider text-slate-400">Pelanggan Utama Terlayani:</span>
                        <span className="text-emerald-400 font-medium">{item.tag}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.keyClients.map((client, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] border border-slate-700/60">
                            {client}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 font-mono">
                        <span>Tonase Kargo: {item.tonase} Ton</span>
                        <span>{item.armada} Armada Dikerahkan</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2 py-1 rounded text-xs ${
                    currentPage === page 
                      ? 'bg-amber-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => onNavigate('customer_map')}
              className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Store className="w-3.5 h-3.5 text-emerald-400" />
              <span>Buka Peta Sebaran Pelanggan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Portals & Live Shipments (Filtered by Month, Year, and Fleet) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Shipments Table (Left) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Daftar Pengiriman: {selectedMonth} {selectedYear}</span>
                {selectedFleet && (
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                    {selectedFleet.plateNumber}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {filteredSchedules.length > 0
                  ? `Menampilkan ${filteredSchedules.length} pengiriman yang sesuai dengan filter yang dipilih`
                  : 'Tidak ada pengiriman tercatat untuk kombinasi periode dan armada ini'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('schedules')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 shrink-0"
            >
              <span>Buka Modul Penjadwalan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {filteredSchedules.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3 font-semibold">Resi / Toko Tujuan</th>
                    <th className="p-3 font-semibold">Armada &amp; Driver</th>
                    <th className="p-3 font-semibold">Rute &amp; Transit</th>
                    <th className="p-3 font-semibold">Jadwal &amp; ETA</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredSchedules.slice(0, 6).map(sch => (
                    <tr key={sch.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <div className="font-mono font-bold text-white text-xs">{sch.trackingNumber}</div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[180px]">{sch.store?.storeName}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-mono font-bold text-slate-200">{sch.fleet?.plateNumber}</div>
                        <div className="text-slate-400 text-[11px]">{sch.crew?.name}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          sch.isInterIsland ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {sch.isInterIsland ? 'Luar Pulau (Ferry)' : 'Tol Darat (Jawa)'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-amber-400 text-[11px]">
                        {new Date(sch.estimatedArrival).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          sch.status === 'in_transit'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : sch.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                          {sch.status === 'in_transit' ? 'In Transit' : sch.status === 'delivered' ? 'Selesai' : 'Terjadwal'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-10 text-center space-y-3 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
                <Info className="w-8 h-8 text-slate-500 mx-auto" />
                <div>
                  <p className="text-xs font-semibold text-slate-300">
                    Tidak ada pengiriman pada {selectedMonth} {selectedYear}
                    {selectedFleet ? ` untuk armada ${selectedFleet.plateNumber}` : ''}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ubah filter bulan/tahun di atas atau pilih &quot;Semua Bulan&quot; untuk melihat seluruh arsip pengiriman.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleResetFilters}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition"
                  >
                    Reset Filter
                  </button>
                  <button
                    onClick={() => onNavigate('schedules')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white rounded-lg transition"
                  >
                    Buat Jadwal Baru
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Launch Cards (Right) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Pantauan GPS Real-Time Tracksolid</h4>
              <p className="text-xs text-slate-400 mt-1">
                Akses langsung ke konsol telematika armada: status kontak ACC, kecepatan live, dan satelit GPS.
              </p>
            </div>
            <button
              onClick={() => onNavigate('tracksolid')}
              className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Buka Monitor Tracksolid</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Evaluasi Jalur GPS (Excel Upload)</h4>
              <p className="text-xs text-slate-400 mt-1">
                Unggah histori log koordinat Excel untuk menghitung idle time, deviasi rute, dan kepatuhan SLA.
              </p>
            </div>
            <button
              onClick={() => onNavigate('tracking_eval')}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Mulai Analisis Excel</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-sm space-y-3 bg-gradient-to-b from-slate-900 to-amber-950/20">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Aktivitas Admin Penjualan</h4>
              <p className="text-xs text-slate-400 mt-1">
                Integrasi SO karton box, jadwal piket admin, checklist harian per bulan, dan SLA durasi muat armada di loading bay DC.
              </p>
            </div>
            <button
              onClick={() => onNavigate('sales_dashboard')}
              className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Buka Modul Admin Penjualan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <FleetPerformanceInsight />
          </div>
          
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <FleetTaxMonitoringPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
