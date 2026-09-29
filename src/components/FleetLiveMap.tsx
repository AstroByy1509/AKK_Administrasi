import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { 
  Radio, 
  Truck, 
  MapPin, 
  Navigation, 
  Signal, 
  RotateCcw, 
  Search, 
  Filter, 
  Zap, 
  Battery, 
  Layers, 
  Compass, 
  Maximize2, 
  Minimize2, 
  Building2, 
  Clock, 
  ShieldCheck, 
  Activity, 
  ChevronRight,
  Eye,
  RefreshCw,
  Flame,
  AlertTriangle,
  Fuel
} from 'lucide-react';
import { TracksolidDevice, Fleet, Schedule, RetailStore } from '../types';
import { logisticsStore } from '../services/store';
import { CENTRAL_WAREHOUSE } from '../data/mockData';

interface FleetLiveMapProps {
  heightClass?: string;
  className?: string;
  selectedImeiFromParent?: string | null;
  onSelectFleet?: (device: TracksolidDevice) => void;
}

type MapTileProvider = 'dark' | 'osm' | 'satellite';

// 24-Hour Idling Hotspot Data Model
export interface IdleHotspot24h {
  id: string;
  locationName: string;
  latitude: number;
  longitude: number;
  totalIdleHours: number; // In hours (e.g. 4.5)
  idleMinutes: number;
  fleetsInvolvedCount: number;
  fleetPlates: string[];
  primaryReason: 'Ferry Queue / Port' | 'Warehouse Loading / Staging' | 'Driver Rest / Meals' | 'Retail Unloading Queue' | 'Traffic / Red Light Stop';
  severity: 'high' | 'medium' | 'low'; // High > 3h, Medium 1-3h, Low < 1h
  estimatedFuelWastedLiters: number; // ~1.5L per hour idle
}

// Default 24h Idle Hotspot Clusters across Key Transit Routes
const INITIAL_IDLE_HOTSPOTS_24H: IdleHotspot24h[] = [
  {
    id: 'hotspot-01',
    locationName: 'Pelabuhan Ketapang Transit Queue',
    latitude: -8.1415,
    longitude: 114.3980,
    totalIdleHours: 4.5,
    idleMinutes: 270,
    fleetsInvolvedCount: 3,
    fleetPlates: ['B 9128 UYX', 'P 9677 VB', 'B 9301 TXR'],
    primaryReason: 'Ferry Queue / Port',
    severity: 'high',
    estimatedFuelWastedLiters: 6.75
  },
  {
    id: 'hotspot-02',
    locationName: 'Gudang Pusat AKK Sukowidi Staging Area',
    latitude: -8.1906,
    longitude: 114.3708,
    totalIdleHours: 3.8,
    idleMinutes: 228,
    fleetsInvolvedCount: 4,
    fleetPlates: ['B 9802 KLS', 'B 9552 PKM', 'B 9445 WES', 'P 8801 UV'],
    primaryReason: 'Warehouse Loading / Staging',
    severity: 'high',
    estimatedFuelWastedLiters: 5.7
  },
  {
    id: 'hotspot-03',
    locationName: 'Rest Area Tol Probolinggo KM 820',
    latitude: -7.7540,
    longitude: 113.2160,
    totalIdleHours: 2.2,
    idleMinutes: 132,
    fleetsInvolvedCount: 2,
    fleetPlates: ['P 8848 U', 'B 9110 SYA'],
    primaryReason: 'Driver Rest / Meals',
    severity: 'medium',
    estimatedFuelWastedLiters: 3.3
  },
  {
    id: 'hotspot-04',
    locationName: 'DC Retail Surabaya Rungkut Unloading Gate',
    latitude: -7.3290,
    longitude: 112.7750,
    totalIdleHours: 2.8,
    idleMinutes: 168,
    fleetsInvolvedCount: 2,
    fleetPlates: ['B 9128 UYX', 'P 8381 VE'],
    primaryReason: 'Retail Unloading Queue',
    severity: 'medium',
    estimatedFuelWastedLiters: 4.2
  },
  {
    id: 'hotspot-05',
    locationName: 'Sanur Bali Retail Drop Point',
    latitude: -8.6750,
    longitude: 115.2580,
    totalIdleHours: 1.5,
    idleMinutes: 90,
    fleetsInvolvedCount: 1,
    fleetPlates: ['P 9812 AK'],
    primaryReason: 'Retail Unloading Queue',
    severity: 'medium',
    estimatedFuelWastedLiters: 2.25
  },
  {
    id: 'hotspot-06',
    locationName: 'Situbondo Lintas Pantura Rest Stop',
    latitude: -7.7050,
    longitude: 113.9920,
    totalIdleHours: 0.8,
    idleMinutes: 48,
    fleetsInvolvedCount: 1,
    fleetPlates: ['W 8603 PG'],
    primaryReason: 'Driver Rest / Meals',
    severity: 'low',
    estimatedFuelWastedLiters: 1.2
  }
];

export const FleetLiveMap: React.FC<FleetLiveMapProps> = ({
  heightClass = 'h-[550px]',
  className = '',
  selectedImeiFromParent = null,
  onSelectFleet
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Local State
  const [devices, setDevices] = useState<TracksolidDevice[]>(logisticsStore.getDevices());
  const [fleets, setFleets] = useState<Fleet[]>(logisticsStore.getFleets());
  const [stores, setStores] = useState<RetailStore[]>(logisticsStore.getStores());
  const [schedules, setSchedules] = useState<Schedule[]>(logisticsStore.getSchedules());

  const [selectedDevice, setSelectedDevice] = useState<TracksolidDevice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'moving' | 'sleeping' | 'offline'>('all');
  const [tileProvider, setTileProvider] = useState<MapTileProvider>('dark');
  const [isSimulatingLive, setIsSimulatingLive] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRetailStores, setShowRetailStores] = useState(true);
  
  // 🔥 Visual Heatmap Toggle for 24h Vehicle Idling Occurrences
  const [showIdleHeatmap, setShowIdleHeatmap] = useState<boolean>(true);
  const [selectedHotspot, setSelectedHotspot] = useState<IdleHotspot24h | null>(null);

  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Listen for changes in logisticsStore
  useEffect(() => {
    const unsubscribe = logisticsStore.subscribe(() => {
      setDevices(logisticsStore.getDevices());
      setFleets(logisticsStore.getFleets());
      setStores(logisticsStore.getStores());
      setSchedules(logisticsStore.getSchedules());
    });
    return () => unsubscribe();
  }, []);

  // Compute dynamic 24h idle hotspots (combining static cluster data + sleeping devices)
  const idleHotspots24h: IdleHotspot24h[] = useMemo(() => {
    const dynamicHotspots: IdleHotspot24h[] = [...INITIAL_IDLE_HOTSPOTS_24H];

    // Append sleeping/idle devices as dynamic hotspots
    devices.forEach(dev => {
      if (dev.status === 'Sleeping' && dev.latitude && dev.longitude) {
        const existing = dynamicHotspots.find(
          h => Math.abs(h.latitude - dev.latitude) < 0.008 && Math.abs(h.longitude - dev.longitude) < 0.008
        );

        if (existing) {
          if (!existing.fleetPlates.includes(dev.vehiclePlate)) {
            existing.fleetPlates.push(dev.vehiclePlate);
            existing.fleetsInvolvedCount += 1;
          }
        } else {
          dynamicHotspots.push({
            id: `dynamic-${dev.imei}`,
            locationName: dev.address || `Titik Diam ${dev.vehiclePlate}`,
            latitude: dev.latitude,
            longitude: dev.longitude,
            totalIdleHours: 1.5,
            idleMinutes: 90,
            fleetsInvolvedCount: 1,
            fleetPlates: [dev.vehiclePlate],
            primaryReason: 'Warehouse Loading / Staging',
            severity: 'medium',
            estimatedFuelWastedLiters: 2.25
          });
        }
      }
    });

    return dynamicHotspots;
  }, [devices]);

  // Aggregated 24h Idling Metrics for Summary Pill
  const aggregatedIdleMetrics = useMemo(() => {
    const totalHotspots = idleHotspots24h.length;
    const totalIdleHours = Number(idleHotspots24h.reduce((sum, h) => sum + h.totalIdleHours, 0).toFixed(1));
    const totalFuelWasted = Number(idleHotspots24h.reduce((sum, h) => sum + h.estimatedFuelWastedLiters, 0).toFixed(1));
    const highSeverityCount = idleHotspots24h.filter(h => h.severity === 'high').length;

    return {
      totalHotspots,
      totalIdleHours,
      totalFuelWasted,
      highSeverityCount
    };
  }, [idleHotspots24h]);

  // Filtered devices list
  const filteredDevices = useMemo(() => {
    return devices.filter(dev => {
      const matchSearch = 
        dev.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dev.vehicleName && dev.vehicleName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        dev.imei.includes(searchQuery);

      let matchStatus = true;
      if (statusFilter === 'moving') {
        matchStatus = dev.currentSpeedKmh > 0 || dev.accStatus === 'ON';
      } else if (statusFilter === 'sleeping') {
        matchStatus = dev.status === 'Sleeping' || (dev.currentSpeedKmh === 0 && dev.accStatus === 'OFF');
      } else if (statusFilter === 'offline') {
        matchStatus = dev.status === 'Offline';
      }

      return matchSearch && matchStatus;
    });
  }, [devices, searchQuery, statusFilter]);

  // Handle parent-selected IMEI
  useEffect(() => {
    if (selectedImeiFromParent) {
      const found = devices.find(d => d.imei === selectedImeiFromParent);
      if (found) {
        setSelectedDevice(found);
        if (mapInstanceRef.current && found.latitude && found.longitude) {
          mapInstanceRef.current.setView([found.latitude, found.longitude], 14, { animate: true });
        }
      }
    }
  }, [selectedImeiFromParent, devices]);

  // Live GPS simulation pulse
  useEffect(() => {
    if (!isSimulatingLive) return;

    const interval = setInterval(() => {
      setDevices(prevDevices => {
        return prevDevices.map(dev => {
          if (dev.status === 'Online' || dev.currentSpeedKmh > 0) {
            const latDelta = (Math.random() - 0.48) * 0.0008;
            const lngDelta = (Math.random() - 0.48) * 0.0008;
            const newLat = Number((dev.latitude + latDelta).toFixed(6));
            const newLng = Number((dev.longitude + lngDelta).toFixed(6));
            const speedFluctuation = Math.max(15, Math.min(85, dev.currentSpeedKmh + Math.floor(Math.random() * 5) - 2));

            return {
              ...dev,
              latitude: newLat,
              longitude: newLng,
              currentSpeedKmh: speedFluctuation,
              lastFix: new Date().toLocaleTimeString(),
              lastUpdate: new Date().toISOString().replace('T', ' ').substring(0, 19)
            };
          }
          return dev;
        });
      });
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulatingLive]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = -8.1906;
      const initialLng = 114.3708;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 10,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const getTileUrl = (provider: MapTileProvider) => {
        if (provider === 'osm') {
          return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        }
        if (provider === 'satellite') {
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        }
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      };

      const tileLayer = L.tileLayer(getTileUrl(tileProvider), {
        attribution: '&copy; OpenStreetMap &amp; Tracksolid API',
        maxZoom: 19
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    if (tileProvider === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    } else if (tileProvider === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    const newTileLayer = L.tileLayer(url, {
      attribution: '&copy; OpenStreetMap &amp; Tracksolid API',
      maxZoom: 19
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
  }, [tileProvider]);

  // Render Map Markers (Fleets, Central Hub, Stores, & 🔥 24h Idling Heatmap Circles)
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    // 1. 🔥 Overlay 24-Hour Idling Occurrences Heatmap Circles
    if (showIdleHeatmap) {
      idleHotspots24h.forEach(hotspot => {
        let circleColor = '#ef4444'; // Red for High (> 3h)
        let fillColor = '#f87171';
        let radiusMeters = 3500;

        if (hotspot.severity === 'medium') {
          circleColor = '#f59e0b'; // Amber for Medium (1-3h)
          fillColor = '#fbbf24';
          radiusMeters = 2500;
        } else if (hotspot.severity === 'low') {
          circleColor = '#eab308'; // Yellow for Low (< 1h)
          fillColor = '#fde047';
          radiusMeters = 1800;
        }

        // Inner solid glow circle
        const heatCircle = L.circle([hotspot.latitude, hotspot.longitude], {
          radius: radiusMeters,
          color: circleColor,
          weight: 2,
          opacity: 0.8,
          fillColor: fillColor,
          fillOpacity: 0.25
        });

        // Pulsing HTML Div Marker at hotspot center
        const heatMarkerIcon = L.divIcon({
          className: 'custom-heat-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group">
              <div class="absolute -inset-3 rounded-full ${hotspot.severity === 'high' ? 'bg-rose-500/40 animate-ping' : 'bg-amber-500/30 animate-pulse'}"></div>
              <div class="w-8 h-8 rounded-full ${hotspot.severity === 'high' ? 'bg-rose-950 border-rose-500' : 'bg-amber-950 border-amber-500'} border-2 text-white flex items-center justify-center shadow-2xl font-bold text-xs">
                🔥
              </div>
              <div class="absolute top-full mt-1 bg-slate-950/95 text-rose-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-rose-500/40 whitespace-nowrap shadow-xl">
                Idle ${hotspot.totalIdleHours} Jam
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const heatMarker = L.marker([hotspot.latitude, hotspot.longitude], { icon: heatMarkerIcon });

        heatMarker.on('click', () => {
          setSelectedHotspot(hotspot);
        });

        // Bind popup to Heatmap Circle
        const popupContent = `
          <div class="p-3 text-xs text-slate-100 font-sans max-w-xs space-y-2">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1.5">
              <div class="flex items-center gap-1.5 font-bold text-rose-400 text-xs">
                🔥 <span>${hotspot.locationName}</span>
              </div>
              <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                hotspot.severity === 'high' 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }">
                ${hotspot.severity.toUpperCase()} IDLE
              </span>
            </div>

            <div class="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
              <div class="bg-slate-900 p-1.5 rounded border border-slate-800">
                <span class="text-slate-400 text-[9px] block">Total Idle (24j):</span>
                <strong className="text-rose-400">${hotspot.totalIdleHours} Jam (${hotspot.idleMinutes} mnt)</strong>
              </div>
              <div class="bg-slate-900 p-1.5 rounded border border-slate-800">
                <span class="text-slate-400 text-[9px] block">Estimasi Solar Rusak:</span>
                <strong className="text-amber-300">~${hotspot.estimatedFuelWastedLiters} Liter</strong>
              </div>
            </div>

            <div class="text-[10px] text-slate-300 leading-snug">
              📍 <strong>Penyebab Utama:</strong> <span class="text-slate-200">${hotspot.primaryReason}</span>
            </div>

            <div class="pt-1.5 border-t border-slate-800 text-[10px]">
              <span class="text-slate-400 block mb-1">Armada Terdeteksi Diam (${hotspot.fleetsInvolvedCount} Unit):</span>
              <div class="flex flex-wrap gap-1 font-mono">
                ${hotspot.fleetPlates.map(p => `<span class="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800">${p}</span>`).join('')}
              </div>
            </div>
          </div>
        `;

        heatCircle.bindPopup(popupContent);
        heatMarker.bindPopup(popupContent);

        layerGroup.addLayer(heatCircle);
        layerGroup.addLayer(heatMarker);
      });
    }

    // 2. Central Warehouse DC Marker (Banyuwangi Hub)
    const hubIcon = L.divIcon({
      className: 'custom-hub-marker',
      html: `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <div class="absolute -inset-2 rounded-full bg-blue-500/30 animate-ping"></div>
          <div class="w-9 h-9 rounded-xl bg-slate-900 border-2 border-blue-400 text-blue-400 flex items-center justify-center shadow-lg font-bold text-xs">
            🏢
          </div>
          <div class="absolute bottom-full mb-1 bg-slate-900/90 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/40 whitespace-nowrap shadow-md">
            Gudang Pusat AKK DC
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const hubMarker = L.marker([CENTRAL_WAREHOUSE.coordinates[0], CENTRAL_WAREHOUSE.coordinates[1]], { icon: hubIcon });
    hubMarker.bindPopup(`
      <div class="p-2.5 text-xs text-slate-100 font-sans max-w-xs">
        <div class="font-bold text-blue-400 text-sm flex items-center gap-1.5 mb-1">
          🏢 ${CENTRAL_WAREHOUSE.name}
        </div>
        <p class="text-slate-300 text-[11px] leading-snug">${CENTRAL_WAREHOUSE.address}</p>
        <div class="mt-2 pt-2 border-t border-slate-700 text-[10px] text-slate-400 font-mono">
          Koordinat: ${CENTRAL_WAREHOUSE.coordinates.join(', ')}
        </div>
      </div>
    `);
    layerGroup.addLayer(hubMarker);

    // 3. Retail Store Markers (if enabled)
    if (showRetailStores) {
      stores.forEach(st => {
        if (!st.latitude || !st.longitude) return;

        const storeIcon = L.divIcon({
          className: 'custom-store-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer group" title="${st.storeName}">
              <div class="w-5 h-5 rounded-full bg-slate-900/90 border border-purple-400/80 text-purple-300 flex items-center justify-center text-[10px] shadow-sm font-bold">
                🛒
              </div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const storeMarker = L.marker([st.latitude, st.longitude], { icon: storeIcon });
        storeMarker.bindPopup(`
          <div class="p-2 text-xs text-slate-100 font-sans">
            <div class="font-bold text-purple-400 text-xs">${st.storeName}</div>
            <div class="text-[10px] text-slate-300">${st.city}, ${st.province}</div>
            <div class="text-[10px] text-slate-400 mt-1">Kat: <strong class="text-amber-300">${st.storeCategory}</strong></div>
          </div>
        `);
        layerGroup.addLayer(storeMarker);
      });
    }

    // 4. Tracksolid Live Fleet Markers
    filteredDevices.forEach(dev => {
      if (!dev.latitude || !dev.longitude) return;

      const isMoving = dev.currentSpeedKmh > 0 || dev.accStatus === 'ON';
      const isSleeping = dev.status === 'Sleeping';
      const isOffline = dev.status === 'Offline';

      let statusBgClass = 'bg-emerald-500';
      let borderClass = 'border-emerald-400';
      let badgeBg = 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50';

      if (isSleeping) {
        statusBgClass = 'bg-amber-500';
        borderClass = 'border-amber-400';
        badgeBg = 'bg-amber-950/90 text-amber-300 border-amber-500/50';
      } else if (isOffline) {
        statusBgClass = 'bg-rose-500';
        borderClass = 'border-rose-400';
        badgeBg = 'bg-rose-950/90 text-rose-300 border-rose-500/50';
      }

      const isSelected = selectedDevice?.imei === dev.imei;

      const fleetIcon = L.divIcon({
        className: 'custom-fleet-marker',
        html: `
          <div class="relative flex flex-col items-center justify-center cursor-pointer group ${isSelected ? 'scale-110 z-30' : 'z-20'}">
            ${isMoving ? `<div class="absolute -inset-2 rounded-full ${statusBgClass}/30 animate-ping"></div>` : ''}
            
            <div class="mb-1 ${badgeBg} px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border shadow-md flex items-center gap-1">
              <span>${dev.vehiclePlate}</span>
              ${isMoving ? `<span class="text-amber-300 font-extrabold ml-0.5">${dev.currentSpeedKmh}km/h</span>` : ''}
            </div>

            <div class="w-8 h-8 rounded-full bg-slate-900 ${borderClass} border-2 text-white flex items-center justify-center shadow-lg font-bold text-xs relative">
              <span className="text-sm">🚚</span>
              <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${statusBgClass} border border-slate-900"></span>
            </div>
          </div>
        `,
        iconSize: [70, 50],
        iconAnchor: [35, 38]
      });

      const marker = L.marker([dev.latitude, dev.longitude], { icon: fleetIcon });

      marker.on('click', () => {
        setSelectedDevice(dev);
        if (onSelectFleet) onSelectFleet(dev);
      });

      marker.bindPopup(`
        <div class="p-3 text-xs text-slate-100 font-sans max-w-xs space-y-2">
          <div class="flex items-center justify-between border-b border-slate-700 pb-1.5">
            <div>
              <div class="font-mono font-black text-amber-400 text-sm">${dev.vehiclePlate}</div>
              <div class="text-[10px] text-slate-400 font-semibold">${dev.vehicleName || 'Truck Fleet'}</div>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeBg}">
              ${dev.status}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
            <div class="bg-slate-900 p-1.5 rounded border border-slate-800">
              <span class="text-slate-400 text-[9px] block">Driver Utama:</span>
              <strong class="text-white font-sans">${dev.driverName}</strong>
            </div>
            <div class="bg-slate-900 p-1.5 rounded border border-slate-800">
              <span class="text-slate-400 text-[9px] block">Kecepatan:</span>
              <strong className="text-emerald-400">${dev.currentSpeedKmh} km/jam</strong>
            </div>
            <div class="bg-slate-900 p-1.5 rounded border border-slate-800">
              <span class="text-slate-400 text-[9px] block">Kontak ACC:</span>
              <strong class="${dev.accStatus === 'ON' ? 'text-emerald-400' : 'text-slate-400'}">${dev.accStatus}</strong>
            </div>
            <div class="bg-slate-900 p-1.5 rounded border border-slate-800">
              <span class="text-slate-400 text-[9px] block">Mileage Hari Ini:</span>
              <strong className="text-blue-400">${dev.todayMileageKm || 0} KM</strong>
            </div>
          </div>

          <div class="text-[10px] text-slate-300 leading-snug pt-1">
            📍 <span class="font-mono">${dev.address}</span>
          </div>

          <div class="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1 border-t border-slate-800">
            <span>GSM: ${dev.signalGsm}/5 | Bat: ${dev.batteryPercent}%</span>
            <span>Fix: ${dev.lastFix || 'Live'}</span>
          </div>
        </div>
      `);

      layerGroup.addLayer(marker);
    });
  }, [filteredDevices, selectedDevice, showRetailStores, stores, showIdleHeatmap, idleHotspots24h]);

  // Center map on all fleets bounds
  const fitAllFleets = () => {
    if (!mapInstanceRef.current || filteredDevices.length === 0) return;

    const validCoords: [number, number][] = filteredDevices
      .filter(d => d.latitude && d.longitude)
      .map(d => [d.latitude, d.longitude]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  };

  // Center map on a specific device
  const focusDevice = (device: TracksolidDevice) => {
    setSelectedDevice(device);
    if (onSelectFleet) onSelectFleet(device);

    if (mapInstanceRef.current && device.latitude && device.longitude) {
      mapInstanceRef.current.setView([device.latitude, device.longitude], 14, { animate: true });
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative ${isFullscreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)]' : className}`}>
      {/* Map Control Header Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Fleet Live Map Telemetry (Tracksolid GPS)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                Peta Posisi Real-Time
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Pemantauan koordinat GPS, status kontak ACC, kecepatan, dan overlay heatmap kejadian armada idle 24 jam
            </p>
          </div>
        </div>

        {/* Live Controls & Map Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* 🔥 24-HOUR IDLE HEATMAP TOGGLE BUTTON */}
          <button
            onClick={() => setShowIdleHeatmap(!showIdleHeatmap)}
            className={`px-3 py-1.5 rounded-xl font-bold border transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
              showIdleHeatmap
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-500/10 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Tampilkan / Sembunyikan Overlay Heatmap Kejadian Armada Idle 24 Jam Terakhir"
          >
            <Flame size={14} className={showIdleHeatmap ? 'text-rose-400' : 'text-slate-500'} />
            <span>Heatmap Idle (24 Jam): {showIdleHeatmap ? 'ON' : 'OFF'}</span>
          </button>

          {/* Live GPS Sync Badge */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-[11px]">
            <span className={`w-2 h-2 rounded-full ${isSimulatingLive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="text-slate-300 font-bold">{isSimulatingLive ? 'LIVE' : 'PAUSED'}</span>
            <span className="text-slate-500 text-[10px]">({lastSyncTime})</span>
          </div>

          {/* Toggle Live Ping Simulation */}
          <button
            onClick={() => setIsSimulatingLive(!isSimulatingLive)}
            className={`px-2.5 py-1 rounded-lg border transition font-semibold flex items-center gap-1 cursor-pointer ${
              isSimulatingLive 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Sematkan / Jeda simulasi ping GPS real-time"
          >
            <RefreshCw size={12} className={isSimulatingLive ? 'animate-spin' : ''} />
            <span>{isSimulatingLive ? 'Telemetry Active' : 'Resume Live'}</span>
          </button>

          {/* Map Layer Selector */}
          <div className="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setTileProvider('dark')}
              className={`px-2 py-0.5 rounded transition cursor-pointer font-semibold ${
                tileProvider === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setTileProvider('satellite')}
              className={`px-2 py-0.5 rounded transition cursor-pointer font-semibold ${
                tileProvider === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Satelit
            </button>
            <button
              onClick={() => setTileProvider('osm')}
              className={`px-2 py-0.5 rounded transition cursor-pointer font-semibold ${
                tileProvider === 'osm' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Street
            </button>
          </div>

          {/* Center All Fleets */}
          <button
            onClick={fitAllFleets}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1 cursor-pointer"
            title="Pusatkan peta ke seluruh koordinat armada"
          >
            <Compass size={13} className="text-amber-400" />
            <span>Fit All</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title={isFullscreen ? 'Kecilkan Peta' : 'Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* 🔥 24-Hour Idling Summary Banner Bar (Visible when Heatmap is ON) */}
      {showIdleHeatmap && (
        <div className="bg-slate-950/95 border-b border-rose-500/30 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400 animate-pulse shrink-0" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Ringkasan Kejadian Armada Idle (24 Jam Terakhir):
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
              🔥 {aggregatedIdleMetrics.totalHotspots} Titik Kluster
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              ⏱️ {aggregatedIdleMetrics.totalIdleHours} Jam Total Idle
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30">
              ⛽ ~{aggregatedIdleMetrics.totalFuelWasted} L Solar Terbuang
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
              ⚠️ {aggregatedIdleMetrics.highSeverityCount} Kluster Risiko Tinggi (&gt;3 Jam)
            </span>
          </div>
        </div>
      )}

      {/* Main Container: Map Canvas + Interactive Fleet Sidebar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden">
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-8 relative min-h-[380px]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[380px] z-10" />

          {/* Floating Map Legend Overlay */}
          <div className="absolute top-3 left-3 z-20 bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 text-[10px] space-y-1.5 font-mono shadow-xl backdrop-blur max-w-[210px]">
            <div className="font-bold text-slate-200 font-sans uppercase border-b border-slate-800 pb-1 flex items-center justify-between">
              <span>Legenda Posisi &amp; Heatmap</span>
              <button
                onClick={() => setShowRetailStores(!showRetailStores)}
                className={`text-[9px] px-1.5 py-0.2 rounded border ${showRetailStores ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
              >
                Toko: {showRetailStores ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Moving / Online (&gt;0 km/h)</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Sleeping / Parkir Idle</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Offline / Sinyal Terputus</span>
            </div>

            {/* 🔥 Heatmap Legend */}
            {showIdleHeatmap && (
              <div className="pt-1 border-t border-slate-800/80 space-y-1">
                <div className="text-[9px] font-bold text-rose-300 uppercase">🔥 Heatmap Idle 24 Jam:</div>
                <div className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 border border-rose-300"></span>
                  <span>Tinggi (&gt;3 Jam Idle)</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 border border-amber-300"></span>
                  <span>Sedang (1-3 Jam Idle)</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-blue-400 pt-0.5 border-t border-slate-800/80">
              <span>🏢 Gudang Pusat Banyuwangi DC</span>
            </div>
          </div>

          {/* Quick Focus Active Fleet / Selected Hotspot Banner */}
          {selectedHotspot && showIdleHeatmap && (
            <div className="absolute top-3 right-3 z-20 bg-slate-950/95 border border-rose-500/50 rounded-xl p-3 shadow-2xl backdrop-blur max-w-xs space-y-1.5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                <span className="flex items-center gap-1">
                  <Flame size={14} />
                  <span>{selectedHotspot.locationName}</span>
                </span>
                <button
                  onClick={() => setSelectedHotspot(null)}
                  className="text-slate-400 hover:text-white font-bold px-1"
                >
                  ✕
                </button>
              </div>
              <div className="text-[11px] text-slate-300">
                Total Idle: <strong className="text-rose-300">{selectedHotspot.totalIdleHours} Jam</strong> | Solar: <strong className="text-amber-300">~{selectedHotspot.estimatedFuelWastedLiters} L</strong>
              </div>
              <div className="text-[10px] text-slate-400">
                Penyebab: <span className="text-slate-200">{selectedHotspot.primaryReason}</span>
              </div>
            </div>
          )}

          {selectedDevice && (
            <div className="absolute bottom-3 left-3 right-3 z-20 bg-slate-950/95 border border-emerald-500/40 rounded-xl p-3 shadow-2xl backdrop-blur flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                  🚚
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-white text-sm">{selectedDevice.vehiclePlate}</span>
                    <span className="text-[10px] bg-slate-900 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-mono font-bold">
                      {selectedDevice.currentSpeedKmh} KM/H
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Driver: <strong>{selectedDevice.driverName}</strong> | {selectedDevice.address}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => focusDevice(selectedDevice)}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer flex items-center gap-1 text-xs"
                >
                  <MapPin size={12} />
                  <span>Fokus Lokasi</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Fleets & Idle Hotspots Sidebar List */}
        <div className="lg:col-span-4 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-full max-h-[550px] overflow-hidden">
          {/* Sidebar Search & Status Filter */}
          <div className="p-3 border-b border-slate-800 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari Plat / Driver / IMEI..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 py-1 rounded-lg text-center transition font-semibold cursor-pointer ${
                  statusFilter === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semua ({devices.length})
              </button>
              <button
                onClick={() => setStatusFilter('moving')}
                className={`flex-1 py-1 rounded-lg text-center transition font-semibold cursor-pointer ${
                  statusFilter === 'moving' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Moving
              </button>
              <button
                onClick={() => setStatusFilter('sleeping')}
                className={`flex-1 py-1 rounded-lg text-center transition font-semibold cursor-pointer ${
                  statusFilter === 'sleeping' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Idle
              </button>
            </div>
          </div>

          {/* Fleets List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2 divide-y divide-slate-800/50">
            {filteredDevices.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Tidak ada armada GPS yang cocok dengan kriteria pencarian.
              </div>
            ) : (
              filteredDevices.map(dev => {
                const isSelected = selectedDevice?.imei === dev.imei;
                const isMoving = dev.currentSpeedKmh > 0 || dev.accStatus === 'ON';

                return (
                  <div
                    key={dev.imei}
                    onClick={() => focusDevice(dev)}
                    className={`p-2.5 rounded-xl transition cursor-pointer border ${
                      isSelected 
                        ? 'bg-slate-900 border-emerald-500/60 shadow-md' 
                        : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-black text-white text-xs flex items-center gap-1.5">
                          <span>{dev.vehiclePlate}</span>
                          {dev.vehicleName && (
                            <span className="text-[10px] text-slate-400 font-normal truncate max-w-[110px]">
                              ({dev.vehicleName})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium mt-0.5">
                          {dev.driverName}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono shrink-0 ${
                        dev.status === 'Online' 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                          : dev.status === 'Sleeping'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {dev.status === 'Online' && isMoving ? `${dev.currentSpeedKmh} km/h` : dev.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1.5 truncate flex items-center gap-1">
                      <MapPin size={10} className="text-slate-500 shrink-0" />
                      <span className="truncate">{dev.address}</span>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-2 pt-1.5 border-t border-slate-800/80">
                      <span>ACC: <strong className={dev.accStatus === 'ON' ? 'text-emerald-400' : 'text-slate-500'}>{dev.accStatus}</strong></span>
                      <span>Mileage: <strong className="text-blue-400">{dev.todayMileageKm || 0} km</strong></span>
                      <span>Bat: {dev.batteryPercent}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
