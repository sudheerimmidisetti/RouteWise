import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default leaflet marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Creates custom pin pointer Leaflet icons with location pin symbols instead of numbers:
 * - Current Location: #00D492 (Emerald Teal) + Location Pin Symbol
 * - Pickup Location:  #00D3F3 (Cyan) + Location Pin Symbol
 * - Dropoff Location: #FF637E (Coral Rose) + Location Pin Symbol
 * - Fuel Stop:        #F59E0B (Amber Gold) + Fuel Symbol ⛽
 */
const createCustomPinIcon = (stopType) => {
  let pinColor = '#6366f1'; // Default Indigo
  let iconSvg = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  if (stopType === 'CURRENT') {
    pinColor = '#00D492';
  } else if (stopType === 'PICKUP') {
    pinColor = '#00D3F3';
  } else if (stopType === 'DROPOFF') {
    pinColor = '#FF637E';
  } else if (stopType === 'FUEL') {
    pinColor = '#F59E0B';
    iconSvg = '<span style="font-size: 13px; line-height: 1;">⛽</span>';
  }

  return L.divIcon({
    className: 'custom-pin-marker-wrapper',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="
          background: ${pinColor};
          color: #ffffff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px ${pinColor}99, 0 0 0 3px #ffffff;
          transition: transform 0.2s ease;
        ">
          ${iconSvg}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 10px solid ${pinColor};
          margin-top: -2px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        "></div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

// Helper component to auto-fit map bounds dynamically & handle window resize invalidation
const MapBoundsFitter = ({ geometry, stops }) => {
  const map = useMap();

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);

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

    return () => window.removeEventListener('resize', handleResize);
  }, [geometry, stops, map]);

  return null;
};

const MapPlaceholder = ({ geometry = [], stops = [] }) => {
  const hasData = geometry.length > 0 || stops.length > 0;

  // Default center coordinates
  const defaultCenter = hasData && geometry[0] ? geometry[0] : [17.3850, 78.4867];
  const defaultZoom = hasData ? 6 : 4;

  return (
    <div
      role="region"
      aria-label="Interactive Commercial Highway Route Map"
      className="glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[350px] sm:h-[450px] md:h-[500px] border border-white/10"
    >
      {/* Header bar with color key badges */}
      <div className="bg-slate-900/90 px-4 sm:px-5 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 z-10 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-bold text-slate-100 text-xs sm:text-sm">Interactive Route & Location Map</span>
        </div>

        {/* Pin Color Legend */}
        <div className="flex items-center space-x-3 text-[10px] font-mono">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#00D492' }}></span>
            <span className="text-slate-300">Current</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#00D3F3' }}></span>
            <span className="text-slate-300">Pickup</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#FF637E' }}></span>
            <span className="text-slate-300">Dropoff</span>
          </div>
        </div>
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

          <MapBoundsFitter geometry={geometry} stops={stops} />

          {/* Real Highway Road Polyline */}
          {hasData && geometry.length > 0 && (
            <Polyline
              positions={geometry}
              color="#6366f1"
              weight={6}
              opacity={0.9}
            />
          )}

          {/* Custom Colored Pin Pointer Markers with Interactive Click Popups */}
          {hasData &&
            stops.map((stop, idx) => {
              if (!stop.latitude || !stop.longitude) return null;
              
              const pinIcon = createCustomPinIcon(stop.stop_type);

              let badgeBg = '#6366f1';
              let roleName = 'Waypoint';

              if (stop.stop_type === 'CURRENT') {
                badgeBg = '#00D492';
                roleName = 'Current Location';
              } else if (stop.stop_type === 'PICKUP') {
                badgeBg = '#00D3F3';
                roleName = 'Pickup Location';
              } else if (stop.stop_type === 'DROPOFF') {
                badgeBg = '#FF637E';
                roleName = 'Dropoff Location';
              } else if (stop.stop_type === 'FUEL') {
                badgeBg = '#F59E0B';
                roleName = 'Fuel Stop';
              }

              return (
                <Marker
                  key={idx}
                  position={[stop.latitude, stop.longitude]}
                  icon={pinIcon}
                >
                  <Popup>
                    <div className="p-2 font-sans text-xs min-w-[200px] text-slate-900">
                      {/* Top Role Badge */}
                      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase text-white tracking-wider shadow-sm"
                          style={{ backgroundColor: badgeBg }}
                        >
                          {roleName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 font-bold">
                          Stop #{stop.sequence_order || idx + 1}
                        </span>
                      </div>

                      {/* Location Name & Full Address */}
                      <div className="font-bold text-slate-900 text-sm leading-tight mb-2">
                        {stop.location_name}
                      </div>

                      {/* Location Coordinates & Duration Details */}
                      <div className="space-y-1 text-[11px] font-mono bg-slate-100 p-2 rounded border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Latitude:</span>
                          <span className="font-bold text-slate-800">{stop.latitude.toFixed(6)}°</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Longitude:</span>
                          <span className="font-bold text-slate-800">{stop.longitude.toFixed(6)}°</span>
                        </div>
                        {stop.duration_minutes !== undefined && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                            <span className="text-slate-500">Duration:</span>
                            <span className="font-bold text-indigo-700">{stop.duration_minutes} min</span>
                          </div>
                        )}
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
