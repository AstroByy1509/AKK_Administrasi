import {
  Fleet,
  Crew,
  RetailStore,
  Schedule,
  TracksolidDevice,
  UserProfile,
  UserRole,
  CrewDeliveryHistory,
  AreaDeliveryStat,
  AreaApprovalRequest,
  SalesOrder,
  AdminActivity,
  AdminSchedule,
  LoadingDurationRecord,
  AdminSkillProfile,
  JobdeskConfig,
  SystemActivity,
  SparePart,
  SparePartUsage,
  SparePartCategory,
  FuelLog,
  FuelType,
  EfficiencyStatus,
  FleetFuelSummary,
  DriverFuelScore,
  ShipmentStatus,
  SwapShiftRequest,
  FleetTireWearPrediction,
  TaxKirReminderItem,
  TaxKirType,
  TaxKirUrgency
} from '../types';
import {
  INITIAL_FLEETS,
  INITIAL_CREWS,
  INITIAL_STORES,
  INITIAL_SCHEDULES,
  INITIAL_TRACKSOLID_DEVICES,
  INITIAL_PROFILES,
  INITIAL_CREW_HISTORY,
  INITIAL_AREA_APPROVALS
} from '../data/mockData';
import {
  INITIAL_SALES_ORDERS,
  INITIAL_ADMIN_ACTIVITIES,
  INITIAL_ADMIN_SCHEDULES,
  INITIAL_LOADING_RECORDS,
  INITIAL_SKILL_PROFILES,
  INITIAL_JOBDESK_CONFIGS
} from '../data/salesMockData';
import {
  INITIAL_SPARE_PARTS,
  INITIAL_SPARE_PART_USAGES
} from '../data/sparePartsMockData';
import {
  INITIAL_FUEL_LOGS,
  FUEL_TARGET_RATIOS
} from '../data/fuelMockData';

const STORAGE_KEYS = {
  FLEETS: 'akk_fleets_v1',
  CREWS: 'akk_crews_v2',
  STORES: 'akk_stores_v1',
  SCHEDULES: 'akk_schedules_v1',
  DEVICES: 'akk_devices_v1',
  CURRENT_USER: 'akk_user_v1',
  USERS: 'akk_users_list_v1',
  SUPABASE_CONFIG: 'akk_supabase_config_v1',
  CREW_HISTORY: 'akk_crew_history_v1',
  AREA_APPROVALS: 'akk_area_approvals_v1',
  AREA_THRESHOLD: 'akk_area_threshold_v1',
  SALES_ORDERS: 'akk_sales_orders_v1',
  ADMIN_ACTIVITIES: 'akk_admin_activities_v1',
  ADMIN_SCHEDULES: 'akk_admin_schedules_v1',
  LOADING_RECORDS: 'akk_loading_records_v1',
  SKILL_PROFILES: 'akk_skill_profiles_v1',
  JOBDESK_CONFIGS: 'akk_jobdesk_configs_v1',
  SPARE_PARTS: 'akk_spare_parts_v1',
  SPARE_PART_USAGES: 'akk_spare_part_usages_v1',
  FUEL_LOGS: 'akk_fuel_logs_v1'
};

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}

class LogisticsStore {
  private fleets: Fleet[] = [];
  private crews: Crew[] = [];
  private stores: RetailStore[] = [];
  private schedules: Schedule[] = [];
  private devices: TracksolidDevice[] = [];
  private users: UserProfile[] = [];
  private currentUser: UserProfile;
  private supabaseConfig: SupabaseConfig;
  private crewHistory: CrewDeliveryHistory[] = [];
  private areaApprovals: AreaApprovalRequest[] = [];
  private areaThreshold: number = 3;
  private salesOrders: SalesOrder[] = [];
  private adminActivities: AdminActivity[] = [];
  private adminSchedules: AdminSchedule[] = [];
  private loadingRecords: LoadingDurationRecord[] = [];
  private skillProfiles: AdminSkillProfile[] = [];
  private jobdeskConfigs: JobdeskConfig[] = [];
  private systemActivities: SystemActivity[] = [];
  private spareParts: SparePart[] = [];
  private sparePartUsages: SparePartUsage[] = [];
  private fuelLogs: FuelLog[] = [];
  private listeners: Array<() => void> = [];
  private notificationListeners: Array<(notif: any) => void> = [];

  constructor() {
    this.fleets = this.loadFromStorage(STORAGE_KEYS.FLEETS, INITIAL_FLEETS);
    this.crews = this.loadFromStorage(STORAGE_KEYS.CREWS, INITIAL_CREWS);
    this.stores = this.loadFromStorage(STORAGE_KEYS.STORES, INITIAL_STORES);
    this.schedules = this.loadFromStorage(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
    this.devices = this.loadFromStorage(STORAGE_KEYS.DEVICES, INITIAL_TRACKSOLID_DEVICES);
    this.users = this.loadFromStorage(STORAGE_KEYS.USERS, INITIAL_PROFILES);
    this.currentUser = this.loadFromStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILES[0]);
    this.crewHistory = this.loadFromStorage(STORAGE_KEYS.CREW_HISTORY, INITIAL_CREW_HISTORY);
    this.areaApprovals = this.loadFromStorage(STORAGE_KEYS.AREA_APPROVALS, INITIAL_AREA_APPROVALS);
    this.areaThreshold = this.loadFromStorage(STORAGE_KEYS.AREA_THRESHOLD, 3);
    this.salesOrders = this.loadFromStorage(STORAGE_KEYS.SALES_ORDERS, INITIAL_SALES_ORDERS);
    this.adminActivities = this.loadFromStorage(STORAGE_KEYS.ADMIN_ACTIVITIES, INITIAL_ADMIN_ACTIVITIES);
    this.adminSchedules = this.loadFromStorage(STORAGE_KEYS.ADMIN_SCHEDULES, INITIAL_ADMIN_SCHEDULES);
    this.loadingRecords = this.loadFromStorage(STORAGE_KEYS.LOADING_RECORDS, INITIAL_LOADING_RECORDS);
    this.skillProfiles = this.loadFromStorage(STORAGE_KEYS.SKILL_PROFILES, INITIAL_SKILL_PROFILES);
    this.jobdeskConfigs = this.loadFromStorage(STORAGE_KEYS.JOBDESK_CONFIGS, INITIAL_JOBDESK_CONFIGS);
    this.spareParts = this.loadFromStorage(STORAGE_KEYS.SPARE_PARTS, INITIAL_SPARE_PARTS);
    this.sparePartUsages = this.loadFromStorage(STORAGE_KEYS.SPARE_PART_USAGES, INITIAL_SPARE_PART_USAGES);
    this.fuelLogs = this.loadFromStorage(STORAGE_KEYS.FUEL_LOGS, INITIAL_FUEL_LOGS);
    this.systemActivities = this.loadFromStorage('akk_system_activities_v1', []);
    this.supabaseConfig = this.loadFromStorage(STORAGE_KEYS.SUPABASE_CONFIG, {
      url: '',
      anonKey: '',
      isConnected: false
    });

    // Auto-migrate crew pool to ensure all 19 drivers & helpers are loaded and legacy mock crews replaced
    if (!this.crews || this.crews.length < 19 || this.crews.some(c => c.name === 'Agus Setiawan' || c.name === 'Slamet Riyadi' || c.name === 'Wahyu Nugroho')) {
      this.crews = [...INITIAL_CREWS];
      this.saveToStorage(STORAGE_KEYS.CREWS, this.crews);
    }

    // Self-heal and migrate stores if missing or if all stores are stacked on identical dummy coordinates (-8.36, 114.15)
    const isCorruptedStackedStores = this.stores && this.stores.length > 5 && this.stores.filter(s => Math.abs(s.latitude - (-8.36)) < 0.01 && Math.abs(s.longitude - 114.15) < 0.01).length > this.stores.length * 0.8;
    if (!this.stores || this.stores.length === 0 || isCorruptedStackedStores) {
      this.stores = [...INITIAL_STORES];
      this.saveToStorage(STORAGE_KEYS.STORES, this.stores);
    }

    // Auto-migrate user profiles if the user name was changed
    let updatedUsers = false;
    this.users = this.users.map(u => {
      let updated = false;
      let newName = u.fullName;
      let newApprovedBy = u.approvedBy;
      if (u.fullName === 'Ir. Hendra Gunawan') {
        newName = 'Bayu Novianto Dimas Permana, S.Si';
        updated = true;
      }
      if (u.approvedBy === 'Ir. Hendra Gunawan') {
        newApprovedBy = 'Bayu Novianto Dimas Permana, S.Si';
        updated = true;
      }
      if (updated) {
        updatedUsers = true;
        return { ...u, fullName: newName, approvedBy: newApprovedBy };
      }
      return u;
    });
    if (updatedUsers) {
      this.saveToStorage(STORAGE_KEYS.USERS, this.users);
    }

    if (this.currentUser && (this.currentUser.fullName === 'Ir. Hendra Gunawan' || this.currentUser.approvedBy === 'Ir. Hendra Gunawan')) {
      this.currentUser = {
        ...this.currentUser,
        fullName: this.currentUser.fullName === 'Ir. Hendra Gunawan' ? 'Bayu Novianto Dimas Permana, S.Si' : this.currentUser.fullName,
        approvedBy: this.currentUser.approvedBy === 'Ir. Hendra Gunawan' ? 'Bayu Novianto Dimas Permana, S.Si' : this.currentUser.approvedBy
      };
      this.saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    }

    // Ensure all fleets have initialCode (inisial mobil) and tax/stnk dates
    let updatedFleets = false;

    // Merge any missing fleets from INITIAL_FLEETS into this.fleets
    INITIAL_FLEETS.forEach(initF => {
      const exists = this.fleets.some(f => f.id === initF.id || f.plateNumber === initF.plateNumber);
      if (!exists) {
        this.fleets.push({ ...initF });
        updatedFleets = true;
      }
    });

    this.fleets = this.fleets.map((f, idx) => {
      let changed = false;

      // Migrate specific vehicle P 8125 VC (Mitsubishi L300)
      if (f.id === 'flt-01' || f.plateNumber === 'B 9421 UXT') {
        return {
          ...f,
          id: 'flt-01',
          plateNumber: 'P 8125 VC',
          vehicleType: 'Pick Up Box',
          initialCode: 'N1 / NP1',
          brand: 'Mitsubishi L300',
          engineCc: '2477 CC',
          year: 2004,
          gpsImei: '',
          lastMaintenance: '2026-12-23',
          taxDueDate: '2027-06-25',
          stnkExpiryDate: '2029-06-25'
        };
      }

      // Migrate specific vehicle P 8509 VQ (Traga Pick Up Box)
      if (f.id === 'flt-02' || f.plateNumber === 'B 9128 UYX') {
        return {
          ...f,
          id: 'flt-02',
          plateNumber: 'P 8509 VQ',
          vehicleType: 'Pick Up Box',
          initialCode: 'A3 / NP3',
          brand: 'Traga',
          engineCc: '2499 CC',
          year: 2021,
          gpsImei: '',
          lastMaintenance: '2027-02-05',
          taxDueDate: '2027-08-03',
          stnkExpiryDate: '2031-08-03'
        };
      }

      // Migrate specific vehicle P 8848 U (Mitsubishi Canter Engkel STD)
      if (f.id === 'flt-03' || f.plateNumber === 'B 9802 KLS') {
        return {
          ...f,
          id: 'flt-03',
          plateNumber: 'P 8848 U',
          vehicleType: 'Engkel STD',
          initialCode: 'N3 / NS1',
          brand: 'Mitsubishi Canter',
          engineCc: '3908 CC',
          year: 2008,
          gpsImei: '',
          lastMaintenance: '2027-01-29',
          taxDueDate: '2027-08-03',
          stnkExpiryDate: '2027-08-03'
        };
      }

      // Migrate specific vehicle P 9677 VB (Mitsubishi Canter Engkel STD)
      if (f.id === 'flt-04' || f.plateNumber === 'B 9301 TXR') {
        return {
          ...f,
          id: 'flt-04',
          plateNumber: 'P 9677 VB',
          vehicleType: 'Engkel STD',
          initialCode: 'N4 / NS2',
          brand: 'Mitsubishi Canter',
          engineCc: '3298 CC',
          year: 2005,
          gpsImei: '',
          lastMaintenance: '2026-11-27',
          taxDueDate: '2027-05-17',
          stnkExpiryDate: '2029-05-27'
        };
      }

      // Migrate specific vehicle P 8801 UV (Mitsubishi Canter Engkel STD)
      if (f.id === 'flt-05' || f.plateNumber === 'B 9655 PQZ') {
        return {
          ...f,
          id: 'flt-05',
          plateNumber: 'P 8801 UV',
          vehicleType: 'Engkel STD',
          initialCode: 'N5 / NS3',
          brand: 'Mitsubishi Canter',
          engineCc: '3908 CC',
          year: 2008,
          gpsImei: '',
          lastMaintenance: '2026-08-11',
          taxDueDate: '2026-10-07',
          stnkExpiryDate: '2026-10-07'
        };
      }

      // Migrate specific vehicle P 8381 VE (Hino Engkel Long)
      if (f.id === 'flt-06' || f.plateNumber === 'B 9044 MLK') {
        return {
          ...f,
          id: 'flt-06',
          plateNumber: 'P 8381 VE',
          vehicleType: 'Engkel Long',
          initialCode: 'N20 / NL1',
          brand: 'Hino',
          engineCc: '4009 CC',
          year: 2013,
          gpsImei: '',
          lastMaintenance: '2026-12-01',
          taxDueDate: '2027-01-16',
          stnkExpiryDate: '2030-01-16'
        };
      }

      let initialCode = f.initialCode;
      if (!initialCode) {
        changed = true;
        const prefix = f.vehicleType.includes('Wingbox') ? 'WB' :
                       f.vehicleType.includes('Fuso') ? 'FS' :
                       f.vehicleType.includes('CDD') ? 'CD' :
                       f.vehicleType.includes('CDE') ? 'CH' :
                       f.vehicleType.includes('Container') ? 'CT' : 'ARM';
        initialCode = `${prefix}-0${idx + 1}`;
      }
      let taxDueDate = f.taxDueDate;
      if (!taxDueDate) {
        changed = true;
        taxDueDate = '2026-11-20';
      }
      let stnkExpiryDate = f.stnkExpiryDate;
      if (!stnkExpiryDate) {
        changed = true;
        stnkExpiryDate = '2028-11-20';
      }
      if (changed) {
        updatedFleets = true;
        return {
          ...f,
          initialCode,
          taxDueDate,
          stnkExpiryDate
        };
      }
      return f;
    });
    this.saveToStorage(STORAGE_KEYS.FLEETS, this.fleets);

    // Auto-migrate any cached state from Cikarang DC to Banyuwangi DC
    let updatedSchedules = false;
    this.schedules = this.schedules.map(s => {
      if (s.originCoords && s.originCoords[0] === -6.3262) {
        updatedSchedules = true;
        return {
          ...s,
          originName: 'Gudang Pusat Banyuwangi DC',
          originCoords: [-8.1906, 114.3708] as [number, number]
        };
      }
      return s;
    });
    if (updatedSchedules) {
      this.saveToStorage(STORAGE_KEYS.SCHEDULES, this.schedules);
    }

    // Ensure fuelLogs have literPerKm, literPer100Km, and latest records
    if (this.fuelLogs.length < INITIAL_FUEL_LOGS.length) {
      this.fuelLogs = [...INITIAL_FUEL_LOGS];
      this.saveToStorage(STORAGE_KEYS.FUEL_LOGS, this.fuelLogs);
    } else {
      let updatedFuel = false;
      this.fuelLogs = this.fuelLogs.map(l => {
        if (l.literPerKm === undefined || l.literPer100Km === undefined) {
          updatedFuel = true;
          const dist = l.distanceKm > 0 ? l.distanceKm : Math.max(0, l.endOdometerKm - l.startOdometerKm);
          return {
            ...l,
            distanceKm: dist,
            literPerKm: dist > 0 ? Number((l.liters / dist).toFixed(4)) : 0,
            literPer100Km: dist > 0 ? Number(((l.liters / dist) * 100).toFixed(2)) : 0
          };
        }
        return l;
      });
      if (updatedFuel) {
        this.saveToStorage(STORAGE_KEYS.FUEL_LOGS, this.fuelLogs);
      }
    }

    // Ensure latest Tracksolid devices matching NSTRARGO console
    const hasLeadDevice = this.devices.some(d => d.imei === '353701090461274');
    if (!hasLeadDevice || this.devices.length !== INITIAL_TRACKSOLID_DEVICES.length) {
      this.devices = [...INITIAL_TRACKSOLID_DEVICES];
      this.saveToStorage(STORAGE_KEYS.DEVICES, this.devices);
    } else {
      let updatedDevices = false;
      this.devices = this.devices.map(d => {
        if (d.latitude === -6.3262 && d.longitude === 107.1518) {
          updatedDevices = true;
          return {
            ...d,
            latitude: -8.1906,
            longitude: 114.3708,
            address: 'Staging Area Gudang Pusat Banyuwangi DC (Gate 2, Jl. Argopuro No.60)'
          };
        }
        return d;
      });
      if (updatedDevices) {
        this.saveToStorage(STORAGE_KEYS.DEVICES, this.devices);
      }
    }
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveToStorage(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public onNotification(listener: (notif: any) => void): () => void {
    this.notificationListeners.push(listener);
    return () => {
      this.notificationListeners = this.notificationListeners.filter(l => l !== listener);
    };
  }

  public emitNotification(type: 'delivery' | 'checker' | 'schedule' | 'sla_warning' | 'geofence', title: string, message: string, urgent?: boolean, data?: any) {
    this.notificationListeners.forEach(l => l({ type, title, message, urgent, data }));
  }

  // Getters
  public getFleets(): Fleet[] {
    return [...this.fleets];
  }

  public getCrews(): Crew[] {
    return [...this.crews];
  }

  public getStores(): RetailStore[] {
    return [...this.stores];
  }

  public getSchedules(): Schedule[] {
    return this.schedules.map(sch => ({
      ...sch,
      store: this.stores.find(s => s.id === sch.storeId),
      fleet: this.fleets.find(f => f.id === sch.fleetId),
      crew: this.crews.find(c => c.id === sch.crewId),
      crewHelper: sch.crewHelperId ? this.crews.find(c => c.id === sch.crewHelperId) : undefined,
      crewHelper2: sch.crewHelper2Id ? this.crews.find(c => c.id === sch.crewHelper2Id) : undefined
    }));
  }

  public getDevices(): TracksolidDevice[] {
    return [...this.devices];
  }

  public updateDevices(updatedDevices: TracksolidDevice[]) {
    this.devices = [...updatedDevices];
    this.saveToStorage(STORAGE_KEYS.DEVICES, this.devices);
  }

  public resetDevices() {
    this.devices = [...INITIAL_TRACKSOLID_DEVICES];
    this.saveToStorage(STORAGE_KEYS.DEVICES, this.devices);
  }

  public getCurrentUser(): UserProfile {
    return this.currentUser;
  }

  public getSupabaseConfig(): SupabaseConfig {
    return this.supabaseConfig;
  }

  public getCrewDeliveryHistory(crewId?: string): CrewDeliveryHistory[] {
    if (crewId) {
      return this.crewHistory.filter(h => h.crewId === crewId);
    }
    return [...this.crewHistory];
  }

  public getCrewAreaStats(crewId: string): AreaDeliveryStat[] {
    const history = this.getCrewDeliveryHistory(crewId);
    const areaMap = new Map<string, { count: number; island: string; lastDate: string }>();

    history.forEach(item => {
      const existing = areaMap.get(item.area);
      if (existing) {
        existing.count += 1;
        if (new Date(item.completionDate) > new Date(existing.lastDate)) {
          existing.lastDate = item.completionDate;
        }
      } else {
        areaMap.set(item.area, {
          count: 1,
          island: item.island,
          lastDate: item.completionDate
        });
      }
    });

    const stats: AreaDeliveryStat[] = [];
    areaMap.forEach((val, key) => {
      stats.push({
        area: key,
        island: val.island,
        totalTrips: val.count,
        lastTripDate: val.lastDate,
        requiresApproval: val.count >= this.areaThreshold
      });
    });

    return stats.sort((a, b) => b.totalTrips - a.totalTrips);
  }

  public checkCrewAreaThreshold(crewId: string, areaName: string): {
    tripCount: number;
    threshold: number;
    requiresApproval: boolean;
    isApproved: boolean;
    recentTrips: CrewDeliveryHistory[];
  } {
    const allCrewTrips = this.getCrewDeliveryHistory(crewId);
    // Match area name or city or island
    const matchedTrips = allCrewTrips.filter(t => 
      t.area.toLowerCase().includes(areaName.toLowerCase()) ||
      areaName.toLowerCase().includes(t.area.toLowerCase()) ||
      t.city.toLowerCase().includes(areaName.toLowerCase()) ||
      areaName.toLowerCase().includes(t.city.toLowerCase())
    );

    const tripCount = matchedTrips.length;
    const requiresApproval = tripCount >= this.areaThreshold;

    // Check if there is an approved request for this crew and area
    const hasApproval = this.areaApprovals.some(
      a => a.crewId === crewId && 
           (a.targetArea.toLowerCase().includes(areaName.toLowerCase()) || areaName.toLowerCase().includes(a.targetArea.toLowerCase())) &&
           a.status === 'approved'
    );

    return {
      tripCount,
      threshold: this.areaThreshold,
      requiresApproval,
      isApproved: hasApproval,
      recentTrips: matchedTrips
    };
  }

  public getAreaApprovalRequests(): AreaApprovalRequest[] {
    return [...this.areaApprovals];
  }

  public createAreaApprovalRequest(req: Omit<AreaApprovalRequest, 'id' | 'requestedAt'>): AreaApprovalRequest {
    const newReq: AreaApprovalRequest = {
      ...req,
      id: 'appr-' + Math.random().toString(36).substring(2, 9),
      requestedAt: new Date().toISOString()
    };
    this.areaApprovals = [newReq, ...this.areaApprovals];
    this.saveToStorage(STORAGE_KEYS.AREA_APPROVALS, this.areaApprovals);
    return newReq;
  }

  public decideAreaApproval(requestId: string, status: 'approved' | 'rejected', notes?: string, decidedBy?: string) {
    this.areaApprovals = this.areaApprovals.map(req => {
      if (req.id === requestId) {
        return {
          ...req,
          status,
          notes: notes !== undefined ? notes : req.notes,
          decidedAt: new Date().toISOString(),
          decidedBy: decidedBy || this.currentUser.fullName
        };
      }
      return req;
    });
    this.saveToStorage(STORAGE_KEYS.AREA_APPROVALS, this.areaApprovals);
  }

  public getAreaDeliveryThreshold(): number {
    return this.areaThreshold;
  }

  public setAreaDeliveryThreshold(val: number) {
    this.areaThreshold = val;
    this.saveToStorage(STORAGE_KEYS.AREA_THRESHOLD, val);
  }

  // User Management & Authentication
  public getUsers(): UserProfile[] {
    return this.users;
  }

  public getPendingUsersCount(): number {
    return this.users.filter(u => u.status === 'pending').length;
  }

  public approveUser(userId: string, notes?: string) {
    const approverName = this.currentUser.fullName || 'Manager Operasional AKK';
    this.users = this.users.map(u => {
      if (u.id === userId) {
        this.logActivity('Approval User', u.fullName, `Disetujui oleh ${approverName}`);
        return {
          ...u,
          status: 'approved' as const,
          approvedAt: new Date().toISOString(),
          approvedBy: approverName,
          notes: notes || 'Disetujui oleh ' + approverName
        };
      }
      return u;
    });

    // If current user is the one approved, update currentUser too
    if (this.currentUser.id === userId) {
      this.currentUser = {
        ...this.currentUser,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: approverName
      };
      this.saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    }

    this.saveToStorage(STORAGE_KEYS.USERS, this.users);
    this.notify();
  }

  public rejectUser(userId: string, reason?: string) {
    this.users = this.users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status: 'rejected' as const,
          notes: reason || 'Ditolak oleh Administrator AKK'
        };
      }
      return u;
    });

    if (this.currentUser.id === userId) {
      this.currentUser = {
        ...this.currentUser,
        status: 'rejected',
        notes: reason || 'Ditolak oleh Administrator AKK'
      };
      this.saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    }

    this.saveToStorage(STORAGE_KEYS.USERS, this.users);
    this.notify();
  }

  public updateUserRole(userId: string, role: UserRole) {
    this.users = this.users.map(u => u.id === userId ? { ...u, role } : u);
    if (this.currentUser.id === userId) {
      this.currentUser = { ...this.currentUser, role };
      this.saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    }
    this.saveToStorage(STORAGE_KEYS.USERS, this.users);
    this.notify();
  }

  public deleteUser(userId: string) {
    this.users = this.users.filter(u => u.id !== userId);
    this.saveToStorage(STORAGE_KEYS.USERS, this.users);
    this.notify();
  }

  public registerUser(data: {
    fullName: string;
    email: string;
    role: UserRole;
    department: string;
    phone?: string;
    notes?: string;
  }): UserProfile {
    const newUser: UserProfile = {
      id: 'usr-' + Math.random().toString(36).substring(2, 8),
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      department: data.department,
      phone: data.phone || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      notes: data.notes || 'Pendaftaran baru menunggu approval'
    };

    this.users = [newUser, ...this.users];
    this.saveToStorage(STORAGE_KEYS.USERS, this.users);

    // Auto login as this new registered user
    this.currentUser = newUser;
    this.saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    this.notify();

    return newUser;
  }

  public loginUser(email: string): UserProfile | null {
    const existing = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      this.currentUser = existing;
      this.saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
      this.notify();
      return existing;
    }
    return null;
  }

  public switchCurrentUser(userId: string) {
    const target = this.users.find(u => u.id === userId);
    if (target) {
      this.currentUser = target;
      this.saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
      this.notify();
    }
  }

  public logoutUser() {
    // Return to default admin profile or guest
    this.currentUser = {
      id: 'guest',
      email: 'tamu@akk-packaging.co.id',
      fullName: 'Tamu / Belum Login',
      role: 'driver',
      department: 'AKK Visitor',
      status: 'pending'
    };
    this.saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    this.notify();
  }

  // Actions
  public setCurrentRole(role: UserRole) {
    const profile = this.users.find(p => p.role === role && p.status === 'approved') || {
      ...this.currentUser,
      role
    };
    this.currentUser = profile;
    this.saveToStorage(STORAGE_KEYS.CURRENT_USER, this.currentUser);
    this.notify();
  }

  public addSchedule(schedule: Omit<Schedule, 'id' | 'createdAt'>): Schedule {
    const newSchedule: Schedule = {
      ...schedule,
      id: 'sch-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString()
    };

    // Update fleet & crew status if scheduled or in_transit
    if (newSchedule.status === 'in_transit' || newSchedule.status === 'scheduled') {
      this.updateFleetStatus(newSchedule.fleetId, 'on-duty', newSchedule.cargoWeightTon);
      this.updateCrewStatus(newSchedule.crewId, 'on-duty');
    }

    this.schedules = [newSchedule, ...this.schedules];
    this.saveToStorage(STORAGE_KEYS.SCHEDULES, this.schedules);
    return newSchedule;
  }

  public updateSchedule(id: string, updatedSchedule: Partial<Omit<Schedule, 'id' | 'createdAt'>>) {
    let oldSch: Schedule | null = null;
    let newSch: Schedule | null = null;
    this.schedules = this.schedules.map(sch => {
      if (sch.id === id) {
        oldSch = sch;
        const result = { ...sch, ...updatedSchedule };
        newSch = result;
        this.logActivity('Update Jadwal', sch.trackingNumber, `Perubahan pada jadwal ${id}`);
        return result;
      }
      return sch;
    });
    this.saveToStorage(STORAGE_KEYS.SCHEDULES, this.schedules);

    if (oldSch && newSch) {
      const isUrgent = (newSch as Schedule).isInterIsland || (newSch as Schedule).status === 'delayed';
      const storeName = this.stores.find(s => s.id === (newSch as Schedule).storeId)?.storeName || 'Store';
      this.emitNotification(
        'schedule',
        isUrgent ? '⚠️ Perubahan Jadwal Muat MENDESAK' : 'Perubahan Jadwal Muat',
        `Jadwal armada ${(newSch as Schedule).trackingNumber} rute ke ${storeName} diperbarui.`,
        isUrgent
      );
    }

    this.notify();
  }

  public deleteSchedule(id: string) {
    this.schedules = this.schedules.filter(sch => sch.id !== id);
    this.saveToStorage(STORAGE_KEYS.SCHEDULES, this.schedules);
    this.notify();
  }

  public updateScheduleStatus(id: string, status: Schedule['status']) {
    let deliveredSchedule: Schedule | null = null;
    let targetSch: Schedule | null = null;

    this.schedules = this.schedules.map(sch => {
      if (sch.id === id) {
        targetSch = sch;
        const updated = { ...sch, status };
        if (status === 'delivered') {
          updated.actualArrival = new Date().toISOString();
          deliveredSchedule = updated;
          this.logActivity('Update Status', 'Pengiriman', `Status ${sch.trackingNumber} menjadi delivered`);
          // Release fleet and crew
          this.updateFleetStatus(sch.fleetId, 'available', 0);
          this.updateCrewStatus(sch.crewId, 'available');
        }
        return updated;
      }
      return sch;
    });
    this.saveToStorage(STORAGE_KEYS.SCHEDULES, this.schedules);

    if (targetSch) {
      const statusTexts: Record<ShipmentStatus, string> = {
        scheduled: 'Menunggu Muat',
        in_transit: 'Dalam Perjalanan (Transit)',
        delivered: 'Telah Sampai (Delivered)',
        delayed: 'Mengalami Keterlambatan'
      };
      this.emitNotification(
        'delivery',
        'Pembaruan Status Pengiriman',
        `Armada ${(targetSch as Schedule).trackingNumber} kini berstatus: ${statusTexts[status] || status}.`,
        status === 'delayed'
      );
    }

    // Record delivery in crew history
    if (deliveredSchedule) {
      const sch = deliveredSchedule as Schedule;
      const store = this.stores.find(s => s.id === sch.storeId);
      const crew = this.crews.find(c => c.id === sch.crewId);
      const fleet = this.fleets.find(f => f.id === sch.fleetId);

      if (crew && store) {
        const areaName = `${store.island} (${store.city})`;
        const areaStats = this.checkCrewAreaThreshold(crew.id, areaName);

        const newHistoryItem: CrewDeliveryHistory = {
          id: 'cdh-' + Math.random().toString(36).substring(2, 9),
          crewId: crew.id,
          crewName: crew.name,
          scheduleId: sch.id,
          trackingNumber: sch.trackingNumber,
          storeName: store.storeName,
          area: areaName,
          city: store.city,
          island: store.island,
          vehiclePlate: fleet?.plateNumber || '-',
          vehicleType: fleet?.vehicleType || 'Pick Up Box',
          cargoWeightTon: sch.cargoWeightTon,
          cargoDescription: sch.cargoDescription,
          completionDate: new Date().toISOString(),
          status: 'delivered',
          onTimeStatus: 'Tepat Waktu',
          ratingReceived: 5.0,
          areaTripSequenceNumber: areaStats.tripCount + 1,
          requiresAreaApproval: (areaStats.tripCount + 1) >= this.areaThreshold,
          areaApprovalStatus: (areaStats.tripCount + 1) >= this.areaThreshold ? 'approved' : 'not_required'
        };

        this.crewHistory = [newHistoryItem, ...this.crewHistory];
        this.saveToStorage(STORAGE_KEYS.CREW_HISTORY, this.crewHistory);

        // Increment trips completed on crew
        this.crews = this.crews.map(c => c.id === crew.id ? { ...c, tripsCompleted: c.tripsCompleted + 1 } : c);
        this.saveToStorage(STORAGE_KEYS.CREWS, this.crews);
      }
    }
  }

  public addFleet(fleet: Omit<Fleet, 'id'>): Fleet {
    const newFleet: Fleet = {
      ...fleet,
      id: 'flt-' + Math.random().toString(36).substring(2, 8)
    };
    this.fleets = [...this.fleets, newFleet];
    this.saveToStorage(STORAGE_KEYS.FLEETS, this.fleets);
    this.notify();
    return newFleet;
  }

  public updateFleetStatus(id: string, status: Fleet['status'], tonnage?: number) {
    this.fleets = this.fleets.map(f => {
      if (f.id === id) {
        return {
          ...f,
          status,
          currentTonnage: tonnage !== undefined ? tonnage : f.currentTonnage
        };
      }
      return f;
    });
    this.saveToStorage(STORAGE_KEYS.FLEETS, this.fleets);
    this.notify();
  }

  public updateFleet(id: string, updatedFields: Partial<Fleet>) {
    this.fleets = this.fleets.map(f => (f.id === id ? { ...f, ...updatedFields } : f));
    this.saveToStorage(STORAGE_KEYS.FLEETS, this.fleets);
    this.notify();
  }

  public deleteFleet(id: string) {
    const deletedFleet = this.fleets.find(f => f.id === id);
    this.fleets = this.fleets.filter(f => f.id !== id);
    this.saveToStorage(STORAGE_KEYS.FLEETS, this.fleets);
    if (deletedFleet) {
      this.logActivity('Hapus Armada', deletedFleet.plateNumber, `Menghapus armada ${deletedFleet.plateNumber} (${deletedFleet.vehicleType})`);
    }
    this.notify();
  }

  public addCrew(crew: Omit<Crew, 'id' | 'tripsCompleted' | 'rating'>): Crew {
    const newCrew: Crew = {
      ...crew,
      id: 'crw-' + Math.random().toString(36).substring(2, 8),
      tripsCompleted: 0,
      rating: 5.0
    };
    this.crews = [...this.crews, newCrew];
    this.saveToStorage(STORAGE_KEYS.CREWS, this.crews);
    this.logActivity('Tambah Kru', newCrew.name, `Menambahkan kru baru ${newCrew.name} sebagai ${newCrew.role}`);
    this.notify();
    return newCrew;
  }

  public updateCrewStatus(id: string, status: Crew['status']) {
    this.crews = this.crews.map(c => (c.id === id ? { ...c, status } : c));
    this.saveToStorage(STORAGE_KEYS.CREWS, this.crews);
    this.notify();
  }

  public updateCrew(id: string, updatedFields: Partial<Crew>) {
    this.crews = this.crews.map(c => (c.id === id ? { ...c, ...updatedFields } : c));
    this.saveToStorage(STORAGE_KEYS.CREWS, this.crews);
    this.notify();
  }

  public deleteCrew(id: string) {
    const deletedCrew = this.crews.find(c => c.id === id);
    this.crews = this.crews.filter(c => c.id !== id);
    this.saveToStorage(STORAGE_KEYS.CREWS, this.crews);
    if (deletedCrew) {
      this.logActivity('Hapus Kru', deletedCrew.name, `Menghapus kru ${deletedCrew.name} (${deletedCrew.role}) dari sistem armada`);
    }
    this.notify();
  }

  public addStore(store: Omit<RetailStore, 'id'>): RetailStore {
    const newStore: RetailStore = {
      ...store,
      id: 'str-' + Math.random().toString(36).substring(2, 8)
    };
    this.stores = [...this.stores, newStore];
    this.saveToStorage(STORAGE_KEYS.STORES, this.stores);
    return newStore;
  }

  public setStores(newStores: RetailStore[]): void {
    this.stores = [...newStores];
    this.saveToStorage(STORAGE_KEYS.STORES, this.stores);
    this.notify();
  }

  public updateStore(id: string, updatedFields: Partial<RetailStore>): void {
    this.stores = this.stores.map(s => s.id === id ? { ...s, ...updatedFields } : s);
    this.saveToStorage(STORAGE_KEYS.STORES, this.stores);
    this.notify();
  }

  public deleteStore(id: string): void {
    this.stores = this.stores.filter(s => s.id !== id);
    this.saveToStorage(STORAGE_KEYS.STORES, this.stores);
  }

  public setSupabaseConfig(config: SupabaseConfig) {
    this.supabaseConfig = config;
    this.saveToStorage(STORAGE_KEYS.SUPABASE_CONFIG, config);
  }

  // ==========================================
  // SALES ADMIN (ADMIN PENJUALAN) METHODS
  // ==========================================

  public getSalesOrders(): SalesOrder[] {
    return this.salesOrders;
  }

  public addSalesOrder(order: Omit<SalesOrder, 'id'>): SalesOrder {
    const newOrder: SalesOrder = {
      ...order,
      id: 'so-' + Math.random().toString(36).substring(2, 8)
    };
    this.salesOrders = [newOrder, ...this.salesOrders];
    this.saveToStorage(STORAGE_KEYS.SALES_ORDERS, this.salesOrders);
    return newOrder;
  }

  public updateSalesOrderStatus(id: string, status: SalesOrder['orderStatus']) {
    this.salesOrders = this.salesOrders.map(o => (o.id === id ? { ...o, orderStatus: status } : o));
    this.saveToStorage(STORAGE_KEYS.SALES_ORDERS, this.salesOrders);
  }

  public getAdminActivities(): AdminActivity[] {
    return this.adminActivities;
  }

  public addAdminActivity(activity: Omit<AdminActivity, 'id'>): AdminActivity {
    const newActivity: AdminActivity = {
      ...activity,
      id: 'act-' + Math.random().toString(36).substring(2, 8)
    };
    this.adminActivities = [newActivity, ...this.adminActivities];
    this.saveToStorage(STORAGE_KEYS.ADMIN_ACTIVITIES, this.adminActivities);
    return newActivity;
  }

  public updateAdminActivityStatus(id: string, status: AdminActivity['status']) {
    this.adminActivities = this.adminActivities.map(a => (a.id === id ? { ...a, status } : a));
    this.saveToStorage(STORAGE_KEYS.ADMIN_ACTIVITIES, this.adminActivities);
  }

  public getAdminSchedules(): AdminSchedule[] {
    return this.adminSchedules;
  }

  public addAdminSchedule(schedule: Omit<AdminSchedule, 'id'>): AdminSchedule {
    const newSchedule: AdminSchedule = {
      ...schedule,
      id: 'sch-' + Math.random().toString(36).substring(2, 8)
    };
    this.adminSchedules = [newSchedule, ...this.adminSchedules];
    this.saveToStorage(STORAGE_KEYS.ADMIN_SCHEDULES, this.adminSchedules);
    return newSchedule;
  }

  public updateAdminScheduleStatus(id: string, status: AdminSchedule['status']) {
    this.adminSchedules = this.adminSchedules.map(s => (s.id === id ? { ...s, status } : s));
    this.saveToStorage(STORAGE_KEYS.ADMIN_SCHEDULES, this.adminSchedules);
  }

  public getLoadingRecords(): LoadingDurationRecord[] {
    return this.loadingRecords;
  }

  public addLoadingRecord(record: Omit<LoadingDurationRecord, 'id'>): LoadingDurationRecord {
    const newRecord: LoadingDurationRecord = {
      ...record,
      id: 'load-' + Math.random().toString(36).substring(2, 8)
    };
    this.loadingRecords = [newRecord, ...this.loadingRecords];
    this.saveToStorage(STORAGE_KEYS.LOADING_RECORDS, this.loadingRecords);
    return newRecord;
  }

  public getSkillProfiles(): AdminSkillProfile[] {
    return this.skillProfiles;
  }

  public updateSkillProfile(id: string, updatedSkills: AdminSkillProfile['skills']) {
    this.skillProfiles = this.skillProfiles.map(p => {
      if (p.id === id) {
        const avgScore = Math.round(
          (updatedSkills.reduce((acc, s) => acc + s.level, 0) / (updatedSkills.length * 5)) * 100
        );
        return {
          ...p,
          skills: updatedSkills,
          overallScore: avgScore
        };
      }
      return p;
    });
    this.saveToStorage(STORAGE_KEYS.SKILL_PROFILES, this.skillProfiles);
  }

  public getJobdeskConfigs(): JobdeskConfig[] {
    return this.jobdeskConfigs;
  }

  public getSystemActivities(): SystemActivity[] {
    return [...this.systemActivities];
  }

  public logActivity(action: string, target: string, details: string) {
    const newActivity: SystemActivity = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      userFullName: this.currentUser.fullName,
      department: this.currentUser.department,
      action,
      target,
      details
    };
    this.systemActivities = [newActivity, ...this.systemActivities].slice(0, 100);
    this.saveToStorage('akk_system_activities_v1', this.systemActivities);
    this.notify();
  }

  public updateJobdeskConfig(id: string, updated: Partial<JobdeskConfig>) {
    this.jobdeskConfigs = this.jobdeskConfigs.map(j => (j.id === id ? { ...j, ...updated } : j));
    this.saveToStorage(STORAGE_KEYS.JOBDESK_CONFIGS, this.jobdeskConfigs);
  }

  // ==========================================
  // SPARE PARTS & ROUTINE MAINTENANCE METHODS
  // ==========================================
  public getSpareParts(): SparePart[] {
    return [...this.spareParts];
  }

  public addSparePart(part: Omit<SparePart, 'id'>): SparePart {
    const newPart: SparePart = {
      ...part,
      id: 'sp-' + Math.random().toString(36).substring(2, 9)
    };
    this.spareParts = [newPart, ...this.spareParts];
    this.saveToStorage(STORAGE_KEYS.SPARE_PARTS, this.spareParts);
    this.logActivity(
      'Tambah Sparepart Baru',
      newPart.name,
      `Stok Awal: ${newPart.stock} ${newPart.unit} (Lokasi: ${newPart.storageLocation})`
    );
    this.notify();
    return newPart;
  }

  public updateSparePart(id: string, updated: Partial<SparePart>): void {
    this.spareParts = this.spareParts.map(p => p.id === id ? { ...p, ...updated } : p);
    this.saveToStorage(STORAGE_KEYS.SPARE_PARTS, this.spareParts);
    this.notify();
  }

  public deleteSparePart(id: string): void {
    const part = this.spareParts.find(p => p.id === id);
    this.spareParts = this.spareParts.filter(p => p.id !== id);
    this.saveToStorage(STORAGE_KEYS.SPARE_PARTS, this.spareParts);
    if (part) {
      this.logActivity(
        'Hapus Master Sparepart',
        part.name,
        `Part ID: ${id} dihapus dari master inventaris`
      );
    }
    this.notify();
  }

  public restockSparePart(id: string, amount: number, notes?: string): void {
    const part = this.spareParts.find(p => p.id === id);
    if (!part) return;
    const newStock = part.stock + amount;
    const today = new Date().toISOString().substring(0, 10);
    this.spareParts = this.spareParts.map(p => 
      p.id === id ? { ...p, stock: newStock, lastRestockDate: today, notes: notes || p.notes } : p
    );
    this.saveToStorage(STORAGE_KEYS.SPARE_PARTS, this.spareParts);
    this.logActivity(
      'Restock Sparepart Masuk',
      part.name,
      `Penambahan +${amount} ${part.unit} (Total kini: ${newStock} ${part.unit}). Catatan: ${notes || '-'}`
    );
    this.notify();
  }

  public getSparePartUsages(fleetId?: string): SparePartUsage[] {
    if (fleetId) {
      return this.sparePartUsages.filter(u => u.fleetId === fleetId);
    }
    return [...this.sparePartUsages];
  }

  public recordSparePartUsage(usage: Omit<SparePartUsage, 'id'>): SparePartUsage {
    const newUsage: SparePartUsage = {
      ...usage,
      id: 'usg-' + Math.random().toString(36).substring(2, 9)
    };

    // 1. Simpan ke daftar riwayat pemakaian
    this.sparePartUsages = [newUsage, ...this.sparePartUsages];
    this.saveToStorage(STORAGE_KEYS.SPARE_PART_USAGES, this.sparePartUsages);

    // 2. Potong stok otomatis di master inventaris gudang jika partId cocok
    if (usage.partId) {
      this.spareParts = this.spareParts.map(p => {
        if (p.id === usage.partId) {
          const reducedStock = Math.max(0, p.stock - usage.quantity);
          return { ...p, stock: reducedStock };
        }
        return p;
      });
      this.saveToStorage(STORAGE_KEYS.SPARE_PARTS, this.spareParts);
    }

    // 3. Sinkronisasi tanggal servis terakhir pada armada
    if (usage.fleetId) {
      this.fleets = this.fleets.map(f => {
        if (f.id === usage.fleetId) {
          return {
            ...f,
            lastMaintenance: usage.replacementDate,
            odometerKm: Math.max(f.odometerKm || 0, usage.odometerKm)
          };
        }
        return f;
      });
      this.saveToStorage(STORAGE_KEYS.FLEETS, this.fleets);
    }

    // 4. Catat ke audit log aktivitas sistem
    this.logActivity(
      'Ganti Komponen Rutin',
      `${usage.plateNumber} (${usage.initialCode || 'Armada'})`,
      `Penggantian ${usage.quantity} ${usage.unit} ${usage.partName} pada ${usage.odometerKm} KM oleh ${usage.mechanicOrWorkshop}`
    );

    this.notify();
    return newUsage;
  }

  public deleteSparePartUsage(id: string): void {
    const item = this.sparePartUsages.find(u => u.id === id);
    this.sparePartUsages = this.sparePartUsages.filter(u => u.id !== id);
    this.saveToStorage(STORAGE_KEYS.SPARE_PART_USAGES, this.sparePartUsages);
    if (item) {
      this.logActivity(
        'Hapus Log Ganti Sparepart',
        item.plateNumber,
        `Catatan penggantian ${item.partName} dihapus`
      );
    }
    this.notify();
  }

  public getFleetRoutineComponentsStatus(fleetId: string) {
    const usages = this.sparePartUsages.filter(u => u.fleetId === fleetId);
    const fleet = this.fleets.find(f => f.id === fleetId);
    const currentKm = fleet?.odometerKm || 50000;
    const now = new Date().getTime();

    // Helper untuk cari penggantian terakhir per kategori
    const getLatest = (cat: SparePartCategory) => {
      const match = usages
        .filter(u => u.category === cat)
        .sort((a, b) => new Date(b.replacementDate).getTime() - new Date(a.replacementDate).getTime())[0];
      return match;
    };

    const latestOil = getLatest('oli');
    const latestTire = getLatest('ban');
    const latestBattery = getLatest('aki');
    const latestFilter = getLatest('filter');

    const calculateStatus = (usage: SparePartUsage | undefined, defaultDays: number, defaultKm: number) => {
      if (!usage) {
        return {
          status: 'warning' as const,
          label: 'Perlu Cek',
          lastDate: '-',
          lastKm: 0,
          nextTarget: `${defaultKm.toLocaleString('id-ID')} KM`
        };
      }

      const diffDays = Math.floor((now - new Date(usage.replacementDate).getTime()) / (1000 * 60 * 60 * 24));
      const targetKm = usage.nextReplacementKm || (usage.odometerKm + defaultKm);
      const remainingKm = targetKm - currentKm;

      if (remainingKm <= 0 || diffDays > defaultDays) {
        return {
          status: 'urgent' as const,
          label: 'Wajib Ganti Segera',
          lastDate: usage.replacementDate,
          lastKm: usage.odometerKm,
          nextTarget: `${targetKm.toLocaleString('id-ID')} KM`,
          detail: `Sudah lewat ${Math.abs(remainingKm).toLocaleString('id-ID')} KM (${diffDays} hari lalu)`
        };
      }

      if (remainingKm <= 1500 || diffDays >= defaultDays * 0.8) {
        return {
          status: 'warning' as const,
          label: 'Segera Jadwalkan',
          lastDate: usage.replacementDate,
          lastKm: usage.odometerKm,
          nextTarget: `${targetKm.toLocaleString('id-ID')} KM`,
          detail: `Sisa ${remainingKm.toLocaleString('id-ID')} KM (${diffDays} hari pakai)`
        };
      }

      return {
        status: 'good' as const,
        label: 'Kondisi Prima',
        lastDate: usage.replacementDate,
        lastKm: usage.odometerKm,
        nextTarget: `${targetKm.toLocaleString('id-ID')} KM`,
        detail: `Pemakaian ${diffDays} hari (${remainingKm.toLocaleString('id-ID')} KM lagi)`
      };
    };

    return {
      fleet,
      oil: {
        latest: latestOil,
        ...calculateStatus(latestOil, 90, 10000) // Oli: 3 bulan / 10.000 KM
      },
      tire: {
        latest: latestTire,
        ...calculateStatus(latestTire, 365, 50000) // Ban: 1 tahun / 50.000 KM
      },
      battery: {
        latest: latestBattery,
        ...calculateStatus(latestBattery, 540, 80000) // Aki: 1.5 tahun / 80.000 KM
      },
      filter: {
        latest: latestFilter,
        ...calculateStatus(latestFilter, 90, 10000)
      }
    };
  }

  public resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.FLEETS);
    localStorage.removeItem(STORAGE_KEYS.CREWS);
    localStorage.removeItem(STORAGE_KEYS.STORES);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.SALES_ORDERS);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SCHEDULES);
    localStorage.removeItem(STORAGE_KEYS.LOADING_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.SKILL_PROFILES);
    localStorage.removeItem(STORAGE_KEYS.JOBDESK_CONFIGS);
    localStorage.removeItem(STORAGE_KEYS.SPARE_PARTS);
    localStorage.removeItem(STORAGE_KEYS.SPARE_PART_USAGES);
    localStorage.removeItem(STORAGE_KEYS.FUEL_LOGS);
    this.fleets = [...INITIAL_FLEETS];
    this.crews = [...INITIAL_CREWS];
    this.stores = [...INITIAL_STORES];
    this.schedules = [...INITIAL_SCHEDULES];
    this.salesOrders = [...INITIAL_SALES_ORDERS];
    this.adminActivities = [...INITIAL_ADMIN_ACTIVITIES];
    this.adminSchedules = [...INITIAL_ADMIN_SCHEDULES];
    this.loadingRecords = [...INITIAL_LOADING_RECORDS];
    this.skillProfiles = [...INITIAL_SKILL_PROFILES];
    this.jobdeskConfigs = [...INITIAL_JOBDESK_CONFIGS];
    this.spareParts = [...INITIAL_SPARE_PARTS];
    this.sparePartUsages = [...INITIAL_SPARE_PART_USAGES];
    this.fuelLogs = [...INITIAL_FUEL_LOGS];
    this.saveToStorage(STORAGE_KEYS.FLEETS, this.fleets);
    this.saveToStorage(STORAGE_KEYS.CREWS, this.crews);
    this.saveToStorage(STORAGE_KEYS.STORES, this.stores);
    this.saveToStorage(STORAGE_KEYS.SCHEDULES, this.schedules);
    this.saveToStorage(STORAGE_KEYS.SALES_ORDERS, this.salesOrders);
    this.saveToStorage(STORAGE_KEYS.ADMIN_ACTIVITIES, this.adminActivities);
    this.saveToStorage(STORAGE_KEYS.ADMIN_SCHEDULES, this.adminSchedules);
    this.saveToStorage(STORAGE_KEYS.LOADING_RECORDS, this.loadingRecords);
    this.saveToStorage(STORAGE_KEYS.SKILL_PROFILES, this.skillProfiles);
    this.saveToStorage(STORAGE_KEYS.JOBDESK_CONFIGS, this.jobdeskConfigs);
    this.saveToStorage(STORAGE_KEYS.SPARE_PARTS, this.spareParts);
    this.saveToStorage(STORAGE_KEYS.SPARE_PART_USAGES, this.sparePartUsages);
    this.saveToStorage(STORAGE_KEYS.FUEL_LOGS, this.fuelLogs);
  }

  // ==========================================
  // MANAJEMEN EFISIENSI BBM ARMADA (FUEL STORE)
  // ==========================================
  public getFuelLogs(): FuelLog[] {
    return [...this.fuelLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getFuelLogById(id: string): FuelLog | undefined {
    return this.fuelLogs.find(log => log.id === id);
  }

  public addFuelLog(data: Omit<FuelLog, 'id' | 'createdAt' | 'ratioKmPerLiter' | 'costPerKm' | 'efficiencyStatus' | 'totalCost' | 'distanceKm' | 'targetRatio'>): FuelLog {
    const fleet = this.fleets.find(f => f.id === data.fleetId);
    const vehicleType = data.vehicleType || fleet?.vehicleType || 'Engkel Long';
    const targetConfig = FUEL_TARGET_RATIOS[vehicleType] || { target: 7.5, minAcceptable: 6.4, label: '7.5 KM / L' };
    const targetRatio = targetConfig.target;

    const distanceKm = Math.max(0, data.endOdometerKm - data.startOdometerKm);
    const totalCost = Math.round(data.liters * data.costPerLiter);
    const ratioKmPerLiter = data.liters > 0 ? Number((distanceKm / data.liters).toFixed(2)) : 0;
    const literPerKm = distanceKm > 0 ? Number((data.liters / distanceKm).toFixed(4)) : 0;
    const literPer100Km = distanceKm > 0 ? Number(((data.liters / distanceKm) * 100).toFixed(2)) : 0;
    const costPerKm = distanceKm > 0 ? Math.round(totalCost / distanceKm) : 0;

    let efficiencyStatus: EfficiencyStatus = 'Efisien / Normal';
    if (ratioKmPerLiter >= targetRatio * 1.05) {
      efficiencyStatus = 'Sangat Efisien';
    } else if (ratioKmPerLiter >= targetRatio * 0.90) {
      efficiencyStatus = 'Efisien / Normal';
    } else if (ratioKmPerLiter >= targetRatio * 0.75) {
      efficiencyStatus = 'Boros';
    } else {
      efficiencyStatus = 'Kritis / Potensi Anomali';
    }

    const newLog: FuelLog = {
      ...data,
      id: `fuel-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      vehicleType,
      targetRatio,
      distanceKm,
      totalCost,
      ratioKmPerLiter,
      literPerKm,
      literPer100Km,
      costPerKm,
      efficiencyStatus,
      createdAt: new Date().toISOString(),
      verifiedBy: data.verifiedBy || this.currentUser.fullName
    };

    this.fuelLogs = [newLog, ...this.fuelLogs];
    this.saveToStorage(STORAGE_KEYS.FUEL_LOGS, this.fuelLogs);

    if (fleet && data.endOdometerKm > (fleet.odometerKm || 0)) {
      this.fleets = this.fleets.map(f =>
        f.id === fleet.id ? { ...f, odometerKm: data.endOdometerKm } : f
      );
      this.saveToStorage(STORAGE_KEYS.FLEETS, this.fleets);
    }

    this.logActivity(
      'Pencatatan BBM Armada',
      `${newLog.plateNumber} (${newLog.initialCode || 'Armada'})`,
      `Pengisian ${newLog.liters} L ${newLog.fuelType} (Rp ${totalCost.toLocaleString('id-ID')}) - Rasio: ${ratioKmPerLiter} KM/L [${efficiencyStatus}]`
    );

    this.notify();
    return newLog;
  }

  public updateFuelLog(id: string, updates: Partial<FuelLog>) {
    const existing = this.fuelLogs.find(l => l.id === id);
    if (!existing) return;

    const merged = { ...existing, ...updates };
    const fleet = this.fleets.find(f => f.id === merged.fleetId);
    const vehicleType = merged.vehicleType || fleet?.vehicleType || 'Engkel Long';
    const targetConfig = FUEL_TARGET_RATIOS[vehicleType] || { target: 7.5, minAcceptable: 6.4, label: '7.5 KM / L' };
    const targetRatio = targetConfig.target;

    const distanceKm = Math.max(0, merged.endOdometerKm - merged.startOdometerKm);
    const totalCost = Math.round(merged.liters * merged.costPerLiter);
    const ratioKmPerLiter = merged.liters > 0 ? Number((distanceKm / merged.liters).toFixed(2)) : 0;
    const literPerKm = distanceKm > 0 ? Number((merged.liters / distanceKm).toFixed(4)) : 0;
    const literPer100Km = distanceKm > 0 ? Number(((merged.liters / distanceKm) * 100).toFixed(2)) : 0;
    const costPerKm = distanceKm > 0 ? Math.round(totalCost / distanceKm) : 0;

    let efficiencyStatus: EfficiencyStatus = 'Efisien / Normal';
    if (ratioKmPerLiter >= targetRatio * 1.05) {
      efficiencyStatus = 'Sangat Efisien';
    } else if (ratioKmPerLiter >= targetRatio * 0.90) {
      efficiencyStatus = 'Efisien / Normal';
    } else if (ratioKmPerLiter >= targetRatio * 0.75) {
      efficiencyStatus = 'Boros';
    } else {
      efficiencyStatus = 'Kritis / Potensi Anomali';
    }

    const updatedLog: FuelLog = {
      ...merged,
      targetRatio,
      distanceKm,
      totalCost,
      ratioKmPerLiter,
      literPerKm,
      literPer100Km,
      costPerKm,
      efficiencyStatus
    };

    this.fuelLogs = this.fuelLogs.map(l => l.id === id ? updatedLog : l);
    this.saveToStorage(STORAGE_KEYS.FUEL_LOGS, this.fuelLogs);

    this.logActivity(
      'Edit Log Pengisian BBM',
      updatedLog.plateNumber,
      `Pembaruan catatan BBM ID: ${id}`
    );

    this.notify();
  }

  public deleteFuelLog(id: string) {
    const item = this.fuelLogs.find(l => l.id === id);
    this.fuelLogs = this.fuelLogs.filter(l => l.id !== id);
    this.saveToStorage(STORAGE_KEYS.FUEL_LOGS, this.fuelLogs);

    if (item) {
      this.logActivity(
        'Hapus Log Pengisian BBM',
        item.plateNumber,
        `Catatan pengisian BBM ${item.liters} L pada tanggal ${item.date} dihapus`
      );
    }
    this.notify();
  }

  public getFleetFuelSummary(): FleetFuelSummary[] {
    return this.fleets.map(fleet => {
      const logs = this.fuelLogs.filter(l => l.fleetId === fleet.id);
      const totalLogs = logs.length;
      const totalLiters = logs.reduce((acc, l) => acc + l.liters, 0);
      const totalCost = logs.reduce((acc, l) => acc + l.totalCost, 0);
      const totalDistanceKm = logs.reduce((acc, l) => acc + l.distanceKm, 0);

      const targetConfig = FUEL_TARGET_RATIOS[fleet.vehicleType] || { target: 7.5, minAcceptable: 6.4, label: '7.5 KM / L' };
      const targetRatio = targetConfig.target;
      const avgKmPerLiter = totalLiters > 0 ? Number((totalDistanceKm / totalLiters).toFixed(2)) : targetRatio;
      
      // Rata-rata Konsumsi Liter per Kilometer
      const avgLiterPerKm = totalDistanceKm > 0 ? Number((totalLiters / totalDistanceKm).toFixed(4)) : (targetRatio > 0 ? Number((1 / targetRatio).toFixed(4)) : 0);
      const avgLiterPer100Km = totalDistanceKm > 0 ? Number(((totalLiters / totalDistanceKm) * 100).toFixed(2)) : (targetRatio > 0 ? Number((100 / targetRatio).toFixed(2)) : 0);
      const targetLiterPerKm = targetRatio > 0 ? Number((1 / targetRatio).toFixed(4)) : 0;
      const targetLiterPer100Km = targetRatio > 0 ? Number((100 / targetRatio).toFixed(2)) : 0;

      const avgCostPerKm = totalDistanceKm > 0 ? Math.round(totalCost / totalDistanceKm) : 0;
      const efficiencyScore = targetRatio > 0 ? Math.round((avgKmPerLiter / targetRatio) * 100) : 100;
      const anomaliesCount = logs.filter(l => l.efficiencyStatus === 'Boros' || l.efficiencyStatus === 'Kritis / Potensi Anomali').length;

      let status: EfficiencyStatus = 'Efisien / Normal';
      if (efficiencyScore >= 105) status = 'Sangat Efisien';
      else if (efficiencyScore >= 90) status = 'Efisien / Normal';
      else if (efficiencyScore >= 75) status = 'Boros';
      else status = 'Kritis / Potensi Anomali';

      return {
        fleetId: fleet.id,
        plateNumber: fleet.plateNumber,
        initialCode: fleet.initialCode,
        vehicleType: fleet.vehicleType,
        totalLogs,
        totalLiters,
        totalCost,
        totalDistanceKm,
        avgKmPerLiter,
        avgLiterPerKm,
        avgLiterPer100Km,
        targetRatio,
        targetLiterPerKm,
        targetLiterPer100Km,
        avgCostPerKm,
        efficiencyScore,
        status,
        anomaliesCount
      };
    });
  }

  public getDriverFuelScores(): DriverFuelScore[] {
    const driverMap = new Map<string, {
      driverId: string;
      driverName: string;
      logs: FuelLog[];
    }>();

    this.fuelLogs.forEach(log => {
      const key = log.driverName || 'Driver Tidak Terdaftar';
      if (!driverMap.has(key)) {
        driverMap.set(key, {
          driverId: log.driverId || key,
          driverName: key,
          logs: []
        });
      }
      driverMap.get(key)!.logs.push(log);
    });

    const scores: DriverFuelScore[] = Array.from(driverMap.values()).map(item => {
      const totalTrips = item.logs.length;
      const totalDistanceKm = item.logs.reduce((acc, l) => acc + l.distanceKm, 0);
      const totalLiters = item.logs.reduce((acc, l) => acc + l.liters, 0);
      const avgKmPerLiter = totalLiters > 0 ? Number((totalDistanceKm / totalLiters).toFixed(2)) : 0;

      const avgEfficiencyRatio = item.logs.reduce((acc, l) => acc + (l.ratioKmPerLiter / (l.targetRatio || 7.5)), 0) / (totalTrips || 1);
      const ecoDrivingScore = Math.min(100, Math.max(40, Math.round(avgEfficiencyRatio * 90)));

      let badge: 'Master Eco-Driver' | 'Driver Efisien' | 'Perlu Pembinaan' = 'Driver Efisien';
      let recommendation = 'Menjaga kecepatan stabil dan pola perpindahan gigi yang tepat.';

      if (ecoDrivingScore >= 90) {
        badge = 'Master Eco-Driver';
        recommendation = 'Pengemudi teladan dengan akselerasi halus, pengereman terencana, dan efisiensi BBM prima.';
      } else if (ecoDrivingScore < 75) {
        badge = 'Perlu Pembinaan';
        recommendation = 'Perlu evaluasi pola idling berlebih saat antre muat dan hindari akselerasi agresif di tanjakan.';
      }

      return {
        driverId: item.driverId,
        driverName: item.driverName,
        totalTrips,
        totalDistanceKm,
        totalLiters,
        avgKmPerLiter,
        ecoDrivingScore,
        ranking: 0,
        badge,
        recommendation
      };
    });

    scores.sort((a, b) => b.ecoDrivingScore - a.ecoDrivingScore);
    scores.forEach((s, idx) => {
      s.ranking = idx + 1;
    });

    return scores;
  }

  public getFuelKPISummary() {
    const totalLiters = this.fuelLogs.reduce((acc, l) => acc + l.liters, 0);
    const totalCost = this.fuelLogs.reduce((acc, l) => acc + l.totalCost, 0);
    const totalDistanceKm = this.fuelLogs.reduce((acc, l) => acc + l.distanceKm, 0);
    const overallAvgKmPerLiter = totalLiters > 0 ? Number((totalDistanceKm / totalLiters).toFixed(2)) : 0;
    const overallAvgLiterPerKm = totalDistanceKm > 0 ? Number((totalLiters / totalDistanceKm).toFixed(4)) : 0;
    const overallAvgLiterPer100Km = totalDistanceKm > 0 ? Number(((totalLiters / totalDistanceKm) * 100).toFixed(2)) : 0;
    const overallAvgCostPerKm = totalDistanceKm > 0 ? Math.round(totalCost / totalDistanceKm) : 0;
    const totalAnomalies = this.fuelLogs.filter(l => l.efficiencyStatus === 'Boros' || l.efficiencyStatus === 'Kritis / Potensi Anomali').length;

    const fleetSummaries = this.getFleetFuelSummary();
    const sortedFleets = [...fleetSummaries].sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    const topFleet = sortedFleets[0];
    const leastFleet = sortedFleets[sortedFleets.length - 1];

    const driverScores = this.getDriverFuelScores();
    const topDriver = driverScores[0];

    return {
      totalLiters,
      totalCost,
      totalDistanceKm,
      overallAvgKmPerLiter,
      overallAvgLiterPerKm,
      overallAvgLiterPer100Km,
      overallAvgCostPerKm,
      totalAnomalies,
      topFleet,
      leastFleet,
      topDriver,
      totalRecords: this.fuelLogs.length
    };
  }

  // Swap Shift Methods
  private swapShiftRequests: SwapShiftRequest[] = [];

  public getSwapShiftRequests(): SwapShiftRequest[] {
    return [...this.swapShiftRequests];
  }

  public submitSwapShiftRequest(req: Omit<SwapShiftRequest, 'id' | 'status' | 'requestedAt'>): SwapShiftRequest {
    const newReq: SwapShiftRequest = {
      ...req,
      id: 'swp-' + Math.random().toString(36).substring(2, 9),
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    this.swapShiftRequests = [newReq, ...this.swapShiftRequests];
    // Normally save to storage here if persistent
    this.notify();
    return newReq;
  }

  // ==========================================
  // TIRE WEAR PREDICTION (PREDIKSI KEAUSAN BAN)
  // Berdasarkan total jarak tempuh harian armada dari Tracksolid
  // ==========================================
  public getFleetTireWearPredictions(): FleetTireWearPrediction[] {
    const devices = this.getDevices();
    const tireUsages = this.sparePartUsages.filter(u => u.category === 'ban');
    const now = new Date();

    return this.fleets.map(fleet => {
      // Find matching Tracksolid GPS device
      const matchedDevice = devices.find(d =>
        d.vehiclePlate.toLowerCase().replace(/\s+/g, '') === fleet.plateNumber.toLowerCase().replace(/\s+/g, '') ||
        (fleet.gpsImei && d.imei === fleet.gpsImei) ||
        (fleet.initialCode && d.vehicleName && d.vehicleName.toLowerCase().includes(fleet.initialCode.toLowerCase().split('/')[0].trim()))
      );

      // Total daily mileage from Tracksolid (todayMileageKm)
      // If Tracksolid has 0 or unavailable, fall back to realistic daily route average
      const dailyMileage = matchedDevice?.todayMileageKm && matchedDevice.todayMileageKm > 0
        ? matchedDevice.todayMileageKm
        : fleet.status === 'on-duty' ? 88.5 : fleet.status === 'available' ? 42.0 : 0;

      // Find latest tire change record from spare parts usage
      const latestUsage = tireUsages
        .filter(u => u.fleetId === fleet.id || u.plateNumber.toLowerCase().replace(/\s+/g, '') === fleet.plateNumber.toLowerCase().replace(/\s+/g, ''))
        .sort((a, b) => new Date(b.replacementDate).getTime() - new Date(a.replacementDate).getTime())[0];

      // Fleet specific parameters
      const isPickUp = fleet.vehicleType === 'Pick Up Box';
      const isDouble = fleet.vehicleType === 'Double STD';
      const isEngkel = fleet.vehicleType === 'Engkel STD' || fleet.vehicleType === 'Engkel Long';

      const initialTreadDepthMm = isPickUp ? 10.0 : isDouble ? 15.0 : 13.0; // Ketebalan tapak ban baru
      const minTreadDepthLegalMm = 2.0; // Batas minimal alur ban aman (legal limit 1.6mm - safety limit 2.0mm)
      const usableTreadDepthMm = initialTreadDepthMm - minTreadDepthLegalMm;

      // Tire brand & model
      const tireBrandModel = isPickUp 
        ? 'Bridgestone Ecopia R156 8PR' 
        : isDouble 
        ? 'Gajah Tunggal Super Lug Heavy Duty' 
        : 'Michelin X Multi Z Radial';

      const tireSize = isPickUp 
        ? '185/80 R14' 
        : isDouble 
        ? '7.50-16 14PR' 
        : '7.50-16 12PR';

      const maxLifespanKm = isPickUp ? 45000 : isDouble ? 60000 : 55000;
      const currentOdo = fleet.odometerKm || 50000;
      
      // Determine installed kilometer
      const installedAtKm = latestUsage ? latestUsage.odometerKm : Math.max(0, currentOdo - (currentOdo % maxLifespanKm));
      const accumulatedKm = Math.max(1200, currentOdo - installedAtKm);
      const remainingKm = Math.max(0, maxLifespanKm - accumulatedKm);
      
      // Calculate wear percentage (0% to 100%)
      const wearPercentage = Math.min(100, Number(((accumulatedKm / maxLifespanKm) * 100).toFixed(1)));
      const healthScore = Math.max(0, Number((100 - wearPercentage).toFixed(1)));

      // Current tread depth based on accumulated mileage
      const treadConsumedMm = (accumulatedKm / maxLifespanKm) * usableTreadDepthMm;
      const currentTreadDepthMm = Math.max(minTreadDepthLegalMm, Number((initialTreadDepthMm - treadConsumedMm).toFixed(2)));

      // Daily wear rate (mm per day) based on Tracksolid daily mileage
      // Formula: (usableTreadDepthMm / maxLifespanKm) * dailyMileage
      const dailyWearRateMm = dailyMileage > 0 
        ? Number(((usableTreadDepthMm / maxLifespanKm) * dailyMileage).toFixed(4)) 
        : 0.005;

      // Estimated days remaining until replacement
      const effectiveDailyKm = Math.max(dailyMileage, 35);
      const estimatedDaysRemaining = remainingKm > 0 
        ? Math.round(remainingKm / effectiveDailyKm) 
        : 0;

      // Projected replacement date
      const projectedDate = new Date(now.getTime() + estimatedDaysRemaining * 24 * 60 * 60 * 1000);
      const projectedReplacementDate = projectedDate.toISOString().substring(0, 10);

      // Rotation due every 10,000 km
      const rotationIntervalKm = 10000;
      const rotationDueKm = installedAtKm + (Math.floor(accumulatedKm / rotationIntervalKm) + 1) * rotationIntervalKm;
      const isRotationNeeded = (accumulatedKm % rotationIntervalKm) >= 8500;

      // Tire status logic
      let status: 'Optimal' | 'Waspada' | 'Kritis' = 'Optimal';
      let statusLabel = 'Kondisi Prima';
      let recommendation = 'Tekanan angin stabil, lanjutkan pemantauan harian.';

      if (remainingKm <= 3500 || currentTreadDepthMm <= 3.0 || wearPercentage >= 85) {
        status = 'Kritis';
        statusLabel = 'Wajib Ganti Segera';
        recommendation = `Alur tapak ban menipis (${currentTreadDepthMm} mm). Segera jadwalkan penggantian ban baru di gudang sparepart sebelum muatan berat.`;
      } else if (remainingKm <= 9000 || currentTreadDepthMm <= 5.0 || wearPercentage >= 65) {
        status = 'Waspada';
        statusLabel = 'Perlu Rotasi & Jadwal Ganti';
        recommendation = isRotationNeeded 
          ? `Disarankan rotasi ban silang (depan-belakang) pada ${rotationDueKm.toLocaleString('id-ID')} KM untuk mencegah aus tidak merata.`
          : `Ban masuk fase aus moderat. Pantau tekanan angin mingguan dan batasi beban overload.`;
      } else {
        status = 'Optimal';
        statusLabel = 'Kondisi Prima';
        recommendation = `Ban dalam performa terbaik (${healthScore}% health). Rekomendasi rotasi berikutnya pada ${rotationDueKm.toLocaleString('id-ID')} KM.`;
      }

      // Pressure (PSI)
      const recommendedPressurePsi = isPickUp ? 45 : isDouble ? 95 : 85;
      const pressureOffset = status === 'Kritis' ? -8 : status === 'Waspada' ? -4 : 0;
      const pressurePsi = recommendedPressurePsi + pressureOffset;

      return {
        fleetId: fleet.id,
        plateNumber: fleet.plateNumber,
        initialCode: fleet.initialCode,
        vehicleType: fleet.vehicleType,
        brand: fleet.brand || 'Mitsubishi',
        currentOdometerKm: currentOdo,
        todayMileageKm: Number(dailyMileage.toFixed(2)),
        trackedImei: matchedDevice?.imei,
        isGpsOnline: matchedDevice ? (matchedDevice.status === 'Online' || matchedDevice.status === 'Sleeping') : false,
        tireBrandModel,
        tireSize,
        initialTreadDepthMm,
        currentTreadDepthMm,
        minTreadDepthLegalMm,
        installedAtKm,
        accumulatedKm,
        maxLifespanKm,
        remainingKm,
        wearPercentage,
        healthScore,
        dailyWearRateMm,
        estimatedDaysRemaining,
        projectedReplacementDate,
        status,
        statusLabel,
        recommendation,
        rotationDueKm,
        isRotationNeeded,
        pressurePsi,
        recommendedPressurePsi
      };
    });
  }
}

export const logisticsStore = new LogisticsStore();
