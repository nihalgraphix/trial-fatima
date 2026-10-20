import React, { useState, useEffect, useRef } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Search,
  LocateFixed,
  Check,
  Loader2,
  Compass,
  Building2,
  Plus,
  Minus,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StoreSettings } from '../../types';
import { useGoogleMapsStatus, MapErrorBoundary } from '../common/GoogleMapsWrapper';

interface StoreLocationConfigCardProps {
  settingsForm?: StoreSettings;
  onUpdateSettingsForm?: (updates: Partial<StoreSettings>) => void;
  compact?: boolean;
}

const HUB_PRESETS = [
  {
    label: 'Trivandrum (MG Road)',
    hubName: 'Fathima Stores Main Hub (MG Road, Trivandrum)',
    address: 'Commercial Complex, MG Road, Trivandrum, Kerala 695001',
    city: 'Trivandrum',
    state: 'Kerala',
    pinCode: '695001',
    lat: 8.5241,
    lng: 76.9366,
  },
  {
    label: 'Kochi (Edappally)',
    hubName: 'Fathima Stores Kochi Hub (Edappally)',
    address: 'NH 66 Bypass Junction, Edappally, Kochi, Kerala 682024',
    city: 'Kochi',
    state: 'Kerala',
    pinCode: '682024',
    lat: 10.0261,
    lng: 76.3125,
  },
  {
    label: 'Kozhikode (SM Street)',
    hubName: 'Fathima Stores Malabar Hub (SM Street, Kozhikode)',
    address: 'Sweet Meat Street, Palayam, Kozhikode, Kerala 673001',
    city: 'Kozhikode',
    state: 'Kerala',
    pinCode: '673001',
    lat: 11.2588,
    lng: 75.7804,
  },
  {
    label: 'Bengaluru (Indiranagar)',
    hubName: 'Fathima Stores Bengaluru Hub (100 Feet Rd)',
    address: '100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560038',
    lat: 12.9784,
    lng: 77.6408,
  },
  {
    label: 'Chennai (Anna Nagar)',
    hubName: 'Fathima Stores Chennai Hub (Anna Nagar)',
    address: '2nd Avenue, Anna Nagar, Chennai, Tamil Nadu 600040',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pinCode: '600040',
    lat: 13.085,
    lng: 80.2101,
  },
];

// Interactive OpenStreetMap Clickable Picker Fallback
const InteractiveOsmStorePinMap: React.FC<{
  lat: number;
  lng: number;
  hubName: string;
  onPickCoords: (lat: number, lng: number) => void;
}> = ({ lat, lng, hubName, onPickCoords }) => {
  const [zoom, setZoom] = useState(15);
  const containerRef = useRef<HTMLDivElement>(null);

  const lat2tile = (l: number, z: number) =>
    ((1 - Math.log(Math.tan((l * Math.PI) / 180) + 1 / Math.cos((l * Math.PI) / 180)) / Math.PI) /
      2) *
    Math.pow(2, z);
  const lon2tile = (lon: number, z: number) => ((lon + 180) / 360) * Math.pow(2, z);
  const tile2lon = (x: number, z: number) => (x / Math.pow(2, z)) * 360 - 180;
  const tile2lat = (y: number, z: number) => {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  };

  const centerTileX = lon2tile(lng, zoom);
  const centerTileY = lat2tile(lat, zoom);
  const baseTileX = Math.floor(centerTileX);
  const baseTileY = Math.floor(centerTileY);
  const offsetX = (centerTileX - baseTileX) * 256;
  const offsetY = (centerTileY - baseTileY) * 256;

  const tiles: { x: number; y: number; dx: number; dy: number }[] = [];
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      tiles.push({ x: baseTileX + dx, y: baseTileY + dy, dx, dy });
    }
  }

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left - rect.width / 2;
    const clickY = e.clientY - rect.top - rect.height / 2;

    const newTileX = centerTileX + clickX / 256;
    const newTileY = centerTileY + clickY / 256;

    const pickedLat = Number(tile2lat(newTileY, zoom).toFixed(6));
    const pickedLng = Number(tile2lon(newTileX, zoom).toFixed(6));
    onPickCoords(pickedLat, pickedLng);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleMapClick}
      className="w-full h-full relative overflow-hidden cursor-crosshair select-none bg-[#E5E9E0]"
      title="Click anywhere on the map to move the Store Hub location"
    >
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
          return (
            <img
              key={`${zoom}-${t.x}-${t.y}`}
              src={`https://tile.openstreetmap.org/${zoom}/${wrappedX}/${t.y}.png`}
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

      {/* Store Hub Center Pin */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-20 pointer-events-none flex flex-col items-center">
        <div className="bg-[#171717] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg mb-1 whitespace-nowrap border border-[#71883F] flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#A9C46C] animate-pulse" />
          <span>{hubName || 'Store Dispatch Hub'}</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#71883F] border-2 border-white text-white flex items-center justify-center shadow-xl">
          <Building2 className="w-4 h-4" />
        </div>
      </div>

      {/* Zoom Controls */}
      <div
        className="absolute right-3 top-3 z-20 flex flex-col bg-white/95 border border-[#E8E8E3] rounded-xl shadow-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(18, z + 1))}
          className="p-2 hover:bg-[#F7F8F3] text-[#171717] border-b border-[#E8E8E3] cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(9, z - 1))}
          className="p-2 hover:bg-[#F7F8F3] text-[#171717] cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="absolute bottom-2.5 left-2.5 z-20 bg-white/95 backdrop-blur-xs border border-[#E8E8E3] px-2.5 py-1 rounded-lg text-[10px] font-semibold text-[#171717] shadow-xs pointer-events-none">
        Click anywhere on map to reposition Store Hub pin ({lat.toFixed(4)}, {lng.toFixed(4)})
      </div>
    </div>
  );
};

export const StoreLocationConfigCard: React.FC<StoreLocationConfigCardProps> = ({
  settingsForm,
  onUpdateSettingsForm,
  compact = false,
}) => {
  const { storeSettings, updateStoreSettings, showToast } = useStore();
  const { mapsHealthy } = useGoogleMapsStatus();

  const source = settingsForm || storeSettings;

  const [hubName, setHubName] = useState(
    source.storeHubName || 'Fathima Stores Main Hub (MG Road, Trivandrum)'
  );
  const [address, setAddress] = useState(
    source.address || 'Commercial Complex, MG Road, Trivandrum, Kerala 695001'
  );
  const [city, setCity] = useState(source.storeCity || 'Trivandrum');
  const [stateName, setStateName] = useState(source.storeState || 'Kerala');
  const [pinCode, setPinCode] = useState(source.storePinCode || '695001');
  const [lat, setLat] = useState<number>(source.storeLat || 8.5241);
  const [lng, setLng] = useState<number>(source.storeLng || 76.9366);
  const [radiusKm, setRadiusKm] = useState<number>(source.deliveryRadiusKm || 25);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when external storeSettings change
  useEffect(() => {
    const s = settingsForm || storeSettings;
    if (s.storeHubName) setHubName(s.storeHubName);
    if (s.address) setAddress(s.address);
    if (s.storeCity) setCity(s.storeCity);
    if (s.storeState) setStateName(s.storeState);
    if (s.storePinCode) setPinCode(s.storePinCode);
    if (typeof s.storeLat === 'number') setLat(s.storeLat);
    if (typeof s.storeLng === 'number') setLng(s.storeLng);
    if (typeof s.deliveryRadiusKm === 'number') setRadiusKm(s.deliveryRadiusKm);
  }, [
    storeSettings.storeLat,
    storeSettings.storeLng,
    storeSettings.address,
    storeSettings.storeHubName,
  ]);

  const syncToParentAndLocal = (updates: Partial<StoreSettings>) => {
    if (onUpdateSettingsForm) {
      onUpdateSettingsForm(updates);
    }
  };

  // Reverse geocode coordinates to address
  const reverseGeocodeCoords = async (pickedLat: number, pickedLng: number) => {
    setLat(pickedLat);
    setLng(pickedLng);
    syncToParentAndLocal({ storeLat: pickedLat, storeLng: pickedLng });

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pickedLat}&lon=${pickedLng}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const addrObj = data.address || {};
          const resolvedCity =
            addrObj.city ||
            addrObj.town ||
            addrObj.municipality ||
            addrObj.county ||
            city;
          const resolvedState = addrObj.state || stateName;
          const resolvedPin = addrObj.postcode || pinCode;
          const roadOrSuburb =
            addrObj.road || addrObj.suburb || addrObj.neighbourhood || resolvedCity;
          const nextHubName = `${storeSettings.storeName || 'Fathima Stores'} Hub (${roadOrSuburb}, ${resolvedCity})`;

          setAddress(data.display_name);
          setCity(resolvedCity);
          setStateName(resolvedState);
          setPinCode(resolvedPin);
          setHubName(nextHubName);

          syncToParentAndLocal({
            address: data.display_name,
            storeAddress: data.display_name,
            storeHubName: nextHubName,
            storeCity: resolvedCity,
            storeState: resolvedState,
            storePinCode: resolvedPin,
            storeLat: pickedLat,
            storeLng: pickedLng,
          });
        }
      }
    } catch {
      // Keep manual fields if reverse geocode fails
    }
  };

  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&addressdetails=1&limit=5`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      }
    } catch {
      showToast('Could not search address. Try picking directly on the map.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    const pickedLat = Number(parseFloat(item.lat).toFixed(6));
    const pickedLng = Number(parseFloat(item.lon).toFixed(6));
    const addr = item.address || {};
    const resolvedCity =
      addr.city || addr.town || addr.village || addr.county || city;
    const resolvedState = addr.state || stateName;
    const resolvedPin = addr.postcode || pinCode;
    const nextHub = `${storeSettings.storeName || 'Fathima Stores'} Hub (${resolvedCity})`;

    setLat(pickedLat);
    setLng(pickedLng);
    setAddress(item.display_name);
    setCity(resolvedCity);
    setStateName(resolvedState);
    setPinCode(resolvedPin);
    setHubName(nextHub);
    setSearchResults([]);
    setSearchQuery('');

    syncToParentAndLocal({
      address: item.display_name,
      storeAddress: item.display_name,
      storeHubName: nextHub,
      storeCity: resolvedCity,
      storeState: resolvedState,
      storePinCode: resolvedPin,
      storeLat: pickedLat,
      storeLng: pickedLng,
    });
    showToast(`Selected store location in ${resolvedCity}`, 'info');
  };

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const gpsLat = Number(pos.coords.latitude.toFixed(6));
        const gpsLng = Number(pos.coords.longitude.toFixed(6));
        await reverseGeocodeCoords(gpsLat, gpsLng);
        setIsLocatingGps(false);
        showToast('Store location updated to your current GPS coordinates!', 'success');
      },
      () => {
        setIsLocatingGps(false);
        showToast('Unable to access GPS. Please allow location permission or click on the map.', 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleApplyPreset = async (preset: (typeof HUB_PRESETS)[0]) => {
    setHubName(preset.hubName);
    setAddress(preset.address);
    setCity(preset.city);
    setStateName(preset.state);
    setPinCode(preset.pinCode);
    setLat(preset.lat);
    setLng(preset.lng);

    const payload: Partial<StoreSettings> = {
      storeHubName: preset.hubName,
      address: preset.address,
      storeAddress: preset.address,
      storeCity: preset.city,
      storeState: preset.state,
      storePinCode: preset.pinCode,
      storeLat: preset.lat,
      storeLng: preset.lng,
    };
    syncToParentAndLocal(payload);
    await updateStoreSettings(payload);
    showToast(`Store location switched to ${preset.label}!`, 'success');
  };

  const handleSaveStoreLocation = async () => {
    setIsSaving(true);
    const payload: Partial<StoreSettings> = {
      storeHubName: hubName,
      address,
      storeAddress: address,
      storeCity: city,
      storeState: stateName,
      storePinCode: pinCode,
      storeLat: Number(lat),
      storeLng: Number(lng),
      deliveryRadiusKm: Number(radiusKm),
    };
    syncToParentAndLocal(payload);
    await updateStoreSettings(payload);
    setIsSaving(false);
    showToast(
      `Store Hub location saved (${city} • ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})! All delivery maps & ETAs updated.`,
      'success'
    );
  };

  return (
    <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs text-xs text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E3] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider flex items-center gap-2">
                <span>Store Location & Dispatch Hub Configurator</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Live GPS Origin
                </span>
              </h4>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                Change the physical store address and GPS coordinates used across Route Optimization, Customer Order ETAs, Driver Navigation, and Invoices.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleUseCurrentGps}
            disabled={isLocatingGps}
            className="px-3 py-2 bg-[#F7F8F3] hover:bg-[#EFF4E6] text-[#171717] border border-[#E8E8E3] hover:border-[#71883F] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isLocatingGps ? (
              <Loader2 className="w-3.5 h-3.5 text-[#71883F] animate-spin" />
            ) : (
              <LocateFixed className="w-3.5 h-3.5 text-[#71883F]" />
            )}
            <span>Use My Current GPS</span>
          </button>

          <button
            type="button"
            onClick={handleSaveStoreLocation}
            disabled={isSaving}
            className="px-4 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Save Store Location Live</span>
          </button>
        </div>
      </div>

      {/* Quick Branch / City Hub Presets */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-[#6B6B6B] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#71883F]" /> Quick Switch Store Branch / Regional Hub:
        </span>
        <div className="flex flex-wrap gap-2">
          {HUB_PRESETS.map((preset) => {
            const isSelected =
              Math.abs(lat - preset.lat) < 0.005 && Math.abs(lng - preset.lng) < 0.005;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#71883F] text-white border-[#71883F] shadow-2xs'
                    : 'bg-[#F7F8F3] text-[#171717] border-[#E8E8E3] hover:border-[#71883F]'
                }`}
              >
                <MapPin className="w-3 h-3" />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Address & Interactive Map Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 6 Cols: Interactive Map */}
        <div className="lg:col-span-6 space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
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
                  placeholder="Search any street, landmark, or city for Store Hub..."
                  className="w-full pl-8 pr-3 py-2 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl text-xs outline-none focus:border-[#71883F]"
                />
                <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-2.5 top-2.5" />
              </div>
              <button
                type="button"
                onClick={() => handleSearchLocation()}
                disabled={isSearching}
                className="px-3.5 py-2 bg-[#171717] hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                {isSearching ? 'Searching...' : 'Find on Map'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-11 z-30 bg-white border border-[#E8E8E3] rounded-xl shadow-xl divide-y divide-[#E8E8E3] max-h-48 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-3 py-2.5 hover:bg-[#F7F8F3] flex items-start gap-2 text-xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#71883F] shrink-0 mt-0.5" />
                    <span className="text-[#171717] line-clamp-2">{item.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map Viewport */}
          <div className={`w-full ${compact ? 'h-56' : 'h-64'} rounded-2xl overflow-hidden border border-[#E8E8E3] relative bg-[#E5E9E0]`}>
            {mapsHealthy ? (
              <MapErrorBoundary
                fallback={
                  <InteractiveOsmStorePinMap
                    lat={lat}
                    lng={lng}
                    hubName={hubName}
                    onPickCoords={reverseGeocodeCoords}
                  />
                }
              >
                <Map
                  id="admin-store-hub-config-map"
                  center={{ lat, lng }}
                  zoom={15}
                  mapId="STORE_HUB_CONFIG_MAP"
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  onClick={(ev: any) => {
                    const clickedLat = ev?.detail?.latLng?.lat;
                    const clickedLng = ev?.detail?.latLng?.lng;
                    if (typeof clickedLat === 'number' && typeof clickedLng === 'number') {
                      reverseGeocodeCoords(
                        Number(clickedLat.toFixed(6)),
                        Number(clickedLng.toFixed(6))
                      );
                    }
                  }}
                  className="w-full h-full"
                >
                  <AdvancedMarker position={{ lat, lng }}>
                    <div className="flex flex-col items-center">
                      <div className="bg-[#171717] text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg mb-1 whitespace-nowrap border border-[#71883F]">
                        {hubName || 'Store Hub'}
                      </div>
                      <div className="w-9 h-9 rounded-full bg-[#71883F] border-2 border-white text-white flex items-center justify-center shadow-xl">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                  </AdvancedMarker>
                </Map>
              </MapErrorBoundary>
            ) : (
              <InteractiveOsmStorePinMap
                lat={lat}
                lng={lng}
                hubName={hubName}
                onPickCoords={reverseGeocodeCoords}
              />
            )}
          </div>
        </div>

        {/* Right 6 Cols: Editable Store Location Details */}
        <div className="lg:col-span-6 space-y-3">
          <div>
            <label className="font-semibold text-[#171717] block mb-1">
              Store Dispatch Hub Name
            </label>
            <input
              type="text"
              value={hubName}
              onChange={(e) => {
                setHubName(e.target.value);
                syncToParentAndLocal({ storeHubName: e.target.value });
              }}
              placeholder="e.g. Fathima Stores Main Hub (MG Road, Trivandrum)"
              className="w-full px-3 py-2 border border-[#E8E8E3] rounded-xl text-[#171717] font-semibold outline-none focus:border-[#71883F]"
            />
          </div>

          <div>
            <label className="font-semibold text-[#171717] block mb-1">
              Full Physical Store Address (Shown on Invoices, Footer & Contact Page)
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                syncToParentAndLocal({
                  address: e.target.value,
                  storeAddress: e.target.value,
                });
              }}
              placeholder="Full building, street, landmark, city, state, PIN..."
              className="w-full px-3 py-2 border border-[#E8E8E3] rounded-xl text-[#171717] outline-none focus:border-[#71883F]"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="font-semibold text-[#171717] block mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  syncToParentAndLocal({ storeCity: e.target.value });
                }}
                className="w-full px-2.5 py-1.5 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#171717] block mb-1">State</label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => {
                  setStateName(e.target.value);
                  syncToParentAndLocal({ storeState: e.target.value });
                }}
                className="w-full px-2.5 py-1.5 border border-[#E8E8E3] rounded-lg text-[#171717] outline-none focus:border-[#71883F]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#171717] block mb-1">PIN Code</label>
              <input
                type="text"
                value={pinCode}
                onChange={(e) => {
                  setPinCode(e.target.value);
                  syncToParentAndLocal({ storePinCode: e.target.value });
                }}
                className="w-full px-2.5 py-1.5 border border-[#E8E8E3] rounded-lg text-[#171717] font-mono outline-none focus:border-[#71883F]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div>
              <label className="font-semibold text-[#171717] block mb-1">Store Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setLat(v);
                  syncToParentAndLocal({ storeLat: v });
                }}
                className="w-full px-2.5 py-1.5 bg-[#F7F8F3] border border-[#E8E8E3] rounded-lg text-[#171717] font-mono outline-none focus:border-[#71883F]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#171717] block mb-1">Store Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  setLng(v);
                  syncToParentAndLocal({ storeLng: v });
                }}
                className="w-full px-2.5 py-1.5 bg-[#F7F8F3] border border-[#E8E8E3] rounded-lg text-[#171717] font-mono outline-none focus:border-[#71883F]"
              />
            </div>
            <div>
              <label className="font-semibold text-[#171717] block mb-1">
                Express Radius (km)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={radiusKm}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10) || 25;
                  setRadiusKm(v);
                  syncToParentAndLocal({ deliveryRadiusKm: v });
                }}
                className="w-full px-2.5 py-1.5 border border-[#E8E8E3] rounded-lg text-[#171717] font-bold outline-none focus:border-[#71883F]"
              />
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between bg-[#F7F8F3] p-2.5 rounded-xl border border-[#E8E8E3]">
            <div className="text-[11px] text-[#6B6B6B]">
              Active Coordinates:{' '}
              <span className="font-mono font-bold text-[#171717]">
                {Number(lat).toFixed(4)}° N, {Number(lng).toFixed(4)}° E
              </span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-[#71883F] hover:underline flex items-center gap-1"
            >
              <span>View Store on Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
