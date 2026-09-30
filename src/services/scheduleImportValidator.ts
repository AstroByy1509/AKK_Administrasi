import { logisticsStore } from './store';
import { Schedule, RetailStore, Fleet, Crew } from '../types';
import { ParsedSheetTrip } from './googleSheetsApiService';
import { standardizeAreaName } from '../utils/areaNormalizer';

export type ValidationStatus = 
  | 'valid' 
  | 'duplicate_po' 
  | 'duplicate_assignment' 
  | 'invalid_po' 
  | 'invalid_date' 
  | 'missing_field';

export interface ValidationIssue {
  severity: 'error' | 'warning';
  field: 'poNumber' | 'date' | 'driver' | 'armada' | 'area' | 'duplicate';
  message: string;
}

export interface ValidatedImportItem {
  index: number;
  rowNumber: number;
  raw: ParsedSheetTrip;
  
  // Normalized attributes
  poNumber: string;
  departureDateIso: string;
  estimatedArrivalIso: string;
  dateDisplay: string;
  driverName: string;
  helperName?: string;
  areaName: string;
  armadaName: string;
  target?: string;
  
  // Validation status
  status: ValidationStatus;
  isValid: boolean;
  isDuplicate: boolean;
  duplicateDetails?: string;
  issues: ValidationIssue[];
}

export interface ValidationSummaryReport {
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  invalidPoCount: number;
  invalidDateCount: number;
  missingFieldCount: number;
  canSyncCount: number; // valid and non-blocking
  items: ValidatedImportItem[];
}

export interface ImportSyncOptions {
  skipDuplicates?: boolean;
  overwriteDuplicates?: boolean;
  skipInvalid?: boolean;
  defaultDate?: Date;
  customAreaMapping?: Record<string, string>;
}

const MONTH_MAP: Record<string, number> = {
  'JAN': 0, 'JANUARI': 0, 'JANUARY': 0,
  'FEB': 1, 'FEBRUARI': 1, 'FEBRUARY': 1,
  'MAR': 2, 'MARET': 2, 'MARCH': 2,
  'APR': 3, 'APRIL': 3,
  'MEI': 4, 'MAY': 4,
  'JUN': 5, 'JUNI': 5, 'JUNE': 5,
  'JUL': 6, 'JULI': 6, 'JULY': 6,
  'AGU': 7, 'AGUST': 7, 'AGUSTUS': 7, 'AUGUST': 7,
  'SEP': 8, 'SEPT': 8, 'SEPTEMBER': 8,
  'OKT': 9, 'OKTOBER': 9, 'OCTOBER': 9,
  'NOV': 10, 'NOPEMBER': 10, 'NOVEMBER': 10,
  'DES': 11, 'DESEMBER': 11, 'DECEMBER': 11
};

export const scheduleImportValidator = {
  /**
   * Parse Indonesian or international date string or Excel serial number into a valid Date object
   */
  parseDate(dateStr: string | number | undefined, fallbackDate: Date = new Date()): { date: Date | null; error?: string } {
    if (!dateStr) {
      return { date: fallbackDate };
    }

    // 1. Handle numeric Excel serial dates (e.g. 46026 for Jan 2026)
    if (typeof dateStr === 'number' || (!isNaN(Number(dateStr)) && Number(dateStr) > 30000 && Number(dateStr) < 70000)) {
      const serial = Number(dateStr);
      // Excel base date: 1899-12-30 (due to 1900 leap year bug)
      const msPerDay = 86400000;
      const parsedDate = new Date((serial - 25569) * msPerDay);
      if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() >= 2020 && parsedDate.getFullYear() <= 2035) {
        return { date: parsedDate };
      }
    }

    const clean = String(dateStr).trim();

    // 2. Check for Indonesian text dates like "05 Januari 2026" or "5 Jan 2026"
    const indoPattern = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i;
    const matchIndo = clean.match(indoPattern);
    if (matchIndo) {
      const day = parseInt(matchIndo[1], 10);
      const monthStr = matchIndo[2].toUpperCase();
      const year = parseInt(matchIndo[3], 10);

      const monthIdx = MONTH_MAP[monthStr];
      if (monthIdx !== undefined && day >= 1 && day <= 31 && year >= 2020 && year <= 2035) {
        const parsed = new Date(year, monthIdx, day, 7, 30, 0);
        return { date: parsed };
      }
    }

    // 3. Check for standard DD/MM/YYYY or DD-MM-YYYY
    const dmyPattern = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/;
    const matchDmy = clean.match(dmyPattern);
    if (matchDmy) {
      const day = parseInt(matchDmy[1], 10);
      const month = parseInt(matchDmy[2], 10) - 1;
      const year = parseInt(matchDmy[3], 10);

      if (month >= 0 && month <= 11 && day >= 1 && day <= 31 && year >= 2020 && year <= 2035) {
        const parsed = new Date(year, month, day, 7, 30, 0);
        return { date: parsed };
      }
    }

    // 4. Try native Date.parse
    const nativeParsed = new Date(clean);
    if (!isNaN(nativeParsed.getTime())) {
      const yr = nativeParsed.getFullYear();
      if (yr >= 2020 && yr <= 2035) {
        return { date: nativeParsed };
      }
    }

    return { 
      date: null, 
      error: `Format tanggal "${clean}" tidak valid. Format yang didukung: YYYY-MM-DD, DD/MM/YYYY, atau DD MMMM YYYY (contoh: 05 Januari 2026).` 
    };
  },

  /**
   * Validate PO Number or generate a sanitized standard tracking number
   */
  validatePoNumber(rawPo: string | undefined, defaultDate: Date, armada: string, seqIdx: number): { poNumber: string; isValid: boolean; error?: string } {
    const cleanArmada = (armada || 'FLT').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const dateStamp = defaultDate.toISOString().substring(0, 10).replace(/-/g, '');
    const defaultGenerated = `PO-AKK-${dateStamp}-${cleanArmada}-${String(seqIdx + 1).padStart(3, '0')}`;

    if (!rawPo || rawPo.trim() === '' || rawPo.trim() === '-' || rawPo.trim().toUpperCase() === 'N/A') {
      // Auto-generate standard PO if not provided
      return {
        poNumber: defaultGenerated,
        isValid: true
      };
    }

    const clean = rawPo.trim();

    // Check invalid placeholder patterns like "???", "NULL", "UNDEFINED", "INVALID"
    const invalidKeywords = ['???', 'NULL', 'UNDEFINED', 'INVALID', 'KOSONG', 'NAN', 'ERROR'];
    if (invalidKeywords.includes(clean.toUpperCase())) {
      return {
        poNumber: clean,
        isValid: false,
        error: `Nomor PO "${clean}" terdeteksi sebagai placeholder tidak valid.`
      };
    }

    // Must be 3 to 40 characters and alphanumeric with allowable separators (-, _, /, .)
    const validPoRegex = /^[A-Za-z0-9\-_./]{3,40}$/;
    if (!validPoRegex.test(clean)) {
      return {
        poNumber: clean,
        isValid: false,
        error: `Format nomor PO "${clean}" tidak valid (hanya boleh huruf, angka, tanda strip, garis miring, atau titik sepanjang 3-40 karakter).`
      };
    }

    return {
      poNumber: clean,
      isValid: true
    };
  },

  /**
   * Validate full batch of imported trips before syncing to operational schedules
   */
  validateImportBatch(
    trips: ParsedSheetTrip[], 
    defaultDate: Date = new Date(),
    customAreaMapping?: Record<string, string>
  ): ValidationSummaryReport {
    const existingSchedules = logisticsStore.getSchedules();

    // Track existing items in DB
    const existingPoMap = new Map<string, Schedule>();
    const existingDriverDateSet = new Set<string>(); // `${driver.toUpperCase()}_${YYYY-MM-DD}`

    existingSchedules.forEach(sch => {
      if (sch.trackingNumber) {
        existingPoMap.set(sch.trackingNumber.trim().toUpperCase(), sch);
      }
      if (sch.crew?.name && sch.departureDate) {
        const dateKey = sch.departureDate.substring(0, 10);
        existingDriverDateSet.add(`${sch.crew.name.trim().toUpperCase()}_${dateKey}`);
      }
    });

    // Track internal duplicates within this batch
    const batchPoCount = new Map<string, number>();
    const batchDriverDateSet = new Set<string>();

    const items: ValidatedImportItem[] = [];

    let duplicateCount = 0;
    let invalidPoCount = 0;
    let invalidDateCount = 0;
    let missingFieldCount = 0;
    let validCount = 0;

    trips.forEach((trip, idx) => {
      const issues: ValidationIssue[] = [];
      let status: ValidationStatus = 'valid';
      let isDuplicate = false;
      let duplicateDetails: string | undefined = undefined;

      // 1. Mandatory Fields Check (Driver, Area, Armada)
      const cleanDriver = (trip.driver || '').trim();
      const rawArea = (trip.area || '').trim();
      const cleanArea = (customAreaMapping && customAreaMapping[rawArea]) 
        ? customAreaMapping[rawArea] 
        : standardizeAreaName(rawArea);
      const cleanArmada = (trip.armada || '').trim();

      if (!cleanDriver || cleanDriver === '-' || cleanDriver.toUpperCase() === 'DRIVER') {
        issues.push({
          severity: 'error',
          field: 'driver',
          message: 'Nama driver / pengemudi wajib diisi.'
        });
        status = 'missing_field';
        missingFieldCount++;
      }

      if (!rawArea || rawArea === '-' || rawArea.toUpperCase() === 'AREA') {
        issues.push({
          severity: 'error',
          field: 'area',
          message: 'Tujuan area / lokasi pengiriman wajib diisi.'
        });
        if (status === 'valid') {
          status = 'missing_field';
          missingFieldCount++;
        }
      }

      // 2. Date Validation
      const { date: parsedDate, error: dateError } = this.parseDate(trip.dateStr, defaultDate);
      let depDateIso = defaultDate.toISOString();
      let arrDateIso = new Date(defaultDate.getTime() + 8.5 * 3600000).toISOString();
      let dateDisplay = defaultDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

      if (dateError || !parsedDate) {
        issues.push({
          severity: 'error',
          field: 'date',
          message: dateError || 'Tanggal pengiriman tidak valid.'
        });
        status = 'invalid_date';
        invalidDateCount++;
      } else {
        depDateIso = parsedDate.toISOString();
        const arr = new Date(parsedDate.getTime() + 8.5 * 3600000);
        arrDateIso = arr.toISOString();
        dateDisplay = parsedDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      }

      // 3. PO / Tracking Number Validation
      const effectiveDateForPo = parsedDate || defaultDate;
      const { poNumber: validatedPo, isValid: isPoFormatValid, error: poError } = this.validatePoNumber(
        trip.notes?.includes('PO-') ? trip.notes : undefined,
        effectiveDateForPo,
        cleanArmada,
        idx
      );

      if (!isPoFormatValid) {
        issues.push({
          severity: 'error',
          field: 'poNumber',
          message: poError || 'Format nomor PO tidak valid.'
        });
        status = 'invalid_po';
        invalidPoCount++;
      }

      // 4. Duplicate Check (PO Number)
      const poUpper = validatedPo.toUpperCase();
      if (existingPoMap.has(poUpper)) {
        isDuplicate = true;
        duplicateDetails = `Nomor PO "${validatedPo}" sudah terdaftar di sistem operasional (ID: ${existingPoMap.get(poUpper)?.id}).`;
        issues.push({
          severity: 'warning',
          field: 'duplicate',
          message: duplicateDetails
        });
        status = 'duplicate_po';
        duplicateCount++;
      } else if (batchPoCount.has(poUpper)) {
        isDuplicate = true;
        duplicateDetails = `Duplikat internal: Nomor PO "${validatedPo}" muncul lebih dari 1 kali dalam spreadsheet ini.`;
        issues.push({
          severity: 'warning',
          field: 'duplicate',
          message: duplicateDetails
        });
        status = 'duplicate_po';
        duplicateCount++;
      } else {
        batchPoCount.set(poUpper, 1);
      }

      // 5. Driver Assignment Conflict (Same Driver on Same Date)
      if (cleanDriver && parsedDate) {
        const dateKey = parsedDate.toISOString().substring(0, 10);
        const driverKey = `${cleanDriver.toUpperCase()}_${dateKey}`;

        if (existingDriverDateSet.has(driverKey)) {
          issues.push({
            severity: 'warning',
            field: 'driver',
            message: `Supir "${cleanDriver}" sudah memiliki penugasan pengiriman pada tanggal ${dateDisplay} di sistem operasional.`
          });
          if (status === 'valid') {
            status = 'duplicate_assignment';
            duplicateCount++;
          }
        } else if (batchDriverDateSet.has(driverKey)) {
          issues.push({
            severity: 'warning',
            field: 'driver',
            message: `Peringatan: Supir "${cleanDriver}" ditugaskan lebih dari sekali pada tanggal ${dateDisplay} dalam spreadsheet ini.`
          });
          if (status === 'valid') {
            status = 'duplicate_assignment';
            duplicateCount++;
          }
        } else {
          batchDriverDateSet.add(driverKey);
        }
      }

      const isValidItem = issues.filter(iss => iss.severity === 'error').length === 0;
      if (isValidItem && !isDuplicate && status === 'valid') {
        validCount++;
      }

      items.push({
        index: idx,
        rowNumber: idx + 1,
        raw: trip,
        poNumber: validatedPo,
        departureDateIso: depDateIso,
        estimatedArrivalIso: arrDateIso,
        dateDisplay,
        driverName: cleanDriver,
        helperName: trip.helper && trip.helper !== '-' ? trip.helper.trim() : undefined,
        areaName: cleanArea,
        armadaName: cleanArmada || 'Truk Reguler',
        target: trip.target,
        status,
        isValid: isValidItem,
        isDuplicate,
        duplicateDetails,
        issues
      });
    });

    const canSyncCount = items.filter(it => it.isValid && !it.isDuplicate).length;

    return {
      totalRows: trips.length,
      validCount,
      duplicateCount,
      invalidPoCount,
      invalidDateCount,
      missingFieldCount,
      canSyncCount,
      items
    };
  },

  /**
   * Sync validated items into logisticsStore safely with filtering options
   */
  syncValidatedItems(
    validatedItems: ValidatedImportItem[],
    options: ImportSyncOptions = {}
  ): {
    syncedCount: number;
    skippedDuplicateCount: number;
    skippedInvalidCount: number;
    overwrittenCount: number;
    errors: string[];
  } {
    const {
      skipDuplicates = true,
      overwriteDuplicates = false,
      skipInvalid = true
    } = options;

    const currentStores = logisticsStore.getStores();
    const currentFleets = logisticsStore.getFleets();
    const currentCrews = logisticsStore.getCrews();
    const existingSchedules = logisticsStore.getSchedules();

    let syncedCount = 0;
    let skippedDuplicateCount = 0;
    let skippedInvalidCount = 0;
    let overwrittenCount = 0;
    const errors: string[] = [];

    validatedItems.forEach(item => {
      // 1. Skip invalid formats (missing required field, corrupt date, corrupt PO)
      if (!item.isValid && skipInvalid) {
        skippedInvalidCount++;
        return;
      }

      // 2. Handle Duplicates
      if (item.isDuplicate) {
        if (skipDuplicates && !overwriteDuplicates) {
          skippedDuplicateCount++;
          return;
        }

        if (overwriteDuplicates) {
          // Find existing schedule by PO number
          const existing = existingSchedules.find(s => s.trackingNumber.toUpperCase() === item.poNumber.toUpperCase());
          if (existing) {
            logisticsStore.updateSchedule(existing.id, {
              departureDate: item.departureDateIso,
              estimatedArrival: item.estimatedArrivalIso,
              notes: `Diperbarui via Google Sheets Sync: Driver ${item.driverName}, Helper ${item.helperName || '-'}, Armada ${item.armadaName}`
            });
            overwrittenCount++;
            return;
          }
        }
      }

      // 3. Match Store, Fleet, Driver
      const effectiveAreaName = (options.customAreaMapping && options.customAreaMapping[item.raw.area]) || item.areaName;
      const areaUpper = effectiveAreaName.toUpperCase();
      let matchedStore = currentStores.find(s => 
        s.storeName.toUpperCase() === areaUpper ||
        s.city.toUpperCase() === areaUpper ||
        areaUpper.includes(s.city.toUpperCase()) || 
        areaUpper.includes(s.storeName.toUpperCase())
      );
      if (!matchedStore) {
        matchedStore = currentStores[0] || {
          id: 'st-import-fallback',
          storeName: effectiveAreaName,
          storeCode: 'RET-' + effectiveAreaName.substring(0, 3).toUpperCase(),
          island: 'Jawa',
          province: 'Jawa Timur',
          city: effectiveAreaName,
          address: `Area Distribusi ${effectiveAreaName}`,
          latitude: -8.219,
          longitude: 114.369,
          contactPerson: 'PIC Toko Area',
          phone: '0812-3456-7890',
          deliveryWindow: '08:00 - 17:00',
          storeCategory: 'Supermarket'
        } as RetailStore;
      }

      const matchedFleet = currentFleets.find(f => 
        (f.initialCode && item.armadaName.toUpperCase().includes(f.initialCode.toUpperCase())) ||
        item.armadaName.toUpperCase().includes(f.plateNumber.replace(/\s+/g, '').toUpperCase())
      ) || currentFleets[0];

      const matchedDriver = currentCrews.find(c => 
        c.name.toUpperCase().includes(item.driverName.toUpperCase()) ||
        item.driverName.toUpperCase().includes(c.name.toUpperCase())
      ) || currentCrews[0];

      let matchedHelper: Crew | undefined = undefined;
      if (item.helperName && item.helperName !== '-') {
        matchedHelper = currentCrews.find(c => 
          c.name.toUpperCase().includes(item.helperName!.toUpperCase()) ||
          item.helperName!.toUpperCase().includes(c.name.toUpperCase())
        );
      }

      const isBaliLuarPulau = areaUpper.includes('DENPASAR') || areaUpper.includes('SINGARAJA') || areaUpper.includes('NEGARA') || areaUpper.includes('BALI');

      const scheduleData: Schedule = {
        id: `sch-import-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`,
        trackingNumber: item.poNumber,
        originName: 'Gudang Pusat AKK Banyuwangi DC',
        originCoords: [-8.1906, 114.3708],
        storeId: matchedStore.id,
        store: matchedStore,
        fleetId: matchedFleet ? matchedFleet.id : 'flt-01',
        fleet: matchedFleet,
        crewId: matchedDriver ? matchedDriver.id : 'crw-01',
        crew: matchedDriver,
        crewHelperId: matchedHelper ? matchedHelper.id : undefined,
        crewHelper: matchedHelper,
        status: 'scheduled',
        departureDate: item.departureDateIso,
        estimatedArrival: item.estimatedArrivalIso,
        cargoDescription: `Karton Box & Sheet Kemasan - Area ${item.areaName}`,
        cargoWeightTon: isBaliLuarPulau ? 4.5 : 2.5,
        isInterIsland: isBaliLuarPulau,
        ferryBookingCode: isBaliLuarPulau ? `ASDP-KTP-GLM-${item.index + 100}` : undefined,
        transitPort: isBaliLuarPulau ? 'Pelabuhan Ketapang Banyuwangi -> Gilimanuk Bali' : undefined,
        notes: `Import Tervalidasi Google Sheets API (Valid: OK). Target: ${item.target || '-'}`,
        areaApprovalStatus: 'approved',
        createdAt: new Date().toISOString()
      };

      try {
        logisticsStore.addSchedule(scheduleData);
        syncedCount++;
      } catch (err: any) {
        errors.push(`Gagal menambahkan ${item.poNumber}: ${err.message}`);
      }
    });

    return {
      syncedCount,
      skippedDuplicateCount,
      skippedInvalidCount,
      overwrittenCount,
      errors
    };
  }
};
