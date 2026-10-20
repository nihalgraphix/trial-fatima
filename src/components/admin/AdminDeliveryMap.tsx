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
  Copy,
  Check,
  Route as RouteIcon,
  Phone,
  Bike,
  Car,
} from 'lucide-react';
import { Order } from '../../types';
import { useStore } from '../../context/StoreContext';

interface Props {
  order: Order;
  storeAddress?: string;
}

export const AdminDeliveryMap: React.FC<Props> = ({ order, storeAddress }) => {
  const { storeSettings } = useStore();
  const map = useMap('admin-order-delivery-map');
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const watchIdRef = useRef<number | null>(null);

  const STORE_HUB_COORDS = {
    lat: storeSettings?.storeLat ?? 8.5241,
    lng: storeSettings?.storeLng ?? 76.9366,
  };

  const [routeInfo, setRouteDetails] = useState<{
    distance: string;
    duration: string;
    steps: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [originMode, setOriginMode] = useState<'store' | 'live_gps'>('store');
  const [adminLiveCoords, setAdminLiveCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocatingAdmin, setIsLocatingAdmin] = useState(false);
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'TWO_WHEELER'>('DRIVING');
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [copiedCoords, setCopiedCoords] = useState(false);

  const safeStoreAddress =
    storeAddress || storeSettings?.address || 'MG Road, Trivandrum, Kerala 695001';
  const customerLat = order.shippingAddress?.lat || STORE_HUB_COORDS.lat + 0.0044;
  const customerLng = order.shippingAddress?.lng || STORE_HUB_COORDS.lng + 0.0054;
  const hasExactPin = Boolean(order.shippingAddress?.lat && order.shippingAddress?.lng);

  // Manage live GPS tracking when Admin selects "Drive from My GPS"
  useEffect(() => {
    if (originMode !== 'live_gps') {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser. Routing from Store Hub.');
      setOriginMode('store');
      return;
    }

    setIsLocatingAdmin(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAdminLiveCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocatingAdmin(false);
      },
      () => {
        setIsLocatingAdmin(false);
        setError('Unable to access live GPS. Using Store Hub as starting point.');
        setOriginMode('store');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setAdminLiveCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [originMode]);

  const activeOriginCoords =
    originMode === 'live_gps' && adminLiveCoords ? adminLiveCoords : STORE_HUB_COORDS;

  useEffect(() => {
    if (!routesLib || !map || !order.shippingAddress) return;

    const destination = hasExactPin
      ? { lat: customerLat, lng: customerLng }
      : `${order.shippingAddress.house || ''}, ${order.shippingAddress.street || ''}, ${order.shippingAddress.city || 'Trivandrum'}, ${order.shippingAddress.pinCode || ''}`;

    const calculateRoute = async () => {
      setIsLoading(true);
      setError(null);

      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];

      try {
        const request = {
          origin: activeOriginCoords,
          destination,
          travelMode,
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
        };

        const { routes } = await (routesLib.Route as any).computeRoutes(request);

        if (!routes || routes.length === 0) {
          setError('Showing pinned customer coordinates on map.');
          map.panTo({ lat: customerLat, lng: customerLng });
          return;
        }

        const primaryRoute = routes[0];

        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline: google.maps.Polyline) => {
          polyline.setOptions({
            strokeColor: originMode === 'live_gps' ? '#145A38' : '#71883F',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 50);
        }

        const extractedSteps: string[] = [];
        const legs = primaryRoute.legs || [];
        if (legs.length > 0 && Array.isArray(legs[0].steps)) {
          for (const step of legs[0].steps.slice(0, 4)) {
            const inst =
              step.instructions ||
              step.navigationInstruction?.instructions ||
              '';
            if (inst) {
              extractedSteps.push(String(inst).replace(/<[^>]*>?/gm, ''));
            }
          }
        }

        setRouteDetails({
          distance: ((primaryRoute.distanceMeters || 2500) / 1000).toFixed(1) + ' km',
          duration: Math.max(3, Math.round((primaryRoute.durationMillis || 600000) / 60000)) + ' mins',
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
    activeOriginCoords.lat,
    activeOriginCoords.lng,
    travelMode,
    originMode,
  ]);

  const mapsDestinationQuery = hasExactPin
    ? `${customerLat},${customerLng}`
    : encodeURIComponent(
        `${order.shippingAddress?.house || ''}, ${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || 'Trivandrum'} ${order.shippingAddress?.pinCode || ''}`
      );

  const mapsOriginQuery =
    originMode === 'live_gps' && adminLiveCoords
      ? `${adminLiveCoords.lat},${adminLiveCoords.lng}`
      : `${STORE_HUB_COORDS.lat},${STORE_HUB_COORDS.lng}`;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${customerLat.toFixed(6)}, ${customerLng.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Route & Customer Pin Info Header */}
      <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#71883F] shadow-2xs shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-[#171717]">
                  Locate & Drive to Customer
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    hasExactPin
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {hasExactPin ? 'Customer GPS Pin Verified' : 'Address Geocoded'}
                </span>
              </div>
              <p className="text-[10px] text-[#6B6B6B] font-mono mt-0.5">
                Pin: {customerLat.toFixed(5)}, {customerLng.toFixed(5)} •{' '}
                {order.deliveryMethod || 'Standard Delivery'}
              </p>
            </div>
          </div>

          {routeInfo && (
            <div className="flex gap-4 bg-white px-3 py-1.5 rounded-xl border border-[#E8E8E3]">
              <div className="text-right">
                <p className="text-[9px] font-bold text-[#71883F] uppercase tracking-wider">
                  Road Dist
                </p>
                <p className="text-xs font-black text-[#171717]">{routeInfo.distance}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-[#71883F] uppercase tracking-wider">
                  Est. Drive
                </p>
                <p className="text-xs font-black text-[#171717]">{routeInfo.duration}</p>
              </div>
            </div>
          )}
        </div>

        {/* Origin & Vehicle Mode Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8E8E3]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setOriginMode('store')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                originMode === 'store'
                  ? 'bg-[#71883F] text-white border-[#71883F]'
                  : 'bg-white text-[#6B6B6B] border-[#E8E8E3] hover:border-[#71883F]'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>From Store Hub</span>
            </button>
            <button
              type="button"
              onClick={() => setOriginMode('live_gps')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                originMode === 'live_gps'
                  ? 'bg-[#145A38] text-white border-[#145A38]'
                  : 'bg-white text-[#6B6B6B] border-[#E8E8E3] hover:border-[#71883F]'
              }`}
            >
              {isLocatingAdmin ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <LocateFixed className="w-3 h-3" />
              )}
              <span>Drive from My Live GPS</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTravelMode('DRIVING')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border cursor-pointer ${
                travelMode === 'DRIVING'
                  ? 'bg-[#171717] text-white border-[#171717]'
                  : 'bg-white text-[#6B6B6B] border-[#E8E8E3]'
              }`}
              title="Van / Car Delivery Route"
            >
              <Car className="w-3 h-3" />
              <span>Van/Car</span>
            </button>
            <button
              type="button"
              onClick={() => setTravelMode('TWO_WHEELER')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border cursor-pointer ${
                travelMode === 'TWO_WHEELER'
                  ? 'bg-[#171717] text-white border-[#171717]'
                  : 'bg-white text-[#6B6B6B] border-[#E8E8E3]'
              }`}
              title="2-Wheeler Delivery Bike Route"
            >
              <Bike className="w-3 h-3" />
              <span>Bike</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Google Map */}
      <div className="h-[360px] w-full rounded-2xl overflow-hidden border border-[#E8E8E3] relative shadow-inner bg-[#E5E9E0]">
        <Map
          id="admin-order-delivery-map"
          mapId="DEMO_MAP_ID"
          mapTypeId={mapTypeId}
          defaultCenter={{ lat: customerLat, lng: customerLng }}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          {/* Store Hub Origin Marker */}
          <AdvancedMarker position={STORE_HUB_COORDS} title={safeStoreAddress}>
            <div className="bg-white/95 border-2 border-[#71883F] px-2 py-0.5 rounded-full text-[10px] font-extrabold text-[#71883F] shadow-md flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#71883F]" />
              <span>Store Hub</span>
            </div>
          </AdvancedMarker>

          {/* Admin / Driver Live GPS Marker */}
          {originMode === 'live_gps' && adminLiveCoords && (
            <AdvancedMarker position={adminLiveCoords} title="Your Live Driver GPS Position">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-9 h-9 bg-emerald-500/30 rounded-full animate-ping" />
                <div className="bg-emerald-700 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-lg border-2 border-white flex items-center gap-1 z-10">
                  <Navigation className="w-3 h-3" />
                  <span>Admin / Driver GPS</span>
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Customer Destination Marker */}
          <AdvancedMarker
            position={{ lat: customerLat, lng: customerLng }}
            title={`Customer: ${order.customerName}`}
          >
            <div className="flex flex-col items-center">
              <div className="bg-[#171717] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg mb-1 whitespace-nowrap border border-[#71883F]">
                <span className="text-[#A9C46C] mr-1">Drop:</span>
                {order.customerName}
              </div>
              <Pin background={'#171717'} glyphColor={'#FFF'} borderColor={'#71883F'} scale={1.15} />
            </div>
          </AdvancedMarker>
        </Map>

        {/* Floating Map Controls (Satellite Toggle + Center Customer Pin) */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
          <button
            type="button"
            onClick={() => setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="pointer-events-auto px-2.5 py-1.5 bg-white/95 hover:bg-white border border-[#E8E8E3] rounded-xl text-[10px] font-bold text-[#171717] shadow-md flex items-center gap-1 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#71883F]" />
            <span>{mapTypeId === 'roadmap' ? 'Satellite Gate View' : 'Street Map'}</span>
          </button>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                if (!map) return;
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(activeOriginCoords);
                bounds.extend({ lat: customerLat, lng: customerLng });
                map.fitBounds(bounds, 50);
              }}
              className="px-2.5 py-1.5 bg-white/95 hover:bg-white border border-[#E8E8E3] rounded-xl text-[10px] font-bold text-[#171717] shadow-md cursor-pointer"
            >
              Fit Full Route
            </button>
            <button
              type="button"
              onClick={() => {
                if (map) {
                  map.panTo({ lat: customerLat, lng: customerLng });
                  map.setZoom(18);
                }
              }}
              className="px-2.5 py-1.5 bg-[#171717] text-white rounded-xl text-[10px] font-bold shadow-md flex items-center gap-1 cursor-pointer"
            >
              <LocateFixed className="w-3 h-3 text-[#A9C46C]" />
              <span>Zoom to Customer House</span>
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 text-[#71883F] animate-spin" />
              <p className="text-[10px] font-bold text-[#71883F]">Calculating Delivery Route...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-3 left-3 right-3 bg-white/95 border border-[#E8E8E3] p-2.5 rounded-xl flex items-center gap-2 z-20 shadow-md">
            <Compass className="w-4 h-4 text-[#71883F] shrink-0" />
            <p className="text-[10px] font-semibold text-[#171717]">{error}</p>
          </div>
        )}
      </div>

      {/* Turn-by-Turn Route Steps Summary (if available) */}
      {routeInfo && routeInfo.steps.length > 0 && (
        <div className="bg-white border border-[#E8E8E3] rounded-xl p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71883F] flex items-center gap-1">
              <RouteIcon className="w-3 h-3" /> Key Route Directions
            </span>
            <span className="text-[10px] font-semibold text-[#6B6B6B]">
              {routeInfo.distance} • {routeInfo.duration}
            </span>
          </div>
          <ol className="text-[11px] text-[#171717] space-y-1 list-decimal list-inside">
            {routeInfo.steps.map((step, i) => (
              <li key={i} className="truncate text-[#6B6B6B]">
                <span className="text-[#171717] font-medium">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Primary Action Buttons: Start Google Maps Driving Navigation, View Pin, Call Customer, Copy GPS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&origin=${mapsOriginQuery}&destination=${mapsDestinationQuery}&travelmode=${
            travelMode === 'TWO_WHEELER' ? 'two-wheeler' : 'driving'
          }`}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-3 bg-[#71883F] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#5F7334] transition-all shadow-xs"
        >
          <Navigation className="w-3.5 h-3.5" /> Start Turn-by-Turn Drive to Customer
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${mapsDestinationQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-3 bg-white border border-[#E8E8E3] hover:border-[#71883F] text-[#171717] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs"
        >
          <MapPin className="w-3.5 h-3.5 text-[#71883F]" /> Open Customer Pin in Google Maps
        </a>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopyCoords}
          className="py-2 px-3 bg-[#F7F8F3] hover:bg-[#EFF4E6] border border-[#E8E8E3] text-[#171717] rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          {copiedCoords ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">GPS Coords Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#71883F]" />
              <span>Copy GPS ({customerLat.toFixed(4)}, {customerLng.toFixed(4)})</span>
            </>
          )}
        </button>

        {order.phone && (
          <a
            href={`tel:${order.phone}`}
            className="py-2 px-3 bg-[#F7F8F3] hover:bg-[#EFF4E6] border border-[#E8E8E3] text-[#171717] rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Phone className="w-3.5 h-3.5 text-[#71883F]" />
            <span>Call Customer ({order.phone})</span>
          </a>
        )}
      </div>
    </div>
  );
};
