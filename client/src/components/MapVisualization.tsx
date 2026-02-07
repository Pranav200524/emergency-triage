import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import { Icon, divIcon } from "leaflet";
import { AnalyzedMessage, Resource } from "@shared/schema";
import { ResourceIcon } from "./ResourceIcon";
import { UrgencyBadge } from "./UrgencyBadge";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issues in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapVisualizationProps {
  resources: Resource[];
  analyzedMessages: AnalyzedMessage[];
}

// Custom icons using HTML
const createCustomIcon = (type: 'resource' | 'incident', urgency?: string) => {
  const color = type === 'resource' 
    ? '#10b981' // Green for resources
    : urgency === 'high' ? '#ef4444' : urgency === 'medium' ? '#f97316' : '#3b82f6';

  const html = `
    <div style="
      background-color: ${color};
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 10px ${color};
    "></div>
  `;
  
  return divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);
  return null;
}

export function MapVisualization({ resources, analyzedMessages }: MapVisualizationProps) {
  const chennaiCenter: [number, number] = [13.0827, 80.2707];

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-white/10 shadow-2xl relative">
      <div className="absolute top-4 right-4 z-[9999] bg-background/90 backdrop-blur border border-white/10 p-3 rounded-lg shadow-lg">
        <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Legend</div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
          <span className="text-xs">High Urgency Incident</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
          <span className="text-xs">Medium Urgency Incident</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <span className="text-xs">Available Resource</span>
        </div>
      </div>

      <MapContainer 
        center={chennaiCenter} 
        zoom={12} 
        scrollWheelZoom={true}
        className="w-full h-full bg-slate-900"
      >
        {/* Dark theme map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController center={chennaiCenter} />

        {/* Resources */}
        {resources.map((res) => (
          <Marker 
            key={res.id} 
            position={[res.lat, res.lng]}
            icon={createCustomIcon('resource')}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[150px]">
                <div className="flex items-center gap-2 mb-2 border-b border-border pb-2">
                  <ResourceIcon type={res.type} className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-sm">{res.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Status: <span className="text-emerald-500 font-medium">{res.status}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Incidents */}
        {analyzedMessages.map((msg) => {
          if (!msg.coordinates) return null;
          return (
            <div key={msg.id}>
              <Marker 
                position={[msg.coordinates.lat, msg.coordinates.lng]}
                icon={createCustomIcon('incident', msg.urgency_level)}
              >
                <Popup className="custom-popup">
                  <div className="p-1 max-w-[200px]">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
                      <span className="font-bold text-sm truncate">Incident #{msg.id.slice(0,4)}</span>
                      <UrgencyBadge level={msg.urgency_level} className="scale-75 origin-right" />
                    </div>
                    <p className="text-xs mb-2 line-clamp-3 italic text-muted-foreground">
                      "{msg.original_content}"
                    </p>
                    <div className="text-xs font-mono bg-muted/50 p-1.5 rounded">
                      Needs: {msg.need}
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Line connecting incident to matched resource */}
              {msg.matched_resource && (
                <Polyline 
                  positions={[
                    [msg.coordinates.lat, msg.coordinates.lng],
                    [msg.matched_resource.lat, msg.matched_resource.lng]
                  ]}
                  pathOptions={{ 
                    color: msg.urgency_level === 'high' ? '#ef4444' : '#3b82f6', 
                    weight: 2, 
                    dashArray: '5, 10',
                    opacity: 0.6
                  }}
                />
              )}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
