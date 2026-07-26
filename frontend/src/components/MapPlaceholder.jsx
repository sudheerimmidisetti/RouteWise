import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getStopTypeBadge } from '../utils/uiHelpers';

// Fix default leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper component to auto-fit map bounds dynamically on route geometry changes
const MapBoundsFitter = ({ geometry, stops }) => {
  const map = useMap();

  useEffect(() => {
    if (geometry && geometry.length > 0) {
      const bounds = L.latLngBounds(geometry);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (stops && stops.length > 0) {
      const coords = stops
        .filter((s) => s.latitude && s.longitude)
        .map((s) => [s.latitude, s.longitude]);
      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [geometry, stops, map]);

  return null;
};

const MapPlaceholder = ({ geometry = [], stops = [] }) => {
  const hasData = geometry.length > 0 || stops.length > 0;

  // Default center coordinates (Geographic Center of United States)
  const defaultCenter = hasData && geometry[0] ? geometry[0] : [39.8283, -98.5795];
  const defaultZoom = hasData ? 6 : 4;

  return (
    <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[500px] border border-white/10">
      {/* Header bar */}
      <div className="bg-slate-900/90 px-5 py-3 border-b border-white/10 flex items-center justify-between z-10 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="font-bold text-slate-100 text-sm">Real-World Turn-by-Turn Highway Routing</span>
        </div>
        <span className={`text-xs font-mono px-3 py-1 rounded-full border ${hasData ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
          {hasData ? `${geometry.length} Geometry Coordinates` : 'Awaiting Parameters'}
        </span>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full relative z-0">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          attributionControl={false}
          style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
        >
          <TileLayer
            attribution=""
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {hasData && <MapBoundsFitter geometry={geometry} stops={stops} />}

          {/* Real Highway Road Polyline */}
          {hasData && geometry.length > 0 && (
            <Polyline
              positions={geometry}
              color="#6366f1"
              weight={6}
              opacity={0.9}
            />
          )}

          {/* Waypoint Markers */}
          {hasData &&
            stops.map((stop, idx) => {
              if (!stop.latitude || !stop.longitude) return null;
              return (
                <Marker key={idx} position={[stop.latitude, stop.longitude]}>
                  <Popup>
                    <div className="p-1 font-sans text-xs">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase mb-1 border ${getStopTypeBadge(stop.stop_type)}`}>
                        {stop.stop_type}
                      </span>
                      <div className="font-bold text-slate-900 text-sm">{stop.location_name}</div>
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                        {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapPlaceholder;
