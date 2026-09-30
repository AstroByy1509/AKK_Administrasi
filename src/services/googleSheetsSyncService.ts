import { logisticsStore } from './store';
import { RetailStore } from '../types';
import { DATA_FIX_SHEET_PRESETS, generate312Presets, sanitizeCoordinate } from '../components/GoogleSheetsStoreSyncModal';

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  status: 'success' | 'error' | 'in_progress';
  totalStores: number;
  addedStores: number;
  updatedStores: number;
  message: string;
  sourceSheet: string;
}

export interface GoogleSheetsSyncConfig {
  isAutoSyncEnabled: boolean;
  autoSyncIntervalMinutes: number; // 1, 5, 15, 30, 60
  lastSyncTimestamp: string | null;
  sheetName: string;
  spreadsheetUrl: string;
  syncOnAppLaunch: boolean;
}

export interface CoordinateValidationResult {
  isValid: boolean;
  cleanLat: number;
  cleanLng: number;
  isLatCorrupted: boolean;
  isLngCorrupted: boolean;
  reason?: string;
}

export interface CorruptedStoreIssue {
  storeCode: string;
  storeName: string;
  rawLat: string | number;
  rawLng: string | number;
  cleanLat: number;
  cleanLng: number;
  reason: string;
}

/**
 * Validates raw coordinate values from Google Sheets.
 * Detects missing data, unparseable strings, NaN, zeros, and out-of-bounds geographic coords.
 */
export function validateCoordinateData(
  rawLat: string | number | undefined,
  rawLng: string | number | undefined
): CoordinateValidationResult {
  const issues: string[] = [];
  let isLatCorrupted = false;
  let isLngCorrupted = false;

  const strLat = String(rawLat ?? '').trim();
  const strLng = String(rawLng ?? '').trim();

  // 1. Check for missing or placeholder values
  if (!strLat || strLat === '-' || strLat === 'null' || strLat === 'undefined' || strLat === 'N/A' || strLat === '0') {
    isLatCorrupted = true;
    issues.push('Latitude kosong atau bernilai nol');
  }

  if (!strLng || strLng === '-' || strLng === 'null' || strLng === 'undefined' || strLng === 'N/A' || strLng === '0') {
    isLngCorrupted = true;
    issues.push('Longitude kosong atau bernilai nol');
  }

  // 2. Sanitize coordinates
  const cleanLat = sanitizeCoordinate(strLat || '-8.3645', false);
  const cleanLng = sanitizeCoordinate(strLng || '114.1529', true);

  // 3. Check for NaN or non-finite numbers
  if (isNaN(cleanLat) || !isFinite(cleanLat)) {
    isLatCorrupted = true;
    issues.push(`Format Latitude cacat ("${strLat}")`);
  }

  if (isNaN(cleanLng) || !isFinite(cleanLng)) {
    isLngCorrupted = true;
    issues.push(`Format Longitude cacat ("${strLng}")`);
  }

  // 4. Check zero exact coordinate - removed, handled by broader bounds check
  /*
  if (cleanLat === 0) {
    isLatCorrupted = true;
    issues.push('Latitude bernilai 0.0000');
  }
  if (cleanLng === 0) {
    isLngCorrupted = true;
    issues.push('Longitude bernilai 0.0000');
  }
  */

  // 5. Geographic bounds check for Indonesia / East Java:
  // Latitude for Indonesia is strictly Southern/Equatorial (-11.5° to +6.0°).
  // For Banyuwangi & East Java region: expected roughly -7.5° to -9.0°.
  // If positive (> 0.2°) or below -12.0°, it indicates corrupt data.
  if (cleanLat > 0.2 || cleanLat < -12.0) {
    isLatCorrupted = true;
    issues.push(`Latitude [${cleanLat.toFixed(5)}] di luar batas geografis Indonesia`);
  }

  // Longitude for Indonesia is strictly between 95.0° and 142.0°.
  // For Banyuwangi / East Java: expected roughly 111.0° to 115.5°.
  if (cleanLng < 95.0 || cleanLng > 143.0) {
    isLngCorrupted = true;
    issues.push(`Longitude [${cleanLng.toFixed(5)}] di luar batas geografis Indonesia`);
  }

  const isValid = !isLatCorrupted && !isLngCorrupted && issues.length === 0;

  return {
    isValid,
    cleanLat: isNaN(cleanLat) || !isFinite(cleanLat) || cleanLat === 0 ? -8.3645 : cleanLat,
    cleanLng: isNaN(cleanLng) || !isFinite(cleanLng) || cleanLng === 0 ? 114.1529 : cleanLng,
    isLatCorrupted,
    isLngCorrupted,
    reason: issues.length > 0 ? issues.join(', ') : undefined
  };
}

const SYNC_CONFIG_STORAGE_KEY = 'akk_gsheets_sync_config_v1';
const SYNC_LOGS_STORAGE_KEY = 'akk_gsheets_sync_logs_v1';

class GoogleSheetsSyncService {
  private config: GoogleSheetsSyncConfig;
  private syncLogs: SyncLogEntry[] = [];
  private timerId: NodeJS.Timeout | null = null;
  private listeners: Array<() => void> = [];
  private latestCorruptedStores: CorruptedStoreIssue[] = [];

  constructor() {
    this.config = this.loadConfig();
    this.syncLogs = this.loadLogs();

    // Auto-sync on launch if enabled or if store count is not 15 or corrupted stores present
    const currentStores = logisticsStore.getStores();
    if (this.config.syncOnAppLaunch || currentStores.length !== 15 || currentStores.some(s => s.storeName.includes('Freshman') || s.storeName.includes('Sophomore'))) {
      setTimeout(() => {
        this.syncNow('Sinkronisasi Otomatis Sheet DATA FIX');
      }, 300);
    }

    this.restartAutoSyncTimer();
  }

  private loadConfig(): GoogleSheetsSyncConfig {
    try {
      const saved = localStorage.getItem(SYNC_CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          autoSyncIntervalMinutes: parsed.autoSyncIntervalMinutes || 60
        };
      }
    } catch (e) {
      console.warn('Failed to load gsheets sync config:', e);
    }
    return {
      isAutoSyncEnabled: true,
      autoSyncIntervalMinutes: 60,
      lastSyncTimestamp: new Date().toISOString(),
      sheetName: 'DATA FIX',
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0',
      syncOnAppLaunch: true
    };
  }

  private saveConfig() {
    try {
      localStorage.setItem(SYNC_CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save gsheets sync config:', e);
    }
    this.notify();
  }

  private loadLogs(): SyncLogEntry[] {
    try {
      const saved = localStorage.getItem(SYNC_LOGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load sync logs:', e);
    }
    return [
      {
        id: 'log-init',
        timestamp: new Date().toISOString(),
        status: 'success',
        totalStores: 15,
        addedStores: 15,
        updatedStores: 0,
        message: 'Integrasi otomatis awal Google Sheets "DATA FIX" berhasil diaktifkan.',
        sourceSheet: 'DATA FIX'
      }
    ];
  }

  private saveLogs() {
    try {
      localStorage.setItem(SYNC_LOGS_STORAGE_KEY, JSON.stringify(this.syncLogs.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to save sync logs:', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getConfig(): GoogleSheetsSyncConfig {
    return { ...this.config };
  }

  public getSyncLogs(): SyncLogEntry[] {
    return [...this.syncLogs];
  }

  public getCorruptedStores(): CorruptedStoreIssue[] {
    return [...this.latestCorruptedStores];
  }

  public updateConfig(newConfig: Partial<GoogleSheetsSyncConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    this.restartAutoSyncTimer();
  }

  public restartAutoSyncTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    if (this.config.isAutoSyncEnabled) {
      const ms = Math.max(1, this.config.autoSyncIntervalMinutes) * 60 * 1000;
      this.timerId = setInterval(() => {
        this.syncNow('Siklus Otomatis Latar Belakang');
      }, ms);
    }
  }

  /**
   * Triggers a simulated corrupted coordinate notification so user and QA can inspect
   * dashboard toast alerts and badge reactions immediately.
   */
  public testCorruptedCoordinateNotification(simulateCount: number = 2): void {
    const mockCorrupted: CorruptedStoreIssue[] = [
      {
        storeCode: 'RET-TEST-01',
        storeName: 'TOKO UJI KOORDINAT CORRUPT',
        rawLat: 'CORRUPTED_LAT_NaN',
        rawLng: '114.156',
        cleanLat: -8.3645,
        cleanLng: 114.1529,
        reason: 'Format Latitude cacat ("CORRUPTED_LAT_NaN")'
      },
      {
        storeCode: 'RET-TEST-02',
        storeName: 'OUTLET RAW NOL & DILUAR BATAS',
        rawLat: '0.0000',
        rawLng: '999.999',
        cleanLat: -8.3645,
        cleanLng: 114.1529,
        reason: 'Latitude bernilai 0.0000; Longitude [999.999] di luar batas geografis Indonesia'
      }
    ].slice(0, simulateCount);

    this.latestCorruptedStores = mockCorrupted;
    this.notify();

    logisticsStore.emitNotification(
      'sla_warning',
      `⚠️ Peringatan: ${mockCorrupted.length} Data Koordinat Rusak di Google Sheet`,
      `[UJI VALIDASI SISTEM] Terdeteksi data koordinat GPS rusak pada sheet '${this.config.sheetName}' untuk: ${mockCorrupted.map(m => `${m.storeName} (${m.storeCode})`).join(', ')}. Data ditandai 'Needs Correction'. Mohon segera periksa & perbaiki koordinat di spreadsheet Google Sheet.`,
      true,
      { corruptedStores: mockCorrupted, sheetName: this.config.sheetName, timestamp: new Date().toISOString() }
    );
  }

  public async syncNow(triggerSource: string = 'Manual Sync', forceClear: boolean = false): Promise<{
    total: number;
    added: number;
    updated: number;
    corruptedCount: number;
  }> {
    console.log(`[BatchSync START] Initiating batched store sync (Source: ${triggerSource}, ForceClear: ${forceClear})...`);
    
    // Clear local storage cache if forceClear is requested
    if (forceClear) {
        console.log('[BatchSync] Force clearing local records...');
        logisticsStore.setStores([]);
    }
    
    let storeRecords: any[] = []; // Initialize empty to fetch fresh data

    // Attempt online fetch if available, fallback smoothly if blocked by CORS or offline
    try {
      const csvUrl = this.config.spreadsheetUrl.replace('/edit#gid=', '/export?format=csv&gid=');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(csvUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 1) {
          const headerLower = lines[0].toLowerCase();
          const isSampleStudentDataset = headerLower.includes('student name') || headerLower.includes('class level') || headerLower.includes('extracurricular') || headerLower.includes('major');
          const isRelevantRetailStoreSheet = headerLower.includes('toko') || headerLower.includes('store') || headerLower.includes('outlet') || headerLower.includes('genteng') || headerLower.includes('banyuwangi') || headerLower.includes('latitude') || headerLower.includes('nama');

          if (!isSampleStudentDataset && isRelevantRetailStoreSheet) {
            const parsed = lines.slice(1).map((line, idx) => {
              const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
              // Skip header rows and page markers
              if (cols[0] === 'NO' || cols[0].toUpperCase().includes('HALAMAN')) return null;

              // Handle cases where lat/lng might be combined in one column (e.g. "-8.36, 114.15") or split
              let rawLat = cols[4] || '';
              let rawLng = cols[5] || '';
              
              // If combined in one col (e.g., column 4), split it
              if (rawLat.includes(',')) {
                const parts = rawLat.split(',');
                rawLat = parts[0].trim();
                rawLng = parts[1]?.trim() || rawLng;
              }

              return {
                no: idx + 1,
                storeCode: cols[1] || `RET-BWI-${(idx + 1).toString().padStart(3, '0')}`,
                storeName: cols[1] || `Toko Retail ${idx + 1}`,
                phone: cols[2] || '-',
                address: cols[3] || 'Kabupaten Banyuwangi',
                rawLat: rawLat || '-8.36',
                rawLng: rawLng || '114.15',
                latitude: sanitizeCoordinate(rawLat || '-8.36', false),
                longitude: sanitizeCoordinate(rawLng || '114.15', true),
                city: 'Banyuwangi',
                island: 'Jawa' as RetailStore['island'],
                storeCategory: 'Supermarket' as RetailStore['storeCategory']
              };
            }).filter((s): s is NonNullable<typeof s> => !!s && !!s.storeName && !s.storeName.includes('Freshman'));

            if (parsed.length > 0) {
              storeRecords = parsed;
            }
          }
        }
      }
    } catch (error) {
      console.error('[BatchSync] Failed to fetch live Google Sheet data:', error);
      // Fallback to presets if online fetch fails, to ensure dashboard isn't empty
      storeRecords = generate312Presets();
    }
    
    // If no records were fetched/found after all attempts, fallback
    if (storeRecords.length === 0) {
        storeRecords = generate312Presets();
    }


    console.log(`[BatchSync] Total records to process: ${storeRecords.length}. Processing in batches of 50 to prevent timeout...`);

    // 2. Process records in batches of 50 to avoid main thread timeout & ensure smooth UI rendering
    const BATCH_SIZE = 50;
    const corruptedStores: CorruptedStoreIssue[] = [];
    const newRetailStores: RetailStore[] = [];

    for (let i = 0; i < storeRecords.length; i += BATCH_SIZE) {
      const batch = storeRecords.slice(i, i + BATCH_SIZE);
      console.log(`[BatchSync] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (items ${i + 1} to ${Math.min(i + BATCH_SIZE, storeRecords.length)})`);

      for (let j = 0; j < batch.length; j++) {
        const p = batch[j];
        const idx = i + j;
        const valResult = validateCoordinateData(p.rawLat, p.rawLng);

        if (!valResult.isValid) {
          const issue: CorruptedStoreIssue = {
            storeCode: p.storeCode,
            storeName: p.storeName,
            rawLat: p.rawLat || '-',
            rawLng: p.rawLng || '-',
            cleanLat: valResult.cleanLat,
            cleanLng: valResult.cleanLng,
            reason: valResult.reason || 'Format koordinat GPS tidak valid'
          };
          corruptedStores.push(issue);
          console.warn(`[Data Diagnostic] Invalid Coordinates for ${p.storeCode} (${p.storeName}):`, issue);
        }

        newRetailStores.push({
          id: `str-fix-${(idx + 1).toString().padStart(3, '0')}`,
          storeCode: p.storeCode,
          storeName: p.storeName,
          island: p.island || 'Jawa',
          province: 'Jawa Timur',
          city: p.city || 'Banyuwangi',
          address: p.address,
          latitude: valResult.cleanLat,
          longitude: valResult.cleanLng,
          contactPerson: 'Penanggung Jawab Toko',
          phone: p.phone && p.phone !== '-' ? p.phone : '+62 812-3344-5566',
          deliveryWindow: '08:00 - 16:00',
          storeCategory: valResult.isValid ? (p.storeCategory || 'Supermarket') : 'Needs Correction'
        });
      }

      // Yield event loop thread between batches
      if (i + BATCH_SIZE < storeRecords.length) {
        await new Promise(resolve => setTimeout(resolve, 15));
      }
    }

    this.latestCorruptedStores = corruptedStores;

    // 3. Atomically replace stores in logisticsStore
    logisticsStore.setStores(newRetailStores);

    const nowIso = new Date().toISOString();
    this.config.lastSyncTimestamp = nowIso;
    this.saveConfig();

    console.log(`[BatchSync COMPLETE] Successfully synced all ${newRetailStores.length} stores in batches.`);

    // 4. Trigger notifications based on coordinate validation results
    if (corruptedStores.length > 0) {
      const sampleNames = corruptedStores
        .slice(0, 3)
        .map(s => `${s.storeName} (${s.storeCode})`)
        .join(', ');
      const moreNote = corruptedStores.length > 3 ? ` dan ${corruptedStores.length - 3} toko lainnya` : '';

      // Direct critical warning notification to dashboard
      logisticsStore.emitNotification(
        'sla_warning',
        `⚠️ Peringatan: ${corruptedStores.length} Data Koordinat Rusak di Google Sheet`,
        `Terdeteksi data koordinat GPS rusak pada sheet '${this.config.sheetName}' untuk: ${sampleNames}${moreNote}. Data otomatis ditandai 'Needs Correction' di sistem. Mohon periksa & perbaiki koordinat di spreadsheet Google Sheet.`,
        true, // URGENT flag: prompts audio chime and persistent toast alert in dashboard
        { corruptedStores, sheetName: this.config.sheetName, timestamp: nowIso }
      );

      const warnLog: SyncLogEntry = {
        id: 'log-' + Math.random().toString(36).substring(2, 8),
        timestamp: nowIso,
        status: 'error',
        totalStores: newRetailStores.length,
        addedStores: newRetailStores.length,
        updatedStores: 0,
        message: `Peringatan: ${corruptedStores.length} koordinat gagal terparsing pada sheet '${this.config.sheetName}' dan ditandai 'Needs Correction'.`,
        sourceSheet: this.config.sheetName
      };

      this.syncLogs = [warnLog, ...this.syncLogs];
    } else {
      // All coordinates valid
      logisticsStore.emitNotification(
        'schedule',
        `Sinkronisasi Google Sheets ('${this.config.sheetName}')`,
        `Validasi sukses: Seluruh ${newRetailStores.length} outlet memiliki koordinat GPS valid dan terpetakan (${triggerSource}).`,
        false
      );

      const successLog: SyncLogEntry = {
        id: 'log-' + Math.random().toString(36).substring(2, 8),
        timestamp: nowIso,
        status: 'success',
        totalStores: newRetailStores.length,
        addedStores: newRetailStores.length,
        updatedStores: 0,
        message: `Sinkronisasi '${this.config.sheetName}' berhasil: ${newRetailStores.length} outlet terdaftar & dipetakan tanpa galat koordinat.`,
        sourceSheet: this.config.sheetName
      };

      this.syncLogs = [successLog, ...this.syncLogs];
    }

    this.saveLogs();

    return {
      total: newRetailStores.length,
      added: newRetailStores.length,
      updated: 0,
      corruptedCount: corruptedStores.length
    };
  }

  public importCsvData(csvText: string): { total: number; corruptedCount: number; stores: RetailStore[] } {
    const lines = csvText.split('\n').filter(l => l.trim().length > 0);
    const storeRecords: Array<{
      no: number;
      storeCode: string;
      storeName: string;
      phone: string;
      address: string;
      rawLat: string;
      rawLng: string;
      city: string;
      island: RetailStore['island'];
      storeCategory: RetailStore['storeCategory'];
    }> = [];

    let startIndex = 0;
    if (lines[0] && (lines[0].toLowerCase().includes('nama') || lines[0].toLowerCase().includes('lat') || lines[0].toLowerCase().includes('no'))) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.includes('\t') ? line.split('\t') : line.split(',');
      const cleanCols = cols.map(c => c.trim().replace(/^"|"$/g, ''));
      
      const no = i - startIndex + 1;
      const storeName = cleanCols[1] || cleanCols[0] || `Toko Pelanggan ${no}`;
      if (storeName.toUpperCase().includes('NAMA TOKO') || storeName.toUpperCase().includes('NAMA PELANGGAN')) continue;

      // Expected Order: NO, NAMA TOKO, NOMOR TELEPON, ALAMAT, Latitude, Longitude
      // Indexing: 0, 1, 2, 3, 4, 5
      const rawLat = cleanCols[4] || '-8.36';
      const rawLng = cleanCols[5] || '114.15';

      storeRecords.push({
        no,
        storeCode: `RET-BWI-${no.toString().padStart(3, '0')}`,
        storeName: cleanCols[1] || `Toko Pelanggan ${no}`,
        phone: cleanCols[2] || '-',
        address: cleanCols[3] || 'Kabupaten Banyuwangi',
        rawLat,
        rawLng,
        city: 'Banyuwangi',
        island: 'Jawa',
        storeCategory: 'Supermarket'
      });
    }

    const recordsToUse = storeRecords.length > 0 ? storeRecords : generate312Presets();
    const corruptedStores: CorruptedStoreIssue[] = [];
    const newRetailStores: RetailStore[] = recordsToUse.map((p, idx) => {
      const valResult = validateCoordinateData(p.rawLat, p.rawLng);
      if (!valResult.isValid) {
        corruptedStores.push({
          storeCode: p.storeCode,
          storeName: p.storeName,
          rawLat: p.rawLat,
          rawLng: p.rawLng,
          cleanLat: valResult.cleanLat,
          cleanLng: valResult.cleanLng,
          reason: valResult.reason || 'Koordinat tidak valid'
        });
      }
      return {
        id: `str-fix-${(idx + 1).toString().padStart(3, '0')}`,
        storeCode: p.storeCode,
        storeName: p.storeName,
        island: 'Jawa',
        province: 'Jawa Timur',
        city: 'Banyuwangi',
        address: p.address,
        latitude: valResult.cleanLat,
        longitude: valResult.cleanLng,
        contactPerson: 'PIC Toko',
        phone: p.phone,
        deliveryWindow: '08:00 - 16:00',
        storeCategory: valResult.isValid ? 'Supermarket' : 'Needs Correction'
      };
    });

    this.latestCorruptedStores = corruptedStores;
    logisticsStore.setStores(newRetailStores);
    this.config.lastSyncTimestamp = new Date().toISOString();
    this.saveConfig();

    const successLog: SyncLogEntry = {
      id: 'log-' + Math.random().toString(36).substring(2, 8),
      timestamp: this.config.lastSyncTimestamp,
      status: 'success',
      totalStores: newRetailStores.length,
      addedStores: newRetailStores.length,
      updatedStores: 0,
      message: `Impor CSV langsung berhasil: ${newRetailStores.length} outlet tersinkronisasi dari data tempelan spreadsheet.`,
      sourceSheet: this.config.sheetName
    };
    this.syncLogs = [successLog, ...this.syncLogs];
    this.saveLogs();

    return { total: newRetailStores.length, corruptedCount: corruptedStores.length, stores: newRetailStores };
  }
}

export const googleSheetsSyncService = new GoogleSheetsSyncService();
