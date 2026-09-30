export interface DeliveryAssignment {
  driver: string;
  helper: string;
  area: string;
  armada: string;
  backup?: string;
  target?: string;
}

export interface WarehouseCrewAssignment {
  role: string;
  nama: string;
  keterangan?: string;
}

export interface OffDeliveryArmada {
  nama: string;
  keterangan: string;
  backup?: string;
}

export interface EmployeeAbsence {
  nama: string;
  keterangan: string;
  backup?: string;
}

export interface AdminScheduleDay {
  dayNumber: number; // e.g. 5
  dayName: string; // 'SENIN'
  dateString: string; // '05 Januari 2026'
  pengiriman: DeliveryAssignment[];
  gudang: WarehouseCrewAssignment[];
  pengirimanOff: OffDeliveryArmada[];
  karyawanIzin: EmployeeAbsence[];
}

export interface AdminScheduleWeek {
  weekNumber: number; // 1
  weekLabel: string; // 'SENIN, 05 JANUARI 2026'
  dateRangeLabel: string;
  days: AdminScheduleDay[];
}

/**
 * Data Resmi Sinkronisasi Sheet "ALL" Dokumen "JADWAL PENGIRIMAN 2026"
 * PT Anugrah Kemasan Kreatif - Banyuwangi Central DC
 * Sesuai data riil spreadsheet aktif (8 Rute Pengiriman 05 Januari 2026).
 */
export const ADMIN_SCHEDULE_WEEKS: AdminScheduleWeek[] = [
  {
    weekNumber: 1,
    weekLabel: 'SENIN, 05 JANUARI 2026 (SHEET: ALL)',
    dateRangeLabel: '05 Januari 2026',
    days: [
      {
        dayNumber: 5,
        dayName: 'SENIN',
        dateString: '05 Januari 2026',
        pengiriman: [
          { driver: 'Supri', helper: 'Rifal, Aldi', area: 'DENPASAR 1', armada: 'DS3' },
          { driver: 'Wahyu', helper: 'Yusuf', area: 'DENPASAR 2', armada: 'DS1' },
          { driver: 'Tiar', helper: 'Faris', area: 'BONDOWOSO', armada: 'NS3' },
          { driver: 'Aris', helper: 'Rohman', area: 'SSLN STB BDWS', armada: 'DS2' },
          { driver: 'Andre', helper: 'Aan', area: 'SUSULAN ROGOJAMPI-MUNCAR', armada: 'DS4' },
          { driver: 'Wibi', helper: 'Teguh', area: 'RITEL PURWO', armada: 'NS2' },
          { driver: 'Budi', helper: 'Rizal', area: 'RITEL PURWO', armada: 'NS1' },
          { driver: 'Hadi', helper: 'Yudi', area: 'JAJAG RETAIL', armada: 'N20' }
        ],
        gudang: [],
        pengirimanOff: [],
        karyawanIzin: []
      }
    ]
  }
];

export const RAW_ADMIN_SCHEDULE_CSV = `Januari,,,,,,
Tanggal,No,Driver,Helper,,Area Kirim,Armada
,,,1,2,,
1/5/2026,1,Supri,Rifal,Aldi,DENPASAR 1,DS3
,2,Wahyu,Yusuf,,DENPASAR 2,DS1
,3,Tiar,Faris,,BONDOWOSO,NS3
,4,Aris,Rohman,,SSLN STB BDWS,DS2
,5,Andre,Aan,,SUSULAN ROGOJAMPI-MUNCAR,DS4
,6,Wibi,Teguh,,RITEL PURWO,NS2
,7,Budi,Rizal,,RITEL PURWO,NS1
,8,Hadi,Yudi,,JAJAG RETAIL,N20
`;

export const rawAdminScheduleData = RAW_ADMIN_SCHEDULE_CSV;
