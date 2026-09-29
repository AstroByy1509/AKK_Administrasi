import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, RotateCcw } from 'lucide-react';
import { CENTRAL_WAREHOUSE } from '../data/mockData';
import { RetailStore, TrackingPoint, RouteStop } from '../types';

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
  selectedFleetName
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const userInteractedRef = useRef<boolean>(false);
  const initialFitDoneRef = useRef<boolean>(false);
  const lastFilterKeyRef = useRef<string>('');
  const lastSelectedStoreIdRef = useRef<string | null>(null);
  const currentBoundsRef = useRef<L.LatLngBounds | null>(null);

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
  }, []);

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

    filteredStores.forEach(store => {
      let lat = Number(store.latitude);
      let lng = Number(store.longitude);

      // Guard against invalid coordinates or NaN so Leaflet never crashes
      if (isNaN(lat) || !isFinite(lat) || lat === 0) lat = -8.3645;
      if (isNaN(lng) || !isFinite(lng) || lng === 0) lng = 114.1529;

      const isSelected = selectedStoreId === store.id;
      const isOuterIsland = store.island !== 'Jawa';

      const pinColor = isSelected
        ? 'bg-blue-600 border-white text-white scale-125 z-50'
        : isOuterIsland
        ? 'bg-emerald-600 border-white text-white'
        : 'bg-indigo-600 border-white text-white';

      const storeIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div class="transition-transform duration-200 flex flex-col items-center">
            <div class="w-8 h-8 rounded-full shadow-lg border-2 flex items-center justify-center font-bold text-xs ${pinColor}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
            </div>
            <span class="px-1.5 py-0.5 mt-0.5 bg-slate-900/90 text-[10px] text-slate-100 rounded shadow font-medium whitespace-nowrap">${store.storeCode}</span>
          </div>
        `,
        iconSize: [32, 48],
        iconAnchor: [16, 24]
      });

      const storeMarker = L.marker([lat, lng], { icon: storeIcon })
        .on('click', () => {
          if (onSelectStore) onSelectStore(store);
        });

      const popupContent = L.DomUtil.create('div', 'min-w-[240px] font-sans');
      popupContent.innerHTML = `
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isOuterIsland ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'}">
            ${store.island} ${isOuterIsland ? '(Luar Pulau)' : ''}
          </span>
          <span class="text-[10px] text-slate-500 font-mono">${store.storeCode}</span>
        </div>
        <h4 class="font-bold text-slate-900 text-sm leading-snug">${store.storeName}</h4>
        <p class="text-xs text-slate-600 mt-1">${store.address}</p>
        <div class="mt-2.5 pt-2 border-t border-slate-200 grid grid-cols-2 gap-1 text-[11px] text-slate-600">
          <div><strong>Kategori:</strong> ${store.storeCategory}</div>
          <div><strong>Jendela Kirim:</strong> ${store.deliveryWindow}</div>
        </div>
      `;
      const btnContainer = L.DomUtil.create('div', 'mt-3 pt-2 border-t border-slate-200', popupContent);
      const btn = L.DomUtil.create('button', 'w-full py-1.5 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition', btnContainer);
      btn.innerHTML = 'Buat Jadwal';
      L.DomEvent.on(btn, 'click', () => {
        if (onSchedule) onSchedule(store);
        map.closePopup();
      });

      storeMarker.bindPopup(popupContent);

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
  }, [stores, selectedStoreId, trackingPoints, stops, showWarehouse, highlightIsland, plannedPolyline, isFleetMode, selectedFleetName, centerCoords, zoomLevel]);

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

  return (
    <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden shadow-inner border border-slate-800 flex flex-col`}>
      {/* Floating Re-center / Fit All Stores Button */}
      <button
        type="button"
        onClick={handleResetView}
        className="absolute top-3 right-3 z-[400] bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1.5 text-xs font-semibold backdrop-blur-sm transition cursor-pointer active:scale-95"
        title="Pusatkan kembali peta ke seluruh outlet"
      >
        <Compass className="w-3.5 h-3.5 text-amber-400" />
        <span>Pusatkan Peta</span>
      </button>

      <div ref={mapContainerRef} className="w-full h-full flex-1" style={{ width: '100%', height: '100%', minHeight: '100%' }} />
    </div>
  );
};
