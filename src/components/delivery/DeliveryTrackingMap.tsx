import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary, useMap, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import {
  Truck,
  MapPin,
  Navigation,
  Loader2,
  Compass,
  Layers,
  LocateFixed,
  Phone,
  Route as RouteIcon,
} from 'lucide-react';
import { Order, DeliveryPersonnel } from '../../types';

interface Props {
  order: Order;
  storeAddress: string;
  deliveryPerson?: DeliveryPersonnel;
}

const STORE_HUB_COORDS = { lat: 8.5241, lng: 76.9366 };

export const DeliveryTrackingMap: React.FC<Props> = ({ order, storeAddress, deliveryPerson }) => {
  const map = useMap('delivery-tracking-map');
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const [routeInfo, setRouteDetails] = useState<{
    distance: string;
    duration: string;
    steps: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [useLiveDriverGps, setUseLiveDriverGps] = useState(false);
  const [liveGpsCoords, setLiveGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const customerLat = order.shippingAddress?.lat || 8.5285;
  const customerLng = order.shippingAddress?.lng || 76.9420;
  const hasExactPin = Boolean(order.shippingAddress?.lat && order.shippingAddress?.lng);

  const activeDriverCoords =
    useLiveDriverGps && liveGpsCoords
      ? liveGpsCoords
      : deliveryPerson?.currentLat && deliveryPerson?.currentLng
      ? { lat: deliveryPerson.currentLat, lng: deliveryPerson.currentLng }
      : null;

  const routeOrigin = activeDriverCoords || STORE_HUB_COORDS;

  const handleLocateMyGps = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this browser.');
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveGpsCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setUseLiveDriverGps(true);
        setIsLocatingGps(false);
      },
      () => {
        setIsLocatingGps(false);
        setError('Unable to fetch live GPS. Routing from Store Hub.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (!routesLib || !map || !order.shippingAddress) return;

    const destination = hasExactPin
      ? { lat: customerLat, lng: customerLng }
      : `${order.shippingAddress.house || ''}, ${order.shippingAddress.street || ''}, ${order.shippingAddress.city || 'Trivandrum'}`;

    const calculateRoute = async () => {
      setIsLoading(true);
      setError(null);

      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];

      try {
        const request = {
          origin: routeOrigin,
          destination,
          travelMode: 'DRIVING',
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
        };

        const { routes } = await (routesLib.Route as any).computeRoutes(request);

        if (!routes || routes.length === 0) {
          setError('Showing pinned delivery destination on map.');
          map.panTo({ lat: customerLat, lng: customerLng });
          return;
        }

        const primaryRoute = routes[0];

        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline: google.maps.Polyline) => {
          polyline.setOptions({
            strokeColor: '#71883F',
            strokeWeight: 5,
            strokeOpacity: 0.85,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 55);
        }

        const extractedSteps: string[] = [];
        const legs = primaryRoute.legs || [];
        if (legs.length > 0 && Array.isArray(legs[0].steps)) {
          for (const step of legs[0].steps.slice(0, 3)) {
            const inst = step.instructions || step.navigationInstruction?.instructions || '';
            if (inst) {
              extractedSteps.push(String(inst).replace(/<[^>]*>?/gm, ''));
            }
          }
        }

        setRouteDetails({
          distance: ((primaryRoute.distanceMeters || 2400) / 1000).toFixed(1) + ' km',
          duration: Math.max(3, Math.round((primaryRoute.durationMillis || 540000) / 60000)) + ' mins',
          steps: extractedSteps,
        });
      } catch (err: any) {
        console.warn('Route calculation notice:', err);
        const msg = String(err?.message || err || '');
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT') || msg.includes('429')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        map.panTo({ lat: customerLat, lng: customerLng });
      } finally {
        setIsLoading(false);
      }
    };

    calculateRoute();

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
    };
  }, [
    routesLib,
    map,
    order,
    customerLat,
    customerLng,
    hasExactPin,
    routeOrigin.lat,
    routeOrigin.lng,
  ]);

  const mapsDestinationParam = hasExactPin
    ? `${customerLat},${customerLng}`
    : encodeURIComponent(
        `${order.shippingAddress?.house || ''}, ${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || 'Trivandrum'}`
      );

  const mapsOriginParam = `${routeOrigin.lat},${routeOrigin.lng}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Top Route Info & Controls */}
      <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-[#71883F] flex items-center justify-center shadow-2xs shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#171717]">
                Destination: {order.shippingAddress?.area || order.shippingAddress?.city || 'Customer Pin'}
              </span>
              <span
                className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  hasExactPin ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {hasExactPin ? 'Exact GPS Pin' : 'Address Pin'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#6B6B6B] mt-0.5">
              GPS: {customerLat.toFixed(5)}, {customerLng.toFixed(5)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (useLiveDriverGps) {
                setUseLiveDriverGps(false);
              } else {
                handleLocateMyGps();
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              useLiveDriverGps
                ? 'bg-[#145A38] text-white border-[#145A38]'
                : 'bg-white text-[#171717] border-[#E8E8E3] hover:border-[#71883F]'
            }`}
          >
            {isLocatingGps ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LocateFixed className="w-3.5 h-3.5 text-[#71883F]" />
            )}
            <span>{useLiveDriverGps ? 'Routing from My GPS' : 'Route from My Live GPS'}</span>
          </button>

          {routeInfo && (
            <div className="bg-[#171717] text-white rounded-xl px-3 py-1.5 flex items-center gap-3">
              <div>
                <span className="text-[9px] text-neutral-400 uppercase font-bold block">ETA</span>
                <span className="text-xs font-black">{routeInfo.duration}</span>
              </div>
              <div className="w-px h-6 bg-white/15" />
              <div>
                <span className="text-[9px] text-neutral-400 uppercase font-bold block">Dist</span>
                <span className="text-xs font-black">{routeInfo.distance}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Google Map */}
      <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-[#E8E8E3] relative shadow-inner bg-[#E5E9E0]">
        <Map
          id="delivery-tracking-map"
          mapId="DEMO_MAP_ID"
          mapTypeId={mapTypeId}
          defaultCenter={{ lat: customerLat, lng: customerLng }}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          {/* Store Hub Origin Marker */}
          <AdvancedMarker position={STORE_HUB_COORDS} title={storeAddress}>
            <div className="bg-white/95 border-2 border-[#71883F] px-2.5 py-1 rounded-full text-[10px] font-extrabold text-[#71883F] shadow-md flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#71883F]" />
              <span>Fathima Store Hub</span>
            </div>
          </AdvancedMarker>

          {/* Customer Destination Marker */}
          <AdvancedMarker position={{ lat: customerLat, lng: customerLng }}>
            <div className="flex flex-col items-center">
              <div className="bg-[#171717] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg mb-1 whitespace-nowrap border border-[#71883F]">
                {order.customerName} ({order.shippingAddress?.house || 'Doorstep'})
              </div>
              <Pin background={'#171717'} glyphColor={'#FFF'} borderColor={'#71883F'} scale={1.15} />
            </div>
          </AdvancedMarker>

          {/* Delivery Person / Live Driver Marker */}
          {activeDriverCoords && (
            <AdvancedMarker position={activeDriverCoords}>
              <div className="relative flex items-center justify-center">
                <div className="absolute w-10 h-10 bg-[#71883F]/25 rounded-full animate-ping" />
                <div className="w-10 h-10 rounded-full bg-[#71883F] text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-[#71883F]/30 z-10">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
            </AdvancedMarker>
          )}
        </Map>

        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-[#71883F] animate-spin" />
              <p className="text-[10px] font-bold text-[#71883F]">Computing Google Maps Route...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-3 left-3 right-3 bg-white/95 border border-[#E8E8E3] p-2.5 rounded-xl flex items-center gap-2 z-20 shadow-md">
            <Compass className="w-4 h-4 text-[#71883F] shrink-0" />
            <p className="text-[10px] font-semibold text-[#171717]">{error}</p>
          </div>
        )}

        {deliveryPerson && (
          <div className="absolute top-4 left-4 flex items-start pointer-events-none z-10">
            <div className="bg-white/95 backdrop-blur-md border border-[#E8E8E3] rounded-2xl p-3 shadow-lg flex items-center gap-3 pointer-events-auto">
              <div className="w-10 h-10 rounded-xl bg-[#71883F] text-white flex items-center justify-center shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#71883F] uppercase tracking-wider">
                  Assigned Partner
                </p>
                <p className="text-xs font-bold text-[#171717]">{deliveryPerson.name}</p>
                <p className="text-[10px] text-[#6B6B6B]">
                  {deliveryPerson.vehicleType} • {deliveryPerson.vehicleNumber}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Map Floating Controls */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
          <button
            type="button"
            onClick={() => setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="pointer-events-auto px-3 py-1.5 bg-white/95 hover:bg-white border border-[#E8E8E3] rounded-xl text-[11px] font-bold text-[#171717] shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#71883F]" />
            <span>{mapTypeId === 'roadmap' ? 'Satellite View' : 'Street Map'}</span>
          </button>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                if (!map) return;
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(routeOrigin);
                bounds.extend({ lat: customerLat, lng: customerLng });
                map.fitBounds(bounds, 55);
              }}
              className="px-3 py-1.5 bg-white/95 hover:bg-white border border-[#E8E8E3] rounded-xl text-[11px] font-bold text-[#171717] shadow-md cursor-pointer"
            >
              Fit Route
            </button>
            <button
              type="button"
              onClick={() => {
                if (map) {
                  map.panTo({ lat: customerLat, lng: customerLng });
                  map.setZoom(18);
                }
              }}
              className="px-3 py-1.5 bg-[#171717] text-white rounded-xl text-[11px] font-bold shadow-md flex items-center gap-1 cursor-pointer"
            >
              <LocateFixed className="w-3.5 h-3.5 text-[#A9C46C]" />
              <span>Customer Pin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Route Steps Summary */}
      {routeInfo && routeInfo.steps.length > 0 && (
        <div className="bg-white border border-[#E8E8E3] rounded-2xl p-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71883F] flex items-center gap-1">
              <RouteIcon className="w-3.5 h-3.5" /> Driving Directions Preview
            </span>
            <span className="text-[10px] font-bold text-[#171717]">
              {routeInfo.distance} ({routeInfo.duration})
            </span>
          </div>
          <ol className="text-xs text-[#6B6B6B] space-y-1 list-decimal list-inside">
            {routeInfo.steps.map((step, idx) => (
              <li key={idx} className="truncate">
                <span className="text-[#171717] font-medium">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&origin=${mapsOriginParam}&destination=${mapsDestinationParam}&travelmode=driving`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[200px] py-3 px-4 bg-[#71883F] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#5F7334] transition-all shadow-xs active:scale-98"
        >
          <Navigation className="w-4 h-4" /> Drive to Customer in Google Maps
        </a>

        <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapsDestinationParam}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-3 bg-white border border-[#E8E8E3] hover:border-[#71883F] text-[#171717] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs"
        >
          <MapPin className="w-4 h-4 text-[#71883F]" /> Open Pin
        </a>

        {deliveryPerson && (
          <a
            href={`tel:${deliveryPerson.phone}`}
            className="px-4 py-3 bg-white border border-[#E8E8E3] text-[#171717] rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#F7F8F3] transition-all shadow-xs active:scale-98"
          >
            <Phone className="w-4 h-4 text-[#71883F]" /> Call Agent
          </a>
        )}
      </div>
    </div>
  );
};
