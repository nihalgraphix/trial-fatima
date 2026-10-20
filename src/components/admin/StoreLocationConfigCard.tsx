import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Move,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const STORE_ORIGIN = {
  lat: 8.4806,
  lng: 76.9261,
  address:
    'T.C 45/862(2), Subash Nagar, Vallakkadavu P.O, Thiruvananthapuram, Kerala 695008',
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

declare global {
  interface Window {
    google: any;
  }
}

// Helper to convert lat/lng to fractional Slippy Map tile coordinates
function latLngToTileXY(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

// Helper to convert fractional Slippy Map tile coordinates back to lat/lng
function tileXYToLatLng(x: number, y: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  const lat = (latRad * 180) / Math.PI;
  return {
    lat: Number(Math.max(-85, Math.min(85, lat)).toFixed(6)),
    lng: Number(Math.max(-180, Math.min(180, lng)).toFixed(6)),
  };
}

interface StoreLocationConfigCardProps {
  onSaved?: () => void;
  compact?: boolean;
}

export const StoreLocationConfigCard: React.FC<StoreLocationConfigCardProps> = ({
  onSaved,
}) => {
  const { storeSettings, updateStoreSettings, showToast } = useStore();

  const [storeAddress, setStoreAddress] = useState(
    storeSettings.storeAddress || STORE_ORIGIN.address
  );
  const [storeLandmark, setStoreLandmark] = useState(
    storeSettings.storeLandmark || 'T.C 45/862(2), Subash Nagar, Vallakkadavu P.O'
  );
  const [storePincode, setStorePincode] = useState(
    storeSettings.storePincode || '695008'
  );
  const [contactPhone, setContactPhone] = useState(
    storeSettings.contactPhone || '+91 98450 12345 / 0471 2345678'
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

  // Viewport center for the interactive scrollable slippy map (can pan independently or lock to pin)
  const [viewLat, setViewLat] = useState<number>(
    Number(storeSettings.storeLat) || STORE_ORIGIN.lat
  );
  const [viewLng, setViewLng] = useState<number>(
    Number(storeSettings.storeLng) || STORE_ORIGIN.lng
  );
  const [zoom, setZoom] = useState<number>(16);
  const [isExpandedMap, setIsExpandedMap] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [useFallbackMap, setUseFallbackMap] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const slippyContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Drag state for interactive OpenStreetMap Slippy Canvas
  const dragStateRef = useRef<{
    isDragging: boolean;
    hasMoved: boolean;
    startX: number;
    startY: number;
    startViewLat: number;
    startViewLng: number;
  }>({
    isDragging: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    startViewLat: viewLat,
    startViewLng: viewLng,
  });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 960, height: 520 });

  // Sync when storeSettings load from Firestore
  useEffect(() => {
    if (storeSettings.storeAddress) setStoreAddress(storeSettings.storeAddress);
    if (storeSettings.storeLandmark) setStoreLandmark(storeSettings.storeLandmark);
    if (storeSettings.storePincode) setStorePincode(storeSettings.storePincode);
    if (storeSettings.contactPhone) setContactPhone(storeSettings.contactPhone);
    if (storeSettings.whatsappNumber) setWhatsappNumber(storeSettings.whatsappNumber);
    if (storeSettings.contactEmail) setContactEmail(storeSettings.contactEmail);
    if (storeSettings.storeLat && !isNaN(Number(storeSettings.storeLat))) {
      const nextLat = Number(storeSettings.storeLat);
      setLat(nextLat);
      setViewLat(nextLat);
    }
    if (storeSettings.storeLng && !isNaN(Number(storeSettings.storeLng))) {
      const nextLng = Number(storeSettings.storeLng);
      setLng(nextLng);
      setViewLng(nextLng);
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

  // Measure slippy map container size for crisp full-width tile coverage
  useEffect(() => {
    const updateSize = () => {
      if (slippyContainerRef.current) {
        const rect = slippyContainerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setContainerSize({ width: rect.width, height: rect.height });
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isExpandedMap, useFallbackMap]);

  // Reverse geocode coordinates via OpenStreetMap Nominatim
  const reverseGeocodeCoordinates = useCallback(async (targetLat: number, targetLng: number) => {
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
  }, []);

  // Initialize Google Maps if API key is configured, otherwise use wide interactive slippy map
  useEffect(() => {
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';
    if (!apiKey) {
      setUseFallbackMap(true);
      return;
    }

    let isMounted = true;
    const initMap = () => {
      if (!isMounted || !mapContainerRef.current || !window.google?.maps) {
        setUseFallbackMap(true);
        return;
      }
      try {
        const center = { lat, lng };
        const map = new window.google.maps.Map(mapContainerRef.current, {
          center,
          zoom: 16,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          scrollwheel: true,
          gestureHandling: 'greedy',
        });

        const marker = new window.google.maps.Marker({
          position: center,
          map,
          draggable: true,
          title: 'Fathima Stores Dispatch Hub (Drag to reposition)',
        });

        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (pos) {
            const newLat = Number(pos.lat().toFixed(6));
            const newLng = Number(pos.lng().toFixed(6));
            setLat(newLat);
            setLng(newLng);
            setViewLat(newLat);
            setViewLng(newLng);
            reverseGeocodeCoordinates(newLat, newLng);
          }
        });

        map.addListener('click', (e: any) => {
          if (e.latLng) {
            const newLat = Number(e.latLng.lat().toFixed(6));
            const newLng = Number(e.latLng.lng().toFixed(6));
            marker.setPosition({ lat: newLat, lng: newLng });
            setLat(newLat);
            setLng(newLng);
            setViewLat(newLat);
            setViewLng(newLng);
            reverseGeocodeCoordinates(newLat, newLng);
          }
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        setMapReady(true);
      } catch {
        setUseFallbackMap(true);
      }
    };

    if (window.google?.maps) {
      initMap();
    } else {
      const existingScript = document.getElementById('google-maps-sdk-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-maps-sdk-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = initMap;
        script.onerror = () => setUseFallbackMap(true);
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', initMap);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Google Map marker if lat/lng changes externally
  useEffect(() => {
    if (mapReady && mapInstanceRef.current && markerRef.current && window.google?.maps) {
      const pos = { lat, lng };
      markerRef.current.setPosition(pos);
      mapInstanceRef.current.panTo(pos);
    }
  }, [lat, lng, mapReady]);

  // Search address or place via OpenStreetMap Nominatim
  const handleSearchLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

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
        const hit = results[0];
        const nextLat = Number(parseFloat(hit.lat).toFixed(6));
        const nextLng = Number(parseFloat(hit.lon).toFixed(6));
        setLat(nextLat);
        setLng(nextLng);
        setViewLat(nextLat);
        setViewLng(nextLng);
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
        showToast('Store location pinned on map! Click Save Store Location to publish.', 'info');
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
        setViewLat(nextLat);
        setViewLng(nextLng);
        await reverseGeocodeCoordinates(nextLat, nextLng);
        setIsLocatingGps(false);
        showToast('Current GPS coordinates captured! Review and save below.', 'success');
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

  // Interactive Slippy Map Drag, Scroll-Wheel Zoom, and Click-to-Pin Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      isDragging: true,
      hasMoved: false,
      startX: e.clientX,
      startY: e.clientY,
      startViewLat: viewLat,
      startViewLng: viewLng,
    };
    setIsDraggingMap(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDragging) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStateRef.current.hasMoved = true;
    }
    const startTile = latLngToTileXY(
      dragStateRef.current.startViewLat,
      dragStateRef.current.startViewLng,
      zoom
    );
    const nextTileX = startTile.x - dx / 256;
    const nextTileY = startTile.y - dy / 256;
    const nextCenter = tileXYToLatLng(nextTileX, nextTileY, zoom);
    setViewLat(nextCenter.lat);
    setViewLng(nextCenter.lng);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDragging) return;
    const wasMoved = dragStateRef.current.hasMoved;
    dragStateRef.current.isDragging = false;
    setIsDraggingMap(false);

    // If user clicked without dragging, pin the store location at the clicked point on the wide map!
    if (!wasMoved && slippyContainerRef.current) {
      const rect = slippyContainerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const dxFromCenter = clickX - rect.width / 2;
      const dyFromCenter = clickY - rect.height / 2;

      const centerTile = latLngToTileXY(viewLat, viewLng, zoom);
      const clickedTileX = centerTile.x + dxFromCenter / 256;
      const clickedTileY = centerTile.y + dyFromCenter / 256;
      const clickedLatLng = tileXYToLatLng(clickedTileX, clickedTileY, zoom);

      setLat(clickedLatLng.lat);
      setLng(clickedLatLng.lng);
      reverseGeocodeCoordinates(clickedLatLng.lat, clickedLatLng.lng);
    }
  };

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    setZoom((prev) => Math.max(10, Math.min(18, prev + delta)));
  };

  const panMapByPixels = (dxPixels: number, dyPixels: number) => {
    const centerTile = latLngToTileXY(viewLat, viewLng, zoom);
    const nextCenter = tileXYToLatLng(
      centerTile.x + dxPixels / 256,
      centerTile.y + dyPixels / 256,
      zoom
    );
    setViewLat(nextCenter.lat);
    setViewLng(nextCenter.lng);
  };

  // Compute visible OpenStreetMap 256x256 tiles covering the wide container
  const renderSlippyTiles = () => {
    const { width, height } = containerSize;
    const centerTile = latLngToTileXY(viewLat, viewLng, zoom);
    const centerTileX = Math.floor(centerTile.x);
    const centerTileY = Math.floor(centerTile.y);
    const offsetX = (centerTile.x - centerTileX) * 256;
    const offsetY = (centerTile.y - centerTileY) * 256;

    const colsEachSide = Math.ceil(width / 512) + 2;
    const rowsEachSide = Math.ceil(height / 512) + 2;
    const maxTileIndex = Math.pow(2, zoom);

    const tiles: React.ReactNode[] = [];
    for (let dx = -colsEachSide; dx <= colsEachSide; dx++) {
      for (let dy = -rowsEachSide; dy <= rowsEachSide; dy++) {
        const tx = ((centerTileX + dx) % maxTileIndex + maxTileIndex) % maxTileIndex;
        const ty = centerTileY + dy;
        if (ty < 0 || ty >= maxTileIndex) continue;

        const left = width / 2 - offsetX + dx * 256;
        const top = height / 2 - offsetY + dy * 256;

        tiles.push(
          <img
            key={`${zoom}-${tx}-${ty}`}
            src={`https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`}
            alt=""
            draggable={false}
            className="absolute w-[256px] h-[256px] max-w-none select-none pointer-events-none"
            style={{
              left: `${Math.round(left)}px`,
              top: `${Math.round(top)}px`,
            }}
          />
        );
      }
    }

    // Calculate pixel position of the pinned Store Location (lat, lng) relative to current viewport center (viewLat, viewLng)
    const pinTile = latLngToTileXY(lat, lng, zoom);
    const pinScreenX = width / 2 + (pinTile.x - centerTile.x) * 256;
    const pinScreenY = height / 2 + (pinTile.y - centerTile.y) * 256;

    return { tiles, pinScreenX, pinScreenY };
  };

  const distFromDefault = calculateDistanceKm(
    STORE_ORIGIN.lat,
    STORE_ORIGIN.lng,
    lat,
    lng
  );

  const { tiles, pinScreenX, pinScreenY } = renderSlippyTiles();

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
                Store Location & GPS Dispatch Hub Configuration
              </h4>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                Drag and scroll around the wide map below or click anywhere to pin your store location. Updates Storefront, Checkout distance fees, and Driver pickup routes immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 bg-[#EFF4E6] text-[#5F7334] border border-[#71883F]/30 rounded-full text-[10px] font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Live Dispatch Origin
          </span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-white hover:bg-[#F7F8F3] text-[#171717] border border-[#E8E8E3] rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors"
          >
            <ExternalLink className="w-3 h-3 text-[#71883F]" /> Open in Maps
          </a>
        </div>
      </div>

      {/* Top Search & GPS Bar */}
      <div className="flex flex-col md:flex-row gap-2.5">
        <div className="flex flex-1 gap-2">
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
              placeholder="Search any area, street, landmark, or pincode to jump on the map..."
              className="w-full pl-9 pr-3 py-2.5 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
            />
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
              setViewLat(STORE_ORIGIN.lat);
              setViewLng(STORE_ORIGIN.lng);
              setStoreAddress(STORE_ORIGIN.address);
              setStoreLandmark('T.C 45/862(2), Subash Nagar, Vallakkadavu P.O');
              setStorePincode('695008');
            }}
            className="px-3 py-2.5 bg-white hover:bg-[#F7F8F3] text-[#6B6B6B] border border-[#E8E8E3] rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-[#71883F]" />
            Reset to Default Hub
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

      {/* FULL-WIDTH WIDE INTERACTIVE SCROLLABLE & DRAGGABLE MAP CANVAS */}
      <div className="space-y-3 w-full">
        <div
          className={`relative w-full ${
            isExpandedMap ? 'h-[660px] sm:h-[740px]' : 'h-[480px] sm:h-[560px]'
          } rounded-2xl overflow-hidden border-2 border-[#E8E8E3] bg-[#E5E3DF] shadow-inner transition-all`}
        >
          {!useFallbackMap ? (
            <div ref={mapContainerRef} className="w-full h-full" />
          ) : (
            <div
              ref={slippyContainerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheelZoom}
              className={`relative w-full h-full overflow-hidden select-none touch-none ${
                isDraggingMap ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {/* OpenStreetMap Slippy Tiles */}
              {tiles}

              {/* Pinned Store Location Marker on the Map */}
              <div
                className="absolute z-10 pointer-events-none transition-transform duration-75"
                style={{
                  left: `${pinScreenX}px`,
                  top: `${pinScreenY}px`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="flex flex-col items-center">
                  <div className="px-3 py-1 bg-[#171717] text-white text-[11px] font-extrabold rounded-full shadow-lg whitespace-nowrap mb-1 border border-white/20 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Fathima Stores Hub ({lat.toFixed(4)}, {lng.toFixed(4)})
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#71883F] border-3 border-white shadow-xl flex items-center justify-center text-white">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="w-3 h-1.5 bg-black/35 rounded-full blur-[1px] mt-0.5" />
                </div>
              </div>

              {/* Subtle Center Crosshair when panning away from pin */}
              {(Math.abs(viewLat - lat) > 0.0002 || Math.abs(viewLng - lng) > 0.0002) && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#171717]/60 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
                  </div>
                </div>
              )}

              {/* Top-Left Instruction & Action Bar */}
              <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-md border border-[#E8E8E3] rounded-xl px-3 py-2 shadow-md flex items-center gap-2">
                  <Move className="w-4 h-4 text-[#71883F]" />
                  <span className="text-[11px] font-bold text-[#171717]">
                    Drag to scroll around · Scroll wheel to zoom · Click anywhere to move Store Pin
                  </span>
                </div>

                {(Math.abs(viewLat - lat) > 0.0002 || Math.abs(viewLng - lng) > 0.0002) && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLat(viewLat);
                        setLng(viewLng);
                        reverseGeocodeCoordinates(viewLat, viewLng);
                      }}
                      className="px-3 py-2 bg-[#71883F] hover:bg-[#5F7334] text-white font-extrabold rounded-xl shadow-md text-[11px] flex items-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Pin Store at Map Center
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewLat(lat);
                        setViewLng(lng);
                      }}
                      className="px-3 py-2 bg-white hover:bg-[#F7F8F3] text-[#171717] border border-[#E8E8E3] font-bold rounded-xl shadow-md text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      Re-center on Pin
                    </button>
                  </>
                )}
              </div>

              {/* Right-Side Zoom & Directional Pan Controls */}
              <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 pointer-events-auto">
                {/* Zoom Controls */}
                <div className="bg-white/95 backdrop-blur-md border border-[#E8E8E3] rounded-xl shadow-md overflow-hidden flex flex-col">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoom((z) => Math.min(18, z + 1));
                    }}
                    title="Zoom In"
                    className="p-2.5 hover:bg-[#F7F8F3] text-[#171717] border-b border-[#E8E8E3] flex items-center justify-center cursor-pointer"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <div className="px-2 py-1 text-[10px] font-mono font-bold text-center text-[#6B6B6B] bg-[#FAFBF7] border-b border-[#E8E8E3]">
                    {zoom}x
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoom((z) => Math.max(10, z - 1));
                    }}
                    title="Zoom Out"
                    className="p-2.5 hover:bg-[#F7F8F3] text-[#171717] flex items-center justify-center cursor-pointer"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Directional Step Pan Pad */}
                <div className="bg-white/95 backdrop-blur-md border border-[#E8E8E3] rounded-xl p-1.5 shadow-md grid grid-cols-3 gap-1 w-[88px]">
                  <div />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      panMapByPixels(0, -180);
                    }}
                    className="p-1.5 rounded-lg hover:bg-[#EFF4E6] text-[#171717] font-bold text-[10px] flex items-center justify-center cursor-pointer"
                    title="Scroll North"
                  >
                    ▲
                  </button>
                  <div />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      panMapByPixels(-180, 0);
                    }}
                    className="p-1.5 rounded-lg hover:bg-[#EFF4E6] text-[#171717] font-bold text-[10px] flex items-center justify-center cursor-pointer"
                    title="Scroll West"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewLat(lat);
                      setViewLng(lng);
                    }}
                    className="p-1.5 rounded-lg bg-[#EFF4E6] text-[#71883F] font-extrabold text-[9px] flex items-center justify-center cursor-pointer"
                    title="Center on Pin"
                  >
                    ●
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      panMapByPixels(180, 0);
                    }}
                    className="p-1.5 rounded-lg hover:bg-[#EFF4E6] text-[#171717] font-bold text-[10px] flex items-center justify-center cursor-pointer"
                    title="Scroll East"
                  >
                    ▶
                  </button>
                  <div />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      panMapByPixels(0, 180);
                    }}
                    className="p-1.5 rounded-lg hover:bg-[#EFF4E6] text-[#171717] font-bold text-[10px] flex items-center justify-center cursor-pointer"
                    title="Scroll South"
                  >
                    ▼
                  </button>
                  <div />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Floating Live Coordinate Status Bar */}
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md border border-[#E8E8E3] rounded-xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-2 z-20 pointer-events-auto">
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
                {distFromDefault} km from original Vallakkadavu hub
              </span>
            )}
          </div>
        </div>

        {/* Quick Area Presets Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FAFBF7] border border-[#E8E8E3] rounded-xl p-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider mr-1">
              Quick Jump Hubs:
            </span>
            {[
              {
                label: 'Vallakkadavu (Main Hub)',
                lat: 8.4806,
                lng: 76.9261,
                address: 'T.C 45/862(2), Subash Nagar, Vallakkadavu P.O, Thiruvananthapuram, Kerala 695008',
                landmark: 'Subash Nagar, Vallakkadavu P.O',
                pincode: '695008',
              },
              {
                label: 'East Fort / Pazhavangadi',
                lat: 8.4832,
                lng: 76.9482,
                address: 'East Fort, Pazhavangadi, Thiruvananthapuram, Kerala 695023',
                landmark: 'Near Padmanabhaswamy Temple, East Fort',
                pincode: '695023',
              },
              {
                label: 'Kazhakkoottam / Technopark',
                lat: 8.5581,
                lng: 76.8816,
                address: 'NH 66 Bypass, Kazhakkoottam, Thiruvananthapuram, Kerala 695582',
                landmark: 'Opposite Technopark Phase 1 Gate',
                pincode: '695582',
              },
              {
                label: 'Pattom Junction',
                lat: 8.5208,
                lng: 76.9423,
                address: 'Pattom Palace P.O, Thiruvananthapuram, Kerala 695004',
                landmark: 'Pattom Main Road Junction',
                pincode: '695004',
              },
            ].map((hub) => (
              <button
                key={hub.label}
                type="button"
                onClick={() => {
                  setLat(hub.lat);
                  setLng(hub.lng);
                  setViewLat(hub.lat);
                  setViewLng(hub.lng);
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

      {/* Store Address, Coordinates & Contact Details Grid below the wide map */}
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
                placeholder="e.g., Subash Nagar, Vallakkadavu"
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
                placeholder="695008"
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
                  setViewLat(val);
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
                  setViewLng(val);
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
