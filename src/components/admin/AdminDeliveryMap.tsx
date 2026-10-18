import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary, useMap, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Truck, MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { Order } from '../../types';

interface Props {
  order: Order;
  storeAddress: string;
}

export const AdminDeliveryMap: React.FC<Props> = ({ order, storeAddress }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [routeInfo, setRouteDetails] = useState<{ distance: string; duration: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!routesLib || !map || !order.shippingAddress) return;

    // Determine destination: Use lat/lng if available, otherwise formatted address
    const destination = (order.shippingAddress.lat && order.shippingAddress.lng)
      ? { lat: order.shippingAddress.lat, lng: order.shippingAddress.lng }
      : `${order.shippingAddress.house}, ${order.shippingAddress.street}, ${order.shippingAddress.city}`;

    const calculateRoute = async () => {
      setIsLoading(true);
      setError(null);
      
      // Cleanup previous route
      polylinesRef.current.forEach(p => p.setMap(null));
      polylinesRef.current = [];

      try {
        const request = {
          origin: storeAddress,
          destination: destination,
          travelMode: 'DRIVING',
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport']
        };

        const { routes } = await (routesLib.Route as any).computeRoutes(request);
        
        if (!routes || routes.length === 0) {
          setError("No route found to this destination.");
          return;
        }

        const primaryRoute = routes[0];
        
        // Render Polylines
        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline: google.maps.Polyline) => {
          polyline.setOptions({
            strokeColor: '#71883F',
            strokeWeight: 5,
            strokeOpacity: 0.8
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        // Fit Viewport
        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, { padding: 50 });
        }

        setRouteDetails({
          distance: (primaryRoute.distanceMeters / 1000).toFixed(1) + ' km',
          duration: Math.round(primaryRoute.durationMillis / 60000) + ' mins'
        });
      } catch (err: any) {
        console.error("Route calculation error:", err);
        setError("Could not calculate route. Ensure addresses are correct.");
      } finally {
        setIsLoading(false);
      }
    };

    calculateRoute();

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, order, storeAddress]);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#71883F] shadow-2xs">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#171717]">Delivery Route</h4>
            <p className="text-[10px] text-[#6B6B6B]">From: {storeAddress.split(',')[0]}</p>
          </div>
        </div>
        
        {routeInfo && (
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#71883F] uppercase tracking-wider">Distance</p>
              <p className="text-sm font-black text-[#171717]">{routeInfo.distance}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-[#71883F] uppercase tracking-wider">Est. Time</p>
              <p className="text-sm font-black text-[#171717]">{routeInfo.duration}</p>
            </div>
          </div>
        )}
      </div>

      <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-[#E8E8E3] relative shadow-inner">
        <Map
          mapId="DEMO_MAP_ID"
          defaultCenter={{ lat: 8.5241, lng: 76.9366 }} // Default Trivandrum
          defaultZoom={12}
          gestureHandling="greedy"
          disableDefaultUI
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          {/* Destination Marker */}
          {order.shippingAddress.lat && order.shippingAddress.lng && (
            <AdvancedMarker position={{ lat: order.shippingAddress.lat, lng: order.shippingAddress.lng }}>
              <Pin background={'#71883F'} glyphColor={'#FFF'} borderColor={'#5F7334'}>
                <MapPin className="w-4 h-4 text-white" />
              </Pin>
            </AdvancedMarker>
          )}
        </Map>

        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-[#71883F] animate-spin" />
              <p className="text-[10px] font-bold text-[#71883F]">Calculating Route...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2 z-20 shadow-lg">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-rose-700">{error}</p>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          const dest = (order.shippingAddress.lat && order.shippingAddress.lng)
            ? `${order.shippingAddress.lat},${order.shippingAddress.lng}`
            : encodeURIComponent(`${order.shippingAddress.house}, ${order.shippingAddress.street}, ${order.shippingAddress.city}`);
          window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
        }}
        className="w-full py-3 bg-[#71883F] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#5F7334] transition-all shadow-xs active:scale-98"
      >
        <Navigation className="w-4 h-4" /> Open in Google Maps
      </button>
    </div>
  );
};
