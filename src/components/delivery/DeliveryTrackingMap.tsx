import React, { useEffect, useState } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Order, DeliveryPersonnel } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Navigation, MapPin, Truck, ExternalLink, Clock, Route, Phone } from 'lucide-react';

interface DeliveryTrackingMapProps {
  order: Order;
  storeAddress?: string;
  storeCoords?: { lat: number; lng: number };
  deliveryPerson?: DeliveryPersonnel | null;
}

const DirectionsLayer: React.FC<{
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  onRouteCalculated: (distance: string, duration: string) => void;
}> = ({ origin, destination, onRouteCalculated }) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(
      new routesLibrary.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#71883F',
          strokeWeight: 5,
          strokeOpacity: 0.85,
        },
      })
    );
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    directionsService
      .route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .then((response) => {
        directionsRenderer.setDirections(response);
        const leg = response.routes[0]?.legs[0];
        if (leg && leg.distance?.text && leg.duration?.text) {
          onRouteCalculated(leg.distance.text, leg.duration.text);
        }
      })
      .catch(() => {
        // Fallback if Directions API route fails
      });

    return () => {
      directionsRenderer.setMap(null);
    };
  }, [directionsService, directionsRenderer, origin.lat, origin.lng, destination.lat, destination.lng]);

  return null;
};

export const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({
  order,
  storeAddress,
  storeCoords,
  deliveryPerson,
}) => {
  const { storeSettings } = useStore();

  const resolvedStoreAddress =
    storeAddress ||
    storeSettings?.address ||
    'Fathima Stores Hub, MG Road, Trivandrum, Kerala 695001';

  const resolvedStoreCoords = storeCoords || {
    lat: storeSettings?.storeLat ?? 8.5241,
    lng: storeSettings?.storeLng ?? 76.9366,
  };

  const destCoords = {
    lat: order.shippingAddress?.lat || resolvedStoreCoords.lat + 0.015,
    lng: order.shippingAddress?.lng || resolvedStoreCoords.lng + 0.015,
  };

  const [distance, setDistance] = useState<string>('4.2 km');
  const [duration, setDuration] = useState<string>('14 mins');

  const hasGoogleKey = true;

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
              Live GPS Route & Pinned Location
            </h4>
            <p className="text-[11px] text-[#6B6B6B]">
              Origin: {storeSettings?.storeHubName || resolvedStoreAddress} • Customer Pin:{' '}
              {destCoords.lat.toFixed(4)}, {destCoords.lng.toFixed(4)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 px-3 py-1.5 bg-white border border-[#E8E8E3] rounded-lg text-xs">
            <span className="flex items-center gap-1 font-semibold text-[#171717]">
              <Route className="w-3.5 h-3.5 text-[#71883F]" /> {distance}
            </span>
            <span className="text-[#E8E8E3]">|</span>
            <span className="flex items-center gap-1 font-semibold text-[#71883F]">
              <Clock className="w-3.5 h-3.5" /> {duration}
            </span>
          </div>

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

      {/* Map View */}
      <div className="relative h-72 w-full bg-[#EFF4E6]/30">
        {hasGoogleKey ? (
          <Map
            defaultCenter={destCoords}
            defaultZoom={13}
            mapId="DELIVERY_TRACKING_MAP"
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="w-full h-full"
          >
            {/* Store Origin Marker */}
            <AdvancedMarker position={resolvedStoreCoords} title={resolvedStoreAddress}>
              <div className="px-2.5 py-1 bg-[#171717] text-white text-[10px] font-bold rounded-full shadow-md flex items-center gap-1 border-2 border-white">
                <span>Store Hub</span>
              </div>
            </AdvancedMarker>

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

            <DirectionsLayer
              origin={resolvedStoreCoords}
              destination={destCoords}
              onRouteCalculated={(dist, dur) => {
                setDistance(dist);
                setDuration(dur);
              }}
            />
          </Map>
        ) : (
          <iframe
            title="Delivery Location Map"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${destCoords.lng - 0.02},${destCoords.lat - 0.02},${destCoords.lng + 0.02},${destCoords.lat + 0.02}&layer=mapnik&marker=${destCoords.lat},${destCoords.lng}`}
          />
        )}
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
