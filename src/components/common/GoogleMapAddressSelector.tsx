import React, { useState, useCallback } from 'react';
import { MapPin, Compass, CheckCircle2 } from 'lucide-react';
import { InteractiveGoogleTileMap } from './GoogleMapsWrapper';

export interface SelectedMapLocation {
  lat: number;
  lng: number;
  house?: string;
  street: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  formattedAddress: string;
}

interface GoogleMapAddressSelectorProps {
  initialLat?: number;
  initialLng?: number;
  onSelectLocation?: (loc: SelectedMapLocation) => void;
  onAddressSelect?: (loc: SelectedMapLocation) => void;
  title?: string;
}

const QUICK_HUBS: SelectedMapLocation[] = [
  {
    lat: 9.9312,
    lng: 76.2673,
    street: 'MG Road, Shenoys',
    area: 'MG Road',
    city: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    pinCode: '682011',
    formattedAddress: 'MG Road, Shenoys, Kochi, Kerala - 682011',
  },
  {
    lat: 10.0159,
    lng: 76.3419,
    street: 'Infopark Expressway',
    area: 'Kakkanad',
    city: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    pinCode: '682030',
    formattedAddress: 'Kakkanad Infopark, Kochi, Kerala - 682030',
  },
  {
    lat: 10.0261,
    lng: 76.3125,
    street: 'NH 66 Bypass Junction',
    area: 'Edappally',
    city: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    pinCode: '682024',
    formattedAddress: 'Edappally Junction, Kochi, Kerala - 682024',
  },
  {
    lat: 9.9658,
    lng: 76.3182,
    street: 'SA Road - Vyttila Mobility Hub',
    area: 'Vyttila',
    city: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    pinCode: '682019',
    formattedAddress: 'Vyttila Mobility Hub, Kochi, Kerala - 682019',
  },
];

export const GoogleMapAddressSelector: React.FC<GoogleMapAddressSelectorProps> = ({
  initialLat = 9.9312,
  initialLng = 76.2673,
  onSelectLocation,
  onAddressSelect,
  title = 'Pin Exact Delivery Location on Google Maps',
}) => {
  const notifySelect = useCallback(
    (loc: SelectedMapLocation) => {
      if (onSelectLocation) onSelectLocation(loc);
      if (onAddressSelect) onAddressSelect(loc);
    },
    [onSelectLocation, onAddressSelect]
  );

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat || 9.9312,
    lng: initialLng || 76.2673,
  });
  const [activeAddress, setActiveAddress] = useState<string>(
    'MG Road, Shenoys, Kochi, Kerala - 682011'
  );
  const [isLocating, setIsLocating] = useState(false);

  const reverseLookup = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const street = addr.road || addr.pedestrian || addr.suburb || 'MG Road';
          const area = addr.suburb || addr.neighbourhood || addr.residential || 'Kochi Central';
          const city = addr.city || addr.town || addr.village || 'Kochi';
          const district = addr.state_district || addr.county || 'Ernakulam';
          const state = addr.state || 'Kerala';
          const pinCode = addr.postcode || '682011';
          const formatted =
            data.display_name || `${street}, ${area}, ${city}, ${state} - ${pinCode}`;
          setActiveAddress(formatted);
          notifySelect({
            lat,
            lng,
            street,
            area,
            city,
            district,
            state,
            pinCode,
            formattedAddress: formatted,
          });
          return;
        }
      } catch {
        // Fallback to coordinates in Kochi
      }
      const fallback: SelectedMapLocation = {
        lat,
        lng,
        street: 'Main Street Road',
        area: 'Central Area',
        city: 'Kochi',
        district: 'Ernakulam',
        state: 'Kerala',
        pinCode: '682011',
        formattedAddress: `Pinned GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}), Kochi, Kerala`,
      };
      setActiveAddress(fallback.formattedAddress);
      notifySelect(fallback);
    },
    [notifySelect]
  );

  const handleUseMyGPS = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setCoords({ lat, lng });
        reverseLookup(lat, lng).finally(() => setIsLocating(false));
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  return (
    <div className="bg-[#FAFBF7] border border-[#E8E8E3] rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EFF4E6] text-[#71883F] flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-[#171717]">{title}</h4>
            <p className="text-[10px] text-[#6B6B6B]">
              Click anywhere on the interactive Google Map or select a hub below
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleUseMyGPS}
          disabled={isLocating}
          className="px-3 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
        >
          <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
          {isLocating ? 'Locating GPS...' : 'Use Live GPS'}
        </button>
      </div>

      {/* Interactive Google Map */}
      <div className="relative h-56 w-full rounded-xl overflow-hidden border border-[#E8E8E3]">
        <InteractiveGoogleTileMap
          center={coords}
          zoom={14}
          onPinMove={(lat, lng) => {
            const cLat = Number(lat.toFixed(6));
            const cLng = Number(lng.toFixed(6));
            setCoords({ lat: cLat, lng: cLng });
            reverseLookup(cLat, cLng);
          }}
          className="w-full h-full"
          markers={[
            {
              id: 'selected-pin',
              lat: coords.lat,
              lng: coords.lng,
              title: 'Deliver Here',
              label: 'PIN',
              color: '#71883F',
            },
          ]}
        />
      </div>

      {/* Selected Coordinates & Address Display */}
      <div className="p-2.5 bg-white border border-[#E8E8E3] rounded-xl flex items-start justify-between gap-2 text-xs">
        <div className="flex items-start gap-2 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-[#71883F] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-[#6B6B6B] block">
              Selected Delivery Pin
            </span>
            <p className="text-xs font-semibold text-[#171717] truncate">{activeAddress}</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-[#71883F] bg-[#EFF4E6] px-2 py-0.5 rounded shrink-0">
          {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
        </span>
      </div>

      {/* Quick Select Hubs */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] block">
          Quick Select Kochi Delivery Zones
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_HUBS.map((hub, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCoords({ lat: hub.lat, lng: hub.lng });
                setActiveAddress(hub.formattedAddress);
                notifySelect(hub);
              }}
              className="p-2 text-left rounded-xl border border-[#E8E8E3] bg-white hover:border-[#71883F] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#71883F] shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#171717] truncate">{hub.area}</p>
                <p className="text-[9px] text-[#6B6B6B] truncate">
                  {hub.city} - {hub.pinCode}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
