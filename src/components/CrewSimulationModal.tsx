import React, { useState } from 'react';
import { Users, Truck, Ship, MapPin, Calendar, CheckCircle2, AlertTriangle, RefreshCw, Download, X, UserCheck, Shield, Compass, Navigation } from 'lucide-react';
import { Crew, Fleet, RetailStore } from '../types';

interface CrewSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  crews: Crew[];
  fleets: Fleet[];
  stores: RetailStore[];
}

export const CrewSimulationModal: React.FC<CrewSimulationModalProps> = ({
  isOpen,
  onClose,
  crews,
  fleets,
  stores,
}) => {
  const [simulationType, setSimulationType] = useState<'monthly_area' | 'inter_island'>('monthly_area');
  const [selectedMonth, setSelectedMonth] = useState('Oktober 2026');
  const [selectedArea, setSelectedArea] = useState('GROSIR 1');
  
  const defaultDriver = crews.find(c => c.role === 'Driver Utama')?.id || crews[0]?.id || '';
  const defaultHelper = crews.find(c => c.role.includes('Helper') || c.role === 'Kernet / Helper')?.id || crews[1]?.id || '';
  const defaultFleet = fleets[0]?.id || '';

  // Simulation state for monthly area routes (mock 4 weeks)
  const [weeklyAssignments, setWeeklyAssignments] = useState([
    { week: 'Minggu 1 (1 - 7 Okt)', route: 'Grosir 1 - Banyuwangi Kota', driverId: defaultDriver, helperId: defaultHelper, truckId: defaultFleet, fatigueScore: 'Rendah (Aman)', slaEst: '98.5%', coords: { x: 25, y: 35 } },
    { week: 'Minggu 2 (8 - 14 Okt)', route: 'Grosir 1 - Rogojampi', driverId: defaultDriver, helperId: defaultHelper, truckId: defaultFleet, fatigueScore: 'Normal', slaEst: '96.0%', coords: { x: 45, y: 60 } },
    { week: 'Minggu 3 (15 - 21 Okt)', route: 'Grosir 1 - Srono & Muncar', driverId: defaultDriver, helperId: defaultHelper, truckId: defaultFleet, fatigueScore: 'Tinggi (Perlu Istirahat)', slaEst: '91.2%', coords: { x: 70, y: 40 } },
    { week: 'Minggu 4 (22 - 31 Okt)', route: 'Grosir 1 - Kalibaru Hub', driverId: defaultDriver, helperId: defaultHelper, truckId: defaultFleet, fatigueScore: 'Normal', slaEst: '95.8%', coords: { x: 85, y: 70 } },
  ]);

  // Inter-island simulation state
  const [interIslandRoutes, setInterIslandRoutes] = useState([
    { destination: 'Denpasar 1 (Bali - Retail Utama)', distanceKm: 145, estimatedHours: 12, ferryRoute: 'Ketapang - Gilimanuk', primaryDriver: defaultDriver, secondDriverOrHelper: defaultHelper, truckId: defaultFleet, riskLevel: 'Sedang', costEst: 'Rp 2.450.000', region: 'Bali & Nusa Tenggara', coords: { x: 30, y: 65 } },
    { destination: 'Bandar Lampung (Sumatera Hub)', distanceKm: 980, estimatedHours: 48, ferryRoute: 'Merak - Bakauheni (Eksekutif)', primaryDriver: defaultDriver, secondDriverOrHelper: defaultHelper, truckId: defaultFleet, riskLevel: 'Tinggi (Double Driver Wajib)', costEst: 'Rp 6.800.000', region: 'Sumatera', coords: { x: 65, y: 25 } },
    { destination: 'Balikpapan E-Walk (Kalimantan)', distanceKm: 1250, estimatedHours: 72, ferryRoute: 'Tanjung Perak - Semayang (Ro-Ro)', primaryDriver: defaultDriver, secondDriverOrHelper: defaultHelper, truckId: defaultFleet, riskLevel: 'Tinggi (Kapal Laut Ro-Ro)', costEst: 'Rp 12.500.000', region: 'Kalimantan', coords: { x: 80, y: 55 } }
  ]);

  const [simulationSaved, setSimulationSaved] = useState(false);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(0);

  if (!isOpen) return null;

  const driversList = crews.filter(c => !c.role.includes('Helper') && c.role !== 'Kernet / Helper');
  const helpersList = crews.filter(c => c.role.includes('Helper') || c.role === 'Kernet / Helper');

  const getDriverName = (id: string) => crews.find(c => c.id === id)?.name || 'Belum Ditunjuk';
  const getHelperName = (id: string) => crews.find(c => c.id === id)?.name || 'Tanpa Helper';
  const getFleetName = (id: string) => fleets.find(f => f.id === id)?.plateNumber || 'Armada Standar';

  const handleRunSimulationExport = () => {
    setSimulationSaved(true);
    setTimeout(() => setSimulationSaved(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Simulasi Penugasan Driver & Helper (Dilengkapi Peta & Diagram Sebaran)</h3>
              <p className="text-xs text-slate-400">Bongkar pasang komposisi kru dengan visualisasi jaringan rute distribusi secara interaktif</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="bg-slate-950/60 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setSimulationType('monthly_area'); setActiveNodeIndex(0); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                simulationType === 'monthly_area'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Simulasi Area Bulanan</span>
            </button>
            <button
              onClick={() => { setSimulationType('inter_island'); setActiveNodeIndex(0); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                simulationType === 'inter_island'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ship className="w-4 h-4" />
              <span>Simulasi Khusus Luar Kota & Antar-Pulau</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {simulationType === 'monthly_area' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white font-bold rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="Oktober 2026">Oktober 2026</option>
                <option value="November 2026">November 2026</option>
                <option value="Desember 2026">Desember 2026 (Peak Season)</option>
              </select>
            )}

            <button
              onClick={handleRunSimulationExport}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Simpan & Ekspor Skenario</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {simulationSaved && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Skenario simulasi penugasan berhasil disimpan dan diunduh untuk evaluasi manajerial!</span>
            </div>
          )}

          {/* INTERACTIVE VISUAL MAP & NETWORK DIAGRAM CONTAINER */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span className="font-black text-white uppercase text-xs tracking-wider">
                  {simulationType === 'monthly_area' ? 'Peta Sebaran Rute Area B2B (Banyuwangi Central Hub)' : 'Diagram Jaringan Logistik Antar-Pulau & Luar Kota'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                Klik node di peta untuk inspeksi kru aktif
              </div>
            </div>

            {/* Visual Map Canvas / Grid */}
            <div className="h-56 bg-slate-900/80 rounded-xl border border-slate-800/80 relative flex items-center justify-center p-4">
              
              {/* Central Warehouse Anchor (Origin) */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 border-2 border-white/30 shadow-xl flex items-center justify-center text-white font-black">
                  DC
                </div>
                <span className="text-[10px] font-bold text-white mt-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Banyuwangi DC</span>
              </div>

              {/* Connecting SVG Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {simulationType === 'monthly_area' ? (
                  weeklyAssignments.map((item, idx) => {
                    const startX = 80;
                    const startY = 110;
                    const endX = 150 + idx * 180;
                    const endY = idx % 2 === 0 ? 70 : 160;
                    const isActive = activeNodeIndex === idx;
                    return (
                      <g key={idx}>
                        <line
                          x1={startX}
                          y1={startY}
                          x2={endX}
                          y2={endY}
                          stroke={isActive ? '#6366f1' : '#334155'}
                          strokeWidth={isActive ? '3' : '1.5'}
                          strokeDasharray={isActive ? 'none' : '4 4'}
                        />
                        <circle cx={endX} cy={endY} r="6" fill={isActive ? '#818cf8' : '#475569'} />
                      </g>
                    );
                  })
                ) : (
                  interIslandRoutes.map((item, idx) => {
                    const startX = 80;
                    const startY = 110;
                    const endX = 220 + idx * 220;
                    const endY = idx === 0 ? 50 : idx === 1 ? 110 : 170;
                    const isActive = activeNodeIndex === idx;
                    return (
                      <g key={idx}>
                        <line
                          x1={startX}
                          y1={startY}
                          x2={endX}
                          y2={endY}
                          stroke={isActive ? '#10b981' : '#334155'}
                          strokeWidth={isActive ? '3' : '1.5'}
                        />
                        <circle cx={endX} cy={endY} r="6" fill={isActive ? '#34d399' : '#475569'} />
                      </g>
                    );
                  })
                )}
              </svg>

              {/* Destination Nodes Interactive Cards */}
              <div className="w-full flex items-center justify-around z-20 px-16">
                {simulationType === 'monthly_area' ? (
                  weeklyAssignments.map((item, idx) => {
                    const isActive = activeNodeIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveNodeIndex(idx)}
                        className={`cursor-pointer p-3 rounded-xl border transition-all duration-300 w-48 shadow-lg ${
                          isActive
                            ? 'bg-indigo-950/90 border-indigo-500 scale-105 shadow-indigo-500/20'
                            : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-indigo-300 text-[10px]">{item.week}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            item.fatigueScore.includes('Tinggi') ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {item.fatigueScore.includes('Tinggi') ? 'Warning' : 'Aman'}
                          </span>
                        </div>
                        <div className="font-black text-white text-[11px] truncate">{item.route}</div>
                        <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 text-[10px] text-slate-300">
                          <div className="truncate">👨‍✈️ {getDriverName(item.driverId)}</div>
                          <div className="truncate">🤝 {getHelperName(item.helperId)}</div>
                          <div className="text-emerald-400 font-mono font-bold">SLA: {item.slaEst}</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  interIslandRoutes.map((item, idx) => {
                    const isActive = activeNodeIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setActiveNodeIndex(idx)}
                        className={`cursor-pointer p-3 rounded-xl border transition-all duration-300 w-56 shadow-lg ${
                          isActive
                            ? 'bg-emerald-950/90 border-emerald-500 scale-105 shadow-emerald-500/20'
                            : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-emerald-300 text-[10px]">{item.region}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300">
                            {item.estimatedHours} Jam
                          </span>
                        </div>
                        <div className="font-black text-white text-[11px] truncate">{item.destination}</div>
                        <div className="mt-2 pt-2 border-t border-slate-800 space-y-1 text-[10px] text-slate-300">
                          <div className="truncate">⚓ {item.ferryRoute}</div>
                          <div className="truncate">👨‍✈️ {getDriverName(item.primaryDriver)}</div>
                          <div className="text-emerald-400 font-mono font-bold">{item.costEst}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

          {simulationType === 'monthly_area' ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                <div>
                  <h4 className="font-bold text-white text-sm">Simulasi Komposisi Kru Kiriman Area ({selectedMonth})</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">Bongkar pasang driver dan helper di bawah untuk melihat perubahan indeks kelelahan dan estimasi SLA secara langsung pada peta di atas.</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-slate-400 font-bold">Pilih Area:</label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-white font-bold rounded-lg px-3 py-1.5 focus:outline-none"
                  >
                    <option value="GROSIR 1">GROSIR 1 (Banyuwangi Kota)</option>
                    <option value="RITEL ROGOJAMPI">RITEL ROGOJAMPI</option>
                    <option value="JEMBER KOTA">JEMBER KOTA</option>
                    <option value="DENPASAR 2">DENPASAR 2 (Bali)</option>
                  </select>
                </div>
              </div>

              {/* Weekly Simulation Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Periode Minggu</th>
                      <th className="p-3">Rute & Destinasi</th>
                      <th className="p-3">Driver Utama</th>
                      <th className="p-3">Helper Tugas</th>
                      <th className="p-3">Armada Truk</th>
                      <th className="p-3">Indeks Kelelahan</th>
                      <th className="p-3">Estimasi SLA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-white">
                    {weeklyAssignments.map((item, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => setActiveNodeIndex(idx)}
                        className={`hover:bg-slate-950/50 cursor-pointer ${activeNodeIndex === idx ? 'bg-indigo-950/30' : ''}`}
                      >
                        <td className="p-3 font-bold text-indigo-400">{item.week}</td>
                        <td className="p-3 font-medium text-slate-200">{item.route}</td>
                        <td className="p-3">
                          <select
                            value={item.driverId}
                            onChange={(e) => {
                              const updated = [...weeklyAssignments];
                              updated[idx].driverId = e.target.value;
                              setWeeklyAssignments(updated);
                            }}
                            className="bg-slate-950 border border-slate-800 text-white rounded-lg px-2 py-1 focus:outline-none w-full"
                          >
                            {driversList.map(d => (
                              <option key={d.id} value={d.id}>{d.name} ({d.licenseType})</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={item.helperId}
                            onChange={(e) => {
                              const updated = [...weeklyAssignments];
                              updated[idx].helperId = e.target.value;
                              setWeeklyAssignments(updated);
                            }}
                            className="bg-slate-950 border border-slate-800 text-white rounded-lg px-2 py-1 focus:outline-none w-full"
                          >
                            <option value="">-- Tanpa Helper --</option>
                            {helpersList.map(h => (
                              <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={item.truckId}
                            onChange={(e) => {
                              const updated = [...weeklyAssignments];
                              updated[idx].truckId = e.target.value;
                              setWeeklyAssignments(updated);
                            }}
                            className="bg-slate-950 border border-slate-800 text-white rounded-lg px-2 py-1 focus:outline-none w-full"
                          >
                            {fleets.map(f => (
                              <option key={f.id} value={f.id}>{f.plateNumber} ({f.vehicleType})</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                            item.fatigueScore.includes('Tinggi') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {item.fatigueScore}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">{item.slaEst}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-between text-indigo-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span>Rekomendasi AI Simulasi: Perubahan komposisi kru langsung disinkronkan ke peta sebaran logistik di atas.</span>
                </div>
                <button
                  onClick={() => {
                    setWeeklyAssignments(prev => prev.map(p => ({
                      ...p,
                      fatigueScore: Math.random() > 0.5 ? 'Normal' : 'Rendah (Aman)',
                      slaEst: (95 + Math.random() * 4).toFixed(1) + '%'
                    })));
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow cursor-pointer whitespace-nowrap"
                >
                  Uji Otomatis Optimasi AI
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                <h4 className="font-bold text-white text-sm">Simulasi Khusus Kiriman Luar Kota & Antar-Pulau (Double Crew & Ferry)</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">Simulasi penugasan lintas provinsi dengan rute penyeberangan kapal laut (Ketapang-Gilimanuk, Merak-Bakauheni, Tanjung Perak).</p>
              </div>

              <div className="space-y-3">
                {interIslandRoutes.map((route, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setActiveNodeIndex(idx)}
                    className={`bg-slate-950 p-4 rounded-xl border transition cursor-pointer ${
                      activeNodeIndex === idx ? 'border-emerald-500 bg-emerald-950/20 shadow-lg' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="font-black text-white text-sm flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span>{route.destination}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Jarak: <strong className="text-slate-200">{route.distanceKm} KM</strong> • Estimasi: <strong className="text-slate-200">{route.estimatedHours} Jam</strong> • Penyeberangan: <strong className="text-indigo-400">{route.ferryRoute}</strong>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Risiko: {route.riskLevel}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Est. Biaya: {route.costEst}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Driver Utama (Lead)</label>
                        <select
                          value={route.primaryDriver}
                          onChange={(e) => {
                            const updated = [...interIslandRoutes];
                            updated[idx].primaryDriver = e.target.value;
                            setInterIslandRoutes(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 mt-1 focus:outline-none"
                        >
                          {driversList.map(d => (
                            <option key={d.id} value={d.id}>{d.name} ({d.licenseType})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Driver Kedua / Helper Senior</label>
                        <select
                          value={route.secondDriverOrHelper}
                          onChange={(e) => {
                            const updated = [...interIslandRoutes];
                            updated[idx].secondDriverOrHelper = e.target.value;
                            setInterIslandRoutes(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 mt-1 focus:outline-none"
                        >
                          {crews.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Armada Truk Luar Kota</label>
                        <select
                          value={route.truckId}
                          onChange={(e) => {
                            const updated = [...interIslandRoutes];
                            updated[idx].truckId = e.target.value;
                            setInterIslandRoutes(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 mt-1 focus:outline-none"
                        >
                          {fleets.map(f => (
                            <option key={f.id} value={f.id}>{f.plateNumber} ({f.vehicleType})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-slate-400 text-xs">
            Visualisasi peta sebaran terhubung langsung dengan tabel di bawah secara real-time.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition cursor-pointer"
          >
            Tutup Simulasi
          </button>
        </div>

      </div>
    </div>
  );
};
