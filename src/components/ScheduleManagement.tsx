import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Truck, Store, User, Users, Ship, Clock, CheckCircle2, AlertTriangle, FileText, Search, ChevronRight, MapPin, Printer, ShieldAlert, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Schedule, RetailStore, Fleet, Crew, ShipmentStatus, CrewDeliveryHistory } from '../types';
import { logisticsStore } from '../services/store';
import { CENTRAL_WAREHOUSE } from '../data/mockData';
import { AreaApprovalModal } from './AreaApprovalModal';
import { CrewSimulationModal } from './CrewSimulationModal';
import { CrewPoolManagementModal } from './CrewPoolManagementModal';

interface ScheduleManagementProps {
  preselectedStore?: RetailStore | null;
  onClearPreselectedStore?: () => void;
}

const AREA_MAP: Record<string, string> = {
  'GROSIR1': 'GROSIR 1',
  'RITEL_ROGOJAMPI': 'RITEL ROGOJAMPI',
  'RITEL_SONGGON': 'RITEL SONGGON',
  'SUSULAN_ROGOJAMPI_MUNCAR': 'SUSULAN ROGOJAMPI-MUNCAR',
  'JAJAG_RETAIL': 'JAJAG RETAIL',
  'DENPASAR2': 'DENPASAR 2',
  'SUSULAN_SANGGAR_JAJAG': 'SUSULAN SANGGAR-JAJAG',
  'DENPASAR1': 'DENPASAR 1',
  'BWI_KOTA_SELATAN': 'BWI KOTA SELATAN',
  'KETAPANG_WONGSOREJO': 'KETAPANG - WONGSOREJO',
  'RITEL_SRONO': 'RITEL SRONO',
  'GALEKAN': 'GALEKAN',
  'JEMBER_BARAT': 'JEMBER BARAT',
  'RITEL_KALIBARU': 'RITEL KALIBARU',
  'RITEL_PURWO': 'RITEL PURWO',
  'SSLN_SINGARAJA': 'SSLN SINGARAJA',
  'SEMPU_KALISTAIL': 'SEMPU KALISTAIL',
  'JEMBER_KOTA': 'JEMBER KOTA',
  'BONDOWOSO': 'BONDOWOSO',
  'SSLN_STB_BDWS': 'SSLN STB BDWS',
  'RITEL_SANGGAR': 'RITEL SANGGAR',
  'NEGARA': 'NEGARA',
  'JEMBER_SELATAN': 'JEMBER SELATAN'
};

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({
  preselectedStore,
  onClearPreselectedStore
}) => {
  const [schedules, setSchedules] = useState<Schedule[]>(logisticsStore.getSchedules());
  const [stores, setStores] = useState<RetailStore[]>(logisticsStore.getStores());
  const [fleets, setFleets] = useState<Fleet[]>(logisticsStore.getFleets());
  const [crews, setCrews] = useState<Crew[]>(logisticsStore.getCrews());

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('Semua Bulan');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedFleetId, setSelectedFleetId] = useState<string>('all');
  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [selectedManifest, setSelectedManifest] = useState<Schedule | null>(null);
  const [isCrewSimulationOpen, setIsCrewSimulationOpen] = useState(false);
  const [isCrewPoolOpen, setIsCrewPoolOpen] = useState(false);

  // Area Approval Pop-up State
  const [areaApprovalModalData, setAreaApprovalModalData] = useState<{
    isOpen: boolean;
    crewName: string;
    crewId: string;
    areaName: string;
    storeName: string;
    plateNumber: string;
    tripCount: number;
    threshold: number;
    recentTrips: CrewDeliveryHistory[];
  }>({
    isOpen: false,
    crewName: '',
    crewId: '',
    areaName: '',
    storeName: '',
    plateNumber: '',
    tripCount: 0,
    threshold: 3,
    recentTrips: []
  });

  // Form state
  const [newSchedule, setNewSchedule] = useState({
    trackingNumber: 'TRK-' + new Date().toISOString().substring(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 900 + 100),
    storeId: '',
    fleetId: '',
    crewId: '',
    crewHelperId: '',
    status: 'scheduled' as ShipmentStatus,
    departureDate: new Date().toISOString().substring(0, 16),
    estimatedArrival: new Date(Date.now() + 24 * 3600000).toISOString().substring(0, 16),
    cargoDescription: 'FMCG & Consumer Goods Assorted Pallets',
    cargoWeightTon: 15.0,
    isInterIsland: false,
    ferryBookingCode: '',
    transitPort: '',
    notes: ''
  });

  useEffect(() => {
    return logisticsStore.subscribe(() => {
      setSchedules(logisticsStore.getSchedules());
      setStores(logisticsStore.getStores());
      setFleets(logisticsStore.getFleets());
      setCrews(logisticsStore.getCrews());
    });
  }, []);

  // Handle preselected store from CustomerMapping tab
  useEffect(() => {
    if (preselectedStore) {
      handleOpenCreateWithStore(preselectedStore);
      if (onClearPreselectedStore) onClearPreselectedStore();
    }
  }, [preselectedStore]);

  const handleOpenCreateWithStore = (store: RetailStore) => {
    const isOuter = store.island !== 'Jawa';
    let defaultTransit = '';
    let defaultBooking = '';

    if (store.island === 'Sumatera') {
      defaultTransit = 'Pelabuhan Merak (Dermaga Eksekutif) -> Pelabuhan Bakauheni';
      defaultBooking = 'ASDP-MRK-BKU-' + Math.floor(Math.random() * 90000 + 10000);
    } else if (store.island === 'Bali & Nusa Tenggara') {
      defaultTransit = 'Pelabuhan Ketapang Banyuwangi -> Pelabuhan Gilimanuk Bali';
      defaultBooking = 'ASDP-KTP-GLM-' + Math.floor(Math.random() * 90000 + 10000);
    } else if (store.island === 'Kalimantan' || store.island === 'Sulawesi') {
      defaultTransit = 'Pelabuhan Tanjung Perak Surabaya -> Pelabuhan Tujuan (Kapal Ro-Ro)';
      defaultBooking = 'KM-DHARMA-RORO-' + Math.floor(Math.random() * 90000 + 10000);
    }

    // Auto-suggest suitable available fleet
    const suitableFleet = fleets.find(f => f.status === 'available') || fleets[0];
    const suitableCrew = crews.find(c => c.status === 'available' && c.role === 'Driver Utama') || crews[0];

    setNewSchedule({
      trackingNumber: 'TRK-' + new Date().toISOString().substring(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 900 + 100),
      storeId: store.id,
      fleetId: suitableFleet ? suitableFleet.id : '',
      crewId: suitableCrew ? suitableCrew.id : '',
      crewHelperId: '',
      status: 'scheduled',
      departureDate: new Date().toISOString().substring(0, 16),
      estimatedArrival: new Date(Date.now() + (isOuter ? 48 : 16) * 3600000).toISOString().substring(0, 16),
      cargoDescription: 'FMCG & Consumer Goods Assorted Pallets',
      cargoWeightTon: 15.0,
      isInterIsland: isOuter,
      ferryBookingCode: defaultBooking,
      transitPort: defaultTransit,
      notes: isOuter ? 'Prioritas konfirmasi slot kapal penyeberangan logistik.' : 'Jalur tol Trans-Jawa reguler.'
    });
    setIsAddScheduleOpen(true);
  };

  const handleStoreChange = (storeId: string) => {
    const selectedStore = stores.find(s => s.id === storeId);
    if (!selectedStore) return;

    const isOuter = selectedStore.island !== 'Jawa';
    let defaultTransit = '';
    let defaultBooking = '';

    if (selectedStore.island === 'Sumatera') {
      defaultTransit = 'Pelabuhan Merak (Dermaga Eksekutif) -> Pelabuhan Bakauheni';
      defaultBooking = 'ASDP-MRK-BKU-' + Math.floor(Math.random() * 90000 + 10000);
    } else if (selectedStore.island === 'Bali & Nusa Tenggara') {
      defaultTransit = 'Pelabuhan Ketapang Banyuwangi -> Pelabuhan Gilimanuk Bali';
      defaultBooking = 'ASDP-KTP-GLM-' + Math.floor(Math.random() * 90000 + 10000);
    } else if (selectedStore.island === 'Kalimantan' || selectedStore.island === 'Sulawesi') {
      defaultTransit = 'Pelabuhan Tanjung Perak Surabaya -> Pelabuhan Tujuan (Kapal Ro-Ro)';
      defaultBooking = 'KM-DHARMA-RORO-' + Math.floor(Math.random() * 90000 + 10000);
    }

    setNewSchedule(prev => ({
      ...prev,
      storeId,
      isInterIsland: isOuter,
      transitPort: defaultTransit,
      ferryBookingCode: defaultBooking
    }));
  };

  const selectedStoreObj = stores.find(s => s.id === newSchedule.storeId);
  const selectedCrewObj = crews.find(c => c.id === newSchedule.crewId);
  const selectedFleetObj = fleets.find(f => f.id === newSchedule.fleetId);
  const currentAreaName = selectedStoreObj ? `${selectedStoreObj.island} (${selectedStoreObj.city})` : '';
  const areaCheck = (selectedCrewObj && currentAreaName)
    ? logisticsStore.checkCrewAreaThreshold(selectedCrewObj.id, currentAreaName)
    : null;

  const sendWhatsAppNotification = async (crew: Crew, message: string) => {
    try {
      await fetch('/api/notify-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: crew.phone, message }),
      });
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
    }
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.storeId || !newSchedule.fleetId || !newSchedule.crewId) {
      alert('Harap pilih Toko Tujuan, Armada Truk, dan Kru Supir.');
      return;
    }

    // Intercept with area threshold approval if required and not yet approved
    if (areaCheck && areaCheck.requiresApproval && !areaCheck.isApproved) {
      setAreaApprovalModalData({
        isOpen: true,
        crewName: selectedCrewObj!.name,
        crewId: selectedCrewObj!.id,
        areaName: currentAreaName,
        storeName: selectedStoreObj!.storeName,
        plateNumber: selectedFleetObj?.plateNumber || '-',
        tripCount: areaCheck.tripCount,
        threshold: areaCheck.threshold,
        recentTrips: areaCheck.recentTrips
      });
      return;
    }

    const scheduleData = {
      ...newSchedule,
      originName: CENTRAL_WAREHOUSE.name,
      originCoords: CENTRAL_WAREHOUSE.coordinates,
      departureDate: new Date(newSchedule.departureDate).toISOString(),
      estimatedArrival: new Date(newSchedule.estimatedArrival).toISOString(),
      areaApprovalStatus: (areaCheck?.requiresApproval ? 'approved' : 'not_required') as 'approved' | 'not_required',
      areaTripCount: (areaCheck?.tripCount || 0) + 1
    };

    if ((newSchedule as any).id) {
      logisticsStore.updateSchedule((newSchedule as any).id, scheduleData);
    } else {
      logisticsStore.addSchedule(scheduleData);
      
      // Notify crew
      const crew = crews.find(c => c.id === scheduleData.crewId);
      const helper = crews.find(c => c.id === scheduleData.crewHelperId);
      const msg = `Halo, Anda ditugaskan untuk pengiriman baru ke ${selectedStoreObj?.storeName}. Armada: ${selectedFleetObj?.plateNumber}. Berangkat: ${new Date(scheduleData.departureDate).toLocaleString()}`;
      
      if (crew) sendWhatsAppNotification(crew, msg);
      if (helper) sendWhatsAppNotification(helper, msg);
    }

    setIsAddScheduleOpen(false);
  };

  const handleApproveAreaAndSaveSchedule = (notes: string) => {
    if (!selectedStoreObj || !selectedCrewObj) return;

    logisticsStore.createAreaApprovalRequest({
      crewId: selectedCrewObj.id,
      crewName: selectedCrewObj.name,
      targetArea: currentAreaName,
      currentTripsInArea: areaCheck?.tripCount || 0,
      thresholdLimit: areaCheck?.threshold || 3,
      storeName: selectedStoreObj.storeName,
      plateNumber: selectedFleetObj?.plateNumber || '-',
      departureDate: new Date(newSchedule.departureDate).toISOString(),
      status: 'approved',
      reasonPolicy: `Otorisasi khusus penugasan pengiriman ke-${(areaCheck?.tripCount || 0) + 1} di area ${currentAreaName}.`,
      notes
    });

    logisticsStore.addSchedule({
      ...newSchedule,
      originName: CENTRAL_WAREHOUSE.name,
      originCoords: CENTRAL_WAREHOUSE.coordinates,
      departureDate: new Date(newSchedule.departureDate).toISOString(),
      estimatedArrival: new Date(newSchedule.estimatedArrival).toISOString(),
      areaApprovalStatus: 'approved',
      areaTripCount: (areaCheck?.tripCount || 0) + 1
    });

    // Notify crew
    const crew = crews.find(c => c.id === newSchedule.crewId);
    const helper = crews.find(c => c.id === newSchedule.crewHelperId);
    const msg = `Halo, Anda ditugaskan untuk pengiriman baru ke ${selectedStoreObj?.storeName}. Armada: ${selectedFleetObj?.plateNumber}. Berangkat: ${new Date(newSchedule.departureDate).toLocaleString()}`;
    
    if (crew) sendWhatsAppNotification(crew, msg);
    if (helper) sendWhatsAppNotification(helper, msg);

    setAreaApprovalModalData(prev => ({ ...prev, isOpen: false }));
    setIsAddScheduleOpen(false);
  };

  const handleRejectAndPickOtherDriver = () => {
    const alternativeDriver = crews.find(c => c.id !== newSchedule.crewId && c.status === 'available');
    if (alternativeDriver) {
      setNewSchedule(prev => ({ ...prev, crewId: alternativeDriver.id }));
    }
    setAreaApprovalModalData(prev => ({ ...prev, isOpen: false }));
  };

const MONTH_NAMES = [
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

const YEAR_LIST = ['Semua Tahun', '2024', '2025', '2026', '2027'];

  const handleUpdateStatus = (scheduleId: string, newStatus: ShipmentStatus) => {
    logisticsStore.updateScheduleStatus(scheduleId, newStatus);
  };

  const filteredSchedules = schedules.filter(sch => {
    const matchesStatus = statusFilter === 'all' || sch.status === statusFilter;
    const matchesQuery =
      sch.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sch.store?.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sch.fleet?.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sch.fleet?.initialCode && sch.fleet.initialCode.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Fleet filter
    const matchesFleet = selectedFleetId === 'all' || sch.fleetId === selectedFleetId;

    // Date filter
    let matchesDate = true;
    const dateStr = sch.departureDate || sch.createdAt;
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        if (selectedYear !== 'Semua Tahun' && d.getFullYear().toString() !== selectedYear) {
          matchesDate = false;
        }
        if (selectedMonth !== 'Semua Bulan') {
          const monthIdx = MONTH_NAMES.indexOf(selectedMonth) - 1;
          if (monthIdx >= 0 && d.getMonth() !== monthIdx) {
            matchesDate = false;
          }
        }
      }
    }

    return matchesStatus && matchesQuery && matchesFleet && matchesDate;
  });

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm no-print">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Dispatcher & Route Planner Hub</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Manajemen Jadwal Pengiriman & Penugasan Armada
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Penjadwalan pengiriman B2B dari Gudang Pusat Banyuwangi DC ke seluruh toko retail pelanggan, alokasi tonase armada otomatis, serta manajemen logistik tiket kapal penyeberangan antar-pulau.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-center flex-wrap">
            <button
              onClick={() => setIsCrewPoolOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Manajemen Data Pool</span>
            </button>

            <button
              onClick={() => setIsCrewSimulationOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Simulasi Driver & Helper</span>
            </button>

            <button
              onClick={() => {
                if (stores.length > 0) handleOpenCreateWithStore(stores[0]);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Jadwal Pengiriman Baru</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['all', 'in_transit', 'scheduled', 'delivered', 'delayed'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition ${
                  statusFilter === st ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'all' && 'Semua Jadwal'}
                {st === 'in_transit' && 'Dalam Perjalanan'}
                {st === 'scheduled' && 'Terjadwal'}
                {st === 'delivered' && 'Selesai'}
                {st === 'delayed' && 'Tertunda'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari no resi, toko, atau plat truk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Secondary Filter Row: Bulan, Tahun, Pilih Armada */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Bulan */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-medium">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {MONTH_NAMES.map(m => (
                  <option key={m} value={m} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Tahun */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-medium">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {YEAR_LIST.map(y => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Pilih Armada */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px] font-medium">Armada:</span>
              <select
                value={selectedFleetId}
                onChange={(e) => setSelectedFleetId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[220px] truncate"
              >
                <option value="all" className="bg-slate-900 text-white">
                  Semua Armada ({fleets.length} Truk)
                </option>
                {fleets.map(f => (
                  <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                    {f.initialCode ? `[${f.initialCode}] ` : ''}{f.plateNumber} - {f.vehicleType}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Tombol Ekspor CSV */}
            <button
              onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," + 
                  ["Area Kirim,Armada,Supir,Status,Keberangkatan"].concat(
                    filteredSchedules.map(s => `"${s.store?.storeName || AREA_MAP[s.storeId] || 'Toko'}","${s.fleet?.plateNumber}","${s.crew?.name}","${s.status}","${new Date(s.departureDate).toLocaleString()}"`)
                  ).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `jadwal_pengiriman_${new Date().toISOString().slice(0, 10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-400 border border-emerald-800 text-xs font-semibold transition"
            >
              <FileText className="w-3.5 h-3.5" />
              Ekspor CSV
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(selectedMonth !== 'Semua Bulan' || selectedYear !== 'Semua Tahun' || selectedFleetId !== 'all') && (
              <button
                onClick={() => {
                  setSelectedMonth('Semua Bulan');
                  setSelectedYear('Semua Tahun');
                  setSelectedFleetId('all');
                }}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
            <span className="text-[11px] text-slate-400">
              Ditemukan: <strong className="text-white">{filteredSchedules.length}</strong> jadwal
            </span>
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-4 font-semibold">Area Kirim</th>
                <th className="p-4 font-semibold">Armada, Supir & Helper</th>
                <th className="p-4 font-semibold">Kategori Jalur & Logistik Kapal</th>
                <th className="p-4 font-semibold">Berangkat / Tiba</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredSchedules.map(sch => {
                const isOuter = sch.isInterIsland;

                return (
                  <tr key={sch.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <div className="font-semibold text-white">{sch.store?.storeName || AREA_MAP[sch.storeId] || 'Toko Retail'}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{sch.store?.city}, {sch.store?.island}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-blue-400" />
                        {sch.fleet?.initialCode && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {sch.fleet.initialCode}
                          </span>
                        )}
                        <span className="font-mono font-bold text-white">{sch.fleet?.plateNumber || '-'}</span>
                        <span className="text-[10px] text-slate-400">({sch.fleet?.vehicleType})</span>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] text-slate-400 mt-1">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-emerald-400" />
                          <span>Supir: <strong className="text-slate-200">{sch.crew?.name || '-'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>Helper: <strong className="text-slate-200">{sch.crewHelper?.name || '-'}</strong></span>
                        </div>
                      </div>
                      {sch.areaApprovalStatus === 'approved' && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span>Otorisasi Khusus Disetujui</span>
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      {isOuter ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Ship className="w-3 h-3" />
                            <span>Luar Pulau (Ferry / Ro-Ro)</span>
                          </span>
                          {sch.transitPort && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]" title={sch.transitPort}>
                              Pelabuhan: {sch.transitPort}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Jalur Tol Darat (Jawa)
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="text-[11px] text-slate-300">
                        ETD: {new Date(sch.departureDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[11px] text-amber-400 mt-0.5 font-medium">
                        ETA: {new Date(sch.estimatedArrival).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="p-4">
                      <select
                        value={sch.status}
                        onChange={(e) => handleUpdateStatus(sch.id, e.target.value as ShipmentStatus)}
                        className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer border ${
                          sch.status === 'in_transit'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                            : sch.status === 'scheduled'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : sch.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                        }`}
                      >
                        <option value="scheduled">Terjadwal</option>
                        <option value="in_transit">Dalam Perjalanan</option>
                        <option value="delivered">Terkirim (Selesai)</option>
                        <option value="delayed">Tertunda (Delayed)</option>
                      </select>
                    </td>

                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setNewSchedule({
                            trackingNumber: sch.trackingNumber,
                            storeId: sch.storeId,
                            fleetId: sch.fleetId,
                            crewId: sch.crewId,
                            crewHelperId: sch.crewHelperId || '',
                            status: sch.status,
                            departureDate: sch.departureDate ? sch.departureDate.substring(0, 16) : new Date().toISOString().substring(0, 16),
                            estimatedArrival: sch.estimatedArrival ? sch.estimatedArrival.substring(0, 16) : new Date().toISOString().substring(0, 16),
                            cargoDescription: sch.cargoDescription || 'FMCG Assorted',
                            cargoWeightTon: sch.cargoWeightTon || 15,
                            isInterIsland: !!sch.isInterIsland,
                            ferryBookingCode: sch.ferryBookingCode || '',
                            transitPort: sch.transitPort || '',
                            notes: sch.notes || '',
                            ...((sch as any).id ? { id: (sch as any).id } : {})
                          });
                          setIsAddScheduleOpen(true);
                        }}
                        className="inline-flex items-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition"
                        title="Edit Jadwal"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
                            logisticsStore.deleteSchedule(sch.id);
                          }
                        }}
                        className="inline-flex items-center p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 text-red-400 border border-slate-700 transition"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedManifest(sch)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
                        title="Lihat Surat Jalan"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Surat Jalan</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>


      {/* Create Schedule Modal */}
      <AnimatePresence>
        {isAddScheduleOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Buat Surat Perintah Jalan & Jadwal Pengiriman Baru
                </h3>
                <button
                  onClick={() => setIsAddScheduleOpen(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  &times;
                </button>
              </div>

            <form onSubmit={handleCreateSchedule} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Area Kirim</label>
                  <select
                    required
                    value={newSchedule.storeId}
                    onChange={(e) => setNewSchedule({ ...newSchedule, storeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-semibold"
                  >
                    <option value="">-- Pilih Area --</option>
                    <option value="GROSIR1">GROSIR 1</option>
                    <option value="RITEL_ROGOJAMPI">RITEL ROGOJAMPI</option>
                    <option value="RITEL_SONGGON">RITEL SONGGON</option>
                    <option value="SUSULAN_ROGOJAMPI_MUNCAR">SUSULAN ROGOJAMPI-MUNCAR</option>
                    <option value="JAJAG_RETAIL">JAJAG RETAIL</option>
                    <option value="DENPASAR2">DENPASAR 2</option>
                    <option value="SUSULAN_SANGGAR_JAJAG">SUSULAN SANGGAR-JAJAG</option>
                    <option value="DENPASAR1">DENPASAR 1</option>
                    <option value="BWI_KOTA_SELATAN">BWI KOTA SELATAN</option>
                    <option value="KETAPANG_WONGSOREJO">KETAPANG - WONGSOREJO</option>
                    <option value="RITEL_SRONO">RITEL SRONO</option>
                    <option value="GALEKAN">GALEKAN</option>
                    <option value="JEMBER_BARAT">JEMBER BARAT</option>
                    <option value="RITEL_KALIBARU">RITEL KALIBARU</option>
                    <option value="RITEL_PURWO">RITEL PURWO</option>
                    <option value="SSLN_SINGARAJA">SSLN SINGARAJA</option>
                    <option value="SEMPU_KALISTAIL">SEMPU KALISTAIL</option>
                    <option value="JEMBER_KOTA">JEMBER KOTA</option>
                    <option value="BONDOWOSO">BONDOWOSO</option>
                    <option value="SSLN_STB_BDWS">SSLN STB BDWS</option>
                    <option value="RITEL_SANGGAR">RITEL SANGGAR</option>
                    <option value="NEGARA">NEGARA</option>
                    <option value="JEMBER_SELATAN">JEMBER SELATAN</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Alokasi Armada Truk</label>
                  <select
                    required
                    value={newSchedule.fleetId}
                    onChange={(e) => setNewSchedule({ ...newSchedule, fleetId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="">-- Pilih Truk --</option>
                    {fleets.map(fl => (
                      <option key={fl.id} value={fl.id}>
                        {fl.initialCode ? `[${fl.initialCode}] ` : ''}{fl.plateNumber} - {fl.vehicleType} [{fl.status}]
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Kru Supir Utama</label>
                  <select
                    required
                    value={newSchedule.crewId}
                    onChange={(e) => setNewSchedule({ ...newSchedule, crewId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="">-- Pilih Supir Utama --</option>
                    {crews.map(cr => (
                      <option key={cr.id} value={cr.id}>
                        {cr.name} ({cr.licenseType}) [{cr.status}]
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Kru Helper (Opsional)</label>
                  <select
                    value={newSchedule.crewHelperId || ''}
                    onChange={(e) => setNewSchedule({ ...newSchedule, crewHelperId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="">-- Pilih Helper --</option>
                    {crews.filter(c => c.id !== newSchedule.crewId).map(cr => (
                      <option key={cr.id} value={cr.id}>
                        {cr.name} [{cr.status}]
                      </option>
                    ))}
                  </select>
                </div>
                {/* Area frequency & approval alert preview */}
                <div className="col-span-2">
                  {areaCheck && areaCheck.requiresApproval && (
                    <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold">Batas Pengiriman Wilayah Tercapai ({areaCheck.tripCount}x Kirim)</div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          Supir <strong className="text-white">{selectedCrewObj?.name}</strong> telah mengirim {areaCheck.tripCount} kali ke wilayah <strong className="text-white">{currentAreaName}</strong>.
                          {areaCheck.isApproved ? (
                            <span className="text-emerald-400 font-semibold block mt-0.5">✓ Otorisasi dispensasi rotasi wilayah telah disetujui.</span>
                          ) : (
                            <span className="text-amber-400 font-semibold block mt-0.5">Pop-up persetujuan otorisasi khusus akan otomatis muncul saat Anda mengklik "Rilis Jadwal".</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Inter-island logistics configuration */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-white">
                    <input
                      type="checkbox"
                      checked={newSchedule.isInterIsland}
                      onChange={(e) => setNewSchedule({ ...newSchedule, isInterIsland: e.target.checked })}
                      className="rounded bg-slate-900 border-slate-700 text-blue-500"
                    />
                    <Ship className="w-4 h-4 text-emerald-400" />
                    Penjadwalan Kapal Penyeberangan / Ro-Ro (Luar Pulau)
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Estimasi Berangkat dari Argopuro</label>
                  <input
                    type="datetime-local"
                    required
                    value={newSchedule.departureDate}
                    onChange={(e) => setNewSchedule({ ...newSchedule, departureDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Estimasi Tiba ke Argopuro</label>
                  <input
                    type="datetime-local"
                    required
                    value={newSchedule.estimatedArrival}
                    onChange={(e) => setNewSchedule({ ...newSchedule, estimatedArrival: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-semibold text-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Kendala</label>
                <textarea
                  placeholder="Masukkan kendala pengiriman jika ada..."
                  value={newSchedule.notes || ''}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow"
                >
                  Simpan & Rilis Penugasan
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Manifest / Surat Jalan Preview Modal */}
      <AnimatePresence>
        {selectedManifest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white text-slate-900 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm">SURAT JALAN & MANIFEST PENGIRIMAN B2B</span>
                </div>
                <button
                  onClick={() => setSelectedManifest(null)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  &times;
                </button>
              </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Header Company */}
              <div className="border-b border-slate-300 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-base font-black text-slate-900 uppercase">PT. ANUGRAH KEMASAN KREATIF</h2>
                  <p className="text-slate-600 text-[11px] mt-0.5">{CENTRAL_WAREHOUSE.name}</p>
                  <p className="text-slate-500 text-[10px]">{CENTRAL_WAREHOUSE.address}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-blue-800">{selectedManifest.trackingNumber}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Tanggal: {new Date(selectedManifest.createdAt).toLocaleDateString('id-ID')}</div>
                </div>
              </div>

              {/* Destination & Fleet Matrix */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">AREA KIRIM:</span>
                  <div className="font-bold text-slate-900 text-sm mt-1">{selectedManifest.store?.storeName || AREA_MAP[selectedManifest.storeId] || '-'}</div>
                  <div className="text-slate-600 mt-0.5">{selectedManifest.store?.address}</div>
                  <div className="text-blue-700 font-bold mt-1">Wilayah: Banyuwangi</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500">ARMADA, DRIVER & HELPER:</span>
                  <div className="font-bold text-slate-900 text-sm mt-1 font-mono">{selectedManifest.fleet?.plateNumber}</div>
                  <div className="text-slate-600 mt-0.5">Tipe: {selectedManifest.fleet?.vehicleType}</div>
                  <div className="text-slate-600 mt-0.5">Driver: {selectedManifest.crew?.name} ({selectedManifest.crew?.licenseType})</div>
                  <div className="text-slate-600 mt-0.5">Helper: {selectedManifest.crewHelper?.name || '-'}</div>
                  <div className="text-slate-600 mt-0.5">Telp: {selectedManifest.crew?.phone}</div>
                </div>
              </div>

              {/* Inter-island logistics info */}
              {selectedManifest.isInterIsland && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <Ship className="w-3.5 h-3.5" />
                    <span>LOGISTIK PENYEBERANGAN KAPAL FERRY / RO-RO</span>
                  </div>
                  <div className="mt-1 text-[11px]">
                    Pelabuhan: <strong>{selectedManifest.transitPort || '-'}</strong>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <table className="w-full text-left border border-slate-300">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                  <tr>
                    <th className="p-2">No</th>
                    <th className="p-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-mono">01</td>
                    <td className="p-2 font-medium">Pengiriman ke Area {selectedManifest.store?.storeName || AREA_MAP[selectedManifest.storeId] || 'Tujuan'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-4 text-center text-[11px] text-slate-600">
                <div>
                  <div>Disiapkan Oleh (Koordinator Logistik):</div>
                  <div className="h-12 border-b border-slate-300 mt-1"></div>
                  <div className="font-bold text-slate-800 mt-1">Dewi Anggraini, S.Log</div>
                </div>
                <div>
                  <div>Dibawa Oleh (Driver / Helper):</div>
                  <div className="h-12 border-b border-slate-300 mt-1"></div>
                  <div className="font-bold text-slate-800 mt-1">{selectedManifest.crew?.name || 'Driver'} / {selectedManifest.crewHelper?.name || '-'}</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 p-4 border-t border-slate-300 flex justify-end gap-2">
              <button
                onClick={() => setSelectedManifest(null)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Dokumen Surat Jalan</span>
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Area Trip Limit Approval Modal */}
      <AreaApprovalModal
        isOpen={areaApprovalModalData.isOpen}
        onClose={() => setAreaApprovalModalData(prev => ({ ...prev, isOpen: false }))}
        crewName={areaApprovalModalData.crewName}
        crewId={areaApprovalModalData.crewId}
        areaName={areaApprovalModalData.areaName}
        storeName={areaApprovalModalData.storeName}
        plateNumber={areaApprovalModalData.plateNumber}
        tripCount={areaApprovalModalData.tripCount}
        threshold={areaApprovalModalData.threshold}
        recentTrips={areaApprovalModalData.recentTrips}
        onApprove={handleApproveAreaAndSaveSchedule}
        onRejectAndPickOtherDriver={handleRejectAndPickOtherDriver}
      />

      {/* Crew & Driver Simulation Modal */}
      <CrewSimulationModal
        isOpen={isCrewSimulationOpen}
        onClose={() => setIsCrewSimulationOpen(false)}
        crews={crews}
        fleets={fleets}
        stores={stores}
      />

      {/* Crew Pool Management Modal */}
      <CrewPoolManagementModal
        isOpen={isCrewPoolOpen}
        onClose={() => setIsCrewPoolOpen(false)}
        crews={crews}
        onRefresh={() => setCrews(logisticsStore.getCrews())}
      />
    </div>
  );
};
