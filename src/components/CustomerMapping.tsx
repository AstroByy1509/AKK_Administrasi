import React, { useState, useEffect, useMemo } from 'react';
import { Store, MapPin, Search, Filter, Plus, Compass, Navigation, Phone, Clock, Layers, Building2, Trash2 } from 'lucide-react';
import { LeafletMap } from './LeafletMap';
import { RetailStore } from '../types';
import { logisticsStore } from '../services/store';

interface CustomerMappingProps {
  onScheduleForStore?: (store: RetailStore) => void;
}

export const CustomerMapping: React.FC<CustomerMappingProps> = ({ onScheduleForStore }) => {
  const [stores, setStores] = useState<RetailStore[]>(logisticsStore.getStores());
  // State to hold selected week for route visualization
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [showRoutes, setShowRoutes] = useState<boolean>(true);
  const [selectedIsland, setSelectedIsland] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<RetailStore | null>(null);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);

  // Helper to fetch routes for the selected week
  const routesForWeek = useMemo(() => {
    // This replicates the logic in WeeklyRoutePlanner to get routes for a week
    // Simplified for now based on available data in the simulation context
    try {
      const saved = localStorage.getItem('akk_simulasi_weeks_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed[selectedWeek] || [];
      }
    } catch {
      // ignore
    }
    return [];
  }, [selectedWeek]);

  // Transform routes into polylines for the map
  const routePolylines = useMemo(() => {
    if (!showRoutes) return [];
    
    // Group routes by day to draw separate lines or all at once?
    // Let's draw all routes for the week, maybe color coded by day.
    return routesForWeek.map(route => {
      const store = stores.find(s => s.storeName === route.route) || stores.find(s => route.route.includes(s.storeName));
      if (store) {
        return {
          coords: [[-8.2333, 114.3667], [store.latitude, store.longitude]] as [number, number][],
          color: route.day === 'Senin' ? '#ef4444' : route.day === 'Selasa' ? '#f59e0b' : route.day === 'Rabu' ? '#10b981' : route.day === 'Kamis' ? '#3b82f6' : route.day === 'Jumat' ? '#8b5cf6' : '#ec4899'
        };
      }
      return null;
    }).filter(p => p !== null);
  }, [routesForWeek, stores, showRoutes]);

  // Form State for new store
  const [newStore, setNewStore] = useState({
    storeCode: 'RET-NEW-' + Math.floor(Math.random() * 900 + 100),
    storeName: '',
    island: 'Jawa' as RetailStore['island'],
    province: 'DKI Jakarta',
    city: 'Jakarta Timur',
    address: '',
    latitude: -6.2088,
    longitude: 106.8456,
    contactPerson: '',
    phone: '',
    deliveryWindow: '08:00 - 17:00',
    storeCategory: 'Supermarket' as RetailStore['storeCategory']
  });

  useEffect(() => {
    return logisticsStore.subscribe(() => {
      setStores(logisticsStore.getStores());
    });
  }, []);

  const filteredStores = stores.filter(st => {
    const matchesIsland = selectedIsland === 'all' || st.island === selectedIsland;
    const matchesCategory = selectedCategory === 'all' || st.storeCategory === selectedCategory;
    const matchesSearch =
      st.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.storeCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesIsland && matchesCategory && matchesSearch;
  });

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStore.storeName || !newStore.address) return;

    logisticsStore.addStore(newStore);
    setIsAddStoreOpen(false);
    setNewStore({
      storeCode: 'RET-NEW-' + Math.floor(Math.random() * 900 + 100),
      storeName: '',
      island: 'Jawa',
      province: 'DKI Jakarta',
      city: 'Jakarta Timur',
      address: '',
      latitude: -6.2088,
      longitude: 106.8456,
      contactPerson: '',
      phone: '',
      deliveryWindow: '08:00 - 17:00',
      storeCategory: 'Supermarket'
    });
  };

  const outerIslandCount = stores.filter(s => s.island !== 'Jawa').length;
  const javaCount = stores.filter(s => s.island === 'Jawa').length;

  return (
    <div className="space-y-6">
      {/* Header & Quick Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Jaringan Toko Retail & Logistik Antar-Pulau</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Pemetaan Daerah Pelanggan & Route Intelligence
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Memetakan sebaran toko retail ritel modern, hypermarket, dan distribution hub di seluruh kepulauan Indonesia dari Gudang Pusat Banyuwangi DC.
            </p>
          </div>

          <button
            onClick={() => setIsAddStoreOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition cursor-pointer self-start lg:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Toko Retail Baru</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-xs">Total Toko Retail</span>
            <div className="text-xl font-bold text-white mt-0.5">{stores.length} Outlet</div>
            <span className="text-[11px] text-slate-500">Terdaftar Aktif</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-xs">Wilayah Jawa</span>
            <div className="text-xl font-bold text-indigo-400 mt-0.5">{javaCount} Outlet</div>
            <span className="text-[11px] text-slate-500">Jalur Tol Darat Trans-Jawa</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-xs">Luar Pulau (Antar-Pulau)</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{outerIslandCount} Outlet</div>
            <span className="text-[11px] text-slate-500">Area Bali</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-xs">Gudang Pusat</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5">Banyuwangi DC</div>
            <span className="text-[11px] text-slate-500">Jawa Timur (Jl. Argopuro No.60)</span>
          </div>
        </div>
      </div>

      {/* Main Map & Filter Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Map */}
        <div className="lg:col-span-8 space-y-4">
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama toko, kota, atau kode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {[1, 2, 3, 4].map(w => <option key={w} value={w}>Pekan {w}</option>)}
              </select>
              <button 
                onClick={() => setShowRoutes(!showRoutes)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${showRoutes ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400'} border border-slate-800`}
              >
                {showRoutes ? 'Sembunyikan Rute' : 'Tampilkan Rute'}
              </button>
              <select
                value={selectedIsland}
                onChange={(e) => setSelectedIsland(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Semua Pulau</option>
                <option value="Jawa">Pulau Jawa</option>
                <option value="Sumatera">Sumatera</option>
                <option value="Bali & Nusa Tenggara">Bali & Nusa Tenggara</option>
                <option value="Kalimantan">Kalimantan</option>
                <option value="Sulawesi">Sulawesi</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Semua Kategori</option>
                <option value="Hypermarket">Hypermarket</option>
                <option value="Supermarket">Supermarket</option>
                <option value="Distribution Hub">Distribution Hub</option>
              </select>
            </div>
          </div>

          {/* Interactive Leaflet Map */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                  Gudang Banyuwangi
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
                  Toko Retail Jawa
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
                  Toko Luar Pulau
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Menampilkan {filteredStores.length} dari {stores.length} toko
              </span>
            </div>

            <div className="relative z-0">
              <LeafletMap
                stores={filteredStores}
                selectedStoreId={selectedStore?.id}
                onSelectStore={(st) => setSelectedStore(st)}
                onSchedule={onScheduleForStore}
                highlightIsland={selectedIsland}
                heightClass="h-[520px]"
                showWarehouse={true}
                plannedPolyline={routePolylines.map(p => p.coords[1])}
              />
            </div>
          </div>
        </div>

        {/* Right: Selected Store Details & Store List */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Store Inspector */}
          {selectedStore ? (
            <div className="bg-slate-900 border border-blue-500/50 rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {selectedStore.storeCategory}
                </span>
                <span className="text-xs font-mono text-slate-400">{selectedStore.storeCode}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{selectedStore.storeName}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{selectedStore.address}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Wilayah / Pulau:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedStore.island}</div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Kota:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedStore.city}</div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Jendela Kirim:</span>
                  <div className="font-semibold text-amber-400 mt-0.5">{selectedStore.deliveryWindow}</div>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[11px]">PIC Toko:</span>
                  <div className="font-semibold text-white mt-0.5">{selectedStore.contactPerson}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedStore.phone}`}
                    className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Hubungi PIC</span>
                  </a>

                  {onScheduleForStore && (
                    <button
                      onClick={() => onScheduleForStore(selectedStore)}
                      className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Buat Jadwal</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (window.confirm(`Apakah Anda yakin ingin menghapus pelanggan "${selectedStore.storeName}" dari database? Tindakan ini tidak dapat dibatalkan.`)) {
                      logisticsStore.deleteStore(selectedStore.id);
                      setSelectedStore(null);
                    }
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-rose-950/20 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-rose-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Pelanggan</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
              <Store className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-300">Pilih Toko di Peta atau Daftar</div>
              <p className="text-[11px] text-slate-500 mt-1">Klik marker toko pada peta untuk menginspeksi rute & detail outlet.</p>
            </div>
          )}

          {/* Compact Store List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Daftar Toko Retail ({filteredStores.length})</span>
              <span className="text-[11px] text-slate-500">Filter Aktif</span>
            </div>

            <div className="divide-y divide-slate-800 max-h-[380px] overflow-y-auto">
              {filteredStores.map(store => {
                const isSelected = selectedStore?.id === store.id;
                const isOuter = store.island !== 'Jawa';
                return (
                  <div
                    key={store.id}
                    onClick={() => setSelectedStore(store)}
                    className={`p-3 text-xs cursor-pointer transition group relative ${
                      isSelected ? 'bg-blue-600/15 border-l-4 border-blue-500' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-white pr-6">{store.storeName}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isOuter ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {store.island}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Apakah Anda yakin ingin menghapus pelanggan "${store.storeName}" dari database?`)) {
                              logisticsStore.deleteStore(store.id);
                              if (selectedStore?.id === store.id) {
                                setSelectedStore(null);
                              }
                            }
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Hapus Pelanggan"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{store.city} &bull; {store.storeCategory}</span>
                      <span className="font-mono text-slate-500">{store.storeCode}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Store Modal */}
      {isAddStoreOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Tambah Toko Retail Pelanggan Baru
              </h3>
              <button
                onClick={() => setIsAddStoreOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Kode Toko</label>
                  <input
                    type="text"
                    required
                    value={newStore.storeCode}
                    onChange={(e) => setNewStore({ ...newStore, storeCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Kategori Toko</label>
                  <select
                    value={newStore.storeCategory}
                    onChange={(e) => setNewStore({ ...newStore, storeCategory: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Hypermarket">Hypermarket</option>
                    <option value="Supermarket">Supermarket</option>
                    <option value="Distribution Hub">Distribution Hub</option>
                    <option value="Minimarket Cluster">Minimarket Cluster</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Nama Toko Retail</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Hypermart Mall Panakkukang Makassar"
                  value={newStore.storeName}
                  onChange={(e) => setNewStore({ ...newStore, storeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Pulau</label>
                  <select
                    value={newStore.island}
                    onChange={(e) => setNewStore({ ...newStore, island: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Jawa">Jawa</option>
                    <option value="Sumatera">Sumatera</option>
                    <option value="Bali & Nusa Tenggara">Bali & Nusa Tenggara</option>
                    <option value="Kalimantan">Kalimantan</option>
                    <option value="Sulawesi">Sulawesi</option>
                    <option value="Papua & Maluku">Papua & Maluku</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Kota / Kabupaten</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kota Makassar"
                    value={newStore.city}
                    onChange={(e) => setNewStore({ ...newStore, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Alamat Lengkap</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Jl. Pengayoman No. 12..."
                  value={newStore.address}
                  onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newStore.latitude}
                    onChange={(e) => setNewStore({ ...newStore, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={newStore.longitude}
                    onChange={(e) => setNewStore({ ...newStore, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">PIC Toko</label>
                  <input
                    type="text"
                    required
                    placeholder="Pak / Ibu..."
                    value={newStore.contactPerson}
                    onChange={(e) => setNewStore({ ...newStore, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Nomor Telepon</label>
                  <input
                    type="text"
                    required
                    placeholder="+62 812..."
                    value={newStore.phone}
                    onChange={(e) => setNewStore({ ...newStore, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddStoreOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
                >
                  Simpan Toko
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
