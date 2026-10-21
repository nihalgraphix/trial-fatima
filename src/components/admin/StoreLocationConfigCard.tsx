import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  LocateFixed,
  Search,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  Loader2,
  Sparkles,
  Compass,
  Maximize2,
  Minimize2,
  Layers,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { InteractiveGoogleTileMap } from '../common/GoogleMapsWrapper';

const STORE_ORIGIN = {
  lat: 9.9312,
  lng: 76.2673,
  address: 'Commercial Complex, MG Road, Kochi, Kerala 682011',
};

function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

interface StoreLocationConfigCardProps {
  onSaved?: () => void;
  compact?: boolean;
}

export const StoreLocationConfigCard: React.FC<StoreLocationConfigCardProps> = ({
  onSaved,
}) => {
  const { storeSettings, updateStoreSettings, showToast } = useStore();
  const map = useMap('admin-store-location-map');
  const placesLib = useMapsLibrary('places');

  const [storeAddress, setStoreAddress] = useState(
    storeSettings.storeAddress || storeSettings.address || STORE_ORIGIN.address
  );
  const [storeLandmark, setStoreLandmark] = useState(
    storeSettings.storeLandmark || 'MG Road, Near Maharajas Metro Station, Kochi'
  );
  const [storePincode, setStorePincode] = useState(
    storeSettings.storePincode || storeSettings.storePinCode || '682011'
  );
  const [contactPhone, setContactPhone] = useState(
    storeSettings.contactPhone || '+91 98450 12345 / 0484 2345678'
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    storeSettings.whatsappNumber || '919845012345'
  );
  const [contactEmail, setContactEmail] = useState(
    storeSettings.contactEmail || 'support@fathimastores.in'
  );
  const [lat, setLat] = useState<number>(
    Number(storeSettings.storeLat) || STORE_ORIGIN.lat
  );
  const [lng, setLng] = useState<number>(
    Number(storeSettings.storeLng) || STORE_ORIGIN.lng
  );
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(
    Number(storeSettings.maxDeliveryRadiusKm) || 25
  );

  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [isExpandedMap, setIsExpandedMap] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<
    Array<{
      id: string;
      mainText: string;
      secondaryText: string;
      rawGoogle?: any;
      rawNominatim?: any;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const sessionTokenRef = useRef<any>(null);

  useEffect(() => {
    if (
      placesLib &&
      !sessionTokenRef.current &&
      (placesLib as any).AutocompleteSessionToken
    ) {
      sessionTokenRef.current = new (placesLib as any).AutocompleteSessionToken();
    }
  }, [placesLib]);

  // Sync when storeSettings load from Firestore
  useEffect(() => {
    if (storeSettings.storeAddress) setStoreAddress(storeSettings.storeAddress);
    if (storeSettings.storeLandmark) setStoreLandmark(storeSettings.storeLandmark);
    if (storeSettings.storePincode) setStorePincode(storeSettings.storePincode);
    if (storeSettings.contactPhone) setContactPhone(storeSettings.contactPhone);
    if (storeSettings.whatsappNumber) setWhatsappNumber(storeSettings.whatsappNumber);
    if (storeSettings.contactEmail) setContactEmail(storeSettings.contactEmail);
    if (storeSettings.storeLat && !isNaN(Number(storeSettings.storeLat))) {
      setLat(Number(storeSettings.storeLat));
    }
    if (storeSettings.storeLng && !isNaN(Number(storeSettings.storeLng))) {
      setLng(Number(storeSettings.storeLng));
    }
    if (storeSettings.maxDeliveryRadiusKm) {
      setMaxRadiusKm(Number(storeSettings.maxDeliveryRadiusKm));
    }
  }, [
    storeSettings.storeAddress,
    storeSettings.storeLandmark,
    storeSettings.storePincode,
    storeSettings.contactPhone,
    storeSettings.whatsappNumber,
    storeSettings.contactEmail,
    storeSettings.storeLat,
    storeSettings.storeLng,
    storeSettings.maxDeliveryRadiusKm,
  ]);

  // Reverse geocode coordinates when marker is moved or map is clicked
  const reverseGeocodeCoordinates = useCallback(
    async (targetLat: number, targetLng: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.display_name) {
          setStoreAddress(data.display_name);
          const addr = data.address || {};
          if (addr.postcode) setStorePincode(String(addr.postcode));
          const landmarkParts = [
            addr.road || addr.pedestrian || addr.suburb,
            addr.neighbourhood || addr.city_district || addr.village || addr.town,
          ].filter(Boolean);
          if (landmarkParts.length > 0) {
            setStoreLandmark(landmarkParts.join(', '));
          }
        }
      } catch {
        // Keep manual address fields if reverse geocoding is offline
      }
    },
    []
  );

  // Live Google Places (New) Autocomplete predictions as user types
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (placesLib && (placesLib as any).AutocompleteSuggestion) {
          try {
            const { AutocompleteSuggestion } = placesLib as any;
            const { suggestions: results } =
              await AutocompleteSuggestion.fetchAutocompleteSuggestions({
                input: searchQuery.trim(),
                sessionToken: sessionTokenRef.current || undefined,
                region: 'IN',
              });
            if (Array.isArray(results) && results.length > 0) {
              setSuggestions(
                results.slice(0, 5).map((r: any, idx: number) => ({
                  id: `gmp-${idx}`,
                  mainText: r.placePrediction?.text?.text || searchQuery,
                  secondaryText: r.placePrediction?.secondaryText?.text || 'India',
                  rawGoogle: r,
                }))
              );
              setIsSearching(false);
              return;
            }
          } catch (gErr) {
            const msg = String((gErr as any)?.message || gErr);
            if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
              window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
            }
          }
        }

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery.trim()
          )}&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setSuggestions(
              data.map((item: any, idx: number) => {
                const parts = String(item.display_name || '').split(',');
                return {
                  id: `nom-${item.place_id || idx}`,
                  mainText: parts.slice(0, 2).join(',').trim() || item.display_name,
                  secondaryText: parts.slice(2).join(',').trim() || 'India',
                  rawNominatim: item,
                };
              })
            );
          }
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, placesLib]);

  const handleSelectSuggestion = async (sug: {
    id: string;
    mainText: string;
    secondaryText: string;
    rawGoogle?: any;
    rawNominatim?: any;
  }) => {
    setIsSearching(true);
    try {
      if (sug.rawGoogle && placesLib) {
        const place = sug.rawGoogle.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
        });
        const loc = place.location;
        if (loc) {
          const nextLat = Number(loc.lat().toFixed(6));
          const nextLng = Number(loc.lng().toFixed(6));
          setLat(nextLat);
          setLng(nextLng);
          if (map) {
            map.panTo({ lat: nextLat, lng: nextLng });
            map.setZoom(17);
          }
          if (place.formattedAddress) setStoreAddress(place.formattedAddress);

          let pin = '';
          const landmarkParts: string[] = [];
          place.addressComponents?.forEach((comp: any) => {
            const types: string[] = comp.types || [];
            const text = comp.longText || comp.long_name || '';
            if (types.includes('postal_code')) pin = text;
            if (
              types.includes('route') ||
              types.includes('sublocality') ||
              types.includes('sublocality_level_1')
            ) {
              if (text) landmarkParts.push(text);
            }
          });
          if (pin) setStorePincode(pin);
          if (landmarkParts.length > 0) setStoreLandmark(landmarkParts.join(', '));
          setSearchQuery('');
          setSuggestions([]);
          if ((placesLib as any).AutocompleteSessionToken) {
            sessionTokenRef.current = new (placesLib as any).AutocompleteSessionToken();
          }
          showToast('Store location pinned on Google Maps! Click Save below to publish.', 'info');
          return;
        }
      }

      if (sug.rawNominatim) {
        const hit = sug.rawNominatim;
        const nextLat = Number(parseFloat(hit.lat).toFixed(6));
        const nextLng = Number(parseFloat(hit.lon).toFixed(6));
        setLat(nextLat);
        setLng(nextLng);
        if (map) {
          map.panTo({ lat: nextLat, lng: nextLng });
          map.setZoom(17);
        }
        if (hit.display_name) setStoreAddress(hit.display_name);
        if (hit.address?.postcode) setStorePincode(String(hit.address.postcode));
        const addr = hit.address || {};
        const landmarkParts = [
          addr.road || addr.suburb,
          addr.neighbourhood || addr.city_district || addr.city || addr.town,
        ].filter(Boolean);
        if (landmarkParts.length > 0) {
          setStoreLandmark(landmarkParts.join(', '));
        }
        setSearchQuery('');
        setSuggestions([]);
        showToast('Store location pinned on Google Maps! Click Save below to publish.', 'info');
      }
    } catch (err) {
      const msg = String((err as any)?.message || err);
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Search button trigger if user presses Enter without picking a dropdown row
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    if (suggestions.length > 0) {
      await handleSelectSuggestion(suggestions[0]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&limit=1&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        await handleSelectSuggestion({
          id: 'nom-direct',
          mainText: results[0].display_name,
          secondaryText: 'India',
          rawNominatim: results[0],
        });
      } else {
        showToast('Location not found. Try searching with city or pincode.', 'error');
      }
    } catch {
      showToast('Unable to search address right now.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Detect live GPS coordinates from browser
  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nextLat = Number(pos.coords.latitude.toFixed(6));
        const nextLng = Number(pos.coords.longitude.toFixed(6));
        setLat(nextLat);
        setLng(nextLng);
        if (map) {
          map.panTo({ lat: nextLat, lng: nextLng });
          map.setZoom(17);
        }
        await reverseGeocodeCoordinates(nextLat, nextLng);
        setIsLocatingGps(false);
        showToast('Current GPS coordinates captured on Google Maps! Review and save below.', 'success');
      },
      (err) => {
        setIsLocatingGps(false);
        showToast(`Could not read GPS: ${err.message}`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveStoreLocation = async () => {
    if (!storeAddress.trim()) {
      showToast('Please enter a valid Store Address.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await updateStoreSettings({
        storeAddress: storeAddress.trim(),
        address: storeAddress.trim(),
        storeLandmark: storeLandmark.trim(),
        storePincode: storePincode.trim(),
        contactPhone: contactPhone.trim(),
        whatsappNumber: whatsappNumber.trim(),
        contactEmail: contactEmail.trim(),
        storeLat: Number(lat),
        storeLng: Number(lng),
        maxDeliveryRadiusKm: Number(maxRadiusKm) || 25,
      });
      showToast('Store location & GPS hub updated across storefront and delivery routes!', 'success');
      if (onSaved) onSaved();
    } catch {
      showToast('Failed to update store location.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const distFromDefault = calculateDistanceKm(
    STORE_ORIGIN.lat,
    STORE_ORIGIN.lng,
    lat,
    lng
  );

  return (
    <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-6 shadow-2xs text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E8E3]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-extrabold text-sm text-[#171717] uppercase tracking-wider flex items-center gap-2">
                Store Location & Google Maps Dispatch Hub Configuration
              </h4>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                Drag and scroll around the wide Google Map below or click anywhere to pin your store location. Updates Storefront, Checkout distance fees, and Driver pickup routes immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 bg-[#EFF4E6] text-[#5F7334] border border-[#71883F]/30 rounded-full text-[10px] font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Google Maps Live Hub
          </span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-white hover:bg-[#F7F8F3] text-[#171717] border border-[#E8E8E3] rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3 h-3 text-[#71883F]" /> Open in Google Maps
          </a>
        </div>
      </div>

      {/* Top Google Places Search & GPS Bar */}
      <div className="flex flex-col md:flex-row gap-2.5 relative">
        <div className="flex flex-1 gap-2 relative">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchLocation();
                }
              }}
              placeholder="Search any building, street, landmark, or pincode on Google Maps..."
              className="w-full pl-9 pr-3 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
            />

            {/* Google Places Autocomplete Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E8E8E3] rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto divide-y divide-[#F7F8F3]">
                {suggestions.map((sug) => (
                  <button
                    key={sug.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(sug)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#EFF4E6]/50 flex items-start gap-2.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-[#71883F] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#171717] truncate">
                        {sug.mainText}
                      </p>
                      {sug.secondaryText && (
                        <p className="text-[10px] text-[#6B6B6B] truncate">
                          {sug.secondaryText}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleSearchLocation()}
            disabled={isSearching}
            className="px-4 py-2.5 bg-[#171717] hover:bg-[#333] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            Search Map
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUseCurrentGps}
            disabled={isLocatingGps}
            className="px-3.5 py-2.5 bg-[#EFF4E6] hover:bg-[#E2ECD0] text-[#5F7334] border border-[#71883F]/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLocatingGps ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LocateFixed className="w-3.5 h-3.5" />
            )}
            Use Current GPS
          </button>

          <button
            type="button"
            onClick={() => {
              setLat(STORE_ORIGIN.lat);
              setLng(STORE_ORIGIN.lng);
              if (map) {
                map.panTo({ lat: STORE_ORIGIN.lat, lng: STORE_ORIGIN.lng });
                map.setZoom(16);
              }
              setStoreAddress(STORE_ORIGIN.address);
              setStoreLandmark('MG Road, Near Maharajas Metro Station, Kochi');
              setStorePincode('682011');
            }}
            className="px-3 py-2.5 bg-white hover:bg-[#F7F8F3] text-[#6B6B6B] border border-[#E8E8E3] rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#71883F]" />
            Reset to Kochi Main Hub
          </button>

          <button
            type="button"
            onClick={() => setIsExpandedMap((prev) => !prev)}
            className="px-3 py-2.5 bg-white hover:bg-[#F7F8F3] text-[#171717] border border-[#E8E8E3] rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isExpandedMap ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-[#71883F]" /> Compact Height
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[#71883F]" /> Expand Map Taller
              </>
            )}
          </button>
        </div>
      </div>

      {/* FULL-WIDTH WIDE GOOGLE MAP CANVAS */}
      <div className="space-y-3 w-full">
        <div
          className={`relative w-full ${
            isExpandedMap ? 'h-[660px] sm:h-[740px]' : 'h-[500px] sm:h-[580px]'
          } rounded-2xl overflow-hidden border-2 border-[#E8E8E3] bg-[#E5E3DF] shadow-inner transition-all`}
        >
          <InteractiveGoogleTileMap
            center={{ lat, lng }}
            zoom={16}
            mapTypeId={mapTypeId}
            onMapClick={(nextLat, nextLng) => {
              setLat(nextLat);
              setLng(nextLng);
              reverseGeocodeCoordinates(nextLat, nextLng);
            }}
            markers={[
              {
                id: 'admin-store-hub-pin',
                lat,
                lng,
                label: `${storeSettings.storeName || 'Fathima Stores'} Hub (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                color: '#71883F',
                isPulse: true,
              },
            ]}
          />

          {/* Top-Left Map Mode & Re-center Controls */}
          <div className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() =>
                setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))
              }
              className="px-3 py-2 bg-white/95 hover:bg-white border border-[#E8E8E3] rounded-xl text-xs font-bold text-[#171717] shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#71883F]" />
              <span>{mapTypeId === 'roadmap' ? 'Satellite View' : 'Street Map'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLat((prev) => Number(prev));
                setLng((prev) => Number(prev));
              }}
              className="px-3 py-2 bg-white/95 hover:bg-white border border-[#E8E8E3] rounded-xl text-xs font-bold text-[#171717] shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-[#71883F]" />
              <span>Re-center on Store Pin</span>
            </button>
          </div>

          {/* Bottom Floating Live Coordinate Status Bar */}
          <div className="absolute bottom-3 left-3 right-14 bg-white/95 backdrop-blur-md border border-[#E8E8E3] rounded-xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-2 z-30 pointer-events-auto">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#71883F] text-white flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-extrabold text-[#171717] block truncate max-w-[320px] sm:max-w-[540px]">
                  {storeAddress}
                </span>
                <span className="text-[10px] font-mono text-[#6B6B6B]">
                  Pinned Hub: {lat.toFixed(6)}° N, {lng.toFixed(6)}° E · Max Delivery Zone: {maxRadiusKm} km
                </span>
              </div>
            </div>

            {distFromDefault > 0.05 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                {distFromDefault} km from MG Road Kochi hub
              </span>
            )}
          </div>
        </div>

        {/* Quick Area Presets Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider mr-1">
              Quick Jump Kochi Hubs:
            </span>
            {[
              {
                label: 'MG Road, Kochi (Main Hub)',
                lat: 9.9312,
                lng: 76.2673,
                address: 'Commercial Complex, MG Road, Kochi, Kerala 682011',
                landmark: 'MG Road, Near Maharajas Metro Station',
                pincode: '682011',
              },
              {
                label: 'Edappally / Lulu Mall',
                lat: 10.0261,
                lng: 76.3125,
                address: 'NH 66 Bypass Junction, Edappally, Kochi, Kerala 682024',
                landmark: 'Near Lulu International Shopping Mall, Edappally',
                pincode: '682024',
              },
              {
                label: 'Kakkanad / Infopark',
                lat: 10.0159,
                lng: 76.3419,
                address: 'Seaport-Airport Road, Kakkanad, Kochi, Kerala 682030',
                landmark: 'Near Infopark Phase 1 Gate, Kakkanad',
                pincode: '682030',
              },
              {
                label: 'Marine Drive / Broadway',
                lat: 9.9772,
                lng: 76.2773,
                address: 'Shanmugham Road, Marine Drive, Kochi, Kerala 682031',
                landmark: 'Near Marine Drive Walkway & Broadway Market',
                pincode: '682031',
              },
            ].map((hub) => (
              <button
                key={hub.label}
                type="button"
                onClick={() => {
                  setLat(hub.lat);
                  setLng(hub.lng);
                  if (map) {
                    map.panTo({ lat: hub.lat, lng: hub.lng });
                    map.setZoom(16);
                  }
                  setStoreAddress(hub.address);
                  setStoreLandmark(hub.landmark);
                  setStorePincode(hub.pincode);
                }}
                className="px-2.5 py-1 bg-white hover:bg-[#EFF4E6] hover:border-[#71883F] text-[#171717] border border-[#E8E8E3] rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
              >
                {hub.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Store Address, Coordinates & Contact Details Grid below the wide Google Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 border-t border-[#E8E8E3]">
        <div className="lg:col-span-6 space-y-4">
          <div>
            <label className="block font-bold text-[#171717] mb-1">
              Full Store Street Address *
            </label>
            <textarea
              rows={2}
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              placeholder="Building No, Street, Area, City, State, PIN"
              className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#171717] mb-1">
                Store Landmark / Locality
              </label>
              <input
                type="text"
                value={storeLandmark}
                onChange={(e) => setStoreLandmark(e.target.value)}
                placeholder="e.g., MG Road, Near Maharajas Metro Station, Kochi"
                className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#171717] mb-1">
                Store Pincode
              </label>
              <input
                type="text"
                value={storePincode}
                onChange={(e) => setStorePincode(e.target.value)}
                placeholder="682011"
                className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="grid grid-cols-3 gap-3 bg-[#F7F8F3] p-3.5 rounded-xl border border-[#E8E8E3]">
            <div>
              <label className="block font-bold text-[#171717] text-[11px] mb-1">
                Latitude (GPS)
              </label>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setLat(val);
                  if (map) map.panTo({ lat: val, lng });
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg font-mono text-[11px] text-[#171717] outline-none focus:border-[#71883F]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#171717] text-[11px] mb-1">
                Longitude (GPS)
              </label>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setLng(val);
                  if (map) map.panTo({ lat, lng: val });
                }}
                className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg font-mono text-[11px] text-[#171717] outline-none focus:border-[#71883F]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#171717] text-[11px] mb-1">
                Max Radius (km)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxRadiusKm}
                onChange={(e) => setMaxRadiusKm(Number(e.target.value) || 25)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#E8E8E3] rounded-lg font-bold text-[11px] text-[#171717] outline-none focus:border-[#71883F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#171717] mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#71883F]" /> Store Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#171717] mb-1 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-[#71883F]" /> WhatsApp No.
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="919845012345"
                className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#171717] mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#71883F]" /> Support Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSaveStoreLocation}
          disabled={isSaving}
          className="w-full sm:w-auto px-6 py-3 bg-[#71883F] hover:bg-[#5F7334] text-white font-extrabold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          <span>Save & Publish Store Location</span>
        </button>
      </div>
    </div>
  );
};
