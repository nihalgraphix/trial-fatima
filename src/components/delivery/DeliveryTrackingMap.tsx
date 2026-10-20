import React, { useEffect, useState, useRef } from 'react';
import {
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Order, DeliveryPersonnel } from '../../types';
import { useStore } from '../../context/StoreContext';
import {
  Navigation,
  MapPin,
  Truck,
  ExternalLink,
  Clock,
  Route as RouteIcon,
  Phone,
  Layers,
} from 'lucide-react';

interface DeliveryTrackingMapProps {
  order: Order;
  storeAddress?: string;
  storeCoords?: { lat: number; lng: number };
  deliveryPerson?: DeliveryPersonnel | null;
}

const ModernRoutesLayer: React.FC<{
  mapIdKey: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  onRouteCalculated: (distance: string, duration: string) => void;
}> = ({ mapIdKey, origin, destination, onRouteCalculated }) => {
  const map = useMap(mapIdKey);
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !(routesLib as any).Route) return;

    // Clear previous polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const request = {
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    };

    (routesLib as any).Route.computeRoutes(request)
      .then(({ routes }: { routes: any[] }) => {
        if (!routes || routes.length === 0) return;
        const primaryRoute = routes[0];

        if (typeof primaryRoute.createPolylines === 'function') {
          const newPolylines = primaryRoute.createPolylines();
          newPolylines.forEach((polyline: google.maps.Polyline) => {
            polyline.setOptions({
              strokeColor: '#71883F',
              strokeWeight: 5,
              strokeOpacity: 0.9,
            });
            polyline.setMap(map);
          });
          polylinesRef.current = newPolylines;
        }

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 48);
        }

        const distMeters = Number(primaryRoute.distanceMeters || 0);
        const durMillis = Number(primaryRoute.durationMillis || 0);
        if (distMeters > 0) {
          const km = (distMeters / 1000).toFixed(1);
          const mins = Math.max(2, Math.round(durMillis / 60000));
          onRouteCalculated(`${km} km`, `${mins} mins`);
        }
      })
      .catch((err: any) => {
        const msg = String(err?.message || err);
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, origin.lat, origin.lng, destination.lat, destination.lng]);

  return null;
};

export const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({
  order,
  storeAddress,
  storeCoords,
  deliveryPerson,
}) => {
  const { storeSettings } = useStore();
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');

  const resolvedStoreAddress =
    storeAddress ||
    storeSettings?.storeAddress ||
    storeSettings?.address ||
    'T.C 45/862(2), Subash Nagar, Vallakkadavu P.O, Thiruvananthapuram, Kerala 695008';

  const resolvedStoreCoords = storeCoords || {
    lat: Number(storeSettings?.storeLat) || 8.4806,
    lng: Number(storeSettings?.storeLng) || 76.9261,
  };

  const destCoords = {
    lat: Number(order.shippingAddress?.lat) || resolvedStoreCoords.lat + 0.015,
    lng: Number(order.shippingAddress?.lng) || resolvedStoreCoords.lng + 0.015,
  };

  const liveCourierCoords =
    order.deliveryLocation?.lat && order.deliveryLocation?.lng
      ? {
          lat: Number(order.deliveryLocation.lat),
          lng: Number(order.deliveryLocation.lng),
        }
      : null;

  // Calculate initial Haversine distance/duration estimate until Routes API responds
  const calcHaversine = () => {
    const R = 6371;
    const dLat = ((destCoords.lat - resolvedStoreCoords.lat) * Math.PI) / 180;
    const dLon = ((destCoords.lng - resolvedStoreCoords.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((resolvedStoreCoords.lat * Math.PI) / 180) *
        Math.cos((destCoords.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const roadKm = Math.max(0.8, R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.28);
    return {
      km: `${roadKm.toFixed(1)} km`,
      mins: `${Math.max(5, Math.round(roadKm * 3.2))} mins`,
    };
  };

  const initialEst = calcHaversine();
  const [distance, setDistance] = useState<string>(initialEst.km);
  const [duration, setDuration] = useState<string>(initialEst.mins);

  const mapInstanceId = `delivery-tracking-map-${order.id}`;

  const googleMapsDriveUrl = `https://www.google.com/maps/dir/?api=1&origin=${resolvedStoreCoords.lat},${resolvedStoreCoords.lng}&destination=${destCoords.lat},${destCoords.lng}&travelmode=driving`;

  return (
    <div className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-2xs text-left">
      <div className="p-4 border-b border-[#E8E8E3] bg-[#F7F8F3] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#71883F] text-white flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#171717] uppercase tracking-wider">
              Live Google Maps Route & Pinned Location
            </h4>
            <p className="text-[11px] text-[#6B6B6B]">
              Origin: {storeSettings?.storeName || 'Fathima Stores'} Hub • Customer Pin:{' '}
              {destCoords.lat.toFixed(4)}, {destCoords.lng.toFixed(4)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-xs">
            <span className="flex items-center gap-1 font-semibold text-[#171717]">
              <RouteIcon className="w-3.5 h-3.5 text-[#71883F]" /> {distance}
            </span>
            <span className="text-[#E8E8E3]">|</span>
            <span className="flex items-center gap-1 font-semibold text-[#71883F]">
              <Clock className="w-3.5 h-3.5" /> {duration}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))
            }
            className="px-3 py-1.5 bg-white hover:bg-[#FAFBF7] border border-[#E8E8E3] text-[#171717] text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#71883F]" />
            <span>{mapTypeId === 'roadmap' ? 'Satellite' : 'Street Map'}</span>
          </button>

          <a
            href={googleMapsDriveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" /> Navigate in Google Maps{' '}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Google Map View */}
      <div className="relative h-80 sm:h-96 w-full bg-[#EFF4E6]/30">
        <Map
          id={mapInstanceId}
          defaultCenter={destCoords}
          defaultZoom={13}
          mapId="DEMO_MAP_ID"
          mapTypeId={mapTypeId}
          gestureHandling="greedy"
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full"
        >
          {/* Store Origin Marker */}
          <AdvancedMarker position={resolvedStoreCoords} title={resolvedStoreAddress}>
            <div className="px-2.5 py-1 bg-[#171717] text-white text-[10px] font-bold rounded-full shadow-md flex items-center gap-1 border-2 border-white">
              <span>Store Hub</span>
            </div>
          </AdvancedMarker>

          {/* Live Courier GPS Marker (if broadcasted) */}
          {liveCourierCoords && (
            <AdvancedMarker position={liveCourierCoords} title="Live Delivery Courier GPS">
              <div className="px-2.5 py-1 bg-sky-600 text-white text-[10px] font-bold rounded-full shadow-md flex items-center gap-1 border-2 border-white">
                <Truck className="w-3 h-3" />
                <span>Live Courier</span>
              </div>
            </AdvancedMarker>
          )}

          {/* Customer Destination Marker */}
          <AdvancedMarker position={destCoords} title={order.shippingAddress?.fullName}>
            <div className="flex flex-col items-center">
              <div className="px-2.5 py-1 bg-[#71883F] text-white text-[10px] font-bold rounded-full shadow-md mb-1 border-2 border-white">
                {order.shippingAddress?.fullName || 'Customer Location'}
              </div>
              <div className="w-7 h-7 rounded-full bg-[#71883F] text-white flex items-center justify-center shadow-lg border-2 border-white">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
          </AdvancedMarker>

          <ModernRoutesLayer
            mapIdKey={mapInstanceId}
            origin={resolvedStoreCoords}
            destination={destCoords}
            onRouteCalculated={(dist, dur) => {
              setDistance(dist);
              setDuration(dur);
            }}
          />
        </Map>
      </div>

      {deliveryPerson && (
        <div className="p-3.5 bg-white border-t border-[#E8E8E3] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-[#EFF4E6] text-[#71883F] font-bold flex items-center justify-center">
              {deliveryPerson.name.charAt(0)}
            </span>
            <div>
              <p className="font-bold text-[#171717]">
                Assigned Courier: {deliveryPerson.name} ({deliveryPerson.vehicleType} •{' '}
                {deliveryPerson.vehicleNumber})
              </p>
              <p className="text-[11px] text-[#6B6B6B]">Area: {deliveryPerson.area}</p>
            </div>
          </div>
          <a
            href={`tel:${deliveryPerson.phone}`}
            className="px-3 py-1.5 bg-[#EFF4E6] text-[#71883F] font-bold rounded-lg flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" /> Call Agent ({deliveryPerson.phone})
          </a>
        </div>
      )}
    </div>
  );
};
