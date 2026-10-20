import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  Loader2,
  LocateFixed,
  Compass,
  Layers,
  ExternalLink,
  Plus,
  Minus,
} from 'lucide-react';
import { ShippingAddress } from '../../types';
import { useGoogleMapsStatus, MapErrorBoundary } from '../common/GoogleMapsWrapper';

interface Props {
  onAddressSelect: (
    address: Partial<ShippingAddress>,
    coords?: { lat: number; lng: number }
  ) => void;
  initialAddress?: Partial<ShippingAddress>;
}

const PRESET_LOCATIONS = [
  {
    id: 'loc-1',
    name: 'MG Road & Secretariat Hub',
    area: 'Statue, Palayam',
    street: 'Mahatma Gandhi Road',
    city: 'Trivandrum',
    district: 'Trivandrum',
    state: 'Kerala',
    pinCode: '695001',
    lat: 8.4988,
    lng: 76.9492,
  },
  {
    id: 'loc-2',
    name: 'Technopark Campus Phase I-III',
    area: 'Kazhakkoottam',
    street: 'NH 66 Bypass Service Road',
    city: 'Trivandrum',
    district: 'Trivandrum',
    state: 'Kerala',
    pinCode: '695581',
    lat: 8.5581,
    lng: 76.8816,
  },
  {
    id: 'loc-3',
    name: 'Pattom Royal Junction',
    area: 'Pattom',
    street: 'MC Road, Near LIC HQ',
    city: 'Trivandrum',
    district: 'Trivandrum',
    state: 'Kerala',
    pinCode: '695004',
    lat: 8.5241,
    lng: 76.9366,
  },
  {
    id: 'loc-4',
    name: 'Kowdiar Palace Avenue',
    area: 'Kowdiar',
    street: 'Vellayambalam - Kowdiar Road',
    city: 'Trivandrum',
    district: 'Trivandrum',
    state: 'Kerala',
    pinCode: '695003',
    lat: 8.5262,
    lng: 76.9615,
  },
  {
    id: 'loc-5',
    name: 'Medical College & Ulloor',
    area: 'Medical College PO',
    street: 'Medical College Ulloor Road',
    city: 'Trivandrum',
    district: 'Trivandrum',
    state: 'Kerala',
    pinCode: '695011',
    lat: 8.5246,
    lng: 76.9282,
  },
  {
    id: 'loc-6',
    name: 'Vazhuthacaud & Bakery Jn',
    area: 'Vazhuthacaud',
    street: 'CV Raman Pillai Road',
    city: 'Trivandrum',
    district: 'Trivandrum',
    state: 'Kerala',
    pinCode: '695014',
    lat: 8.5012,
    lng: 76.9598,
  },
];

// Interactive Tile Map Fallback when Google Maps JS SDK key is restricted/unavailable
const InteractiveOsmPinMap: React.FC<{
  pinnedCoords: { lat: number; lng: number };
  mapTypeId: 'roadmap' | 'hybrid';
  onPinMove: (lat: number, lng: number) => void;
}> = ({ pinnedCoords, mapTypeId, onPinMove }) => {
  const [zoom, setZoom] = useState(15);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert lat/lng to fractional tile coordinates
  const lat2tile = (lat: number, z: number) =>
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) /
      2) *
    Math.pow(2, z);
  const lon2tile = (lon: number, z: number) => ((lon + 180) / 360) * Math.pow(2, z);

  const tile2lon = (x: number, z: number) => (x / Math.pow(2, z)) * 360 - 180;
  const tile2lat = (y: number, z: number) => {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  };

  const centerTileX = lon2tile(pinnedCoords.lng, zoom);
  const centerTileY = lat2tile(pinnedCoords.lat, zoom);
  const baseTileX = Math.floor(centerTileX);
  const baseTileY = Math.floor(centerTileY);
  const offsetX = (centerTileX - baseTileX) * 256;
  const offsetY = (centerTileY - baseTileY) * 256;

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const dxPixels = clickX - rect.width / 2;
    const dyPixels = clickY - rect.height / 2;

    const newTileX = centerTileX + dxPixels / 256;
    const newTileY = centerTileY + dyPixels / 256;
    const newLng = tile2lon(newTileX, zoom);
    const newLat = tile2lat(newTileY, zoom);
    onPinMove(newLat, newLng);
  };

  const tiles: { x: number; y: number; dx: number; dy: number }[] = [];
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      tiles.push({ x: baseTileX + dx, y: baseTileY + dy, dx, dy });
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={handleMapClick}
      className="w-full h-full relative overflow-hidden cursor-crosshair select-none bg-[#E5E9E0]"
      title="Click anywhere on the map to move your delivery pin"
    >
      {/* Tile Layer */}
      <div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(${-offsetX}px, ${-offsetY}px)`,
        }}
      >
        {tiles.map((t) => {
          const maxTile = Math.pow(2, zoom);
          const wrappedX = ((t.x % maxTile) + maxTile) % maxTile;
          const url =
            mapTypeId === 'hybrid'
              ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${t.y}/${wrappedX}`
              : `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${t.y}.png`;
          return (
            <img
              key={`${zoom}-${t.x}-${t.y}`}
              src={url}
              alt=""
              draggable={false}
              className="absolute w-[256px] h-[256px] max-w-none pointer-events-none"
              style={{
                left: `${t.dx * 256}px`,
                top: `${t.dy * 256}px`,
              }}
            />
          );
        })}
      </div>

      {/* Center Pinned Marker */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-10 flex flex-col items-center">
        <div className="bg-[#171717] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg mb-1 whitespace-nowrap flex items-center gap-1 border border-[#71883F]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Deliver Here ({pinnedCoords.lat.toFixed(4)}, {pinnedCoords.lng.toFixed(4)})</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-[#71883F] border-3 border-white shadow-xl flex items-center justify-center text-white">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="w-2.5 h-1.5 bg-black/30 rounded-full blur-[1px] mt-0.5" />
      </div>

      {/* Zoom Controls */}
      <div
        className="absolute right-3 top-14 z-20 flex flex-col bg-white/95 border border-[#E8E8E3] rounded-xl shadow-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(18, z + 1))}
          className="p-2 hover:bg-[#F7F8F3] text-[#171717] border-b border-[#E8E8E3] cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(10, z - 1))}
          className="p-2 hover:bg-[#F7F8F3] text-[#171717] cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const GoogleMapAddressPicker: React.FC<Props> = ({ onAddressSelect, initialAddress }) => {
  const { mapsHealthy } = useGoogleMapsStatus();
  const map = useMap('checkout-delivery-map');
  const geocodingLib = useMapsLibrary('geocoding');
  const placesLib = useMapsLibrary('places');

  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedCoords, setPinnedCoords] = useState<{ lat: number; lng: number }>({
    lat: initialAddress?.lat || 8.5241,
    lng: initialAddress?.lng || 76.9366,
  });
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [pinnedLabel, setPinnedLabel] = useState<string>(
    initialAddress?.area
      ? `${initialAddress.area}, ${initialAddress.city || 'Trivandrum'}`
      : 'Pattom, Trivandrum (695004)'
  );
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [suggestions, setSuggestions] = useState<
    Array<{ id: string; mainText: string; secondaryText: string; rawGoogle?: any; rawNominatim?: any }>
  >([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const sessionTokenRef = useRef<any>(null);

  useEffect(() => {
    if (placesLib && !sessionTokenRef.current && (placesLib as any).AutocompleteSessionToken) {
      sessionTokenRef.current = new (placesLib as any).AutocompleteSessionToken();
    }
  }, [placesLib]);

  // Reverse geocode coordinates using Google Geocoder or OpenStreetMap Nominatim fallback
  const reverseGeocodeCoords = useCallback(
    async (lat: number, lng: number) => {
      if (mapsHealthy && geocodingLib && (geocodingLib as any).Geocoder) {
        try {
          const geocoder = new (geocodingLib as any).Geocoder();
          const response = await geocoder.geocode({ location: { lat, lng } });
          if (response.results && response.results[0]) {
            const place = response.results[0];
            const components = place.address_components || [];

            const getComponent = (type: string) =>
              components.find((c: any) => c.types.includes(type))?.long_name || '';

            const streetNumber = getComponent('street_number');
            const route = getComponent('route');
            const sublocality =
              getComponent('sublocality_level_1') ||
              getComponent('sublocality') ||
              getComponent('neighborhood');
            const locality =
              getComponent('locality') || getComponent('administrative_area_level_2') || 'Trivandrum';
            const district = getComponent('administrative_area_level_2') || locality;
            const state = getComponent('administrative_area_level_1') || 'Kerala';
            const pinCode = getComponent('postal_code') || '695001';
            const premise = getComponent('premise') || getComponent('subpremise');

            const formattedLabel = place.formatted_address || `${sublocality || locality} (${pinCode})`;
            setPinnedLabel(formattedLabel);

            onAddressSelect(
              {
                ...(premise ? { house: premise } : {}),
                street: [streetNumber, route].filter(Boolean).join(' ') || route || formattedLabel.split(',')[0],
                area: sublocality || locality,
                city: locality,
                district,
                state,
                pinCode,
                lat,
                lng,
              },
              { lat, lng }
            );
            return;
          }
        } catch (err) {
          console.warn('Google Reverse Geocode fallback to Nominatim:', err);
        }
      }

      // OpenStreetMap Nominatim Reverse Geocoding fallback
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${lat}&lon=${lng}`
        );
        if (res.ok) {
          const data = await res.json();
          const addr = data?.address || {};
          const street =
            addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || 'MG Road';
          const area =
            addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || 'Central Area';
          const city =
            addr.city || addr.town || addr.village || addr.state_district || 'Trivandrum';
          const district = addr.state_district || addr.county || city;
          const state = addr.state || 'Kerala';
          const pinCode = addr.postcode || '695001';
          const label = data?.display_name
            ? data.display_name.split(',').slice(0, 3).join(', ')
            : `${area}, ${city} (${pinCode})`;

          setPinnedLabel(label);
          onAddressSelect(
            {
              street,
              area,
              city,
              district,
              state,
              pinCode,
              lat,
              lng,
            },
            { lat, lng }
          );
          return;
        }
      } catch (nomErr) {
        console.warn('Nominatim reverse geocode fallback:', nomErr);
      }

      setPinnedLabel(`Pinned Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      onAddressSelect({ lat, lng }, { lat, lng });
    },
    [geocodingLib, mapsHealthy, onAddressSelect]
  );

  // Places + Nominatim Autocomplete Search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchPredictions = async () => {
      setIsSearchingPlaces(true);
      try {
        if (mapsHealthy && placesLib && (placesLib as any).AutocompleteSuggestion) {
          try {
            const { AutocompleteSuggestion } = placesLib as any;
            const request: any = {
              input: searchQuery,
              sessionToken: sessionTokenRef.current || undefined,
              region: 'IN',
            };
            const { suggestions: results } =
              await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
            if (results && results.length > 0) {
              setSuggestions(
                results.slice(0, 5).map((r: any, idx: number) => ({
                  id: `gmp-${idx}`,
                  mainText: r.placePrediction?.text?.text || searchQuery,
                  secondaryText: r.placePrediction?.secondaryText?.text || 'India',
                  rawGoogle: r,
                }))
              );
              setIsSearchingPlaces(false);
              return;
            }
          } catch (err) {
            console.warn('Places prediction fallback to Nominatim:', err);
          }
        }

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=in&q=${encodeURIComponent(
            searchQuery
          )}`
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
      } catch (err) {
        console.warn('Place search notice:', err);
      } finally {
        setIsSearchingPlaces(false);
      }
    };

    const timer = setTimeout(fetchPredictions, 280);
    return () => clearTimeout(timer);
  }, [searchQuery, placesLib, mapsHealthy]);

  const handleSelectSuggestion = async (suggestion: {
    id: string;
    mainText: string;
    secondaryText: string;
    rawGoogle?: any;
    rawNominatim?: any;
  }) => {
    setIsSearchingPlaces(true);
    try {
      if (suggestion.rawGoogle && placesLib) {
        const place = suggestion.rawGoogle.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
        });

        const loc = place.location;
        if (loc) {
          const lat = loc.lat();
          const lng = loc.lng();
          setPinnedCoords({ lat, lng });
          setSelectedPresetId(null);
          if (map) {
            map.panTo({ lat, lng });
            map.setZoom(17);
          }

          let street = '';
          let area = '';
          let city = 'Trivandrum';
          let district = 'Trivandrum';
          let state = 'Kerala';
          let pinCode = '695001';
          let house = '';

          place.addressComponents?.forEach((comp: any) => {
            const types: string[] = comp.types || [];
            const text = comp.longText || comp.long_name || '';
            if (types.includes('premise') || types.includes('subpremise')) house = text;
            if (types.includes('route')) street = text;
            if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood'))
              area = text;
            if (types.includes('locality')) city = text;
            if (types.includes('administrative_area_level_2')) district = text;
            if (types.includes('administrative_area_level_1')) state = text;
            if (types.includes('postal_code')) pinCode = text;
          });

          const displayLabel = place.formattedAddress || suggestion.mainText || `${area || city} (${pinCode})`;
          setPinnedLabel(displayLabel);
          setSearchQuery('');
          setSuggestions([]);

          onAddressSelect(
            {
              ...(house ? { house } : {}),
              street: street || suggestion.mainText,
              area: area || city,
              city,
              district,
              state,
              pinCode,
              lat,
              lng,
            },
            { lat, lng }
          );

          if ((placesLib as any).AutocompleteSessionToken) {
            sessionTokenRef.current = new (placesLib as any).AutocompleteSessionToken();
          }
          return;
        }
      }

      if (suggestion.rawNominatim) {
        const nom = suggestion.rawNominatim;
        const addr = nom.address || {};
        const lat = parseFloat(nom.lat) || 8.5241;
        const lng = parseFloat(nom.lon) || 76.9366;
        setPinnedCoords({ lat, lng });
        setSelectedPresetId(null);
        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(17);
        }

        const street = addr.road || addr.pedestrian || suggestion.mainText;
        const area =
          addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || suggestion.mainText;
        const city =
          addr.city || addr.town || addr.village || addr.state_district || 'Trivandrum';
        const district = addr.state_district || addr.county || city;
        const state = addr.state || 'Kerala';
        const pinCode = addr.postcode || '695001';

        setPinnedLabel(`${suggestion.mainText}, ${city} (${pinCode})`);
        setSearchQuery('');
        setSuggestions([]);

        onAddressSelect(
          {
            street,
            area,
            city,
            district,
            state,
            pinCode,
            lat,
            lng,
          },
          { lat, lng }
        );
      }
    } catch (err) {
      console.warn('Place selection error:', err);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handleSelectPreset = (loc: (typeof PRESET_LOCATIONS)[0]) => {
    setSelectedPresetId(loc.id);
    setPinnedCoords({ lat: loc.lat, lng: loc.lng });
    setPinnedLabel(`${loc.name} — ${loc.area} (${loc.pinCode})`);
    if (map) {
      map.panTo({ lat: loc.lat, lng: loc.lng });
      map.setZoom(16);
    }
    onAddressSelect(
      {
        street: loc.street,
        area: loc.area,
        city: loc.city,
        district: loc.district,
        state: loc.state,
        pinCode: loc.pinCode,
        lat: loc.lat,
        lng: loc.lng,
      },
      { lat: loc.lat, lng: loc.lng }
    );
  };

  const handleUseMyGPS = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPinnedCoords({ lat, lng });
          setSelectedPresetId(null);
          if (map) {
            map.panTo({ lat, lng });
            map.setZoom(17);
          }
          reverseGeocodeCoords(lat, lng).finally(() => setIsLocating(false));
        },
        () => {
          const fallback = PRESET_LOCATIONS[2];
          handleSelectPreset(fallback);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      handleSelectPreset(PRESET_LOCATIONS[2]);
      setIsLocating(false);
    }
  };

  const filteredPresets = PRESET_LOCATIONS.filter(
    (loc) =>
      !searchQuery.trim() ||
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.pinCode.includes(searchQuery)
  );

  const handlePinMove = (lat: number, lng: number) => {
    setPinnedCoords({ lat, lng });
    setSelectedPresetId(null);
    reverseGeocodeCoords(lat, lng);
  };

  return (
    <div className="bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Header & GPS Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#71883F] text-white flex items-center justify-center shrink-0 shadow-xs">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#171717] flex items-center gap-1.5">
              <span>Google Maps Delivery Pin & Place Search</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF4E6] text-[#71883F] font-semibold">
                Exact Doorstep GPS
              </span>
            </h4>
            <p className="text-[11px] text-[#6B6B6B]">
              Search your building/street or click directly on the map to drop your exact delivery pin
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleUseMyGPS}
          disabled={isLocating}
          className="px-3.5 py-2 bg-[#171717] hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-[#A9C46C] animate-spin" />
              <span>Locating GPS...</span>
            </>
          ) : (
            <>
              <LocateFixed className="w-3.5 h-3.5 text-[#A9C46C]" />
              <span>Locate Me (Live GPS)</span>
            </>
          )}
        </button>
      </div>

      {/* Places Autocomplete Search Input */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search apartment, street, area, landmark, or PIN code..."
              className="w-full pl-9 pr-9 py-2.5 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
            />
            {isSearchingPlaces && (
              <Loader2 className="w-4 h-4 text-[#71883F] absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
            )}
          </div>
        </div>

        {/* Autocomplete Dropdown Suggestions */}
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
                  <p className="text-xs font-bold text-[#171717] truncate">{sug.mainText}</p>
                  {sug.secondaryText && (
                    <p className="text-[10px] text-[#6B6B6B] truncate">{sug.secondaryText}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-[#E8E8E3] bg-[#E5E9E0] shadow-inner">
        {mapsHealthy ? (
          <MapErrorBoundary
            fallback={
              <InteractiveOsmPinMap
                pinnedCoords={pinnedCoords}
                mapTypeId={mapTypeId}
                onPinMove={handlePinMove}
              />
            }
          >
            <Map
              id="checkout-delivery-map"
              mapId="DEMO_MAP_ID"
              mapTypeId={mapTypeId}
              defaultCenter={pinnedCoords}
              defaultZoom={15}
              gestureHandling="greedy"
              disableDefaultUI={false}
              onClick={(ev) => {
                const latLng = ev.detail?.latLng;
                if (latLng) {
                  handlePinMove(latLng.lat, latLng.lng);
                }
              }}
            >
              <AdvancedMarker position={pinnedCoords}>
                <div className="flex flex-col items-center">
                  <div className="bg-[#171717] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg mb-1 whitespace-nowrap flex items-center gap-1 border border-[#71883F]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Deliver Here</span>
                  </div>
                  <Pin background={'#71883F'} glyphColor={'#FFF'} borderColor={'#171717'} scale={1.2} />
                </div>
              </AdvancedMarker>
            </Map>
          </MapErrorBoundary>
        ) : (
          <InteractiveOsmPinMap
            pinnedCoords={pinnedCoords}
            mapTypeId={mapTypeId}
            onPinMove={handlePinMove}
          />
        )}

        {/* Map Top Left Coordinate Pill */}
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-xs border border-[#E8E8E3] rounded-lg px-2.5 py-1.5 shadow-sm flex items-center gap-2 pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-[#71883F]" />
          <span className="text-[11px] font-mono font-bold text-[#171717]">
            {pinnedCoords.lat.toFixed(5)}° N, {pinnedCoords.lng.toFixed(5)}° E
          </span>
        </div>

        {/* Map Bottom Controls: Satellite Toggle & Recenter */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
          <button
            type="button"
            onClick={() => setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))}
            className="pointer-events-auto px-3 py-1.5 bg-white/95 hover:bg-white border border-[#E8E8E3] rounded-lg text-[11px] font-bold text-[#171717] shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-[#71883F]" />
            <span>{mapTypeId === 'roadmap' ? 'Satellite View' : 'Street Map'}</span>
          </button>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${pinnedCoords.lat},${pinnedCoords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto px-3 py-1.5 bg-white/95 hover:bg-white border border-[#E8E8E3] rounded-lg text-[11px] font-bold text-[#71883F] shadow-sm flex items-center gap-1 cursor-pointer transition-all"
          >
            <span>Verify on Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Pinned Confirmation Banner */}
      <div className="bg-[#EFF4E6] border border-[#71883F]/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#171717] min-w-0">
          <CheckCircle2 className="w-4 h-4 text-[#71883F] shrink-0" />
          <span className="truncate">
            Pinned Delivery Point: <strong className="font-bold">{pinnedLabel}</strong>
          </span>
        </div>
        <span className="text-[11px] text-[#71883F] font-semibold shrink-0 flex items-center gap-1">
          <Navigation className="w-3 h-3" /> Shared with Delivery Driver
        </span>
      </div>

      {/* Quick Select Popular Delivery Zones */}
      <div>
        <p className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-2">
          Quick-Pin Popular Delivery Hubs:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {filteredPresets.map((loc) => {
            const isSelected = selectedPresetId === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelectPreset(loc)}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF4E6] border-[#71883F] shadow-2xs'
                    : 'bg-white border-[#E8E8E3] hover:border-[#71883F]/50'
                }`}
              >
                <MapPin
                  className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    isSelected ? 'text-[#71883F]' : 'text-[#6B6B6B]'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#171717] truncate">{loc.name}</p>
                  <p className="text-[10px] text-[#6B6B6B] truncate">
                    {loc.area} • {loc.pinCode}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
