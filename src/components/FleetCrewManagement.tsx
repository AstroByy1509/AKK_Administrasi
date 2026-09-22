import React, { useState, useEffect } from 'react';
import {
  Truck,
  Users,
  Plus,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  Fuel,
  AlertCircle,
  Phone,
  Award,
  Calendar,
  Search,
  History,
  ShieldAlert,
  UserCheck,
  Edit3,
  Trash2,
  FileText,
  CreditCard,
  Droplets,
  Disc,
  BatteryCharging
} from 'lucide-react';
import { Fleet, Crew, VehicleType, FleetStatus, CrewStatus } from '../types';
import { logisticsStore } from '../services/store';
import { CrewDeliveryHistoryView } from './CrewDeliveryHistoryView';

interface FleetCrewManagementProps {
  onNavigateToSpareParts?: () => void;
  onNavigateToFuelEfficiency?: () => void;
}

export const FleetCrewManagement: React.FC<FleetCrewManagementProps> = ({
  onNavigateToSpareParts,
  onNavigateToFuelEfficiency
}) => {
  const [fleets, setFleets] = useState<Fleet[]>(logisticsStore.getFleets());
  const [crews, setCrews] = useState<Crew[]>(logisticsStore.getCrews());
  const [activeTab, setActiveTab] = useState<'fleets' | 'crews' | 'history'>('fleets');
  const [fleetFilter, setFleetFilter] = useState<string>('all');
  const [crewFilter, setCrewFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddFleetOpen, setIsAddFleetOpen] = useState(false);
  const [isAddCrewOpen, setIsAddCrewOpen] = useState(false);

  // Edit Modals and States
  const [isEditFleetOpen, setIsEditFleetOpen] = useState(false);
  const [editingFleet, setEditingFleet] = useState<Fleet | null>(null);

  const [isEditCrewOpen, setIsEditCrewOpen] = useState(false);
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null);

  // Default Tax & STNK Date Helper
  const getDefaultTaxDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().substring(0, 10);
  };

  const getDefaultStnkDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return d.toISOString().substring(0, 10);
  };

  // Status helper for Tax & STNK/Plat
  const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'Belum diisi', color: 'text-slate-400 bg-slate-800/60 border-slate-700' };
    const target = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { label: `Jatuh Tempo (${Math.abs(diffDays)}h lalu)`, color: 'text-rose-400 bg-rose-500/15 border-rose-500/30' };
    }
    if (diffDays <= 30) {
      return { label: `Sisa ${diffDays} hari`, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
    }
    return { label: `Aktif (${diffDays}h)`, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
  };

  // New Fleet Form State
  const [newFleet, setNewFleet] = useState({
    plateNumber: 'B 9' + Math.floor(Math.random() * 900 + 100) + ' XYZ',
    vehicleType: 'Pick Up Box' as VehicleType,
    status: 'available' as FleetStatus,
    gpsImei: '868204059' + Math.floor(Math.random() * 900000 + 100000),
    initialCode: 'PU-07',
    lastMaintenance: new Date().toISOString().substring(0, 10),
    brand: 'Mitsubishi L300',
    year: new Date().getFullYear(),
    engineCc: '2500 CC',
    taxDueDate: getDefaultTaxDate(),
    stnkExpiryDate: getDefaultStnkDate()
  });

  // New Crew Form State
  const [newCrew, setNewCrew] = useState({
    name: '',
    phone: '+62 8',
    role: 'Driver Utama' as Crew['role'],
    licenseNumber: '9204-' + Math.floor(Math.random() * 9000 + 1000) + '-' + Math.floor(Math.random() * 90000 + 10000),
    licenseType: 'SIM B2 Umum' as Crew['licenseType'],
    status: 'available' as CrewStatus
  });

  useEffect(() => {
    return logisticsStore.subscribe(() => {
      setFleets(logisticsStore.getFleets());
      setCrews(logisticsStore.getCrews());
    });
  }, []);

  const handleCreateFleet = (e: React.FormEvent) => {
    e.preventDefault();
    logisticsStore.addFleet(newFleet);
    setIsAddFleetOpen(false);
    setNewFleet({
      plateNumber: 'B 9' + Math.floor(Math.random() * 900 + 100) + ' XYZ',
      vehicleType: 'Pick Up Box',
      status: 'available',
      gpsImei: '868204059' + Math.floor(Math.random() * 900000 + 100000),
      initialCode: 'PU-0' + Math.floor(Math.random() * 90 + 10),
      lastMaintenance: new Date().toISOString().substring(0, 10),
      brand: 'Mitsubishi L300',
      year: new Date().getFullYear(),
      engineCc: '2500 CC',
      taxDueDate: getDefaultTaxDate(),
      stnkExpiryDate: getDefaultStnkDate()
    });
  };

  const handleCreateCrew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrew.name) return;
    logisticsStore.addCrew(newCrew);
    setIsAddCrewOpen(false);
    setNewCrew({
      name: '',
      phone: '+62 8',
      role: 'Driver Utama',
      licenseNumber: '9204-' + Math.floor(Math.random() * 9000 + 1000) + '-' + Math.floor(Math.random() * 90000 + 10000),
      licenseType: 'SIM B2 Umum',
      status: 'available'
    });
  };

  // Fleet Edit & Delete Handlers
  const handleEditFleetClick = (fleet: Fleet) => {
    setEditingFleet({ ...fleet });
    setIsEditFleetOpen(true);
  };

  const handleUpdateFleet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFleet) return;
    logisticsStore.updateFleet(editingFleet.id, editingFleet);
    setIsEditFleetOpen(false);
    setEditingFleet(null);
  };

  const handleDeleteFleetClick = (id: string, plateNumber: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus armada dengan plat nomor ${plateNumber}?`)) {
      logisticsStore.deleteFleet(id);
    }
  };

  // Crew Edit & Delete Handlers
  const handleEditCrewClick = (crew: Crew) => {
    setEditingCrew({ ...crew });
    setIsEditCrewOpen(true);
  };

  const handleUpdateCrew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCrew) return;
    logisticsStore.updateCrew(editingCrew.id, editingCrew);
    setIsEditCrewOpen(false);
    setEditingCrew(null);
  };

  const handleDeleteCrewClick = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kru bernama ${name}?`)) {
      logisticsStore.deleteCrew(id);
    }
  };

  const toggleFleetStatus = (fleet: Fleet) => {
    const nextStatus: FleetStatus =
      fleet.status === 'available' ? 'on-duty' : fleet.status === 'on-duty' ? 'maintenance' : 'available';
    logisticsStore.updateFleetStatus(fleet.id, nextStatus);
  };

  const toggleCrewStatus = (crew: Crew) => {
    const nextStatus: CrewStatus =
      crew.status === 'available' ? 'on-duty' : crew.status === 'on-duty' ? 'off' : 'available';
    logisticsStore.updateCrewStatus(crew.id, nextStatus);
  };

  const filteredFleets = fleets.filter(f => {
    const matchesStatus = fleetFilter === 'all' || f.status === fleetFilter;
    const matchesQuery =
      f.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.initialCode && f.initialCode.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesQuery;
  });

  const filteredCrews = crews.filter(c => {
    const matchesStatus = crewFilter === 'all' || c.status === crewFilter;
    const matchesQuery =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              <Truck className="w-3.5 h-3.5" />
              <span>Manajemen Sumber Daya Operasional</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Manajemen Armada Truk & Kru Pengemudi
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Alokasi kendaraan logistik berat (Tronton, Fuso, Container, CDE/CDD) dan ketersediaan supir bersertifikasi SIM B2 Umum untuk pengiriman nasional & antar-pulau.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToFuelEfficiency && (
              <button
                onClick={onNavigateToFuelEfficiency}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 text-xs font-semibold shadow transition cursor-pointer"
              >
                <Fuel className="w-4 h-4" />
                <span>Efisiensi BBM &rarr;</span>
              </button>
            )}
            {onNavigateToSpareParts && (
              <button
                onClick={onNavigateToSpareParts}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold shadow transition cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Stok Sparepart &rarr;</span>
              </button>
            )}
            {activeTab === 'fleets' ? (
              <button
                onClick={() => setIsAddFleetOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrasi Armada Truk</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAddCrewOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kru / Pengemudi</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Toggle & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('fleets')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeTab === 'fleets' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Data Armada ({fleets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('crews')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeTab === 'crews' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Data Kru Supir & Kernet ({crews.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeTab === 'history' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Histori & Otorisasi Wilayah</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-slate-950 uppercase">
                Rotasi
              </span>
            </button>

            {onNavigateToSpareParts && (
              <button
                onClick={onNavigateToSpareParts}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30 transition cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Stok Sparepart & Servis (Oli, Ban, Aki)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={activeTab === 'fleets' ? 'Cari plat / tipe...' : 'Cari nama kru...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              >
              </input>
            </div>

            {activeTab === 'fleets' ? (
              <select
                value={fleetFilter}
                onChange={(e) => setFleetFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="available">Available</option>
                <option value="on-duty">On-Duty</option>
                <option value="maintenance">Maintenance</option>
              </select>
            ) : (
              <select
                value={crewFilter}
                onChange={(e) => setCrewFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="available">Available</option>
                <option value="on-duty">On-Duty</option>
                <option value="off">Off / Libur</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Fleets Grid */}
      {activeTab === 'fleets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFleets.map(fleet => {
            const assignedCrew = crews.find(c => c.currentFleetId === fleet.id);

            return (
              <div key={fleet.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">PLAT NOMOR</span>
                      {fleet.initialCode && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          {fleet.initialCode}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-white font-mono tracking-wider">{fleet.plateNumber}</h3>
                  </div>

                  <button
                    onClick={() => toggleFleetStatus(fleet)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer border transition ${
                      fleet.status === 'available'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : fleet.status === 'on-duty'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {fleet.status === 'available' && '● Ready (Available)'}
                    {fleet.status === 'on-duty' && '● On-Duty (Aktif)'}
                    {fleet.status === 'maintenance' && '● Servis / Bengkel'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Tipe Armada:</span>
                    <div className="font-semibold text-white mt-0.5">{fleet.vehicleType}</div>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Inisial Mobil:</span>
                    <div className="font-semibold text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                        {fleet.initialCode || (fleet.vehicleType.includes('Wingbox') ? 'WB' : 'ARM') + '-' + fleet.plateNumber.slice(-3)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Spesifikasi Kendaraan */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 text-center">
                    <span className="text-slate-400 text-[10px] block">Merk Mobil</span>
                    <div className="font-semibold text-white truncate mt-0.5" title={fleet.brand || 'Mitsubishi L300'}>
                      {fleet.brand || 'Mitsubishi L300'}
                    </div>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 text-center">
                    <span className="text-slate-400 text-[10px] block">Tahun Produksi</span>
                    <div className="font-semibold text-white mt-0.5">{fleet.year || '2023'}</div>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 text-center">
                    <span className="text-slate-400 text-[10px] block">Kapasitas (CC)</span>
                    <div className="font-semibold text-white mt-0.5">{fleet.engineCc || '2500 CC'}</div>
                  </div>
                </div>

                {/* Operational Details */}
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 text-[11px]">GPS Tracksolid:</span>
                      <div className="font-mono text-slate-200 text-[11px] font-semibold">
                        {fleet.gpsImei && fleet.gpsImei.trim() !== '-' && fleet.gpsImei.trim() !== '' ? fleet.gpsImei : '- (Non-GPS)'}
                      </div>
                    </div>
                    {fleet.gpsImei && fleet.gpsImei.trim() !== '-' && fleet.gpsImei.trim() !== '' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Online
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                        Non-GPS
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>Terakhir Servis / KIR:</span>
                    <span className="font-medium text-slate-200">{fleet.lastMaintenance || '2026-08-15'}</span>
                  </div>

                  {/* Pajak Kendaraan & STNK / Plat */}
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        Pajak Tahunan:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-200 text-[11px]">{fleet.taxDueDate || '2026-11-20'}</span>
                        {(() => {
                          const status = getExpiryStatus(fleet.taxDueDate);
                          return (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${status.color}`}>
                              {status.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60">
                      <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                        STNK / Plat (5 Thn):
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-200 text-[11px]">{fleet.stnkExpiryDate || '2028-11-20'}</span>
                        {(() => {
                          const status = getExpiryStatus(fleet.stnkExpiryDate);
                          return (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${status.color}`}>
                              {status.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Status Komponen Rutin (Oli, Ban, Aki) */}
                  {(() => {
                    const routineStatus = logisticsStore.getFleetRoutineComponentsStatus(fleet.id);
                    return (
                      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300 flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-amber-400" />
                            <span>Komponen Rutin Armada:</span>
                          </span>
                          {onNavigateToSpareParts && (
                            <button
                              onClick={onNavigateToSpareParts}
                              className="text-[10px] text-amber-400 hover:underline font-semibold cursor-pointer"
                            >
                              Kelola Stok & Servis &rarr;
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                          <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-center">
                            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                              <Droplets className="w-3 h-3 text-amber-400" />
                              <span>Oli</span>
                            </div>
                            <span className={`text-[9px] font-bold px-1 py-0.2 rounded border block truncate ${
                              routineStatus.oil.status === 'urgent'
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                : routineStatus.oil.status === 'warning'
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {routineStatus.oil.label}
                            </span>
                          </div>

                          <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-center">
                            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                              <Disc className="w-3 h-3 text-emerald-400" />
                              <span>Ban</span>
                            </div>
                            <span className={`text-[9px] font-bold px-1 py-0.2 rounded border block truncate ${
                              routineStatus.tire.status === 'urgent'
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                : routineStatus.tire.status === 'warning'
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {routineStatus.tire.label}
                            </span>
                          </div>

                          <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 text-center">
                            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                              <BatteryCharging className="w-3 h-3 text-cyan-400" />
                              <span>Aki</span>
                            </div>
                            <span className={`text-[9px] font-bold px-1 py-0.2 rounded border block truncate ${
                              routineStatus.battery.status === 'urgent'
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                : routineStatus.battery.status === 'warning'
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {routineStatus.battery.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Efisiensi BBM Armada */}
                  {(() => {
                    const fuelSummary = logisticsStore.getFleetFuelSummary().find(fs => fs.fleetId === fleet.id);
                    const avgLKm = fuelSummary?.avgLiterPerKm || (fuelSummary?.targetRatio ? Number((1 / fuelSummary.targetRatio).toFixed(4)) : 0.1333);
                    const avgL100Km = fuelSummary?.avgLiterPer100Km || (fuelSummary?.targetRatio ? Number((100 / fuelSummary.targetRatio).toFixed(2)) : 13.33);
                    return (
                      <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]">
                        <div className="flex items-center gap-2">
                          <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div>
                            <span className="text-slate-400">Efisiensi BBM: </span>
                            <span className="font-bold text-amber-400 font-mono">
                              {avgLKm} L/KM
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1 font-mono">
                              ({avgL100Km} L/100 KM &bull; {fuelSummary ? `${fuelSummary.avgKmPerLiter} KM/L` : '7.5 KM/L'})
                            </span>
                          </div>
                        </div>
                        {onNavigateToFuelEfficiency && (
                          <button
                            onClick={onNavigateToFuelEfficiency}
                            className="text-[10px] text-amber-400 hover:underline font-semibold cursor-pointer shrink-0"
                          >
                            Analisis L/KM &rarr;
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Assigned Crew Bar */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px]">Kru Ditugaskan:</span>
                  <div className="font-semibold text-white flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>{assignedCrew ? assignedCrew.name : 'Standby / Pool Banyuwangi'}</span>
                  </div>
                </div>

                {/* Edit & Hapus Buttons */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => handleEditFleetClick(fleet)}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-750 hover:text-white text-slate-300 font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteFleetClick(fleet.id, fleet.plateNumber)}
                    className="px-3 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Crews Grid */}
      {activeTab === 'crews' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCrews.map(crew => (
            <div key={crew.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold text-sm">
                    {crew.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{crew.name}</h3>
                    <span className="text-[11px] text-slate-400">{crew.role}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleCrewStatus(crew)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer border transition ${
                    crew.status === 'available'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : crew.status === 'on-duty'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {crew.status === 'available' && '● Ready'}
                  {crew.status === 'on-duty' && '● Sedang Jalan'}
                  {crew.status === 'off' && '○ Libur / Off'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Sertifikasi SIM:</span>
                  <div className="font-semibold text-emerald-400 mt-0.5">{crew.licenseType}</div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Total Perjalanan:</span>
                  <div className="font-semibold text-white mt-0.5">{crew.tripsCompleted} Trip Sukses</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                <a
                  href={`tel:${crew.phone}`}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{crew.phone}</span>
                </a>

                <div className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Award className="w-3.5 h-3.5" />
                  <span>{crew.rating.toFixed(1)} / 5.0</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('history')}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cek Histori & Distribusi Wilayah</span>
                </button>
              </div>

              {/* Edit & Hapus Buttons */}
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => handleEditCrewClick(crew)}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-750 hover:text-white text-slate-300 font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteCrewClick(crew.id, crew.name)}
                  className="px-3 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History & Area Approval Tab Content */}
      {activeTab === 'history' && (
        <CrewDeliveryHistoryView />
      )}

      {/* Add Fleet Modal */}
      {isAddFleetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                Registrasi Armada Kendaraan Baru
              </h3>
              <button
                onClick={() => setIsAddFleetOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateFleet} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Nomor Polisi (Plat)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: P 8125 VC"
                    value={newFleet.plateNumber}
                    onChange={(e) => setNewFleet({ ...newFleet, plateNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Tipe Kendaraan</label>
                  <select
                    value={newFleet.vehicleType}
                    onChange={(e) => setNewFleet({ ...newFleet, vehicleType: e.target.value as VehicleType })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Pick Up Box">Pick Up Box</option>
                    <option value="Engkel STD">Engkel STD</option>
                    <option value="Engkel Long">Engkel Long</option>
                    <option value="Double STD">Double STD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">IMEI GPS Tracksolid (Opsional)</label>
                  <input
                    type="text"
                    placeholder="868204... (atau - jika Non-GPS)"
                    value={newFleet.gpsImei}
                    onChange={(e) => setNewFleet({ ...newFleet, gpsImei: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Inisial Mobil</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: N1 / NP1, WB-01, DS-1"
                    value={newFleet.initialCode}
                    onChange={(e) => setNewFleet({ ...newFleet, initialCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Merk Mobil</label>
                  <select
                    value={newFleet.brand}
                    onChange={(e) => setNewFleet({ ...newFleet, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Mitsubishi L300">Mitsubishi L300</option>
                    <option value="Traga">Traga</option>
                    <option value="Mitsubishi Canter">Mitsubishi Canter</option>
                    <option value="Hino">Hino</option>
                    <option value="Isuzu">Isuzu</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Kapasitas Mesin (CC)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 2477 CC"
                    value={newFleet.engineCc}
                    onChange={(e) => setNewFleet({ ...newFleet, engineCc: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Tahun Produksi</label>
                  <select
                    value={newFleet.year}
                    onChange={(e) => setNewFleet({ ...newFleet, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    {Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Tanggal Terakhir Servis / Uji KIR</label>
                  <input
                    type="date"
                    value={newFleet.lastMaintenance}
                    onChange={(e) => setNewFleet({ ...newFleet, lastMaintenance: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Pajak Kendaraan & STNK / Plat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 flex items-center justify-between">
                    <span>Pajak (Tahunan)</span>
                    <span className="text-[10px] text-blue-400 font-medium">Jatuh Tempo</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newFleet.taxDueDate}
                    onChange={(e) => setNewFleet({ ...newFleet, taxDueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 flex items-center justify-between">
                    <span>STNK / Plat</span>
                    <span className="text-[10px] text-amber-400 font-medium">Masa Berlaku 5 Thn</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newFleet.stnkExpiryDate}
                    onChange={(e) => setNewFleet({ ...newFleet, stnkExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddFleetOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow"
                >
                  Daftarkan Armada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Crew Modal */}
      {isAddCrewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Tambah Anggota Kru Pengemudi
              </h3>
              <button
                onClick={() => setIsAddCrewOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCrew} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nama Lengkap Kru</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Joko Supriyanto"
                  value={newCrew.name}
                  onChange={(e) => setNewCrew({ ...newCrew, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Peran Tugas</label>
                  <select
                    value={newCrew.role}
                    onChange={(e) => setNewCrew({ ...newCrew, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Driver Utama">Driver Utama</option>
                    <option value="Driver Cadangan">Driver Cadangan</option>
                    <option value="Kernet / Helper">Kernet / Helper</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Jenis SIM</label>
                  <select
                    value={newCrew.licenseType}
                    onChange={(e) => setNewCrew({ ...newCrew, licenseType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="SIM B2 Umum">SIM B2 Umum (Tronton / Container)</option>
                    <option value="SIM B1 Umum">SIM B1 Umum (Fuso / CDD)</option>
                    <option value="SIM A">SIM A (Kernet / Mobil Kecil)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Nomor Handphone / WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="+62 812..."
                    value={newCrew.phone}
                    onChange={(e) => setNewCrew({ ...newCrew, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Nomor Registrasi SIM</label>
                  <input
                    type="text"
                    required
                    value={newCrew.licenseNumber}
                    onChange={(e) => setNewCrew({ ...newCrew, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCrewOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
                >
                  Simpan Data Kru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fleet Modal */}
      {isEditFleetOpen && editingFleet && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                Edit Armada Truk ({editingFleet.plateNumber})
              </h3>
              <button
                onClick={() => {
                  setIsEditFleetOpen(false);
                  setEditingFleet(null);
                }}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateFleet} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Nomor Polisi (Plat)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: B 9503 XYZ"
                    value={editingFleet.plateNumber}
                    onChange={(e) => setEditingFleet({ ...editingFleet, plateNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Tipe Kendaraan</label>
                  <select
                    value={editingFleet.vehicleType}
                    onChange={(e) => setEditingFleet({ ...editingFleet, vehicleType: e.target.value as VehicleType })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Pick Up Box">Pick Up Box</option>
                    <option value="Engkel STD">Engkel STD</option>
                    <option value="Engkel Long">Engkel Long</option>
                    <option value="Double STD">Double STD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">IMEI GPS Tracksolid (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 868204... (atau kosongkan jika Non-GPS)"
                    value={editingFleet.gpsImei || ''}
                    onChange={(e) => setEditingFleet({ ...editingFleet, gpsImei: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Inisial Mobil</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: N1 / NP1, WB-01, DS-1"
                    value={editingFleet.initialCode || ''}
                    onChange={(e) => setEditingFleet({ ...editingFleet, initialCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Merk Mobil</label>
                  <select
                    value={editingFleet.brand || 'Mitsubishi L300'}
                    onChange={(e) => setEditingFleet({ ...editingFleet, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Mitsubishi L300">Mitsubishi L300</option>
                    <option value="Traga">Traga</option>
                    <option value="Mitsubishi Canter">Mitsubishi Canter</option>
                    <option value="Hino">Hino</option>
                    <option value="Isuzu">Isuzu</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Kapasitas Mesin (CC)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 2477 CC"
                    value={editingFleet.engineCc || ''}
                    onChange={(e) => setEditingFleet({ ...editingFleet, engineCc: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Tahun Produksi</label>
                  <select
                    value={editingFleet.year || new Date().getFullYear()}
                    onChange={(e) => setEditingFleet({ ...editingFleet, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    {Array.from({ length: new Date().getFullYear() - 1990 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Tanggal Terakhir Servis / Uji KIR</label>
                  <input
                    type="date"
                    value={editingFleet.lastMaintenance || ''}
                    onChange={(e) => setEditingFleet({ ...editingFleet, lastMaintenance: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Pajak Kendaraan & STNK / Plat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 flex items-center justify-between">
                    <span>Pajak (Tahunan)</span>
                    <span className="text-[10px] text-blue-400 font-medium">Jatuh Tempo</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editingFleet.taxDueDate || ''}
                    onChange={(e) => setEditingFleet({ ...editingFleet, taxDueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 flex items-center justify-between">
                    <span>STNK / Plat</span>
                    <span className="text-[10px] text-amber-400 font-medium">Masa Berlaku 5 Thn</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editingFleet.stnkExpiryDate || ''}
                    onChange={(e) => setEditingFleet({ ...editingFleet, stnkExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditFleetOpen(false);
                    setEditingFleet(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Crew Modal */}
      {isEditCrewOpen && editingCrew && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Edit Data Kru ({editingCrew.name})
              </h3>
              <button
                onClick={() => {
                  setIsEditCrewOpen(false);
                  setEditingCrew(null);
                }}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateCrew} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nama Lengkap Kru</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Joko Supriyanto"
                  value={editingCrew.name}
                  onChange={(e) => setEditingCrew({ ...editingCrew, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Peran Tugas</label>
                  <select
                    value={editingCrew.role}
                    onChange={(e) => setEditingCrew({ ...editingCrew, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Driver Utama">Driver Utama</option>
                    <option value="Driver Cadangan">Driver Cadangan</option>
                    <option value="Kernet / Helper">Kernet / Helper</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Jenis SIM</label>
                  <select
                    value={editingCrew.licenseType}
                    onChange={(e) => setEditingCrew({ ...editingCrew, licenseType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="SIM B2 Umum">SIM B2 Umum (Tronton / Container)</option>
                    <option value="SIM B1 Umum">SIM B1 Umum (Fuso / CDD)</option>
                    <option value="SIM A">SIM A (Kernet / Mobil Kecil)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Nomor Handphone / WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="+62 812..."
                    value={editingCrew.phone}
                    onChange={(e) => setEditingCrew({ ...editingCrew, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Nomor Registrasi SIM</label>
                  <input
                    type="text"
                    required
                    value={editingCrew.licenseNumber}
                    onChange={(e) => setEditingCrew({ ...editingCrew, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditCrewOpen(false);
                    setEditingCrew(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
