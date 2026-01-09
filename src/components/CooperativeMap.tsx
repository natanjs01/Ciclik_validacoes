import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Cooperativa {
  id: string;
  nome_fantasia: string;
  cidade: string | null;
  uf: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number | null;
}

interface CooperativeMapProps {
  cooperativas: Cooperativa[];
  selectedId: string;
  onSelect: (id: string) => void;
  userLocation: { latitude: number; longitude: number } | null;
  className?: string;
}

// Custom marker icons
const createMarkerIcon = (selected: boolean) => {
  const color = selected ? '#95C11F' : '#FBBB1A';
  const size = selected ? 32 : 24;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        ${selected ? 'transform: scale(1.1);' : ''}
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      width: 20px;
      height: 20px;
      background: #3B82F6;
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3);
      animation: pulse 2s infinite;
    "></div>
    <style>
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3); }
        50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.1), 0 2px 8px rgba(0,0,0,0.3); }
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const formatDistance = (km: number | null | undefined): string => {
  if (km === null || km === undefined) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

export default function CooperativeMap({
  cooperativas,
  selectedId,
  onSelect,
  userLocation,
  className,
}: CooperativeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Default center (Brazil)
    const defaultCenter: [number, number] = userLocation
      ? [userLocation.latitude, userLocation.longitude]
      : [-15.7801, -47.9292];

    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: userLocation ? 12 : 4,
      zoomControl: false,
    });

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    const marker = L.marker([userLocation.latitude, userLocation.longitude], {
      icon: userLocationIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    marker.bindPopup('<strong>Você está aqui</strong>');

    return () => {
      marker.remove();
    };
  }, [userLocation]);

  // Update cooperative markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const validCoops = cooperativas.filter(
      (c) => c.latitude && c.longitude
    );

    // Add markers for each cooperative
    validCoops.forEach((coop) => {
      const isSelected = coop.id === selectedId;
      const marker = L.marker([coop.latitude!, coop.longitude!], {
        icon: createMarkerIcon(isSelected),
        zIndexOffset: isSelected ? 500 : 0,
      }).addTo(map);

      const popupContent = `
        <div style="min-width: 150px;">
          <strong style="color: #1a1a1a;">${coop.nome_fantasia}</strong>
          <br/>
          <span style="color: #666; font-size: 12px;">
            ${coop.cidade || ''}${coop.cidade && coop.uf ? ', ' : ''}${coop.uf || ''}
          </span>
          ${coop.distance !== null && coop.distance !== undefined ? `<br/><span style="color: #95C11F; font-weight: 600; font-size: 13px;">${formatDistance(coop.distance)}</span>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        onSelect(coop.id);
      });

      markersRef.current.set(coop.id, marker);
    });

    // Fit bounds if we have cooperatives
    if (validCoops.length > 0) {
      const bounds = L.latLngBounds(
        validCoops.map((c) => [c.latitude!, c.longitude!])
      );
      
      if (userLocation) {
        bounds.extend([userLocation.latitude, userLocation.longitude]);
      }

      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [cooperativas, selectedId, onSelect]);

  // Center on selected cooperative
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedId) return;

    const marker = markersRef.current.get(selectedId);
    if (marker) {
      map.setView(marker.getLatLng(), 14, { animate: true });
      marker.openPopup();
    }
  }, [selectedId]);

  const hasCooperativas = cooperativas.some((c) => c.latitude && c.longitude);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={cn('relative rounded-2xl overflow-hidden border shadow-sm z-0', className)}
      style={{ isolation: 'isolate' }}
    >
      {/* Map container - z-index controlado */}
      <div ref={mapRef} className="w-full h-full min-h-[250px]" style={{ zIndex: 0 }} />

      {/* Overlay when no cooperatives */}
      {!hasCooperativas && (
        <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <MapPin className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center px-4">
            Nenhuma cooperativa com localização disponível
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-12 left-3 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-primary border-2 border-white shadow" />
          <span>Selecionada</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-accent border-2 border-white shadow" />
          <span>Disponível</span>
        </div>
        {userLocation && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />
            <span>Você</span>
          </div>
        )}
      </div>

      {/* Center on user button */}
      {userLocation && (
        <button
          onClick={() => {
            mapInstanceRef.current?.setView(
              [userLocation.latitude, userLocation.longitude],
              14,
              { animate: true }
            );
          }}
          className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm p-2 rounded-lg shadow-md hover:bg-background transition-colors"
          title="Centralizar em você"
        >
          <Navigation2 className="h-4 w-4 text-blue-500" />
        </button>
      )}
    </motion.div>
  );
}
