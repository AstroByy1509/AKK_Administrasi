import { logisticsStore } from './store';
import { Schedule, ShipmentStatus, RetailStore } from '../types';
import { 
  scheduleImportValidator, 
  ValidatedImportItem, 
  ValidationSummaryReport, 
  ImportSyncOptions 
} from './scheduleImportValidator';
import { standardizeAreaName } from '../utils/areaNormalizer';

export interface GoogleSpreadsheetMetadata {
  title: string;
  sheets: Array<{
    sheetId: number;
    title: string;
    rowCount?: number;
    columnCount?: number;
  }>;
}

export interface ParsedSheetTrip {
  poNumber?: string;
  driver: string;
  helper?: string;
  helper2?: string;
  rawArea?: string;
  area: string;
  armada: string;
  dateStr?: string;
  dayName?: string;
  target?: string;
  notes?: string;
  backup?: string;
}

export interface GoogleSheetsSyncConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  selectedSheetTitle: string;
  range: string;
  isAutoSyncEnabled: boolean;
  autoSyncIntervalMinutes: number; // 5, 15, 30, 60
  lastSyncTimestamp: string | null;
  lastSyncStatus: 'success' | 'error' | 'idle' | 'in_progress';
  lastSyncMessage: string | null;
  totalSyncedCount: number;
}

const STORAGE_KEY = 'akk_google_sheets_schedule_sync_config';

export const googleSheetsApiService = {
  /**
   * Extract spreadsheet ID from various URL formats or returns raw ID.
   * e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
   */
  extractSpreadsheetId(input: string): string {
    if (!input) return '';
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // Return clean input if already an ID
    return trimmed.split('/')[0].split('?')[0];
  },

  /**
   * Get default or stored configuration
   */
  getConfig(): GoogleSheetsSyncConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load Google Sheets config:', e);
    }

    return {
      spreadsheetId: '',
      spreadsheetUrl: '',
      selectedSheetTitle: 'ALL',
      range: 'A1:Z100',
      isAutoSyncEnabled: false,
      autoSyncIntervalMinutes: 15,
      lastSyncTimestamp: null,
      lastSyncStatus: 'idle',
      lastSyncMessage: null,
      totalSyncedCount: 0
    };
  },

  /**
   * Save configuration
   */
  saveConfig(config: GoogleSheetsSyncConfig): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save Google Sheets config:', e);
    }
  },

  /**
   * Fetch spreadsheet metadata using Google Sheets v4 API
   */
  async getSpreadsheetMetadata(spreadsheetId: string, accessToken: string): Promise<GoogleSpreadsheetMetadata> {
    const cleanId = this.extractSpreadsheetId(spreadsheetId);
    if (!cleanId) throw new Error('ID Spreadsheet tidak valid.');

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=properties.title,sheets.properties(sheetId,title,gridProperties)`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal mengambil metadata spreadsheet (HTTP ${response.status})`);
    }

    const data = await response.json();
    return {
      title: data.properties?.title || 'Google Spreadsheet',
      sheets: (data.sheets || []).map((s: any) => ({
        sheetId: s.properties?.sheetId,
        title: s.properties?.title,
        rowCount: s.properties?.gridProperties?.rowCount,
        columnCount: s.properties?.gridProperties?.columnCount
      }))
    };
  },

  /**
   * Fetch cell values from a specified range
   */
  async getSheetValues(spreadsheetId: string, range: string, accessToken: string): Promise<any[][]> {
    const cleanId = this.extractSpreadsheetId(spreadsheetId);
    if (!cleanId) throw new Error('ID Spreadsheet tidak valid.');

    const encodedRange = encodeURIComponent(range);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodedRange}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Gagal membaca sel dari Google Sheets (HTTP ${response.status})`);
    }

    const data = await response.json();
    return data.values || [];
  },

  /**
   * Parse rows from Sheet "ALL" or general tabular schedule
   */
  parseScheduleRows(rows: any[][], customAreaMapping?: Record<string, string>): ParsedSheetTrip[] {
    const trips: ParsedSheetTrip[] = [];
    if (!rows || rows.length === 0) return trips;

    // Check if format is raw Sheet "ALL" (column headers like DRIVER, HELPER, AREA, ARMADA)
    // Or standard 2D table
    let driverCol = -1;
    let helperCol = -1;
    let helper2Col = -1;
    let areaCol = -1;
    let armadaCol = -1;
    let dateCol = -1;
    let targetCol = -1;
    let poCol = -1;
    let headerRowIdx = -1;

    // Search header row across first 10 rows
    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r];
      if (!row) continue;

      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] || '').toUpperCase().trim();
        if (val === 'DRIVER' || val === 'SUPIR') driverCol = c;
        if (val === 'HELPER' || val === 'KERNET') {
          helperCol = c;
          // Check if next column in same or sub-row is Helper 2
          if (c + 1 < row.length && (String(row[c + 1] || '').trim() === '2' || String(row[c + 1] || '').trim() === '')) {
            helper2Col = c + 1;
          }
        }
        if (val === '1' && helperCol === -1 && c > 1) {
          helperCol = c;
          if (c + 1 < row.length) helper2Col = c + 1;
        }
        if (val.includes('AREA') || val.includes('TUJUAN') || val.includes('RUTE')) areaCol = c;
        if (val === 'ARMADA' || val === 'MOBIL' || val === 'PLAT') armadaCol = c;
        if (val.includes('TANGGAL') || val.includes('DATE') || val.includes('HARI')) dateCol = c;
        if (val.includes('TARGET') || val.includes('JAM') || val.includes('BACKUP')) targetCol = c;
        if (val === 'PO' || val === 'NO PO' || val === 'NOMOR PO' || val === 'NO RESI' || val === 'RESI' || val === 'NO SJ' || val === 'SURAT JALAN' || val === 'INVOICE') poCol = c;
      }

      if (driverCol !== -1 && areaCol !== -1) {
        headerRowIdx = r;
        // If dateCol wasn't found on the driver header row, look in previous rows (e.g. Row 3 has "Tanggal" in Col 0)
        if (dateCol === -1) {
          for (let pr = 0; pr < r; pr++) {
            const prevRow = rows[pr];
            if (!prevRow) continue;
            for (let pc = 0; pc < prevRow.length; pc++) {
              const pVal = String(prevRow[pc] || '').toUpperCase().trim();
              if (pVal.includes('TANGGAL') || pVal.includes('DATE')) {
                dateCol = pc;
                break;
              }
            }
          }
          if (dateCol === -1) dateCol = 0; // Default to Column A
        }

        // If helperCol wasn't found on driver row, check row above for "Helper"
        if (helperCol === -1) {
          for (let pr = 0; pr < r; pr++) {
            const prevRow = rows[pr];
            if (!prevRow) continue;
            for (let pc = 0; pc < prevRow.length; pc++) {
              const pVal = String(prevRow[pc] || '').toUpperCase().trim();
              if (pVal === 'HELPER') {
                helperCol = pc;
                helper2Col = pc + 1;
                break;
              }
            }
          }
          if (helperCol === -1 && driverCol !== -1 && areaCol !== -1 && areaCol > driverCol + 1) {
            helperCol = driverCol + 1;
            if (areaCol > driverCol + 2) helper2Col = driverCol + 2;
          }
        }
        break;
      }
    }

    if (driverCol !== -1 && areaCol !== -1 && headerRowIdx !== -1) {
      // Found structured header!
      let lastInheritedDate = '';
      let emptyCount = 0;

      for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const rowData = rows[i];
        if (!rowData || rowData.length === 0) {
          emptyCount++;
          if (emptyCount >= 3) break; // End of filled data section
          continue;
        }

        const driver = String(rowData[driverCol] || '').trim();
        const area = String(rowData[areaCol] || '').trim();
        const armada = armadaCol !== -1 ? String(rowData[armadaCol] || '').trim() : '-';

        // Check if row is empty
        if (!driver && !area) {
          emptyCount++;
          if (emptyCount >= 3) break;
          continue;
        }
        emptyCount = 0;

        // Skip headers or sub-headers
        if (
          driver.toUpperCase() === 'DRIVER' || 
          driver.toUpperCase() === 'SUPIR' || 
          area.toUpperCase() === 'AREA' || 
          area.toUpperCase() === 'AREA KIRIM' ||
          driver === '1' || 
          driver === '2'
        ) {
          continue;
        }

        // Check date with merged cell inheritance
        let rawDate = dateCol !== -1 ? String(rowData[dateCol] || '').trim() : '';
        if (
          rawDate && 
          rawDate !== '-' && 
          !rawDate.toUpperCase().includes('TANGGAL') && 
          !rawDate.toUpperCase().includes('JANUARI') &&
          rawDate !== '0'
        ) {
          lastInheritedDate = rawDate;
        }
        const effectiveDateStr = rawDate || lastInheritedDate || '1/5/2026';

        // Helper 1 and Helper 2
        const rawHelper1 = helperCol !== -1 ? String(rowData[helperCol] || '').trim() : undefined;
        const rawHelper2 = helper2Col !== -1 ? String(rowData[helper2Col] || '').trim() : undefined;
        
        const helper1Clean = (rawHelper1 && rawHelper1 !== '-' && rawHelper1 !== '0') ? rawHelper1 : undefined;
        const helper2Clean = (rawHelper2 && rawHelper2 !== '-' && rawHelper2 !== '0') ? rawHelper2 : undefined;

        // Combine for display or preserve helper2
        const combinedHelper = helper1Clean && helper2Clean 
          ? `${helper1Clean}, ${helper2Clean}` 
          : (helper1Clean || helper2Clean || undefined);

        const target = targetCol !== -1 ? String(rowData[targetCol] || '').trim() : undefined;
        const poNumber = poCol !== -1 ? String(rowData[poCol] || '').trim() : undefined;

        if (driver && driver !== '-' && area && area !== '-') {
          const standardizedArea = (customAreaMapping && customAreaMapping[area]) || standardizeAreaName(area);
          trips.push({
            driver,
            helper: combinedHelper,
            helper2: helper2Clean,
            rawArea: area,
            area: standardizedArea,
            armada: armada || 'Truk Reguler',
            target,
            dateStr: effectiveDateStr,
            poNumber: poNumber && poNumber !== '-' ? poNumber : undefined
          });
        }
      }

      return trips;
    }

    // Fallback: Scan every row for lines that look like delivery assignments (has driver + area + armada)
    rows.forEach((row, rowIdx) => {
      if (!row || row.length < 3) return;
      const rowStr = row.join(' ').toUpperCase();
      if (rowStr.includes('CHECKER SO') || rowStr.includes('FORMASI GUDANG') || rowStr.includes('PENGIRIMAN OFF')) {
        return;
      }

      // Check first 6 columns
      for (let c = 0; c < row.length - 2; c++) {
        const potentialDriver = String(row[c] || '').trim();
        const potentialHelper = String(row[c + 1] || '').trim();
        const potentialArea = String(row[c + 2] || '').trim();
        const potentialArmada = String(row[c + 3] || '').trim();

        if (
          potentialDriver.length >= 3 && 
          !potentialDriver.includes('MINGGU') && 
          !potentialDriver.includes('JANUARI') &&
          potentialArea.length >= 3 && 
          potentialArmada.length >= 2
        ) {
          const standardizedArea = (customAreaMapping && customAreaMapping[potentialArea]) || standardizeAreaName(potentialArea);
          trips.push({
            driver: potentialDriver,
            helper: potentialHelper !== '-' ? potentialHelper : undefined,
            rawArea: potentialArea,
            area: standardizedArea,
            armada: potentialArmada,
            notes: `Row ${rowIdx + 1}`
          });
          break;
        }
      }
    });

    return trips;
  },

  /**
   * Validate trips batch with duplicate and format checks
   */
  validateTrips(trips: ParsedSheetTrip[], defaultDate?: Date, customAreaMapping?: Record<string, string>): ValidationSummaryReport {
    return scheduleImportValidator.validateImportBatch(trips, defaultDate, customAreaMapping);
  },

  /**
   * Sync live Google Sheet data directly to logisticsStore with full validation
   */
  async syncToOperationalSchedule(
    spreadsheetId: string,
    sheetTitle: string,
    accessToken: string,
    options: ImportSyncOptions = { skipDuplicates: true, overwriteDuplicates: false, skipInvalid: true }
  ): Promise<{ 
    syncedCount: number; 
    skippedDuplicateCount: number;
    skippedInvalidCount: number;
    overwrittenCount: number;
    message: string;
    validationReport: ValidationSummaryReport;
  }> {
    const range = `${sheetTitle}!A1:Z150`;
    const rows = await this.getSheetValues(spreadsheetId, range, accessToken);
    const trips = this.parseScheduleRows(rows, options.customAreaMapping);

    if (trips.length === 0) {
      throw new Error(`Tidak ditemukan data baris pengiriman yang valid pada Sheet "${sheetTitle}". Pastikan kolom DRIVER, HELPER, AREA, dan ARMADA tersedia.`);
    }

    // Run validation mechanism
    const validationReport = scheduleImportValidator.validateImportBatch(trips, options.defaultDate || new Date(), options.customAreaMapping);

    // Execute sync using validated items
    const syncResult = scheduleImportValidator.syncValidatedItems(validationReport.items, options);

    // Update config sync status
    const currentConfig = this.getConfig();
    const summaryMsg = `Berhasil menyinkronkan ${syncResult.syncedCount} jadwal pengiriman (${syncResult.skippedDuplicateCount} duplikat dicegah, ${syncResult.skippedInvalidCount} baris tidak valid dilewati)`;
    
    this.saveConfig({
      ...currentConfig,
      lastSyncTimestamp: new Date().toISOString(),
      lastSyncStatus: 'success',
      lastSyncMessage: summaryMsg,
      totalSyncedCount: currentConfig.totalSyncedCount + syncResult.syncedCount
    });

    return {
      syncedCount: syncResult.syncedCount,
      skippedDuplicateCount: syncResult.skippedDuplicateCount,
      skippedInvalidCount: syncResult.skippedInvalidCount,
      overwrittenCount: syncResult.overwrittenCount,
      message: summaryMsg,
      validationReport
    };
  }
};
