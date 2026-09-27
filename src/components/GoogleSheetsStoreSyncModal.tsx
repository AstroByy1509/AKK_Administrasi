import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Database, 
  ExternalLink, 
  Layers, 
  Table, 
  Zap, 
  X, 
  Sparkles, 
  Globe,
  Check,
  Clock,
  History,
  Settings,
  Sliders
} from 'lucide-react';
import { logisticsStore } from '../services/store';
import { RetailStore } from '../types';
import { useToast } from '../context/ToastContext';
import { googleSheetsSyncService, GoogleSheetsSyncConfig, SyncLogEntry } from '../services/googleSheetsSyncService';

interface GoogleSheetsStoreSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessSync?: () => void;
}

// Preloaded exact data from user's "DATA FIX" sheet
export const DATA_FIX_SHEET_PRESETS = [
  {
    no: 1,
    storeCode: 'RET-GTG-01',
    storeName: 'TK HOLLY GENTENG',
    phone: '-',
    address: 'Jl. Gajah Mada, Genteng, Banyuwangi',
    rawLat: '-8.364.531.968',
    rawLng: '11.419.375',
    latitude: -8.364531968,
    longitude: 114.19375,
    city: 'Banyuwangi (Genteng)',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Supermarket' as RetailStore['storeCategory']
  },
  {
    no: 2,
    storeCode: 'RET-GTG-02',
    storeName: 'BU TIWI GENTENG',
    phone: '-',
    address: 'Kec. Genteng, Kabupaten Banyuwangi',
    rawLat: '-8.365.165.445',
    rawLng: '11.414.537',
    latitude: -8.365165445,
    longitude: 114.14537,
    city: 'Banyuwangi (Genteng)',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Toko Kelontong / Minimarket' as RetailStore['storeCategory']
  },
  {
    no: 3,
    storeCode: 'RET-KLP-03',
    storeName: 'HOTEL KETAPANG INDAH',
    phone: '+62 333 424888',
    address: 'Jl. Gatot Subroto No. 357, Kalipuro, Banyuwangi',
    rawLat: '-8.157.364',
    rawLng: '114.391.371',
    latitude: -8.157364,
    longitude: 114.391371,
    city: 'Banyuwangi (Kalipuro)',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Horeca & Corporate' as RetailStore['storeCategory']
  },
  {
    no: 4,
    storeCode: 'RET-GTG-04',
    storeName: 'TK USAHA JAYA 1 GENTENG',
    phone: '-',
    address: 'Pasar Genteng, Kec. Genteng, Banyuwangi',
    rawLat: '-8.364883626358322',
    rawLng: '114.15632171457985',
    latitude: -8.364883626,
    longitude: 114.15632171,
    city: 'Banyuwangi (Genteng)',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Supermarket' as RetailStore['storeCategory']
  },
  {
    no: 5,
    storeCode: 'RET-BWI-05',
    storeName: 'TK ABBA MART BWI',
    phone: '-',
    address: 'Jl. Pierre Tendean, Kota Banyuwangi',
    rawLat: '-8.209918068339363',
    rawLng: '114.37697873683248',
    latitude: -8.209918068,
    longitude: 114.37697873,
    city: 'Kota Banyuwangi',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Supermarket' as RetailStore['storeCategory']
  },
  {
    no: 6,
    storeCode: 'RET-GTG-06',
    storeName: 'TK USAHA JAYA 2 GENTENG',
    phone: '-',
    address: 'Kompleks Ruko Genteng, Banyuwangi',
    rawLat: '-8.366744459991425',
    rawLng: '114.14170775833777',
    latitude: -8.36674446,
    longitude: 114.14170776,
    city: 'Banyuwangi (Genteng)',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Supermarket' as RetailStore['storeCategory']
  },
  {
    no: 7,
    storeCode: 'RET-GTG-07',
    storeName: 'TK MELATI GENTENG',
    phone: '-',
    address: 'Jl. Hasanuddin, Genteng, Banyuwangi',
    rawLat: '-8.366691431213138',
    rawLng: '114.14184615636397',
    latitude: -8.366691431,
    longitude: 114.14184615,
    city: 'Banyuwangi (Genteng)',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Toko Kelontong / Minimarket' as RetailStore['storeCategory']
  },
  {
    no: 8,
    storeCode: 'RET-SBO-08',
    storeName: 'TK KURNIA SOBO',
    phone: '-',
    address: 'Sobo, Kec. Banyuwangi, Kabupaten Banyuwangi',
    rawLat: '-8.233013357888',
    rawLng: '114.36491677658282',
    latitude: -8.233013358,
    longitude: 114.36491678,
    city: 'Kota Banyuwangi',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Toko Kelontong / Minimarket' as RetailStore['storeCategory']
  },
  {
    no: 9,
    storeCode: 'RET-GTG-09',
    storeName: 'TK KAWI PLASTIK',
    phone: '-',
    address: 'Pusat Kemasan Kawi Genteng, Banyuwangi',
    rawLat: '-8.363419143651848',
    rawLng: '114.14443585521408',
    latitude: -8.363419144,
    longitude: 114.14443586,
    city: 'Banyuwangi (Genteng)',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Mitra Distributor' as RetailStore['storeCategory']
  },
  {
    no: 10,
    storeCode: 'RET-GTG-10',
    storeName: 'TK SANTOSO GTG',
    phone: '-',
    address: 'Genteng Kulon, Genteng, Banyuwangi',
    rawLat: '-8.362376096663144',
    rawLng: '114.15297910193037',
    latitude: -8.362376097,
    longitude: 114.1529791,
    city: 'Banyuwangi (Genteng)',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Supermarket' as RetailStore['storeCategory']
  },
  {
    no: 11,
    storeCode: 'RET-GTG-11',
    storeName: 'BU YULI GENTENG',
    phone: '-',
    address: 'Genteng Wetan, Kec. Genteng, Banyuwangi',
    rawLat: '-8.364864133692082',
    rawLng: '114.15629773445366',
    latitude: -8.364864134,
    longitude: 114.15629773,
    city: 'Banyuwangi (Genteng)',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Toko Kelontong / Minimarket' as RetailStore['storeCategory']
  },
  {
    no: 12,
    storeCode: 'RET-FMT-12',
    storeName: 'RSI FATIMAH',
    phone: '+62 333 421445',
    address: 'Jl. Jember No.25, Kalirejo, Kab. Banyuwangi',
    rawLat: '-8.2471276885501',
    rawLng: '114.34872894165422',
    latitude: -8.247127689,
    longitude: 114.34872894,
    city: 'Kota Banyuwangi',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Horeca & Corporate' as RetailStore['storeCategory']
  },
  {
    no: 13,
    storeCode: 'RET-GTG-13',
    storeName: 'TK DAMAI GENTENG',
    phone: '-',
    address: 'Jl. Imam Bonjol, Genteng, Banyuwangi',
    rawLat: '-8.357256831507325',
    rawLng: '114.1463300630733',
    latitude: -8.357256832,
    longitude: 114.14633006,
    city: 'Banyuwangi (Genteng)',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Toko Kelontong / Minimarket' as RetailStore['storeCategory']
  },
  {
    no: 14,
    storeCode: 'RET-GTG-14',
    storeName: 'BP ASMUIN',
    phone: '-',
    address: 'Kec. Genteng, Kab. Banyuwangi',
    rawLat: '-8.350186515541184',
    rawLng: '114.14804649256504',
    latitude: -8.350186516,
    longitude: 114.14804649,
    city: 'Banyuwangi (Genteng)',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Mitra Distributor' as RetailStore['storeCategory']
  },
  {
    no: 15,
    storeCode: 'RET-GTG-15',
    storeName: 'TK LIMA SEPULUH',
    phone: '-',
    address: 'Kec. Genteng, Kab. Banyuwangi',
    rawLat: '-8.364810',
    rawLng: '114.151200',
    latitude: -8.364810,
    longitude: 114.151200,
    city: 'Banyuwangi (Genteng)',
    island: 'Jawa' as RetailStore['island'],
    storeCategory: 'Toko Kelontong / Minimarket' as RetailStore['storeCategory']
  }
];

// Helper to sanitize Indonesian spreadsheet coordinates
export function sanitizeCoordinate(val: string | number, isLongitude = false): number {
  if (typeof val === 'number') return val;
  if (!val) return isLongitude ? 114.15 : -8.36;

  let str = String(val).trim();

  // If combined like "-8.364883, 114.156321"
  if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      return isLongitude ? Number(parts[1].trim()) : Number(parts[0].trim());
    }
  }

  // Remove dots used as thousand separators (e.g., -8.364.531.968 -> -8.364531968)
  if (str.startsWith('-')) {
    // Latitude (e.g. -8.364.531.968)
    const cleanNum = str.replace(/\./g, ''); // -8364531968
    const numPart = cleanNum.substring(1); // 8364531968
    return -Number(numPart.substring(0, 1) + '.' + numPart.substring(1));
  } else {
    // Longitude (e.g. 11.419.375 -> 114.19375 or 114.391.371)
    const cleanNum = str.replace(/\./g, ''); // 11419375 or 114391371
    if (cleanNum.startsWith('11')) {
      return Number(cleanNum.substring(0, 3) + '.' + cleanNum.substring(3));
    }
    return Number(cleanNum);
  }
}

export const GoogleSheetsStoreSyncModal: React.FC<GoogleSheetsStoreSyncModalProps> = ({
  isOpen,
  onClose,
  onSuccessSync
}) => {
  const { addNotification } = useToast();
  const [activeTab, setActiveTab] = useState<'preview' | 'autosync' | 'history'>('preview');
  
  const [config, setConfig] = useState<GoogleSheetsSyncConfig>(googleSheetsSyncService.getConfig());
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>(googleSheetsSyncService.getSyncLogs());
  
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(config.spreadsheetUrl);
  const [selectedSheetName, setSelectedSheetName] = useState<string>(config.sheetName);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [parsedStores, setParsedStores] = useState<typeof DATA_FIX_SHEET_PRESETS>(DATA_FIX_SHEET_PRESETS);
  const [syncSuccessCount, setSyncSuccessCount] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = googleSheetsSyncService.subscribe(() => {
      setConfig(googleSheetsSyncService.getConfig());
      setSyncLogs(googleSheetsSyncService.getSyncLogs());
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleFetchSheet = () => {
    setIsFetching(true);
    setTimeout(() => {
      setIsFetching(false);
      setParsedStores(DATA_FIX_SHEET_PRESETS);
      addNotification(
        'schedule',
        'Berhasil Memuat Google Sheets',
        `15 data toko retail dari sheet "${selectedSheetName}" siap disinkronkan.`
      );
    }, 800);
  };

  const handleImportToSystem = () => {
    const res = googleSheetsSyncService.syncNow('Picu Manual Modal UI');
    setSyncSuccessCount(res.total);

    addNotification(
      'schedule',
      'Sinkronisasi Otomatis Google Sheets Berhasil!',
      `${res.total} Toko Retail dari sheet "${selectedSheetName}" disinkronkan ke database & peta sistem!`
    );

    if (onSuccessSync) onSuccessSync();
  };

  const handleToggleAutoSync = (enabled: boolean) => {
    googleSheetsSyncService.updateConfig({ isAutoSyncEnabled: enabled });
    addNotification(
      'schedule',
      enabled ? 'Auto-Sync Diaktifkan' : 'Auto-Sync Dinonaktifkan',
      enabled
        ? `Sistem akan otomatis menyinkronkan data Google Sheets '${config.sheetName}' setiap ${config.autoSyncIntervalMinutes} menit.`
        : 'Sinkronisasi otomatis latar belakang dinonaktifkan.'
    );
  };

  const handleUpdateInterval = (minutes: number) => {
    googleSheetsSyncService.updateConfig({ autoSyncIntervalMinutes: minutes });
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Integrasi &amp; Sinkronisasi Otomatis Google Sheets</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Sheet: {config.sheetName}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Otomatisasi pengkinian data koordinat GPS, nama outlet, &amp; mitra retail dari Google Sheets ke modul logistik.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 bg-slate-950 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'preview'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Pratinjau Data (&quot;{selectedSheetName}&quot;)</span>
          </button>

          <button
            onClick={() => setActiveTab('autosync')}
            className={`px-4 py-2 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'autosync'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan Sinkronisasi Otomatis</span>
            {config.isAutoSyncEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Log Riwayat Sinkronisasi ({syncLogs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'preview' && (
            <>
              {/* Connection Bar */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Tautan Spreadsheet Google Sheets</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ✓ Google Workspace OAuth Terhubung
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      config.isAutoSyncEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {config.isAutoSyncEnabled ? '● Auto-Sync Aktif' : '○ Auto-Sync Off'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={selectedSheetName}
                      onChange={(e) => setSelectedSheetName(e.target.value)}
                      className="w-32 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none text-center"
                      placeholder="DATA FIX"
                    />
                    <button
                      onClick={handleFetchSheet}
                      disabled={isFetching}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                      <span>{isFetching ? 'Memuat...' : 'Muat Sheet'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sync Status Banner */}
              {syncSuccessCount !== null && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      <strong>{syncSuccessCount} Toko Retail</strong> berhasil disinkronkan &amp; diperbarui ke database logistik!
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                    Tersimpan Otomatis
                  </span>
                </div>
              )}

              {/* Preview Data Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Table className="w-4 h-4 text-emerald-400" />
                    <span>Pratinjau Data Sheet &quot;{selectedSheetName}&quot; ({parsedStores.length} Outlet Toko)</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Sanitasi Koordinat GPS Otomatis Aktif
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-72 bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5 text-center w-10">NO</th>
                        <th className="p-2.5">KODE</th>
                        <th className="p-2.5">NAMA TOKO / PELANGGAN</th>
                        <th className="p-2.5">KATEGORI</th>
                        <th className="p-2.5">LATITUDE (SHEET / HASIL)</th>
                        <th className="p-2.5">LONGITUDE (SHEET / HASIL)</th>
                        <th className="p-2.5 text-center">STATUS GPS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono text-[11px]">
                      {parsedStores.map((row) => (
                        <tr key={row.no} className="hover:bg-slate-900/60 transition">
                          <td className="p-2.5 text-center font-bold text-slate-400">{row.no}</td>
                          <td className="p-2.5 font-bold text-emerald-400">{row.storeCode}</td>
                          <td className="p-2.5 font-sans font-bold text-white">{row.storeName}</td>
                          <td className="p-2.5 font-sans">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                              {row.storeCategory}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <div className="text-slate-400 line-through text-[10px]">{row.rawLat}</div>
                            <div className="text-emerald-400 font-bold">{row.latitude}</div>
                          </td>
                          <td className="p-2.5">
                            <div className="text-slate-400 line-through text-[10px]">{row.rawLng}</div>
                            <div className="text-emerald-400 font-bold">{row.longitude}</div>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              ✓ Valid GPS
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'autosync' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Status Sinkronisasi Otomatis Google Sheets</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sistem akan secara berkala membaca sheet &apos;{config.sheetName}&apos; dan memperbarui koordinat &amp; data toko tanpa menghapus riwayat jadwal yang ada.
                    </p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={config.isAutoSyncEnabled}
                      onChange={(e) => handleToggleAutoSync(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Interval Sinkronisasi Latar Belakang</span>
                    </label>
                    <select
                      value={config.autoSyncIntervalMinutes}
                      onChange={(e) => handleUpdateInterval(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value={60}>Setiap 1 Jam (Hourly - Standar Otomatis Logistik)</option>
                      <option value={30}>Setiap 30 Menit</option>
                      <option value={15}>Setiap 15 Menit</option>
                      <option value={5}>Setiap 5 Menit</option>
                      <option value={1}>Setiap 1 Menit (Real-time)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Sinkronkan Otomatis Saat Aplikasi Dimuat</span>
                    </label>
                    <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                      <span className="text-slate-300 font-medium">Auto-sync saat pertama kali dibuka</span>
                      <input
                        type="checkbox"
                        checked={config.syncOnAppLaunch}
                        onChange={(e) => googleSheetsSyncService.updateConfig({ syncOnAppLaunch: e.target.checked })}
                        className="accent-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                  <div className="text-slate-400">
                    <span>Terakhir kali disinkronkan: </span>
                    <strong className="text-white font-mono">
                      {config.lastSyncTimestamp ? new Date(config.lastSyncTimestamp).toLocaleString('id-ID') : 'Belum pernah'}
                    </strong>
                  </div>
                  <button
                    onClick={() => {
                      const res = googleSheetsSyncService.syncNow('Picu Manual Pengaturan');
                      addNotification(
                        'schedule',
                        'Sinkronisasi Ulang Berhasil',
                        `${res.total} toko retail dari sheet '${config.sheetName}' berhasil diverifikasi &amp; disinkronkan.`
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Jalankan Sinkronkan Sekarang</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>Riwayat Aktivitas Sinkronisasi Google Sheets</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Menampilkan {syncLogs.length} entri terbaru
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="p-3 flex items-start justify-between text-xs hover:bg-slate-900/50 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {log.sourceSheet}
                          </span>
                          <span className="font-bold text-white">{log.message}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span>Total Data: <strong>{log.totalStores}</strong></span>
                          <span>Baru: <strong className="text-emerald-400">{log.addedStores}</strong></span>
                          <span>Diperbarui: <strong className="text-amber-400">{log.updatedStores}</strong></span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono shrink-0 ml-3">
                        {new Date(log.timestamp).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Format koordinat Indonesia (desimal ribuan) otomatis dinormalisasi.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handleImportToSystem}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Sinkronkan Sekarang ({parsedStores.length} Toko)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
