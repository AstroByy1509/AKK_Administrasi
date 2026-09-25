import React, { useMemo } from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';

const API_KEY = "AIzaSyCCbt1fc0OOODWAHq5fI7GXdWs_0WMNN94";

// Mock data: Heatmap coordinates
const HEATMAP_DATA = [
  { lat: -6.2000, lng: 106.8167, weight: 10 },
  { lat: -6.2100, lng: 106.8200, weight: 20 },
  { lat: -6.1900, lng: 106.8100, weight: 5 },
  // ... more data
];

export const DeliveryHeatmap: React.FC = () => {
  return (
    <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-slate-800">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={{ lat: -6.2088, lng: 106.8456 }}
          defaultZoom={11}
          mapId="DEMO_MAP_ID"
        />
      </APIProvider>
    </div>
  );
};
