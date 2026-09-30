import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Truck, 
  Warehouse, 
  UserX, 
  Layers, 
  Check, 
  Calendar, 
  Users, 
  Sparkles, 
  ArrowRight, 
  FileText,
  Clock,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Info,
  MapPin,
  Ship,
  User,
  Send,
  X,
  Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ADMIN_SCHEDULE_WEEKS, AdminScheduleWeek, AdminScheduleDay, DeliveryAssignment, RAW_ADMIN_SCHEDULE_CSV } from '../data/adminSchedule';
import { logisticsStore } from '../services/store';
import { Schedule, ShipmentStatus, RetailStore, Fleet, Crew } from '../types';
import { GoogleSheetsApiSyncModal } from './GoogleSheetsApiSyncModal';
import { 
  scheduleImportValidator, 
  ValidationSummaryReport, 
  ValidatedImportItem 
} from '../services/scheduleImportValidator';
import { 
  googleSheetsApiService, 
  ParsedSheetTrip 
} from '../services/googleSheetsApiService';
import { standardizeAreaName, getAreaSubDetail } from '../utils/areaNormalizer';
import { areaAutoMapper, AreaMappingEntry, OfficialAreaItem } from '../services/areaAutoMapper';
import { QuickCreateAreaModal } from './QuickCreateAreaModal';
import { AreaAutoMappingSection } from './AreaAutoMappingSection';

const FLEET_SPEC_MAP: Record<string, { model: string; category: string }> = {
  'DS1': { model: 'Isuzu Giga CDD Long', category: 'Luar Kota (Bali Spec)' },
  'DS2': { model: 'Mitsubishi Canter HDX', category: 'Heavy Duty Box 6R' },
  'DS3': { model: 'Hino Dutro 130 HD', category: 'Luar Kota (Bali Spec)' },
  'DS4': { model: 'Isuzu Elf NMR 71', category: 'Box 6-Roda Reguler' },
  'NS1': { model: 'Mitsubishi Canter FE71', category: 'Engkel Box 4-Roda' },
  'NS2': { model: 'Isuzu Elf NLR 55', category: 'Engkel Box 4-Roda' },
  'NS3': { model: 'Hino Dutro 110 SDB', category: 'Engkel Box 4-Roda' },
  'N20': { model: 'Mitsubishi L300 Box', category: 'Blind Van / Pick-up Box' }
};

const DRIVER_AVATAR_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  'Supri': { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', ring: 'border-blue-500/30' },
  'Wahyu': { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400', ring: 'border-indigo-500/30' },
  'Tiar': { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', ring: 'border-emerald-500/30' },
  'Aris': { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', ring: 'border-amber-500/30' },
  'Andre': { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', ring: 'border-purple-500/30' },
  'Wibi': { bg: 'bg-teal-500/10 dark:bg-teal-500/20', text: 'text-teal-600 dark:text-teal-400', ring: 'border-teal-500/30' },
  'Budi': { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', ring: 'border-rose-500/30' },
  'Hadi': { bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', ring: 'border-cyan-500/30' }
};

function getDriverInitials(name: string): string {
  if (!name) return 'DR';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getAreaCorridor(standardArea: string): string {
  if (standardArea.includes('DENPASAR') || standardArea.includes('SINGARAJA') || standardArea.includes('NEGARA')) {
    return 'Lintas Pulau (Ferry ASDP Ketapang - Gilimanuk)';
  }
  if (standardArea.includes('BONDOWOSO') || standardArea.includes('STB') || standardArea.includes('SITUBONDO')) {
    return 'Jalur Pantura / Pegunungan Utara';
  }
  if (standardArea.includes('ROGOJAMPI') || standardArea.includes('SONGGON') || standardArea.includes('SRONO')) {
    return 'Koridor Banyuwangi Tengah (Ritel)';
  }
  if (standardArea.includes('PURWO') || standardArea.includes('JAJAG') || standardArea.includes('GALEKAN')) {
    return 'Koridor Banyuwangi Selatan (Supermarket & Grosir)';
  }
  return 'Rute Distribusi Reguler Gudang Pusat AKK';
}

interface GoogleSheetsAdminScheduleViewProps {
  onSyncComplete?: (count: number) => void;
  onNavigateToSchedules?: () => void;
}

export const GoogleSheetsAdminScheduleView: React.FC<GoogleSheetsAdminScheduleViewProps> = ({
  onSyncComplete,
  onNavigateToSchedules
}) => {
  const [selectedWeekNum, setSelectedWeekNum] = useState<number | 'all'>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'luar_kota' | 'lokal'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'sheet_grid' | 'cards_view'>('sheet_grid');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isApiSyncModalOpen, setIsApiSyncModalOpen] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedRowsCount, setUploadedRowsCount] = useState<number>(0);
  const [uploadedValidationReport, setUploadedValidationReport] = useState<ValidationSummaryReport | null>(null);
  const [skipDuplicatesUpload, setSkipDuplicatesUpload] = useState<boolean>(true);
  const [skipInvalidUpload, setSkipInvalidUpload] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Intelligent Area Auto-Mapping State
  const [detectedAreaMappings, setDetectedAreaMappings] = useState<Record<string, AreaMappingEntry>>({});
  const [officialAreasList, setOfficialAreasList] = useState<OfficialAreaItem[]>(() => areaAutoMapper.getOfficialAreaList());
  const [quickCreateAreaTarget, setQuickCreateAreaTarget] = useState<string | null>(null);
  const [isAreaMappingModalOpen, setIsAreaMappingModalOpen] = useState<boolean>(false);
  const [activeUploadTab, setActiveUploadTab] = useState<'audit' | 'area_mapping'>('audit');
  const [parsedUploadedTrips, setParsedUploadedTrips] = useState<ParsedSheetTrip[]>([]);

  // Filtered weeks & days
  const filteredWeeks = useMemo(() => {
    let result = ADMIN_SCHEDULE_WEEKS;
    if (selectedWeekNum !== 'all') {
      result = result.filter(w => w.weekNumber === selectedWeekNum);
    }
    return result;
  }, [selectedWeekNum]);

  // Extract raw areas from currently active week/sheet
  const currentSheetAreas = useMemo(() => {
    const areas: string[] = [];
    filteredWeeks.forEach(w => {
      w.days.forEach(d => {
        d.pengiriman.forEach(p => {
          if (p.area) areas.push(p.area);
        });
      });
    });
    return areas;
  }, [filteredWeeks]);

  // Auto-run intelligent mapping for current sheet
  useEffect(() => {
    if (currentSheetAreas.length > 0) {
      const mappings = areaAutoMapper.processRawAreaBatch(currentSheetAreas);
      setDetectedAreaMappings(prev => {
        const updated = { ...mappings };
        Object.keys(prev).forEach(k => {
          if (prev[k].isUserOverridden && updated[k]) {
            updated[k] = prev[k];
          }
        });
        return updated;
      });
    }
  }, [currentSheetAreas]);

  // Handle mapping modification
  const handleMappingChange = (rawArea: string, targetOfficialArea: string) => {
    const foundOfficial = officialAreasList.find(a => a.name.toUpperCase() === targetOfficialArea.toUpperCase());
    setDetectedAreaMappings(prev => {
      const current = prev[rawArea];
      const updated: AreaMappingEntry = {
        rawArea,
        occurrenceCount: current?.occurrenceCount || 1,
        matchedOfficialArea: targetOfficialArea,
        matchedStoreId: foundOfficial?.id || null,
        confidence: 'exact',
        confidenceScore: 100,
        similarityReason: `Dipetakan manual oleh pengguna ke '${targetOfficialArea}'`,
        isUserOverridden: true
      };
      areaAutoMapper.saveUserMappingPreference(rawArea, targetOfficialArea);
      return { ...prev, [rawArea]: updated };
    });

    if (parsedUploadedTrips.length > 0) {
      const mappingDict: Record<string, string> = {};
      Object.entries({ ...detectedAreaMappings, [rawArea]: { matchedOfficialArea: targetOfficialArea } as any }).forEach(([k, v]) => {
        if (v.matchedOfficialArea) mappingDict[k] = v.matchedOfficialArea;
      });
      const revalidated = scheduleImportValidator.validateImportBatch(parsedUploadedTrips, new Date(), mappingDict);
      setUploadedValidationReport(revalidated);
    }
  };

  // Handle new area created via quick dialog
  const handleAreaCreated = (newArea: OfficialAreaItem, rawAreaKey: string) => {
    const updatedList = areaAutoMapper.getOfficialAreaList();
    setOfficialAreasList(updatedList);

    setDetectedAreaMappings(prev => {
      const current = prev[rawAreaKey];
      return {
        ...prev,
        [rawAreaKey]: {
          rawArea: rawAreaKey,
          occurrenceCount: current?.occurrenceCount || 1,
          matchedOfficialArea: newArea.name,
          matchedStoreId: newArea.id,
          confidence: 'exact',
          confidenceScore: 100,
          similarityReason: `Area baru '${newArea.name}' berhasil dibuat dan didaftarkan ke Jadwal Pengiriman & Muat`,
          isUserOverridden: true,
          isNewlyCreated: true
        }
      };
    });

    if (parsedUploadedTrips.length > 0) {
      const mappingDict: Record<string, string> = {};
      Object.entries({ ...detectedAreaMappings, [rawAreaKey]: { matchedOfficialArea: newArea.name } as any }).forEach(([k, v]) => {
        if (v.matchedOfficialArea) mappingDict[k] = v.matchedOfficialArea;
      });
      const revalidated = scheduleImportValidator.validateImportBatch(parsedUploadedTrips, new Date(), mappingDict);
      setUploadedValidationReport(revalidated);
    }

    setSyncSuccessMessage(`✨ Area baru '${newArea.name}' berhasil didaftarkan ke 'Jadwal Pengiriman & Muat' dan dipetakan otomatis!`);
    setTimeout(() => setSyncSuccessMessage(null), 6000);
  };

  // Aggregate statistics
  const stats = useMemo(() => {
    let totalTrips = 0;
    let totalWarehouseRoles = 0;
    let totalLeaves = 0;
    let totalOff = 0;
    let totalLuarKota = 0;
    let totalLokal = 0;

    filteredWeeks.forEach(w => {
      w.days.forEach(d => {
        totalTrips += d.pengiriman.length;
        totalWarehouseRoles += d.gudang.length;
        totalLeaves += d.karyawanIzin.length;
        totalOff += d.pengirimanOff.length;
        d.pengiriman.forEach(p => {
          const std = standardizeAreaName(p.area);
          if (std.includes('DENPASAR') || std.includes('SINGARAJA') || std.includes('NEGARA')) {
            totalLuarKota++;
          } else {
            totalLokal++;
          }
        });
      });
    });

    return { totalTrips, totalWarehouseRoles, totalLeaves, totalOff, totalLuarKota, totalLokal };
  }, [filteredWeeks]);

  // Handle Export to Excel .xlsx
  const handleExportXLSX = () => {
    try {
      const rows: any[][] = [];
      
      // Header metadata
      rows.push(['PT ANUGRAH KEMASAN KREATIF - BANYUWANGI CENTRAL HUB']);
      rows.push(['JADWAL OPERASIONAL & PENUGASAN (SHEET: ALL)']);
      rows.push(['Periode: Januari 2026', 'Total Pengiriman: ' + stats.totalTrips]);
      rows.push([]);

      filteredWeeks.forEach(week => {
        rows.push([`=== ${week.weekLabel} (${week.dateRangeLabel}) ===`]);
        rows.push([
          'TANGGAL', 
          'HARI', 
          'KATEGORI', 
          'DRIVER / PETUGAS', 
          'HELPER / PIC', 
          'AREA / ROLE', 
          'ARMADA / MOBIL', 
          'BACKUP / TARGET / KET'
        ]);

        week.days.forEach(day => {
          // Deliveries
          day.pengiriman.forEach(p => {
            rows.push([
              day.dateString,
              day.dayName,
              'FORMASI PENGIRIMAN',
              p.driver,
              p.helper,
              p.area,
              p.armada,
              p.target ? `Target: ${p.target}` : (p.backup || '-')
            ]);
          });

          // Warehouse
          day.gudang.forEach(g => {
            rows.push([
              day.dateString,
              day.dayName,
              'FORMASI GUDANG',
              g.nama,
              '-',
              g.role,
              '-',
              g.keterangan || '-'
            ]);
          });

          // Off / Maintenance
          day.pengirimanOff.forEach(o => {
            rows.push([
              day.dateString,
              day.dayName,
              'PENGIRIMAN OFF / ARMADA FREE',
              o.nama,
              '-',
              o.keterangan,
              '-',
              o.backup || '-'
            ]);
          });

          // Leave / Absence
          day.karyawanIzin.forEach(iz => {
            rows.push([
              day.dateString,
              day.dayName,
              'KARYAWAN IZIN / SAKIT',
              iz.nama,
              '-',
              iz.keterangan,
              '-',
              iz.backup || '-'
            ]);
          });
        });
        rows.push([]);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ALL');
      XLSX.writeFile(workbook, `Jadwal_Operasional_AKK_Sheet_ALL_${new Date().toISOString().substring(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
      alert('Gagal mengekspor file spreadsheet.');
    }
  };

  // Handle File Upload & Processing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Find sheet 'ALL' or use first sheet
        const sheetName = workbook.SheetNames.find(n => n.toUpperCase() === 'ALL') || workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        setUploadedRowsCount(jsonRows.length);
        const parsedTrips = googleSheetsApiService.parseScheduleRows(jsonRows);
        setParsedUploadedTrips(parsedTrips);

        // Intelligent Auto-Mapping for uploaded raw areas
        const rawAreas = parsedTrips.map(t => t.area).filter(Boolean);
        const mappings = areaAutoMapper.processRawAreaBatch(rawAreas);
        setDetectedAreaMappings(mappings);

        // Build mapping dictionary
        const mappingDict: Record<string, string> = {};
        Object.entries(mappings).forEach(([k, v]) => {
          if (v.matchedOfficialArea) mappingDict[k] = v.matchedOfficialArea;
        });

        const validation = scheduleImportValidator.validateImportBatch(parsedTrips, new Date(), mappingDict);
        setUploadedValidationReport(validation);

        // If any unmapped area, show the area mapping tab first
        const hasUnmapped = Object.values(mappings).some(m => m.confidence === 'unmapped');
        setActiveUploadTab(hasUnmapped ? 'area_mapping' : 'audit');
        setIsUploadModalOpen(true);
      } catch (err) {
        console.error('File parsing error:', err);
        alert('Gagal membaca struktur file Excel / CSV.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Handle Sync to Active Operational Schedule with Validation & Area Mappings
  const handleSyncToOperationalSchedules = () => {
    setIsSyncing(true);

    const mappingDict: Record<string, string> = {};
    Object.entries(detectedAreaMappings).forEach(([k, v]) => {
      if (v.matchedOfficialArea) mappingDict[k] = v.matchedOfficialArea;
    });

    const tripsToSync: ParsedSheetTrip[] = [];
    filteredWeeks.forEach((week) => {
      week.days.forEach((day) => {
        day.pengiriman.forEach((p, idx) => {
          const dayNumPad = String(day.dayNumber).padStart(2, '0');
          const resolvedArea = mappingDict[p.area] || standardizeAreaName(p.area);
          tripsToSync.push({
            driver: p.driver,
            helper: p.helper,
            area: resolvedArea,
            armada: p.armada,
            target: p.target,
            dateStr: `2026-01-${dayNumPad}`,
            dayName: day.dayName,
            notes: `PO-AKK-202601${dayNumPad}-${p.armada.replace(/[^A-Za-z0-9]/g, '')}-${idx + 1}`
          });
        });
      });
    });

    // Run duplicate and format validation with custom mappings
    const report = scheduleImportValidator.validateImportBatch(tripsToSync, new Date('2026-01-05'), mappingDict);
    const syncRes = scheduleImportValidator.syncValidatedItems(report.items, {
      skipDuplicates: true,
      skipInvalid: true,
      customAreaMapping: mappingDict
    });

    setTimeout(() => {
      setIsSyncing(false);
      const msg = `⚡ Berhasil menyinkronkan ${syncRes.syncedCount} jadwal pengiriman valid (${syncRes.skippedDuplicateCount} duplikat dicegah, ${syncRes.skippedInvalidCount} baris tidak valid dilewati)!`;
      setSyncSuccessMessage(msg);
      if (onSyncComplete) onSyncComplete(syncRes.syncedCount);
      setTimeout(() => setSyncSuccessMessage(null), 8000);
    }, 600);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Card: Google Sheets Integrated Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                GOOGLE SHEETS &bull; SHEET: &quot;ALL&quot;
              </span>
              <span className="text-xs text-slate-500 font-mono">Live Roster DC Banyuwangi</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-400 font-medium">Bulan Januari 2026 (5 Pekan Lengkap)</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2 flex items-center gap-2">
              Jadwal Operasional Admin (Sheet ALL)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Tabel jadwal terpadu formasi pengiriman armada, tim gudang, jadwal armada bebas/off, serta perizinan karyawan langsung dari spreadsheet Google Sheets Sheet &quot;ALL&quot;.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
              onChange={handleFileUpload}
            />

            <button
              onClick={() => setIsApiSyncModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition cursor-pointer border border-emerald-400/30"
              title="Hubungkan & Sinkronkan langsung dengan Google Sheets API v4"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Live Sync Google Sheets API</span>
            </button>

            <button
              onClick={() => setIsAreaMappingModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer relative"
              title="Kelola & tinjau pemetaan otomatis nama area spreadsheet ke tabel Jadwal Pengiriman & Muat"
            >
              <MapPin className="w-4 h-4 text-rose-400" />
              <span>Pemetaan Area ({Object.keys(detectedAreaMappings).length})</span>
              {Object.values(detectedAreaMappings).some(m => m.confidence === 'unmapped') && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1.5 right-1.5" />
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
              title="Unggah spreadsheet baru (.xlsx / .csv)"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Unggah Spreadsheet</span>
            </button>

            <button
              onClick={handleExportXLSX}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
              title="Unduh data sebagai file Excel .xlsx"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleSyncToOperationalSchedules}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white text-xs font-black shadow-md transition cursor-pointer"
              title="Konversi baris pengiriman Sheet ALL menjadi jadwal resmi di menu Jadwal Pengiriman & Muat"
            >
              <Sparkles className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : '⚡ Sinkronkan ke Jadwal Operasional'}</span>
            </button>
          </div>
        </div>

        {/* Notice: Live Sheet "ALL" alignment */}
        <div className="mt-4 p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Status Dokumen Google Spreadsheet Sheet &quot;ALL&quot;:</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                8 Rute Terdeteksi (05 Januari 2026)
              </span>
            </div>
            <p className="text-slate-300 mt-1 leading-relaxed">
              Di spreadsheet Anda saat ini baru terisi <strong>8 rute pengiriman aktif</strong> (Supri, Wahyu, Tiar, Aris, Andre, Wibi, Budi, Hadi) pada tanggal <strong>05 Januari 2026 (1/5/2026)</strong>.
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-500/30">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong>Standardisasi Nama Area Aktif:</strong> Nama area dari Google Sheets otomatis disamakan 100% dengan daftar resmi di <em>Pembuatan Jadwal Baru</em> (misal: <code>Situbondo</code> &rarr; <strong>SSLN STB BDWS</strong>, <code>Purwo Dambuntung / Pasar</code> &rarr; <strong>RITEL PURWO</strong>, <code>Susulan Genteng - Rogojampi</code> &rarr; <strong>SUSULAN ROGOJAMPI-MUNCAR</strong>, <code>Denpasar 1 & 2</code> &rarr; <strong>DENPASAR 1 & 2</strong>).
              </span>
            </div>
          </div>
        </div>

        {/* Sync Success Banner */}
        {syncSuccessMessage && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-semibold">{syncSuccessMessage}</span>
            </div>
            {onNavigateToSchedules && (
              <button
                onClick={onNavigateToSchedules}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Lihat di Jadwal Terdaftar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Aggregate KPI Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80">
          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Total Ritase Kirim</span>
              <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {stats.totalTrips} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rute Aktif</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Luar Kota / Bali</span>
              <Ship className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">
              {stats.totalLuarKota} <span className="text-xs font-semibold text-blue-600/80 dark:text-blue-400">Ferry ASDP</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Distribusi Lokal</span>
              <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
              {stats.totalLokal} <span className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400">Jawa Timur</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Total Personel Kru</span>
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              17 <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">On-Duty</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Category & Week Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua Rute ({stats.totalTrips})
            </button>
            <button
              onClick={() => setCategoryFilter('luar_kota')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'luar_kota'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              <Ship className="w-3.5 h-3.5" />
              <span>Bali / Luar Kota ({stats.totalLuarKota})</span>
            </button>
            <button
              onClick={() => setCategoryFilter('lokal')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'lokal'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Lokal ({stats.totalLokal})</span>
            </button>
          </div>
        </div>

        {/* Search & View Mode Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari driver, helper, area, armada..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:outline-hidden placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('sheet_grid')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'sheet_grid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tampilan Grid</span>
            </button>

            <button
              onClick={() => setViewMode('cards_view')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'cards_view'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Kartu Hari</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Content: Grid Sheet View or Day Cards View */}
      {viewMode === 'sheet_grid' ? (
        <div className="space-y-6">
          {filteredWeeks.map((week) => (
            <div key={week.weekNumber} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              {/* Week Title Bar */}
              <div className="bg-slate-50 dark:bg-slate-950 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {week.weekLabel} &bull; <span className="text-emerald-600 dark:text-emerald-400">{week.dateRangeLabel}</span>
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
                  {week.days.reduce((acc, d) => acc + d.pengiriman.length, 0)} Ritase Pengiriman Aktif
                </span>
              </div>

              {/* Responsive Spreadsheet Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700 text-xs">
                      <th className="p-3.5 text-center w-16 border-r border-slate-200 dark:border-slate-800"># NO</th>
                      <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 w-44">KATEGORI & RUTE</th>
                      <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 w-44">DRIVER (PENGEMUDI)</th>
                      <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 w-40">HELPER / PIC</th>
                      <th className="p-3.5 border-r border-slate-200 dark:border-slate-800">AREA & TUJUAN</th>
                      <th className="p-3.5 border-r border-slate-200 dark:border-slate-800 w-44">ARMADA TRUK</th>
                      <th className="p-3.5 w-44">STATUS & AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/60 font-medium">
                    {week.days.map((day) => {
                      // Filter by search query & category filter
                      const matchesSearch = (str?: string) => 
                        !searchQuery || (str && str.toLowerCase().includes(searchQuery.toLowerCase()));

                      const filteredPengiriman = day.pengiriman.filter(p => {
                        const standardArea = standardizeAreaName(p.area);
                        const isLuarPulau = standardArea.includes('DENPASAR') || standardArea.includes('SINGARAJA') || standardArea.includes('NEGARA');
                        
                        if (categoryFilter === 'luar_kota' && !isLuarPulau) return false;
                        if (categoryFilter === 'lokal' && isLuarPulau) return false;

                        return matchesSearch(p.driver) || matchesSearch(p.helper) || matchesSearch(standardArea) || matchesSearch(p.armada);
                      });

                      const filteredGudang = day.gudang.filter(g =>
                        categoryFilter === 'all' && (matchesSearch(g.nama) || matchesSearch(g.role) || matchesSearch(g.keterangan))
                      );

                      const filteredOff = day.pengirimanOff.filter(o =>
                        categoryFilter === 'all' && (matchesSearch(o.nama) || matchesSearch(o.keterangan))
                      );

                      const filteredIzin = day.karyawanIzin.filter(i =>
                        categoryFilter === 'all' && (matchesSearch(i.nama) || matchesSearch(i.keterangan))
                      );

                      if (
                        filteredPengiriman.length === 0 && 
                        filteredGudang.length === 0 && 
                        filteredOff.length === 0 && 
                        filteredIzin.length === 0
                      ) {
                        return null;
                      }

                      return (
                        <React.Fragment key={day.dayNumber}>
                          {/* Day Header Row */}
                          <tr className="bg-slate-50 dark:bg-slate-950/90 border-y border-slate-200 dark:border-slate-800 font-bold">
                            <td colSpan={7} className="px-4 py-2.5">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2.5">
                                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                                    {day.dayName}, {day.dateString}
                                  </span>
                                  <span className="text-slate-400 dark:text-slate-600">·</span>
                                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                                    {filteredPengiriman.length} Pengiriman Terjadwal
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                  Gudang Pusat AKK Banyuwangi DC
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* Deliveries */}
                          {filteredPengiriman.map((p, pIdx) => {
                            const standardArea = standardizeAreaName(p.area);
                            const subDetail = getAreaSubDetail(p.area);
                            const isLuarPulau = standardArea.includes('DENPASAR') || standardArea.includes('SINGARAJA') || standardArea.includes('NEGARA');
                            const driverInitials = getDriverInitials(p.driver);
                            const avatarStyle = DRIVER_AVATAR_COLORS[p.driver] || { 
                              bg: 'bg-slate-100 dark:bg-slate-800', 
                              text: 'text-slate-700 dark:text-slate-300', 
                              ring: 'border-slate-300 dark:border-slate-700' 
                            };
                            const corridor = getAreaCorridor(standardArea);
                            const fleetSpec = FLEET_SPEC_MAP[p.armada] || { model: 'Truk Box Reguler', category: 'Distribusi' };

                            return (
                              <tr 
                                key={`p-${pIdx}`} 
                                className={`group border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-150 ${
                                  isLuarPulau 
                                    ? 'bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-50/60 dark:hover:bg-blue-900/20' 
                                    : 'hover:bg-emerald-50/40 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                {/* 1. NO & HARI */}
                                <td className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
                                  <div className="flex flex-col items-center justify-center gap-0.5">
                                    <span className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                      {pIdx + 1}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                      {day.dayName}
                                    </span>
                                  </div>
                                </td>

                                {/* 2. KATEGORI & RUTE */}
                                <td className="p-3 border-r border-slate-200 dark:border-slate-800">
                                  {isLuarPulau ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30 shrink-0">
                                        <Ship className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                          Luar Kota / Bali
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                          Ferry ASDP
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                                        <Truck className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                          Distribusi Lokal
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                          Jawa Timur
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* 3. DRIVER / KRU */}
                                <td className="p-3 border-r border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${avatarStyle.bg} ${avatarStyle.text} ${avatarStyle.ring}`}>
                                      {driverInitials}
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                                        {p.driver}
                                      </div>
                                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                        Driver Utama
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* 4. HELPER / PIC */}
                                <td className="p-3 border-r border-slate-200 dark:border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                      {p.helper || '-'}
                                    </span>
                                  </div>
                                </td>

                                {/* 5. AREA & TUJUAN */}
                                <td className="p-3 border-r border-slate-200 dark:border-slate-800">
                                  {(() => {
                                    const mappingEntry = detectedAreaMappings[p.area];
                                    const mappedOfficialArea = mappingEntry?.matchedOfficialArea;
                                    const isUnmapped = mappingEntry?.confidence === 'unmapped';
                                    const isNewlyCreated = mappingEntry?.isNewlyCreated;
                                    const effectiveArea = mappedOfficialArea || standardArea;

                                    return (
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <MapPin className={`w-3.5 h-3.5 shrink-0 ${isUnmapped ? 'text-rose-500 animate-bounce' : 'text-emerald-500'}`} />
                                          <span className="text-xs font-black text-slate-900 dark:text-white tracking-wide">
                                            {effectiveArea}
                                          </span>

                                          {isNewlyCreated && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                                              ✨ Baru Didaftarkan
                                            </span>
                                          )}

                                          {isUnmapped && (
                                            <button
                                              type="button"
                                              onClick={() => setQuickCreateAreaTarget(p.area)}
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/70 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 transition cursor-pointer"
                                              title="Nama area ini belum ada di tabel Jadwal Pengiriman & Muat. Klik untuk membuat area baru."
                                            >
                                              <Plus className="w-3 h-3" />
                                              <span>+ Buat Area Baru</span>
                                            </button>
                                          )}

                                          {subDetail && (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                              {subDetail}
                                            </span>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 pl-5 flex-wrap">
                                          <span>{corridor}</span>
                                          {p.area && p.area.toUpperCase() !== effectiveArea.toUpperCase() && (
                                            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.2 rounded">
                                              Asli: &ldquo;{p.area}&rdquo;
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </td>

                                {/* 6. ARMADA */}
                                <td className="p-3 border-r border-slate-200 dark:border-slate-800">
                                  <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 font-mono font-bold text-xs">
                                      <Truck className="w-3 h-3 text-amber-500" />
                                      <span>{p.armada}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                      {fleetSpec.model}
                                    </div>
                                  </div>
                                </td>

                                {/* 7. STATUS & AKSI */}
                                <td className="p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      {p.target ? (
                                        <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                                          Target: {p.target}
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                          <span>Terjadwal</span>
                                        </div>
                                      )}
                                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {p.backup || 'Reguler Pagi'}
                                      </div>
                                    </div>

                                    <a
                                      href={`https://wa.me/?text=${encodeURIComponent(`Halo ${p.driver}, konfirmasi jadwal tugas pengiriman:\nTanggal: ${day.dateString}\nArea: ${standardArea}\nArmada: ${p.armada}\nHelper: ${p.helper || '-'}\nMohon standby di gudang sebelum jadwal keberangkatan.`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={`Kirim WA ke ${p.driver}`}
                                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Warehouse Assignments */}
                          {filteredGudang.map((g, gIdx) => (
                            <tr key={`g-${gIdx}`} className="bg-amber-50/20 dark:bg-slate-950/40 hover:bg-amber-50/40 dark:hover:bg-slate-800/30 transition text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800/60">
                              <td className="p-3 text-center text-slate-400 text-xs border-r border-slate-200 dark:border-slate-800">
                                G{gIdx + 1}
                              </td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                                  Gudang
                                </span>
                              </td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-200">
                                {g.nama}
                              </td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-slate-400">-</td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                                {g.role}
                              </td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-slate-400">-</td>
                              <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">{g.keterangan || '-'}</td>
                            </tr>
                          ))}

                          {/* Off duties and Absences */}
                          {filteredOff.map((o, oIdx) => (
                            <tr key={`o-${oIdx}`} className="bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800/60">
                              <td className="p-3 text-center text-slate-400 text-xs border-r border-slate-200 dark:border-slate-800">
                                -
                              </td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                                  Free / Off
                                </span>
                              </td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300">{o.nama}</td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-slate-400">-</td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">{o.keterangan}</td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-slate-400">-</td>
                              <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">{o.backup ? `Backup: ${o.backup}` : '-'}</td>
                            </tr>
                          ))}

                          {filteredIzin.map((iz, izIdx) => (
                            <tr key={`iz-${izIdx}`} className="bg-rose-50/40 dark:bg-rose-950/10 hover:bg-rose-50/70 dark:hover:bg-rose-950/20 transition text-rose-700 dark:text-rose-300 border-b border-slate-200 dark:border-slate-800/60">
                              <td className="p-3 text-center text-rose-400 text-xs border-r border-slate-200 dark:border-slate-800">
                                -
                              </td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800">
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
                                  Izin / Sakit
                                </span>
                              </td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800 font-bold text-rose-800 dark:text-rose-200">{iz.nama}</td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-slate-400">-</td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-rose-700 dark:text-rose-300">{iz.keterangan}</td>
                              <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-slate-400">-</td>
                              <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">{iz.backup ? `Backup: ${iz.backup}` : '-'}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 4. Day-by-Day Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWeeks.flatMap((w) => w.days).map((day) => (
            <div key={day.dayNumber} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-white">{day.dayName}</h3>
                    <p className="text-xs text-amber-400 font-semibold">{day.dateString}</p>
                  </div>
                  <span className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300 font-bold">
                    {day.pengiriman.length} Armada
                  </span>
                </div>

                {/* Deliveries List */}
                <div className="mt-3.5 space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-400" />
                    <span>Formasi Pengiriman ({day.pengiriman.length})</span>
                  </h4>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {day.pengiriman.map((p, pIdx) => (
                      <div key={pIdx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-1.5">
                            <span>{p.driver}</span>
                            {p.helper && p.helper !== '-' && (
                              <span className="text-slate-400 font-normal">&bull; Helper: {p.helper}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-amber-300 font-semibold mt-0.5">{standardizeAreaName(p.area)}</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 whitespace-nowrap">
                          {p.armada}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warehouse Crew */}
                {day.gudang.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/70 space-y-1.5">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-amber-400" />
                      <span>Kru Gudang ({day.gudang.length})</span>
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {day.gudang.slice(0, 4).map((g, gIdx) => (
                        <span key={gIdx} className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                          <strong className="text-slate-200">{g.role}:</strong> {g.nama}
                        </span>
                      ))}
                      {day.gudang.length > 4 && (
                        <span className="text-[10px] text-slate-500 self-center">+{day.gudang.length - 4} lainnya</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Leave & Off Footer */}
              {(day.karyawanIzin.length > 0 || day.pengirimanOff.length > 0) && (
                <div className="pt-3 border-t border-slate-800/70 text-[10px] text-slate-400 flex items-center justify-between">
                  {day.karyawanIzin.length > 0 ? (
                    <span className="text-rose-400 font-semibold">
                      Izin: {day.karyawanIzin.map(i => `${i.nama} (${i.keterangan})`).join(', ')}
                    </span>
                  ) : (
                    <span className="text-slate-500">Semua Kru Hadir</span>
                  )}
                  {day.pengirimanOff.length > 0 && (
                    <span className="text-slate-400 font-mono">
                      {day.pengirimanOff.length} Armada Bebas
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 5. Upload Preview Modal with Validation & Intelligent Area Auto-Mapping */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Pratinjau, Validasi &amp; Pemetaan Spreadsheet</h3>
                  <p className="text-xs text-slate-400">{uploadedFileName}</p>
                </div>
              </div>

              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab switchers */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setActiveUploadTab('audit')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeUploadTab === 'audit'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Audit &amp; Validasi Format</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveUploadTab('area_mapping')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeUploadTab === 'area_mapping'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Pemetaan Area Cerdas</span>
                {Object.values(detectedAreaMappings).some(m => m.confidence === 'unmapped') ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black animate-pulse">
                    {Object.values(detectedAreaMappings).filter(m => m.confidence === 'unmapped').length} Belum Dikenali
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                    {Object.keys(detectedAreaMappings).length} Area Terpetakan
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content 1: Audit */}
            {activeUploadTab === 'audit' && (
              <div className="space-y-4">
                {uploadedValidationReport ? (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Baris Terdeteksi:</span>
                      <span className="font-bold text-white">{uploadedValidationReport.totalRows} baris</span>
                    </div>

                    {/* Audit Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-850">
                      <div className="bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/30 text-center">
                        <span className="text-[10px] text-emerald-400 font-bold block">🟢 Lolos</span>
                        <span className="text-base font-bold text-emerald-300">{uploadedValidationReport.validCount}</span>
                      </div>

                      <div className="bg-amber-950/20 p-2 rounded-lg border border-amber-500/30 text-center">
                        <span className="text-[10px] text-amber-400 font-bold block">🟡 Duplikat</span>
                        <span className="text-base font-bold text-amber-300">{uploadedValidationReport.duplicateCount}</span>
                      </div>

                      <div className="bg-rose-950/20 p-2 rounded-lg border border-rose-500/30 text-center">
                        <span className="text-[10px] text-rose-400 font-bold block">🔴 Format Salah</span>
                        <span className="text-base font-bold text-rose-300">
                          {uploadedValidationReport.invalidDateCount + uploadedValidationReport.invalidPoCount + uploadedValidationReport.missingFieldCount}
                        </span>
                      </div>
                    </div>

                    {/* Protections */}
                    <div className="pt-2 border-t border-slate-850 space-y-2 text-[11px]">
                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={skipDuplicatesUpload}
                          onChange={(e) => setSkipDuplicatesUpload(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Lewati entri duplikat otomatis (Mencegah nomor PO/supir ganda)</span>
                      </label>

                      <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={skipInvalidUpload}
                          onChange={(e) => setSkipInvalidUpload(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>Tolak baris dengan format tanggal atau PO tidak valid</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Baris:</span>
                      <span className="font-bold text-white">{uploadedRowsCount} baris</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content 2: Area Auto-Mapping Section */}
            {activeUploadTab === 'area_mapping' && (
              <div className="max-h-[60vh] overflow-y-auto pr-1">
                <AreaAutoMappingSection
                  areaMappings={detectedAreaMappings}
                  officialAreas={officialAreasList}
                  onMappingChange={handleMappingChange}
                  onRequestCreateArea={(rawArea) => setQuickCreateAreaTarget(rawArea)}
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                {Object.values(detectedAreaMappings).some(m => m.confidence === 'unmapped') ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Tip: Buat area baru untuk nama yang belum terdaftar sebelum sinkronisasi.</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Semua nama area telah terharmonisasi dengan Jadwal Pengiriman &amp; Muat.</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mappingDict: Record<string, string> = {};
                    Object.entries(detectedAreaMappings).forEach(([k, v]) => {
                      if (v.matchedOfficialArea) mappingDict[k] = v.matchedOfficialArea;
                    });

                    if (uploadedValidationReport) {
                      const syncRes = scheduleImportValidator.syncValidatedItems(uploadedValidationReport.items, {
                        skipDuplicates: skipDuplicatesUpload,
                        skipInvalid: skipInvalidUpload,
                        customAreaMapping: mappingDict
                      });
                      setIsUploadModalOpen(false);
                      const msg = `⚡ Berhasil menyinkronkan ${syncRes.syncedCount} jadwal pengiriman valid (${syncRes.skippedDuplicateCount} duplikat dicegah, ${syncRes.skippedInvalidCount} baris salah diabaikan)!`;
                      setSyncSuccessMessage(msg);
                      if (onSyncComplete) onSyncComplete(syncRes.syncedCount);
                      setTimeout(() => setSyncSuccessMessage(null), 8000);
                    } else {
                      setIsUploadModalOpen(false);
                      handleSyncToOperationalSchedules();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Konfirmasi &amp; Sinkronkan Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Dedicated Area Auto-Mapping Modal */}
      {isAreaMappingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <MapPin className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">Pemetaan Area Cerdas (Spreadsheet &rarr; Jadwal)</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Harmonisasi Otomatis
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mendeteksi nama area dari spreadsheet secara cerdas dan menyamakannya dengan daftar area resmi di tabel &lsquo;Jadwal Pengiriman &amp; Muat&rsquo;.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickCreateAreaTarget('AREA BARU')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Buat Area Baru</span>
                </button>
                <button
                  onClick={() => setIsAreaMappingModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto pr-1">
              <AreaAutoMappingSection
                areaMappings={detectedAreaMappings}
                officialAreas={officialAreasList}
                onMappingChange={handleMappingChange}
                onRequestCreateArea={(rawArea) => setQuickCreateAreaTarget(rawArea)}
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Total Area Resmi Terdaftar: <strong className="text-white">{officialAreasList.length}</strong> area di Jadwal Pengiriman &amp; Muat
              </span>
              <button
                type="button"
                onClick={() => setIsAreaMappingModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Quick Create Area Modal Dialog */}
      <QuickCreateAreaModal
        isOpen={quickCreateAreaTarget !== null}
        onClose={() => setQuickCreateAreaTarget(null)}
        rawAreaName={quickCreateAreaTarget || ''}
        onAreaCreated={handleAreaCreated}
      />

      {/* 8. Google Sheets API v4 Live Sync Modal */}
      <GoogleSheetsApiSyncModal
        isOpen={isApiSyncModalOpen}
        onClose={() => setIsApiSyncModalOpen(false)}
        onSyncComplete={(count) => {
          setSyncSuccessMessage(`⚡ Berhasil menyinkronkan ${count} rute pengiriman langsung dari Google Sheets API v4!`);
          if (onSyncComplete) onSyncComplete(count);
          setTimeout(() => setSyncSuccessMessage(null), 8000);
        }}
      />
    </div>
  );
};
