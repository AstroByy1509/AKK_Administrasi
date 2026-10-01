import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import { Compass, RotateCcw, Maximize2, Minimize2, X, Layers, Phone, Navigation, MapPin } from 'lucide-react';
import { CENTRAL_WAREHOUSE } from '../data/mockData';
import { RetailStore, TrackingPoint, RouteStop } from '../types';
import { extractCoordinatesFromObject, getStoreLocationType } from '../utils/coordinateParser';

interface LeafletMapProps {
  stores?: RetailStore[];
  selectedStoreId?: string | null;
  onSelectStore?: (store: RetailStore) => void;
  onSchedule?: (store: RetailStore) => void; // New callback
  trackingPoints?: TrackingPoint[];
  stops?: RouteStop[];
  showWarehouse?: boolean;
  highlightIsland?: string;
  centerCoords?: [number, number];
  zoomLevel?: number;
  heightClass?: string;
  plannedPolyline?: [number, number][];
  isFleetMode?: boolean;
  selectedFleetName?: string;
  allowFullscreen?: boolean;
  externalIsFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  stores = [],
  selectedStoreId = null,
  onSelectStore,
  onSchedule,
  trackingPoints = [],
  stops = [],
  showWarehouse = true,
  highlightIsland = 'all',
  centerCoords,
  zoomLevel = 6,
  heightClass = 'h-full min-h-[480px] w-full',
  plannedPolyline = [],
  isFleetMode = false,
  selectedFleetName,
  allowFullscreen = true,
  externalIsFullscreen,
  onToggleFullscreen
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const userInteractedRef = useRef<boolean>(false);
  const initialFitDoneRef = useRef<boolean>(false);
  const lastFilterKeyRef = useRef<string>('');
  const lastSelectedStoreIdRef = useRef<string | null>(null);
  const currentBoundsRef = useRef<L.LatLngBounds | null>(null);
  const [internalIsFullscreen, setInternalIsFullscreen] = useState<boolean>(false);

  const isFullscreen = externalIsFullscreen !== undefined ? externalIsFullscreen : internalIsFullscreen;

  const toggleFullscreenMode = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      setInternalIsFullscreen(prev => !prev);
    }
  };

  // Handle Fullscreen Keydown (ESC key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (onToggleFullscreen) {
          onToggleFullscreen();
        } else {
          setInternalIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onToggleFullscreen]);

  // Invalidate Map Size when entering/exiting Fullscreen
  useEffect(() => {
    if (mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
        if (currentBoundsRef.current && !userInteractedRef.current) {
          mapInstanceRef.current?.fitBounds(currentBoundsRef.current, {
            padding: [50, 50],
            maxZoom: 13,
            animate: false
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    const initialCenter: [number, number] = centerCoords || [-8.3, 114.25]; // Banyuwangi / East Java region default

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: zoomLevel,
      zoomControl: true,
      scrollWheelZoom: true
    });

    // Detect user pan/drag and zoom events so automatic re-renders do NOT override user positioning
    map.on('movestart', (e: any) => {
      if (e && e.originalEvent) {
        userInteractedRef.current = true;
      }
    });

    map.on('zoomstart', (e: any) => {
      if (e && e.originalEvent) {
        userInteractedRef.current = true;
      }
    });

    // Standard OpenStreetMap tiles (No API key required, reliable and clean)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: 'abc'
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    // Use dynamic ResizeObserver to gracefully handle container dimension changes
    // without causing 'snap-back' jumping or resetting zoom/pan coordinates
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          const currentCenter = mapInstanceRef.current.getCenter();
          const currentZoom = mapInstanceRef.current.getZoom();

          mapInstanceRef.current.invalidateSize({ pan: false });

          // Preserve exact coordinates and zoom level during container resize
          if (userInteractedRef.current) {
            mapInstanceRef.current.setView(currentCenter, currentZoom, { animate: false });
          } else if (currentBoundsRef.current) {
            mapInstanceRef.current.fitBounds(currentBoundsRef.current, {
              padding: [45, 45],
              maxZoom: 13,
              animate: false
            });
          }
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Invalidate size after layout stabilization
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch {
          // ignore cleanup race conditions
        }
        mapInstanceRef.current = null;
      }
    };
  }, [isFullscreen]);

  // Update Layers when props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    // Check if user changed the filter, fleet mode, or store count
    const filterKey = `${highlightIsland}_${isFleetMode ? selectedFleetName : ''}_${stores.length}_${trackingPoints.length}_${stops.length}`;
    const filterChanged = filterKey !== lastFilterKeyRef.current;
    const storeSelectionChanged = selectedStoreId !== lastSelectedStoreIdRef.current;

    lastFilterKeyRef.current = filterKey;
    lastSelectedStoreIdRef.current = selectedStoreId;

    if (filterChanged || (storeSelectionChanged && selectedStoreId)) {
      // If user actively changed filters or picked a specific store, allow camera realignment
      userInteractedRef.current = false;
    }

    try {
      map.stop();
    } catch {}

    layerGroup.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    // 1. Central Warehouse Marker
    if (showWarehouse) {
      const warehouseIcon = L.divIcon({
        className: 'custom-warehouse-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-1 bg-amber-500/40 rounded-full animate-ping"></div>
            <div class="w-10 h-10 bg-slate-900 border-2 border-amber-400 rounded-xl shadow-xl flex items-center justify-center text-amber-400 font-bold text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const whMarker = L.marker(CENTRAL_WAREHOUSE.coordinates, { icon: warehouseIcon })
        .bindPopup(`
          <div class="p-2.5 min-w-[270px] font-sans">
            <div class="flex items-center justify-between gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
              <span>★ PUSAT DISTRIBUSI LOGISTIK</span>
              <span class="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">Hub Utama</span>
            </div>
            <h4 class="font-bold text-slate-900 text-sm leading-tight">${CENTRAL_WAREHOUSE.name}</h4>
            <div class="text-[11px] text-emerald-700 font-semibold mt-0.5">
              <span>${(CENTRAL_WAREHOUSE as any).category || 'Pemasok Produk Plastik'}</span>
              <span class="text-amber-500 font-bold ml-1">★ 4.7</span> <span class="text-slate-400 font-normal">(55)</span>
            </div>
            <p class="text-xs text-slate-600 mt-1 leading-relaxed">${CENTRAL_WAREHOUSE.address}</p>
            <div class="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div>Hub Koordinat: <span class="font-mono font-semibold text-slate-900">${CENTRAL_WAREHOUSE.coordinates[0]}, ${CENTRAL_WAREHOUSE.coordinates[1]}</span></div>
              <div>Kode Plus: <span class="font-mono text-slate-700">${(CENTRAL_WAREHOUSE as any).plusCode || 'R95C+Q8 Klatak, Kabupaten Banyuwangi'}</span></div>
              <div class="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-100">
                <span>Telp: <strong class="text-slate-800">${CENTRAL_WAREHOUSE.contact}</strong></span>
                <span class="text-emerald-700 font-medium">${(CENTRAL_WAREHOUSE as any).operatingHours || 'Buka • Tutup 16.00'}</span>
              </div>
            </div>
          </div>
        `);
      layerGroup.addLayer(whMarker);
      bounds.push(CENTRAL_WAREHOUSE.coordinates);
    }

    // 2. Retail Stores Markers
    const filteredStores = stores.filter(st => {
      if (highlightIsland === 'all' || !highlightIsland) return true;
      return st.island === highlightIsland;
    });

    const seenCoordKeys = new Map<string, number>();

    filteredStores.forEach((store, sIdx) => {
      const coords = extractCoordinatesFromObject(store, sIdx);
      let lat = coords.latitude;
      let lng = coords.longitude;

      // Anti-stacking micro-dispersion: if multiple stores have identical coordinates, apply tiny offset (< 50m) so pins don't overlap completely
      const coordKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
      const duplicateCount = seenCoordKeys.get(coordKey) || 0;
      seenCoordKeys.set(coordKey, duplicateCount + 1);

      if (duplicateCount > 0) {
        const angle = (duplicateCount * 137.5 * Math.PI) / 180;
        const radius = 0.0004 * Math.sqrt(duplicateCount); // approx 30-50m
        lat = lat + Math.sin(angle) * radius;
        lng = lng + Math.cos(angle) * radius;
      }

      const isSelected = selectedStoreId === store.id;
      const locType = getStoreLocationType(store);

      let pinColor = 'bg-indigo-600 border-white text-white shadow-md ring-1 ring-indigo-400';
      let badgeHtml = '<span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">Dalam Kota (Banyuwangi)</span>';

      if (isSelected) {
        pinColor = 'bg-blue-600 border-white text-white scale-125 z-50 shadow-xl ring-4 ring-blue-400';
      } else if (locType === 'luar_pulau') {
        pinColor = 'bg-emerald-500 border-white text-white shadow-md ring-1 ring-emerald-300';
        badgeHtml = `<span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">${store.island} (Luar Pulau)</span>`;
      } else if (locType === 'luar_kota') {
        pinColor = 'bg-rose-500 border-white text-white shadow-md ring-1 ring-rose-300';
        badgeHtml = `<span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">Luar Kota (${store.city || 'Jawa Timur'})</span>`;
      }

      const storeIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div class="transition-transform duration-200 flex flex-col items-center group relative cursor-pointer">
            <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-[10px] ${pinColor}">
              <span class="w-2 h-2 rounded-full bg-white"></span>
            </div>
            <div class="absolute bottom-full mb-1 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-50 border border-slate-700 pointer-events-none">
              <strong>${store.storeCode}</strong>: ${store.storeName} (${locType === 'luar_kota' ? 'Luar Kota' : locType === 'luar_pulau' ? 'Luar Pulau' : 'Banyuwangi'})
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const storeMarker = L.marker([lat, lng], { icon: storeIcon })
        .on('click', () => {
          if (onSelectStore) onSelectStore(store);
        });

      const popupContent = L.DomUtil.create('div', 'min-w-[250px] font-sans p-0.5');
      popupContent.innerHTML = `
        <div class="flex items-center justify-between mb-1.5">
          ${badgeHtml}
          <span class="text-[10px] text-slate-500 font-mono font-bold">${store.storeCode}</span>
        </div>
        <h4 class="font-bold text-slate-900 text-sm leading-snug">${store.storeName}</h4>
        <p class="text-xs text-slate-600 mt-1">${store.address}</p>
        <div class="mt-2.5 pt-2 border-t border-slate-200 grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
          <div><strong>Kategori:</strong> ${store.storeCategory}</div>
          <div><strong>Kota:</strong> ${store.city || '-'}</div>
          <div><strong>PIC:</strong> ${store.contactPerson || '-'}</div>
          <div><strong>Jendela Kirim:</strong> ${store.deliveryWindow || '08:00-17:00'}</div>
        </div>
        ${store.phone ? `<div class="text-[11px] mt-1 text-slate-600"><strong>Telp:</strong> <a href="tel:${store.phone}" class="text-blue-600 font-bold hover:underline">${store.phone}</a></div>` : ''}
      `;
      const btnContainer = L.DomUtil.create('div', 'mt-3 pt-2 border-t border-slate-200 flex items-center gap-1.5', popupContent);
      const btnSchedule = L.DomUtil.create('button', 'flex-1 py-1.5 px-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer', btnContainer);
      btnSchedule.innerHTML = 'Buat Jadwal';
      L.DomEvent.on(btnSchedule, 'click', () => {
        if (onSchedule) onSchedule(store);
        map.closePopup();
      });

      storeMarker.bindPopup(popupContent);

      if (isSelected) {
        setTimeout(() => {
          storeMarker.openPopup();
        }, 150);
      }

      layerGroup.addLayer(storeMarker);
      bounds.push([lat, lng]);
    });

    // 3. Planned polyline (Removed)
    // Planned polyline rendering logic has been removed as per user request.


    // 4. Actual GPS Tracking Points / Fleet Markers
    if (trackingPoints.length > 0) {
      if (isFleetMode) {
        // Render individual fleet vehicles (Tracksolid Pro Live Mode)
        trackingPoints.forEach(point => {
          const isSelected = selectedFleetName && point.locationName?.includes(selectedFleetName);
          const isMoving = point.speed > 0 || point.engineStatus === 'RUNNING';

          const markerHtml = isSelected
            ? `
              <div class="relative flex flex-col items-center" style="transform: translate(-50%, -100%);">
                <div class="bg-[#d32f2f] text-white px-2.5 py-1 rounded text-[11px] font-black shadow-2xl whitespace-nowrap mb-1 tracking-tight border border-red-700">
                  ${selectedFleetName}
                </div>
                <div class="w-8 h-8 rounded-full bg-[#1976d2] border-2 border-white shadow-xl flex items-center justify-center text-white ring-4 ring-blue-400/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                </div>
              </div>
            `
            : `
              <div class="w-7 h-7 rounded-full ${isMoving ? 'bg-emerald-500' : 'bg-red-500'} border-2 border-white shadow-md flex items-center justify-center text-white" style="transform: translate(-50%, -50%);">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
              </div>
            `;

          const vehicleIcon = L.divIcon({
            className: 'fleet-marker-custom',
            html: markerHtml,
            iconSize: isSelected ? [140, 60] : [28, 28],
            iconAnchor: isSelected ? [70, 60] : [14, 14]
          });

          const vMarker = L.marker([point.latitude, point.longitude], { icon: vehicleIcon })
            .bindPopup(`
              <div class="p-2.5 font-sans min-w-[220px]">
                <div class="text-[10px] font-black uppercase text-blue-600 tracking-wider">TRACKSOLID LIVE GPS</div>
                <div class="font-bold text-xs text-slate-900 mt-0.5">${point.locationName || 'Armada GPS'}</div>
                <div class="text-xs text-slate-700 mt-1">Kecepatan: <strong>${point.speed} km/h</strong></div>
                <div class="text-xs text-slate-600">Status Kontak: <strong class="${point.engineStatus === 'RUNNING' ? 'text-emerald-600' : 'text-red-600'}">${point.engineStatus}</strong></div>
                <div class="text-[11px] text-slate-400 font-mono mt-1">${point.timestamp}</div>
              </div>
            `);

          layerGroup.addLayer(vMarker);
          if (!centerCoords) {
            bounds.push([point.latitude, point.longitude]);
          }
        });
      } else {
        const actualCoords: [number, number][] = trackingPoints.map(p => [p.latitude, p.longitude]);

        const routeLine = L.polyline(actualCoords, {
          color: '#0284c7', // Sky blue
          weight: 5,
          opacity: 0.9,
          lineCap: 'round'
        });
        layerGroup.addLayer(routeLine);

        // Start Marker
        const startPoint = trackingPoints[0];
        const startIcon = L.divIcon({
          className: 'start-marker',
          html: `
            <div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold">
              A
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        const startMarker = L.marker([startPoint.latitude, startPoint.longitude], { icon: startIcon })
          .bindPopup(`<strong>Titik Awal Keberangkatan</strong><br/>${startPoint.timestamp}<br/>${startPoint.locationName || ''}`);
        layerGroup.addLayer(startMarker);

        // Current/Last Marker (Truck Icon)
        const lastPoint = trackingPoints[trackingPoints.length - 1];
        const truckIcon = L.divIcon({
          className: 'truck-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute -inset-2 bg-blue-500/40 rounded-full animate-pulse"></div>
              <div class="w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        const currentTruckMarker = L.marker([lastPoint.latitude, lastPoint.longitude], { icon: truckIcon })
          .bindPopup(`
            <div class="p-2 font-sans">
              <span class="text-xs font-bold text-blue-600">POSISI GPS TERKINI</span>
              <div class="text-xs text-slate-800 font-medium mt-1">Kecepatan: ${lastPoint.speed} km/h</div>
              <div class="text-xs text-slate-600">Status Mesin: ${lastPoint.engineStatus}</div>
              <div class="text-xs text-slate-500 font-mono mt-0.5">${lastPoint.timestamp}</div>
            </div>
          `);
        layerGroup.addLayer(currentTruckMarker);

        actualCoords.forEach(c => bounds.push(c));
      }
    }

    // 5. Idle Stops Markers (Yellow / Orange Warning)
    stops.forEach(stop => {
      const stopIcon = L.divIcon({
        className: 'stop-marker',
        html: `
          <div class="w-7 h-7 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center text-slate-900 font-bold text-xs">
            ⏱
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const stopMarker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon })
        .bindPopup(`
          <div class="p-2 min-w-[200px] font-sans">
            <span class="text-[10px] font-bold uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              WAKTU BERHENTI / IDLE
            </span>
            <div class="font-semibold text-xs text-slate-900 mt-1">${stop.locationName}</div>
            <div class="text-xs text-slate-700 mt-1"><strong>Durasi:</strong> ${stop.durationMinutes} Menit</div>
            <div class="text-xs text-slate-600"><strong>Alasan:</strong> ${stop.reason}</div>
            <div class="text-[11px] text-slate-400 mt-1">${stop.startTime} - ${stop.endTime}</div>
          </div>
        `);
      layerGroup.addLayer(stopMarker);
      bounds.push([stop.latitude, stop.longitude]);
    });

    if (bounds.length > 0) {
      currentBoundsRef.current = L.latLngBounds(bounds);
    }

    // Only auto-center/fitBounds if user has NOT manually dragged/zoomed the map,
    // OR if it's the initial load, OR if an intentional filter/store selection occurred.
    if (!userInteractedRef.current || !initialFitDoneRef.current) {
      if (selectedStoreId) {
        const selectedStore = stores.find(s => s.id === selectedStoreId);
        if (selectedStore) {
          const sLat = Number(selectedStore.latitude);
          const sLng = Number(selectedStore.longitude);
          if (!isNaN(sLat) && !isNaN(sLng)) {
            map.setView([sLat, sLng], Math.max(map.getZoom(), 13), { animate: true });
          }
        }
      } else if (centerCoords) {
        map.setView(centerCoords, zoomLevel, { animate: false });
      } else if (bounds.length > 0) {
        map.fitBounds(L.latLngBounds(bounds), {
          padding: [45, 45],
          maxZoom: 13,
          animate: initialFitDoneRef.current
        });
        initialFitDoneRef.current = true;
      }
    }
  }, [stores, selectedStoreId, trackingPoints, stops, showWarehouse, highlightIsland, plannedPolyline, isFleetMode, selectedFleetName, centerCoords, zoomLevel, isFullscreen]);

  const handleResetView = () => {
    if (mapInstanceRef.current && currentBoundsRef.current) {
      userInteractedRef.current = false;
      mapInstanceRef.current.fitBounds(currentBoundsRef.current, {
        padding: [45, 45],
        maxZoom: 13,
        animate: true
      });
    }
  };

  const mapElement = (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 !z-[999999] w-screen h-screen bg-[#090d16] text-white flex flex-col p-3 m-0 overflow-hidden font-sans'
          : `relative w-full ${heightClass} rounded-xl overflow-hidden shadow-inner border border-slate-800 flex flex-col`
      }
    >
      {/* Floating Controls Bar (Fullscreen & Reset View) */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-2">
        <button
          type="button"
          onClick={handleResetView}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 text-xs font-semibold backdrop-blur-sm transition cursor-pointer active:scale-95"
          title="Pusatkan kembali peta ke seluruh outlet"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Pusatkan Peta</span>
        </button>

        {allowFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreenMode}
            className={`px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 text-xs font-bold backdrop-blur-sm transition cursor-pointer active:scale-95 border ${
              isFullscreen
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 ring-2 ring-rose-400/40'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/80'
            }`}
            title={isFullscreen ? 'Keluar dari Mode Fullscreen (Esc)' : 'Tampilkan Peta Layar Penuh (Fullscreen)'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-white" />
                <span>Keluar Fullscreen (Esc)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Layar Penuh</span>
              </>
            )}
          </button>
        )}
      </div>

      {isFullscreen && (
        <div className="absolute top-3 left-3 z-[400] bg-slate-900/95 border border-slate-800 px-3.5 py-2 rounded-xl shadow-2xl backdrop-blur-md text-xs flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Mode Layar Penuh (GIS Intelligence & Route Intelligence)</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] border border-blue-500/30">
                {stores.length} Toko
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Klik pada titik toko mana saja untuk melihat rincian &bull; Tekan <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">Esc</kbd> untuk keluar
            </div>
          </div>
        </div>
      )}

      {/* Floating Detail Card in Fullscreen Mode when a store is selected */}
      {isFullscreen && selectedStoreId && (
        (() => {
          const selStore = stores.find(s => s.id === selectedStoreId);
          if (!selStore) return null;
          const locType = getStoreLocationType(selStore);
          return (
            <div className="absolute bottom-6 right-6 z-[450] bg-slate-900/95 border border-blue-500/60 w-80 max-w-[calc(100vw-3rem)] rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs space-y-3 animate-card-fade-in text-white">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  locType === 'luar_pulau'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : locType === 'luar_kota'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}>
                  {locType === 'luar_pulau' ? `${selStore.island} (Luar Pulau)` : locType === 'luar_kota' ? `Luar Kota (${selStore.city || 'Jatim'})` : 'Dalam Kota (Banyuwangi)'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-400">{selStore.storeCode}</span>
                  {onSelectStore && (
                    <button
                      type="button"
                      onClick={() => onSelectStore({} as any)}
                      className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition"
                      title="Tutup Kartu Detail"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white text-sm leading-snug">{selStore.storeName}</h4>
                <p className="text-slate-400 text-[11px] mt-1 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{selStore.address}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800 text-slate-300">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Kategori:</span>
                  <strong className="text-slate-200">{selStore.storeCategory}</strong>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Jendela Kirim:</span>
                  <strong className="text-amber-400">{selStore.deliveryWindow}</strong>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">PIC Toko:</span>
                  <strong className="text-slate-200">{selStore.contactPerson || '-'}</strong>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">Kota/Daerah:</span>
                  <strong className="text-slate-200">{selStore.city || '-'}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {selStore.phone && (
                  <a
                    href={`tel:${selStore.phone}`}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 border border-slate-700 transition"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Hubungi</span>
                  </a>
                )}
                {onSchedule && (
                  <button
                    type="button"
                    onClick={() => onSchedule(selStore)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow transition cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Buat Jadwal</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()
      )}

      <div ref={mapContainerRef} className="w-full h-full flex-1" style={{ width: '100%', height: '100%', minHeight: '100%' }} />
    </div>
  );

  if (isFullscreen) {
    return createPortal(mapElement, document.body);
  }

  return mapElement;
};
