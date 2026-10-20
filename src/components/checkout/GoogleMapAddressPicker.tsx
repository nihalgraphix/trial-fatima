import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  MapPin,
  Search,
  Navigation,
  CheckCircle2,
  Truck,
  AlertCircle,
  Loader2,
  Crosshair,
  Layers,
  Route as RouteIcon,
  Home,
  Briefcase,
  Building2,
  LocateFixed,
  ExternalLink,
} from 'lucide-react';
import { GeoCoordinates, ShippingAddress } from '../../types';

interface GoogleMapAddressPickerProps {
  initialAddress?: ShippingAddress;
  onAddressSelect: (address: ShippingAddress, coords: GeoCoordinates) => void;
}

const STORE_HUB = {
  lat: 8.5241,
  lng: 76.9366,
  name: 'Fathima Stores Hub (MG Road, Trivandrum)',
};

export const GoogleMapAddressPicker: React.FC<GoogleMapAddressPickerProps> = ({
  initialAddress,
  onAddressSelect,
}) => {
  const map = useMap('checkout-address-map');
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [isReverseResolving, setIsReverseResolving] = useState(false);
  const [placeSuggestions, setPlaceSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [showRouteLine, setShowRouteLine] = useState<boolean>(true);
  const [placeLabelType, setPlaceLabelType] = useState<'Home' | 'Work' | 'Campus' | 'Other'>('Home');

  const [selectedPin, setSelectedPin] = useState<GeoCoordinates>({
    lat: initialAddress?.lat || STORE_HUB.lat,
    lng: initialAddress?.lng || STORE_HUB.lng,
    addressFormatted: initialAddress?.area
      ? `${initialAddress.area}, ${initialAddress.city || 'Trivandrum'}`
      : 'MG Road, Trivandrum, Kerala, 695001',
  });

  const [addressForm, setAddressForm] = useState<ShippingAddress>({
    fullName: initialAddress?.fullName || '',
    phone: initialAddress?.phone || '',
    email: initialAddress?.email || '',
    house: initialAddress?.house || '',
    street: initialAddress?.street || '',
    area: initialAddress?.area || 'MG Road Central',
    city: initialAddress?.city || 'Trivandrum',
    district: initialAddress?.district || 'Thiruvananthapuram',
    state: initialAddress?.state || 'Kerala',
    pinCode: initialAddress?.pinCode || '695001',
    isDefault: true,
    lat: initialAddress?.lat || STORE_HUB.lat,
    lng: initialAddress?.lng || STORE_HUB.lng,
  });

  const [distanceKm, setDistanceKm] = useState<number>(1.2);
  const [driveDurationText, setDriveDurationText] = useState<string>('6 mins drive');
  const [isServiceable, setIsServiceable] = useState<boolean>(true);
  const [deliveryEstDays, setDeliveryEstDays] = useState<string>('Same-Day Express (By 6 PM)');

  // Calculate fallback Haversine distance from Store Hub
  const calculateDistance = useCallback((lat: number, lng: number) => {
    const R = 6371;
    const dLat = ((lat - STORE_HUB.lat) * Math.PI) / 180;
    const dLng = ((lng - STORE_HUB.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((STORE_HUB.lat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = Math.max(0.3, Math.round(R * c * 10) / 10);

    setDistanceKm(dist);
    setDriveDurationText(`${Math.max(4, Math.round(dist * 3.2))} mins drive`);

    if (dist <= 25) {
      setIsServiceable(true);
      setDeliveryEstDays(dist <= 10 ? 'Same-Day Express (By 6 PM)' : 'Next-Day Priority Delivery');
    } else if (dist <= 500) {
      setIsServiceable(true);
      setDeliveryEstDays('Standard Courier (2–4 Business Days)');
    } else {
      setIsServiceable(true);
      setDeliveryEstDays('National Express Courier (3–5 Days)');
    }
  }, []);

  // Compute live driving route from Store Hub to Customer Pin via Routes API
  useEffect(() => {
    if (!routesLib || !map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (!showRouteLine) return;

    const isSameSpot =
      Math.abs(selectedPin.lat - STORE_HUB.lat) < 0.0003 &&
      Math.abs(selectedPin.lng - STORE_HUB.lng) < 0.0003;
    if (isSameSpot) return;

    let isCancelled = false;

    const computeDeliveryRoute = async () => {
      try {
        const request = {
          origin: { lat: STORE_HUB.lat, lng: STORE_HUB.lng },
          destination: { lat: selectedPin.lat, lng: selectedPin.lng },
          travelMode: 'DRIVING',
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
        };

        const { routes } = await (routesLib.Route as any).computeRoutes(request);
        if (isCancelled || !routes || routes.length === 0) return;

        const primaryRoute = routes[0];
        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline: google.maps.Polyline) => {
          polyline.setOptions({
            strokeColor: '#71883F',
            strokeWeight: 4,
            strokeOpacity: 0.85,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.distanceMeters) {
          const roadKm = Math.max(0.3, Math.round((primaryRoute.distanceMeters / 1000) * 10) / 10);
          setDistanceKm(roadKm);
          if (roadKm <= 25) {
            setDeliveryEstDays(roadKm <= 10 ? 'Same-Day Express (By 6 PM)' : 'Next-Day Priority Delivery');
          } else if (roadKm <= 500) {
            setDeliveryEstDays('Standard Courier (2–4 Business Days)');
          }
        }
        if (primaryRoute.durationMillis) {
          const mins = Math.max(3, Math.round(primaryRoute.durationMillis / 60000));
          setDriveDurationText(mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m drive` : `${mins} mins drive`);
        }
      } catch (err: any) {
        const msg = String(err?.message || err || '');
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT') || msg.includes('429')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      }
    };

    computeDeliveryRoute();

    return () => {
      isCancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, selectedPin.lat, selectedPin.lng, showRouteLine]);

  // Helper to extract structured address components from a Place object
  const parsePlaceComponents = useCallback(
    (place: google.maps.places.Place, fallbackFormatted: string) => {
      let street = '';
      let area = '';
      let city = '';
      let district = '';
      let state = '';
      let pinCode = '';
      let house = '';

      if (place.addressComponents) {
        for (const comp of place.addressComponents) {
          const types = comp.types || [];
          const longText = comp.longText || '';
          if (types.includes('subpremise') || types.includes('premise')) {
            house = longText;
          } else if (types.includes('route') || types.includes('street_address')) {
            street = longText;
          } else if (
            types.includes('sublocality_level_1') ||
            types.includes('sublocality') ||
            types.includes('neighborhood')
          ) {
            area = area || longText;
          } else if (types.includes('locality')) {
            city = longText;
          } else if (
            types.includes('administrative_area_level_2') ||
            types.includes('administrative_area_level_3')
          ) {
            district = longText;
          } else if (types.includes('administrative_area_level_1')) {
            state = longText;
          } else if (types.includes('postal_code')) {
            pinCode = longText;
          }
        }
      }

      return {
        house: house || place.displayName || addressForm.house,
        street: street || fallbackFormatted.split(',')[0]?.trim() || addressForm.street,
        area: area || fallbackFormatted.split(',')[1]?.trim() || addressForm.area,
        city: city || addressForm.city,
        district: district || city || addressForm.district,
        state: state || addressForm.state,
        pinCode: pinCode || addressForm.pinCode,
      };
    },
    [addressForm]
  );

  // Fetch live Google Places Autocomplete (New) suggestions
  useEffect(() => {
    if (!placesLib) return;
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setPlaceSuggestions([]);
      setIsLoadingPlaces(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoadingPlaces(true);
        const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        const request: google.maps.places.AutocompleteRequest = {
          input: trimmed,
          sessionToken: sessionTokenRef.current,
          locationBias: {
            center: { lat: selectedPin.lat, lng: selectedPin.lng },
            radius: 50000,
          } as any,
        };

        const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        setPlaceSuggestions(response.suggestions || []);
      } catch (err: any) {
        console.warn('Places Autocomplete error:', err);
        const msg = String(err?.message || err || '');
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT') || msg.includes('429')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setPlaceSuggestions([]);
      } finally {
        setIsLoadingPlaces(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [placesLib, searchQuery, selectedPin.lat, selectedPin.lng]);

  // Select a Google Place prediction and fetch fields
  const handleSelectGooglePlace = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!placesLib || !suggestion.placePrediction) return;
    try {
      setIsLoadingPlaces(true);
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'addressComponents', 'viewport'],
      });

      sessionTokenRef.current = null;
      setPlaceSuggestions([]);
      setIsSearching(false);

      const lat = place.location?.lat() ?? selectedPin.lat;
      const lng = place.location?.lng() ?? selectedPin.lng;
      const formatted =
        place.formattedAddress || place.displayName || suggestion.placePrediction.text?.text || '';

      const parsed = parsePlaceComponents(place, formatted);

      const nextCoords: GeoCoordinates = {
        lat,
        lng,
        addressFormatted: formatted,
        placeId: place.id,
      };
      setSelectedPin(nextCoords);
      calculateDistance(lat, lng);

      if (map) {
        map.panTo({ lat, lng });
        map.setZoom(17);
      }

      const updatedAddr: ShippingAddress = {
        ...addressForm,
        ...parsed,
        lat,
        lng,
      };
      setAddressForm(updatedAddr);
      setSearchQuery(formatted);
      onAddressSelect(updatedAddr, nextCoords);
    } catch (err: any) {
      console.warn('Error fetching place details:', err);
      const msg = String(err?.message || err || '');
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT') || msg.includes('429')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  // Pin any coordinates directly on the map (via click, drag, or GPS) + Reverse Place Lookup
  const applyPinLocation = useCallback(
    async (lat: number, lng: number, label?: string) => {
      const fallbackLabel = label || `Pinned Doorstep (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
      const initialCoords: GeoCoordinates = {
        lat,
        lng,
        addressFormatted: fallbackLabel,
      };
      setSelectedPin(initialCoords);
      calculateDistance(lat, lng);

      if (map) {
        map.panTo({ lat, lng });
      }

      const immediateAddr: ShippingAddress = {
        ...addressForm,
        area: label ? label.split(',')[0] : addressForm.area,
        lat,
        lng,
      };
      setAddressForm(immediateAddr);
      onAddressSelect(immediateAddr, initialCoords);

      // Perform Reverse Place Lookup using Places API (New) searchNearby so user gets real street/city/pincode
      if (placesLib && (placesLib as any).Place?.searchNearby) {
        try {
          setIsReverseResolving(true);
          const { places } = await (placesLib as any).Place.searchNearby({
            fields: ['displayName', 'formattedAddress', 'addressComponents', 'location'],
            locationRestriction: {
              center: { lat, lng },
              radius: 250,
            },
            maxResultCount: 1,
          });

          if (places && places.length > 0) {
            const nearestPlace = places[0];
            const resolvedFormatted =
              nearestPlace.formattedAddress || nearestPlace.displayName || fallbackLabel;
            const parsed = parsePlaceComponents(nearestPlace, resolvedFormatted);

            const resolvedCoords: GeoCoordinates = {
              lat,
              lng,
              addressFormatted: resolvedFormatted,
              placeId: nearestPlace.id,
            };
            const resolvedAddr: ShippingAddress = {
              ...immediateAddr,
              ...parsed,
              lat,
              lng,
            };
            setSelectedPin(resolvedCoords);
            setAddressForm(resolvedAddr);
            setSearchQuery(resolvedFormatted);
            onAddressSelect(resolvedAddr, resolvedCoords);
          }
        } catch (err: any) {
          const msg = String(err?.message || err || '');
          if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT') || msg.includes('429')) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          }
        } finally {
          setIsReverseResolving(false);
        }
      }
    },
    [addressForm, calculateDistance, map, onAddressSelect, parsePlaceComponents, placesLib]
  );

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      applyPinLocation(STORE_HUB.lat, STORE_HUB.lng, 'MG Road Central, Trivandrum');
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (map) map.setZoom(17);
        applyPinLocation(lat, lng, `My Live GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setIsLocatingGps(false);
      },
      () => {
        setIsLocatingGps(false);
        applyPinLocation(STORE_HUB.lat, STORE_HUB.lng, 'MG Road Central, Trivandrum');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleFitRouteBounds = () => {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: STORE_HUB.lat, lng: STORE_HUB.lng });
    bounds.extend({ lat: selectedPin.lat, lng: selectedPin.lng });
    map.fitBounds(bounds, 55);
  };

  useEffect(() => {
    calculateDistance(selectedPin.lat, selectedPin.lng);
  }, []);

  return (
    <div className="bg-[#FAFBF7] border border-[#E8E8E3] rounded-2xl p-4 sm:p-5 space-y-4 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E3] pb-3.5">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-7 h-7 rounded-lg bg-[#EFF4E6] text-[#71883F] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </span>
            <h4 className="font-extrabold text-sm text-[#171717]">
              Search & Pin Exact Delivery Location
            </h4>
          </div>
          <p className="text-[11px] text-[#6B6B6B]">
            Search your street or building on Google Maps, use live GPS, or tap/drag the pin directly onto your doorstep.
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocatingGps}
          className="px-3.5 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs disabled:opacity-60"
        >
          {isLocatingGps ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          <span>{isLocatingGps ? 'Detecting GPS...' : 'Use My Live GPS Location'}</span>
        </button>
      </div>

      {/* Location Tag Type Selector */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#6B6B6B] mr-1">Save Place As:</span>
          {[
            { id: 'Home' as const, icon: Home, label: 'Home' },
            { id: 'Work' as const, icon: Briefcase, label: 'Work / Office' },
            { id: 'Campus' as const, icon: Building2, label: 'School / Hostel' },
            { id: 'Other' as const, icon: MapPin, label: 'Other' },
          ].map((tag) => {
            const Icon = tag.icon;
            const active = placeLabelType === tag.id;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => setPlaceLabelType(tag.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                  active
                    ? 'bg-[#71883F] text-white border-[#71883F] shadow-2xs'
                    : 'bg-white text-[#6B6B6B] border-[#E8E8E3] hover:border-[#71883F]'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{tag.label}</span>
              </button>
            );
          })}
        </div>

        {isReverseResolving && (
          <span className="text-[11px] font-bold text-[#71883F] flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Resolving street address from pin...
          </span>
        )}
      </div>

      {/* Google Places Search Box */}
      <div className="relative">
        <label className="text-xs font-bold text-[#171717] block mb-1.5">
          Search Building, Street, Area, Landmark, or Pincode
        </label>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearching(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              placeholder="Search apartment, street name, landmark, or city on Google Maps..."
              className="w-full pl-9 pr-16 py-2.5 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F] shadow-2xs"
            />
            <Search className="w-4 h-4 text-[#71883F] absolute left-3 top-2.5" />
            <div className="absolute right-2.5 top-2 flex items-center gap-1">
              {isLoadingPlaces && <Loader2 className="w-4 h-4 text-[#71883F] animate-spin" />}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPlaceSuggestions([]);
                  }}
                  className="text-[10px] font-bold text-[#6B6B6B] hover:text-[#171717] px-1.5 py-0.5 rounded bg-[#F7F8F3]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Google Places Autocomplete Suggestions Dropdown */}
        {isSearching && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E8E8E3] rounded-2xl shadow-xl z-30 py-1.5 divide-y divide-[#E8E8E3] max-h-64 overflow-y-auto">
            {placeSuggestions.length > 0 ? (
              placeSuggestions.map((s, idx) => {
                const mainText =
                  s.placePrediction?.mainText?.text ||
                  s.placePrediction?.text?.text ||
                  'Location';
                const secondaryText = s.placePrediction?.secondaryText?.text || '';
                return (
                  <button
                    key={s.placePrediction?.placeId || idx}
                    type="button"
                    onClick={() => handleSelectGooglePlace(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#F7F8F3] flex items-start gap-2.5 text-xs transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-[#71883F] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#171717] truncate">{mainText}</p>
                      {secondaryText && (
                        <p className="text-[11px] text-[#6B6B6B] truncate">{secondaryText}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-[#71883F] bg-[#EFF4E6] px-2 py-0.5 rounded-md shrink-0">
                      Pin Here
                    </span>
                  </button>
                );
              })
            ) : !isLoadingPlaces ? (
              <div className="px-4 py-3 text-xs text-[#6B6B6B] flex items-center justify-between">
                <span>Tap directly on the map below to drop your pin at this location.</span>
                <button
                  type="button"
                  onClick={() => setIsSearching(false)}
                  className="text-[11px] font-bold text-[#71883F] hover:underline"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Real Interactive Google Map View */}
      <div className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden border border-[#E8E8E3] shadow-inner bg-[#E5E9E0]">
        <Map
          id="checkout-address-map"
          mapId="DEMO_MAP_ID"
          mapTypeId={mapTypeId}
          defaultCenter={{ lat: selectedPin.lat, lng: selectedPin.lng }}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          onClick={(e) => {
            if (e.detail?.latLng) {
              applyPinLocation(e.detail.latLng.lat, e.detail.latLng.lng);
            }
          }}
        >
          {/* Store Hub Marker */}
          <AdvancedMarker position={{ lat: STORE_HUB.lat, lng: STORE_HUB.lng }} title={STORE_HUB.name}>
            <div className="bg-white/95 border-2 border-[#71883F] px-2.5 py-1 rounded-full text-[10px] font-extrabold text-[#71883F] shadow-md flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#71883F]" />
              <span>Fathima Store Hub</span>
            </div>
          </AdvancedMarker>

          {/* Customer Delivery Pin Marker (Draggable) */}
          <AdvancedMarker
            position={{ lat: selectedPin.lat, lng: selectedPin.lng }}
            draggable={true}
            onDragEnd={(e) => {
              if (e.latLng) {
                applyPinLocation(e.latLng.lat(), e.latLng.lng());
              }
            }}
            title="Drag or click map to adjust your exact doorstep location"
          >
            <div className="flex flex-col items-center">
              <div className="bg-[#171717] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md mb-1 whitespace-nowrap border border-[#71883F]">
                Deliver to {placeLabelType}
              </div>
              <Pin background={'#171717'} glyphColor={'#FFFFFF'} borderColor={'#71883F'} scale={1.15} />
            </div>
          </AdvancedMarker>
        </Map>

        {/* Top Left Map Instruction Pill */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-xs border border-[#E8E8E3] px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#171717] shadow-md flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-[#71883F]" />
            <span>Tap map or drag pin to exact gate / building</span>
          </div>
        </div>

        {/* Top Right Serviceability Badge */}
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <div
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-md flex items-center gap-1.5 ${
              isServiceable ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {isServiceable ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            <span>
              {isServiceable ? `Serviceable • ${distanceKm} km (${driveDurationText})` : 'Outside Zone'}
            </span>
          </div>
        </div>

        {/* Bottom Map Floating Controls (Satellite Toggle, Route View, Recenter Pin) */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={() => setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
              className="px-3 py-1.5 bg-white/95 hover:bg-white border border-[#E8E8E3] rounded-xl text-[11px] font-bold text-[#171717] shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
              title="Switch between Street Map and Satellite Rooftop View"
            >
              <Layers className="w-3.5 h-3.5 text-[#71883F]" />
              <span>{mapTypeId === 'roadmap' ? 'Satellite View' : 'Street Map'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRouteLine((prev) => !prev)}
              className={`px-3 py-1.5 border rounded-xl text-[11px] font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all ${
                showRouteLine
                  ? 'bg-[#71883F] text-white border-[#71883F]'
                  : 'bg-white/95 text-[#171717] border-[#E8E8E3]'
              }`}
              title="Toggle driving route line from Store Hub"
            >
              <RouteIcon className="w-3.5 h-3.5" />
              <span>{showRouteLine ? 'Route Active' : 'Show Route'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={handleFitRouteBounds}
              className="px-2.5 py-1.5 bg-white/95 hover:bg-white border border-[#E8E8E3] rounded-xl text-[11px] font-bold text-[#171717] shadow-md flex items-center gap-1 cursor-pointer"
              title="View full route from Store Hub to your pin"
            >
              <span>Fit Route</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (map) {
                  map.panTo({ lat: selectedPin.lat, lng: selectedPin.lng });
                  map.setZoom(17);
                }
              }}
              className="px-2.5 py-1.5 bg-[#171717] hover:bg-neutral-800 text-white rounded-xl text-[11px] font-bold shadow-md flex items-center gap-1 cursor-pointer"
              title="Zoom in to your delivery pin"
            >
              <LocateFixed className="w-3.5 h-3.5 text-[#71883F]" />
              <span>My Pin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pinned Coordinates & Delivery Route Summary Bar */}
      <div className="bg-[#EFF4E6] border border-[#71883F]/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#71883F] text-white flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase bg-[#71883F] text-white px-2 py-0.5 rounded">
                {placeLabelType}
              </span>
              <p className="font-extrabold text-[#171717] text-xs truncate">
                {selectedPin.addressFormatted}
              </p>
            </div>
            <p className="text-[11px] text-[#6B6B6B] mt-0.5">
              GPS Pin:{' '}
              <span className="font-mono font-bold text-[#171717]">
                {selectedPin.lat.toFixed(5)}, {selectedPin.lng.toFixed(5)}
              </span>{' '}
              • <span className="font-bold text-[#71883F]">{distanceKm} km</span> ({driveDurationText}) from Store Hub •{' '}
              {deliveryEstDays}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${selectedPin.lat},${selectedPin.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-[#171717] hover:text-[#71883F] bg-white px-2.5 py-1.5 rounded-lg border border-[#E8E8E3] flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3 h-3 text-[#71883F]" />
            <span>Preview Pin</span>
          </a>
          <span className="text-[10px] font-bold uppercase text-[#71883F] bg-white px-2.5 py-1.5 rounded-lg border border-[#71883F]/20">
            GPS Verified
          </span>
        </div>
      </div>
    </div>
  );
};
