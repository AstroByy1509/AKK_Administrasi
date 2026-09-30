/**
 * Standard Area Normalizer & Harmonizer
 * Menyelaraskan nama area dari Google Sheet (Sheet ALL)
 * agar 100% identik dengan opsi resmi pada Pembuatan Jadwal Baru.
 */

export const STANDARD_AREAS = [
  'GROSIR 1',
  'RITEL ROGOJAMPI',
  'RITEL SONGGON',
  'SUSULAN ROGOJAMPI-MUNCAR',
  'JAJAG RETAIL',
  'DENPASAR 2',
  'SUSULAN SANGGAR-JAJAG',
  'DENPASAR 1',
  'BWI KOTA SELATAN',
  'KETAPANG - WONGSOREJO',
  'RITEL SRONO',
  'GALEKAN',
  'JEMBER BARAT',
  'RITEL KALIBARU',
  'RITEL PURWO',
  'SSLN SINGARAJA',
  'SEMPU KALISTAIL',
  'JEMBER KOTA',
  'BONDOWOSO',
  'SSLN STB BDWS',
  'RITEL SANGGAR',
  'NEGARA',
  'JEMBER SELATAN'
] as const;

export type StandardAreaName = typeof STANDARD_AREAS[number];

export const AREA_CODE_MAP: Record<string, StandardAreaName> = {
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

/**
 * Normalisasi otomatis nama area variatif dari Google Sheets / Excel
 * menjadi nama area baku yang dipakai di "Pembuatan Jadwal Baru".
 */
export function standardizeAreaName(rawArea: string | undefined | null): string {
  if (!rawArea) return 'RITEL ROGOJAMPI';
  const clean = rawArea.trim().toUpperCase();

  // 1. Direct matches
  if (clean === 'DENPASAR 1' || clean === 'DENPASAR1') return 'DENPASAR 1';
  if (clean === 'DENPASAR 2' || clean === 'DENPASAR2') return 'DENPASAR 2';
  if (clean === 'BONDOWOSO') return 'BONDOWOSO';
  if (clean === 'JAJAG RETAIL' || clean === 'JAJAG' || clean === 'JAJAG ( RITEL )') return 'JAJAG RETAIL';
  if (clean === 'NEGARA') return 'NEGARA';
  if (clean === 'GALEKAN') return 'GALEKAN';
  if (clean === 'BWI KOTA SELATAN' || clean === 'BANYUWANGI KOTA') return 'BWI KOTA SELATAN';

  // 2. Situbondo / Bondowoso Susulan -> SSLN STB BDWS
  if (
    clean.includes('SITUBONDO') || 
    clean.includes('STBD') || 
    clean.includes('STB') || 
    clean === 'SSLN STB BDWS' || 
    clean.includes('SSLN STB')
  ) {
    return 'SSLN STB BDWS';
  }

  // 3. Susulan Genteng - Rogojampi -> SUSULAN ROGOJAMPI-MUNCAR
  if (
    clean.includes('GENTENG - ROGOJAMPI') || 
    clean.includes('GENTENG, RGJ') || 
    clean.includes('GTG- RGJ') || 
    clean.includes('ROGOJAMPI-MUNCAR') || 
    clean.includes('ROGOJAMPI - MUNCAR') ||
    clean.includes('SSL RGJ') ||
    clean.includes('SUSULAN GTG')
  ) {
    return 'SUSULAN ROGOJAMPI-MUNCAR';
  }

  // 4. Purwo Dambuntung / Purwo Pasar / Purwo -> RITEL PURWO
  if (clean.includes('PURWO')) {
    return 'RITEL PURWO';
  }

  // 5. Singaraja -> SSLN SINGARAJA
  if (clean.includes('SINGARAJA')) {
    return 'SSLN SINGARAJA';
  }

  // 6. Kalibaru -> RITEL KALIBARU
  if (clean.includes('KALIBARU')) {
    return 'RITEL KALIBARU';
  }

  // 7. Songgon -> RITEL SONGGON
  if (clean.includes('SONGGON')) {
    return 'RITEL SONGGON';
  }

  // 8. Srono -> RITEL SRONO
  if (clean.includes('SRONO')) {
    return 'RITEL SRONO';
  }

  // 9. Sanggar -> RITEL SANGGAR / SUSULAN SANGGAR-JAJAG
  if (clean.includes('SUSULAN SANGGAR') || clean.includes('SANGGAR-JAJAG')) {
    return 'SUSULAN SANGGAR-JAJAG';
  }
  if (clean.includes('SANGGAR')) {
    return 'RITEL SANGGAR';
  }

  // 10. Rogojampi Ritel -> RITEL ROGOJAMPI
  if (clean.includes('ROGOJAMPI')) {
    return 'RITEL ROGOJAMPI';
  }

  // 11. Ketapang / Wongsorejo -> KETAPANG - WONGSOREJO
  if (clean.includes('KETAPANG') || clean.includes('WONGSOREJO')) {
    return 'KETAPANG - WONGSOREJO';
  }

  // 12. Sempu / Kalistail / Xstail -> SEMPU KALISTAIL
  if (clean.includes('SEMPU') || clean.includes('KALISTAIL') || clean.includes('XSTAIL')) {
    return 'SEMPU KALISTAIL';
  }

  // 13. Jember Kota / Barat / Selatan
  if (clean.includes('JEMBER BARAT') || clean.includes('JEMBER PINGGIR') || clean.includes('JEMBER (MALAM)')) {
    return 'JEMBER BARAT';
  }
  if (clean.includes('JEMBER SELATAN')) {
    return 'JEMBER SELATAN';
  }
  if (clean.includes('JEMBER')) {
    return 'JEMBER KOTA';
  }

  // 14. Grosir -> GROSIR 1
  if (clean.includes('GROSIR')) {
    return 'GROSIR 1';
  }

  // Check if matches standard area directly
  const directMatch = STANDARD_AREAS.find(a => a === clean);
  if (directMatch) return directMatch;

  return clean;
}

/**
 * Mendapatkan sub-detail asli (misal: "Purwo Dambuntung" -> detail: "Dambuntung")
 * untuk tampilan badge informatif opsional.
 */
export function getAreaSubDetail(rawArea: string | undefined | null): string | null {
  if (!rawArea) return null;
  const upper = rawArea.trim().toUpperCase();

  if (upper.includes('DAMBUNTUNG')) return 'Dambuntung';
  if (upper.includes('PASAR') && upper.includes('PURWO')) return 'Pasar';
  if (upper.includes('PAGI') && upper.includes('SITUBONDO')) return 'Pagi';
  if (upper.includes('GENTENG') && upper.includes('ROGOJAMPI')) return 'Genteng - Rogojampi';

  return null;
}
