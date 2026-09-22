export type UserRole = 'super_admin' | 'dispatcher' | 'driver' | 'sales_admin' | 'purchasing_admin' | 'hr_admin' | 'finance_tax_admin' | 'warehouse_admin' | 'marketing_online' | 'marketing_offline';
export type UserApprovalStatus = 'approved' | 'pending' | 'rejected';

export type FleetStatus = 'available' | 'on-duty' | 'maintenance';
export type CrewStatus = 'available' | 'on-duty' | 'off';
export type ShipmentStatus = 'scheduled' | 'in_transit' | 'delivered' | 'delayed';
export type VehicleType = 'Pick Up Box' | 'Engkel STD' | 'Engkel Long' | 'Double STD';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  department: string;
  status: UserApprovalStatus;
  createdAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
}

export interface Fleet {
  id: string;
  plateNumber: string;
  vehicleType: VehicleType;
  status: FleetStatus;
  initialCode?: string; // Inisial Mobil (e.g. WB-01, DS-1, N08)
  driverId?: string;
  gpsImei?: string;
  lastMaintenance?: string;
  year?: number;
  brand?: string;
  engineCc?: string;
  taxDueDate?: string; // Tanggal Jatuh Tempo Pajak (Tahunan)
  stnkExpiryDate?: string; // Masa Berlaku STNK / Plat (5 Tahunan)
  // Optional backwards compatibility fields
  tonnageCapacity?: number;
  currentTonnage?: number;
  fuelLevelPercent?: number;
  odometerKm?: number;
}

export interface Crew {
  id: string;
  name: string;
  phone: string;
  role: 'Driver Utama' | 'Driver Cadangan' | 'Kernet / Helper';
  licenseNumber: string;
  licenseType: 'SIM B2 Umum' | 'SIM B1 Umum' | 'SIM A';
  status: CrewStatus;
  currentFleetId?: string;
  tripsCompleted: number;
  rating: number; // e.g. 4.8 / 5
  certifications?: string[];
  routeExperience?: string[];
}

export interface RetailStore {
  id: string;
  storeCode: string;
  storeName: string;
  island: 'Jawa' | 'Sumatera' | 'Bali & Nusa Tenggara' | 'Kalimantan' | 'Sulawesi' | 'Papua & Maluku';
  province: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPerson: string;
  phone: string;
  deliveryWindow: string; // e.g. "08:00 - 17:00"
  storeCategory: 'Hypermarket' | 'Supermarket' | 'Distribution Hub' | 'Minimarket Cluster';
}

export interface Schedule {
  id: string;
  trackingNumber: string;
  originName: string;
  originCoords: [number, number];
  storeId: string;
  store?: RetailStore;
  fleetId: string;
  fleet?: Fleet;
  crewId: string;
  crewHelperId?: string;
  crew?: Crew;
  crewHelper?: Crew;
  status: ShipmentStatus;
  departureDate: string;
  estimatedArrival: string;
  actualArrival?: string;
  cargoDescription: string;
  cargoWeightTon: number;
  isInterIsland: boolean;
  ferryBookingCode?: string;
  transitPort?: string;
  notes?: string;
  createdAt: string;
  areaApprovalStatus?: 'approved' | 'pending' | 'not_required';
  areaTripCount?: number;
  areaName?: string;
}

export interface CrewDeliveryHistory {
  id: string;
  crewId: string;
  crewName: string;
  scheduleId: string;
  trackingNumber: string;
  storeName: string;
  area: string; // e.g. "Sumatera (Lampung)", "Jawa Barat (Bandung)", "Jawa Timur (Surabaya)", "Bali"
  city: string;
  island: string;
  vehiclePlate: string;
  vehicleType: VehicleType;
  cargoWeightTon: number;
  cargoDescription: string;
  completionDate: string;
  status: 'delivered' | 'returned' | 'partial';
  onTimeStatus: 'Tepat Waktu' | 'Terlambat' | 'Lebih Cepat';
  delayReason?: string;
  ratingReceived: number; // 1-5
  notes?: string;
  requiresAreaApproval?: boolean;
  areaTripSequenceNumber?: number; // Pengiriman ke-X di area yang sama
  areaApprovalStatus?: 'approved' | 'pending' | 'not_required';
  approvedBy?: string;
  approvedAt?: string;
}

export interface AreaDeliveryStat {
  area: string;
  island: string;
  totalTrips: number;
  lastTripDate: string;
  requiresApproval: boolean;
}

export interface AreaApprovalRequest {
  id: string;
  crewId: string;
  crewName: string;
  scheduleId?: string;
  targetArea: string;
  currentTripsInArea: number;
  thresholdLimit: number;
  storeName: string;
  plateNumber: string;
  departureDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reasonPolicy: string;
  notes?: string;
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface TrackingPoint {
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  engineStatus: 'RUNNING' | 'STOP' | 'IDLE';
  locationName?: string;
  odometerKm?: number;
}

export interface RouteStop {
  stopNumber: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  latitude: number;
  longitude: number;
  locationName: string;
  reason: 'Port Transit / Ferry Queue' | 'Driver Rest / Meals' | 'Traffic Congestion' | 'Retail Unloading' | 'Toll Gate Inspection';
}

export interface TrackingEvaluation {
  fileName: string;
  scheduleId?: string;
  totalPoints: number;
  totalDistanceKm: number;
  durationHours: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  totalIdleMinutes: number;
  routeDeviationKm: number;
  isWithinRouteTolerance: boolean;
  onTimeStatus: 'On-Time' | 'Early' | 'Delayed';
  delayMinutes: number;
  stops: RouteStop[];
  points: TrackingPoint[];
}

export interface TracksolidDevice {
  imei: string;
  vehiclePlate: string;
  vehicleName?: string;
  driverName: string;
  model: string;
  status: 'Online' | 'Offline' | 'Sleeping';
  accStatus: 'ON' | 'OFF';
  currentSpeedKmh: number;
  batteryPercent: number;
  signalGsm: number; // 1-5
  satellites: number;
  lastUpdate: string;
  latitude: number;
  longitude: number;
  address: string;
  stopDuration?: string;
  todayMileageKm?: number;
  lastFix?: string;
  coordinatesDms?: string;
  voltage?: string;
}

// ==========================================
// SALES ADMIN (ADMIN PENJUALAN) DATA SCHEMAS
// ==========================================

export interface SalesOrder {
  id: string;
  poNumber: string;
  clientName: string;
  orderDate: string;
  productType: 'Karton Box Corrugated (A1)' | 'Die-Cut Box E-Commerce' | 'Sheet Corrugated Board' | 'Offset Printing Packaging' | 'Heavy Duty Box';
  quantityPcs: number;
  totalAmount: number; // IDR
  paymentStatus: 'Lunas' | 'TOP 30 Hari' | 'TOP 14 Hari' | 'Menunggu DP';
  orderStatus: 'Draft' | 'PO Masuk' | 'SPK Produksi' | 'Siap Muat' | 'Terkirim';
  deliveryDestination: string;
  adminPic: string;
}

export interface AdminActivity {
  id: string;
  adminName: string;
  actionType: 'Input PO' | 'Follow Up Pembayaran' | 'Terbitkan DO' | 'Koordinasi Sampel' | 'Approval Diskon' | 'Update Resi Logistik';
  clientName: string;
  timestamp: string;
  status: 'completed' | 'in_progress' | 'pending';
  notes: string;
  durationMinutes: number;
}

export interface AdminSchedule {
  id: string;
  adminName: string;
  date: string;
  timeSlot: string;
  taskTitle: string;
  category: 'Order Processing' | 'Client Meeting / Visit' | 'Stock & Loading Coordination' | 'Invoice & AR Follow-up';
  priority: 'high' | 'medium' | 'low';
  status: 'completed' | 'scheduled' | 'rescheduled';
  locationOrChannel: string;
}

export interface LoadingDurationRecord {
  id: string;
  doNumber: string;
  clientName: string;
  fleetPlate: string;
  adminPic: string;
  cargoType: string;
  quantityBoxes: number;
  startQueueTime: string;
  startLoadingTime: string;
  finishLoadingTime: string;
  totalDurationMinutes: number;
  targetSlaMinutes: number;
  status: 'on_time' | 'delayed' | 'fast';
  delayReason?: string;
}

export interface SkillCategoryScore {
  skillName: string;
  level: 1 | 2 | 3 | 4 | 5; // 1: Beginner, 2: Developing, 3: Competent, 4: Advanced, 5: Master
  category: 'Teknis Kemasan' | 'Sistem & ERP' | 'Pelayanan Klien' | 'Logistik & Regulasi';
  certified: boolean;
}

export interface AdminSkillProfile {
  id: string;
  adminName: string;
  avatarUrl?: string;
  roleTitle: string;
  experienceYears: number;
  overallScore: number; // 0 - 100
  recentTraining: string;
  skills: SkillCategoryScore[];
}

export interface JobdeskConfig {
  id: string;
  roleName: string;
  assignedAdminNames: string[];
  territory: string;
  dailyTasks: string[];
  weeklyTasks: string[];
  kpiTargets: { name: string; target: string; weight: number }[];
  approvalLimits: string;
  slaCommitment: string;
}

export interface SystemActivity {
  id: string;
  timestamp: string;
  userFullName: string;
  department: string;
  action: string;
  target: string;
  details: string;
}

export type SparePartCategory = 'oli' | 'ban' | 'aki' | 'filter' | 'rem' | 'lainnya';

export interface SparePart {
  id: string;
  name: string;
  category: SparePartCategory;
  partNumber: string;
  unit: string;
  stock: number;
  minStock: number;
  costPerUnit: number;
  compatibleVehicles: string;
  storageLocation: string;
  lastRestockDate: string;
  notes?: string;
}

export interface SparePartUsage {
  id: string;
  fleetId: string;
  plateNumber: string;
  initialCode?: string;
  partId: string;
  partName: string;
  category: SparePartCategory;
  quantity: number;
  unit: string;
  replacementDate: string; // YYYY-MM-DD
  odometerKm: number; // KM saat penggantian
  nextReplacementKm?: number; // Target KM penggantian berikutnya
  nextReplacementDate?: string; // Target tanggal penggantian berikutnya
  mechanicOrWorkshop: string; // Nama bengkel / teknisi
  totalCost: number;
  notes?: string;
  performedBy: string;
}

export type FuelType = 'BioSolar' | 'Dexlite' | 'Pertamina Dex' | 'Pertalite' | 'Pertamax';
export type EfficiencyStatus = 'Sangat Efisien' | 'Efisien / Normal' | 'Boros' | 'Kritis / Potensi Anomali';

export interface FuelLog {
  id: string;
  fleetId: string;
  plateNumber: string;
  initialCode?: string;
  vehicleType: VehicleType;
  driverId?: string;
  driverName: string;
  date: string; // YYYY-MM-DD
  fuelType: FuelType;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  startOdometerKm: number;
  endOdometerKm: number;
  distanceKm: number;
  ratioKmPerLiter: number; // distanceKm / liters
  costPerKm: number; // totalCost / distanceKm
  targetRatio: number; // KM per liter standar sesuai jenis kendaraan
  literPerKm?: number; // Konsumsi liter per kilometer (liters / distanceKm)
  literPer100Km?: number; // Konsumsi liter per 100 kilometer
  efficiencyStatus: EfficiencyStatus;
  gasStation: string; // Nama / Lokasi SPBU
  receiptNumber?: string; // Nomor struk / nota SPBU
  routeTrip?: string; // Rute perjalanan pengiriman
  cargoLoadTon?: number; // Beban muatan saat perjalanan
  notes?: string;
  createdAt: string;
  verifiedBy?: string;
}

export interface FleetFuelSummary {
  fleetId: string;
  plateNumber: string;
  initialCode?: string;
  vehicleType: VehicleType;
  totalLogs: number;
  totalLiters: number;
  totalCost: number;
  totalDistanceKm: number;
  avgKmPerLiter: number; // KM per Liter
  avgLiterPerKm: number; // Liter per KM (Liters / DistanceKm)
  avgLiterPer100Km: number; // Liter per 100 KM
  targetRatio: number; // Target KM per Liter
  targetLiterPerKm: number; // Target Liter per KM (1 / targetRatio)
  targetLiterPer100Km: number; // Target Liter per 100 KM
  avgCostPerKm?: number; // Biaya per KM
  efficiencyScore: number; // Persentase terhadap target
  status: EfficiencyStatus;
  anomaliesCount: number;
}

export interface DriverFuelScore {
  driverId: string;
  driverName: string;
  totalTrips: number;
  totalDistanceKm: number;
  totalLiters: number;
  avgKmPerLiter: number;
  ecoDrivingScore: number; // 0 - 100
  ranking: number;
  badge: 'Master Eco-Driver' | 'Driver Efisien' | 'Perlu Pembinaan';
  recommendation: string;
}

