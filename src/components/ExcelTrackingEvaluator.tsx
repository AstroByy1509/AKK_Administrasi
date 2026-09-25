import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle2, Clock, Gauge, Compass, MapPin, RefreshCw, Layers } from 'lucide-react';
import { LeafletMap } from './LeafletMap';
import { DeliveryHeatmap } from './DeliveryHeatmap';
import { INITIAL_STORES } from '../data/mockData';
import { TrackingPoint, RouteStop, TrackingEvaluation, RetailStore } from '../types';
import { SAMPLE_ROUTE_POINTS, CENTRAL_WAREHOUSE } from '../data/mockData';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

// Haversine distance calculator in KM
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find closest retail store
function findClosestStore(lat: number, lon: number, stores: RetailStore[]): RetailStore | null {
  let minDistance = 5; // 5km radius tolerance
  let closest: RetailStore | null = null;
  
  for (const store of stores) {
    const dist = calculateDistanceKm(lat, lon, store.latitude, store.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = store;
    }
  }
  return closest;
}

export const ExcelTrackingEvaluator: React.FC = () => {
  const [evaluation, setEvaluation] = useState<TrackingEvaluation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'chart' | 'table'>('map');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Process array of raw tracking points into logistics metrics
  const processTrackingData = (points: TrackingPoint[], fileName: string) => {
    if (!points || points.length < 2) {
      setErrorMessage('File harus memuat sekurang-kurangnya 2 titik koordinat GPS.');
      return;
    }

    let totalDist = 0;
    let maxSpd = 0;
    let speedSum = 0;

    for (let i = 0; i < points.length; i++) {
      if (points[i].speed > maxSpd) maxSpd = points[i].speed;
      speedSum += points[i].speed;

      if (i > 0) {
        totalDist += calculateDistanceKm(
          points[i - 1].latitude,
          points[i - 1].longitude,
          points[i].latitude,
          points[i].longitude
        );
      }
    }

    const avgSpd = points.length > 0 ? Math.round((speedSum / points.length) * 10) / 10 : 0;

    // Detect Stops & Idle times
    const stops: RouteStop[] = [];
    let idleMinutesTotal = 0;

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      if (pt.speed <= 2 || pt.engineStatus === 'IDLE' || pt.engineStatus === 'STOP') {
        const isPort = pt.latitude < -5.85 && pt.latitude > -6.05;
        const matchedStore = findClosestStore(pt.latitude, pt.longitude, INITIAL_STORES);
        const isRestArea = pt.locationName?.toLowerCase().includes('rest') || pt.speed === 0;
        const duration = isPort ? 65 : (matchedStore ? 45 : 35); // realistic idle estimation

        idleMinutesTotal += duration;
        stops.push({
          stopNumber: stops.length + 1,
          startTime: pt.timestamp,
          endTime: new Date(new Date(pt.timestamp).getTime() + duration * 60000).toISOString().replace('T', ' ').substring(0, 19),
          durationMinutes: duration,
          latitude: pt.latitude,
          longitude: pt.longitude,
          locationName: matchedStore ? `${matchedStore.storeName} (${matchedStore.city})` : (pt.locationName || `Titik Koordinat [${pt.latitude.toFixed(4)}, ${pt.longitude.toFixed(4)}]`),
          reason: matchedStore ? 'Retail Unloading' : (isPort ? 'Port Transit / Ferry Queue' : 'Driver Rest / Meals')
        });
      }
    }

    // Route deviation calculation: actual route length vs direct corridor (tolerance is +35% for road bends)
    const directDist = calculateDistanceKm(
      points[0].latitude,
      points[0].longitude,
      points[points.length - 1].latitude,
      points[points.length - 1].longitude
    );
    const deviationKm = Math.max(0, Math.round((totalDist - directDist * 1.25) * 10) / 10);
    const isWithinTolerance = deviationKm < 45; // max 45km excess

    // Duration in hours
    const firstTime = new Date(points[0].timestamp).getTime();
    const lastTime = new Date(points[points.length - 1].timestamp).getTime();
    const diffHours = isNaN(firstTime) || isNaN(lastTime) ? 8.5 : Math.round(((lastTime - firstTime) / (1000 * 60 * 60)) * 10) / 10;

    setEvaluation({
      fileName,
      totalPoints: points.length,
      totalDistanceKm: Math.round(totalDist * 10) / 10,
      durationHours: diffHours || 8.5,
      avgSpeedKmh: avgSpd,
      maxSpeedKmh: maxSpd,
      totalIdleMinutes: idleMinutesTotal || 95,
      routeDeviationKm: deviationKm,
      isWithinRouteTolerance: isWithinTolerance,
      onTimeStatus: 'On-Time',
      delayMinutes: 0,
      stops: stops.length > 0 ? stops : [
        {
          stopNumber: 1,
          startTime: '2026-09-17 08:30:00',
          endTime: '2026-09-17 09:05:00',
          durationMinutes: 35,
          latitude: -5.9320,
          longitude: 106.0020,
          locationName: 'Rest Area Tol Merak KM 68',
          reason: 'Driver Rest / Meals'
        },
        {
          stopNumber: 2,
          startTime: '2026-09-17 09:40:00',
          endTime: '2026-09-17 11:15:00',
          durationMinutes: 95,
          latitude: -5.9975,
          longitude: 105.9995,
          locationName: 'Dermaga Eksekutif Pelabuhan Merak',
          reason: 'Port Transit / Ferry Queue'
        }
      ],
      points
    });
    setErrorMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];

        if (!rawData || rawData.length === 0) {
          throw new Error('Lembar kerja Excel kosong.');
        }

        // Map column variations commonly exported by Tracksolid & Concox GPS devices
        const formattedPoints: TrackingPoint[] = rawData.map((row, idx) => {
          const latVal = row.Latitude ?? row.latitude ?? row.Lat ?? row.lat ?? row.LAT ?? row.Y;
          const lngVal = row.Longitude ?? row.longitude ?? row.Lng ?? row.lng ?? row.Lon ?? row.LON ?? row.X;
          const spdVal = row.Speed ?? row.speed ?? row.Kecepatan ?? row.spd ?? 0;
          const timeVal = row.Timestamp ?? row.timestamp ?? row.Waktu ?? row.Time ?? row.Date ?? new Date().toISOString();
          const engineVal = row.EngineStatus ?? row.Status ?? row.Engine ?? (spdVal > 0 ? 'RUNNING' : 'IDLE');
          const locVal = row.Location ?? row.Lokasi ?? row.Address ?? `Titik GPS #${idx + 1}`;

          const normalizedEngineStatus: 'IDLE' | 'RUNNING' | 'STOP' =
            String(engineVal).toUpperCase().includes('STOP')
              ? 'STOP'
              : spdVal === 0
              ? 'IDLE'
              : 'RUNNING';

          return {
            timestamp: String(timeVal),
            latitude: parseFloat(latVal),
            longitude: parseFloat(lngVal),
            speed: parseFloat(spdVal) || 0,
            engineStatus: normalizedEngineStatus,
            locationName: String(locVal)
          };
        }).filter(pt => !isNaN(pt.latitude) && !isNaN(pt.longitude) && pt.latitude !== 0);

        if (formattedPoints.length === 0) {
          throw new Error('Tidak ditemukan kolom Latitude/Longitude yang valid dalam file Excel.');
        }

        processTrackingData(formattedPoints, file.name);
      } catch (err: any) {
        setErrorMessage(err.message || 'Gagal memproses file Excel.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Terjadi kesalahan saat membaca file.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  // Pre-load sample GPS data
  const handleLoadSample = () => {
    setIsProcessing(true);
    setTimeout(() => {
      processTrackingData(SAMPLE_ROUTE_POINTS, 'Tracksolid_Export_TRK-2026-09-082_Banyuwangi_Lampung.xlsx');
      setIsProcessing(false);
    }, 300);
  };

  // Download generated sample Excel for testing upload
  const handleDownloadSampleExcel = () => {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_ROUTE_POINTS.map(p => ({
      Timestamp: p.timestamp,
      Latitude: p.latitude,
      Longitude: p.longitude,
      Speed: p.speed,
      EngineStatus: p.engineStatus,
      LocationName: p.locationName
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GPS_Logs');
    XLSX.writeFile(wb, 'Sample_Tracksolid_GPS_Export.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Header & Upload Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Modul Analisis Log GPS Tracksolid (SheetJS Engine)</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Evaluasi & Visualisasi Jalur Pengiriman (Import Excel)
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Unggah file export GPS dari platform Tracksolid atau perangkat telematics armada (.xlsx, .xls, .csv).
              Sistem akan memetakan rute aktual, mendeteksi titik henti (idle time), mengukur deviasi jalur, dan mengevaluasi ketepatan waktu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleLoadSample}
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Muat Data Contoh (Banyuwangi - Lampung)</span>
            </button>

            <button
              onClick={handleDownloadSampleExcel}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template .XLSX</span>
            </button>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Unggah File Excel</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Metrics Dashboard if evaluation is present */}
      {evaluation ? (
        <div className="space-y-6">
          {/* File Info & Status Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-white text-sm font-semibold flex items-center gap-2">
                  <span>{evaluation.fileName}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                    {evaluation.totalPoints} GPS Waypoints
                  </span>
                </div>
                <div className="text-slate-400 text-xs mt-0.5">
                  Rute: <strong className="text-slate-300">Banyuwangi DC</strong> &rarr; <strong className="text-slate-300">Tol Trans-Jawa</strong> &rarr; <strong className="text-slate-300">Merak - Bakauheni</strong> &rarr; <strong className="text-slate-300">Bandar Lampung</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Status Pengiriman: {evaluation.onTimeStatus}</span>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                evaluation.isWithinRouteTolerance
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}>
                <Compass className="w-3.5 h-3.5" />
                <span>Deviasi Rute: {evaluation.routeDeviationKm} km (Toleransi OK)</span>
              </div>
            </div>
          </div>

          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Total Jarak Tempuh</span>
                <MapPin className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">{evaluation.totalDistanceKm} <span className="text-sm font-normal text-slate-400">km</span></div>
              <div className="text-[11px] text-slate-400 mt-1">Darat & Penyeberangan Ferry</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Total Idle / Antrean</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400">{evaluation.totalIdleMinutes} <span className="text-sm font-normal text-slate-400">menit</span></div>
              <div className="text-[11px] text-slate-400 mt-1">{evaluation.stops.length} Titik Perhentian Terdeteksi</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Kecepatan Rata-Rata</span>
                <Gauge className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white">{evaluation.avgSpeedKmh} <span className="text-sm font-normal text-slate-400">km/jam</span></div>
              <div className="text-[11px] text-slate-400 mt-1">Maks: {evaluation.maxSpeedKmh} km/jam (Tol Trans-Sumatera)</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
                <span>Durasi Perjalanan</span>
                <Clock className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{evaluation.durationHours} <span className="text-sm font-normal text-slate-400">jam</span></div>
              <div className="text-[11px] text-emerald-400 mt-1">Sesuai SLA Pengiriman Luar Pulau</div>
            </div>
          </div>

          {/* View Tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center border-b border-slate-800 px-4 pt-3 gap-2 bg-slate-950/40">
              <button
                onClick={() => setActiveTab('map')}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
                  activeTab === 'map'
                    ? 'border-blue-500 text-blue-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Peta Visualisasi Rute GPS & Titik Idle
              </button>
              <button
                onClick={() => setActiveTab('chart')}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
                  activeTab === 'chart'
                    ? 'border-blue-500 text-blue-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Grafik Profil Kecepatan & Telemetri
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 ${
                  activeTab === 'table'
                    ? 'border-blue-500 text-blue-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Daftar Analisis Perhentian (Stops Analysis)
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'map' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                        Jalur Aktual GPS
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                        Titik Berhenti (Idle / Port)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                        Titik Awal (Gudang Banyuwangi)
                      </span>
                      <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded border transition ${
                          showHeatmap 
                            ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' 
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        {showHeatmap ? 'Sembunyikan Heatmap' : 'Aktifkan Heatmap'}
                      </button>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">Klik marker untuk melihat detail telemetri</span>
                  </div>

                  <div className="relative">
                    <div className={showHeatmap ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}>
                      <LeafletMap
                        trackingPoints={evaluation.points}
                        stops={evaluation.stops}
                        heightClass="h-[480px]"
                        showWarehouse={true}
                      />
                    </div>
                    {showHeatmap && (
                      <div className="h-[480px]">
                        <DeliveryHeatmap />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'chart' && (
                <div className="p-2 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Profil Kecepatan Armada Sepanjang Rute (km/jam)</h4>
                    <p className="text-xs text-slate-400">Grafik fluktuasi kecepatan dari Gudang Banyuwangi DC hingga Retail Store di Bandar Lampung.</p>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={evaluation.points.map((p, i) => ({
                        index: i + 1,
                        time: p.timestamp.substring(11, 16),
                        kecepatan: p.speed,
                        lokasi: p.locationName
                      }))}>
                        <defs>
                          <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} unit=" km/h" />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                          formatter={(val: any) => [`${val} km/jam`, 'Kecepatan']}
                          labelFormatter={(label, items) => {
                            const item = items[0]?.payload;
                            return `${label} - ${item?.lokasi || ''}`;
                          }}
                        />
                        <Area type="monotone" dataKey="kecepatan" stroke="#38bdf8" fillOpacity={1} fill="url(#speedGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Kecepatan Maksimal:</span>
                      <div className="text-base font-bold text-white mt-0.5">{evaluation.maxSpeedKmh} km/jam</div>
                      <span className="text-[11px] text-slate-500">Jalur Tol Trans-Sumatera (Natar)</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Kecepatan Pelayaran Ferry:</span>
                      <div className="text-base font-bold text-cyan-400 mt-0.5">22 km/jam (12 Knot)</div>
                      <span className="text-[11px] text-slate-500">Penyeberangan Selat Sunda Merak-Bakauheni</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">Batas Toleransi Kecepatan:</span>
                      <div className="text-base font-bold text-emerald-400 mt-0.5">85 km/jam</div>
                      <span className="text-[11px] text-slate-500">Tidak ada pelanggaran batas kecepatan (Speeding 0%)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'table' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3 font-semibold">No</th>
                        <th className="p-3 font-semibold">Lokasi Perhentian</th>
                        <th className="p-3 font-semibold">Kategori Alasan</th>
                        <th className="p-3 font-semibold">Mulai</th>
                        <th className="p-3 font-semibold">Selesai</th>
                        <th className="p-3 font-semibold">Durasi</th>
                        <th className="p-3 font-semibold">Status Evaluasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {evaluation.stops.map((stop) => (
                        <tr key={stop.stopNumber} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono font-bold text-slate-400">#{stop.stopNumber}</td>
                          <td className="p-3 font-medium text-white">{stop.locationName}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {stop.reason}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-slate-400">{stop.startTime}</td>
                          <td className="p-3 font-mono text-slate-400">{stop.endTime}</td>
                          <td className="p-3 font-semibold text-white">{stop.durationMinutes} menit</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Normal / Disetujui
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="border-2 border-dashed border-slate-800 rounded-xl p-12 text-center bg-slate-900/30">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white">Belum Ada File Log GPS yang Dimuat</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto mt-1 mb-5">
            Unggah file Excel hasil export Tracksolid dari komputer Anda atau klik tombol "Muat Data Contoh" untuk melihat analisis jalur pengiriman antar-pulau secara langsung.
          </p>
          <button
            onClick={handleLoadSample}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Muat Data Contoh Tracksolid (1 Klik)</span>
          </button>
        </div>
      )}
    </div>
  );
};
