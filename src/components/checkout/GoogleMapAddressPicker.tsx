import React, { useState, useEffect } from 'react';
import { MapPin, Search, Navigation, CheckCircle2, ShieldCheck, Truck, AlertCircle } from 'lucide-react';
import { GeoCoordinates, ShippingAddress } from '../../types';

interface GoogleMapAddressPickerProps {
  initialAddress?: ShippingAddress;
  onAddressSelect: (address: ShippingAddress, coords: GeoCoordinates) => void;
}

export const GoogleMapAddressPicker: React.FC<GoogleMapAddressPickerProps> = ({
  initialAddress,
  onAddressSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPin, setSelectedPin] = useState<GeoCoordinates>({
    lat: initialAddress?.house ? 8.5241 : 8.5241, // Default Trivandrum Hub coords
    lng: 76.9366,
    addressFormatted: 'MG Road, Trivandrum, Kerala, 695001',
    placeId: 'ChIJ33842183BzsR',
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
  });

  const [distanceKm, setDistanceKm] = useState<number>(3.2);
  const [isServiceable, setIsServiceable] = useState<boolean>(true);
  const [deliveryEstDays, setDeliveryEstDays] = useState<string>('Same-Day Express');

  // Simulated Google Places Search Suggestions
  const sampleSuggestions = [
    { title: 'MG Road Central, Trivandrum', lat: 8.5241, lng: 76.9366, pin: '695001', area: 'MG Road' },
    { title: 'Technopark Phase 1, Kazhakkoottam', lat: 8.5581, lng: 76.8812, pin: '695581', area: 'Kazhakkoottam' },
    { title: 'Kowdiar Palace Circle, Kowdiar', lat: 8.5280, lng: 76.9580, pin: '695003', area: 'Kowdiar' },
    { title: 'Vazhuthacaud Junction, Trivandrum', lat: 8.4990, lng: 76.9520, pin: '695014', area: 'Vazhuthacaud' },
    { title: 'Lulu Mall Anayara, Trivandrum', lat: 8.5120, lng: 76.9150, pin: '695029', area: 'Anayara' },
  ];

  const filteredSuggestions = sampleSuggestions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Recalculate distance and serviceability based on coordinates
  const calculateDistance = (lat: number, lng: number) => {
    // Distance from Trivandrum Store Hub (8.5241, 76.9366)
    const storeLat = 8.5241;
    const storeLng = 76.9366;
    const R = 6371; // Earth radius in km
    const dLat = ((lat - storeLat) * Math.PI) / 180;
    const dLng = ((lng - storeLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((storeLat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = Math.round(R * c * 10) / 10 || 2.5;

    setDistanceKm(dist);

    if (dist <= 25) {
      setIsServiceable(true);
      setDeliveryEstDays(dist <= 8 ? 'Same-Day Express (By 5 PM)' : 'Guaranteed Tomorrow');
    } else if (dist <= 60) {
      setIsServiceable(true);
      setDeliveryEstDays('2 Business Days');
    } else {
      setIsServiceable(false);
      setDeliveryEstDays('Outside Delivery Radius');
    }
  };

  const handleSelectSuggestion = (s: typeof sampleSuggestions[0]) => {
    setSelectedPin({
      lat: s.lat,
      lng: s.lng,
      addressFormatted: s.title,
    });
    setAddressForm((prev) => ({
      ...prev,
      area: s.area,
      pinCode: s.pin,
      street: prev.street || s.area + ' Main Road',
    }));
    calculateDistance(s.lat, s.lng);
    setSearchQuery('');
    setIsSearching(false);
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setSelectedPin({
            lat,
            lng,
            addressFormatted: `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          });
          calculateDistance(lat, lng);
        },
        () => {
          // Fallback if permission denied
          handleSelectSuggestion(sampleSuggestions[0]);
        }
      );
    } else {
      handleSelectSuggestion(sampleSuggestions[0]);
    }
  };

  const handlePinOffset = (dLat: number, dLng: number) => {
    const newLat = selectedPin.lat + dLat;
    const newLng = selectedPin.lng + dLng;
    setSelectedPin({
      lat: newLat,
      lng: newLng,
      addressFormatted: `Adjusted Pin Location (${newLat.toFixed(4)}, ${newLng.toFixed(4)})`,
    });
    calculateDistance(newLat, newLng);
  };

  useEffect(() => {
    onAddressSelect(addressForm, selectedPin);
  }, [addressForm, selectedPin]);

  return (
    <div className="bg-white border border-[#E8E8E3] rounded-3xl p-5 sm:p-7 space-y-6 text-left shadow-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E3] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-[#EFF4E6] text-[#71883F] flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </span>
            <h3 className="font-extrabold text-base text-[#171717]">Google Maps Address Selection</h3>
          </div>
          <p className="text-xs text-[#6B6B6B]">
            Search location or position the map pin to verify delivery serviceability and dispatch route
          </p>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="px-3 py-1.5 bg-[#EFF4E6] hover:bg-[#71883F] text-[#71883F] hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Use Current Location</span>
        </button>
      </div>

      {/* Google Places Search Box */}
      <div className="relative">
        <label className="text-xs font-bold text-[#171717] block mb-1">
          Search Area, Landmark, or Pincode (Google Places API)
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearching(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearching(true);
            }}
            placeholder="Search e.g. MG Road, Kazhakkoottam, Kowdiar..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#F7F8F3] border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
          />
          <Search className="w-4 h-4 text-[#71883F] absolute left-3.5 top-3" />
        </div>

        {/* Suggestions Dropdown */}
        {isSearching && searchQuery.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E8E3] rounded-2xl shadow-xl z-30 py-2 divide-y divide-[#E8E8E3]">
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((s) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#F7F8F3] flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#71883F] shrink-0" />
                    <span className="font-semibold text-[#171717]">{s.title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#6B6B6B] bg-[#EFF4E6] px-2 py-0.5 rounded font-bold">
                    PIN {s.pin}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-[#6B6B6B]">
                No matching places found. Try searching a major landmark in Kerala / Trivandrum.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Simulated Google Map View */}
      <div className="relative h-60 sm:h-64 rounded-2xl overflow-hidden border border-[#E8E8E3] bg-[#E5E9E0] shadow-inner flex items-center justify-center select-none">
        
        {/* Map Background Grid Visual */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#C8D2C0_1px,transparent_1px),linear-gradient(to_bottom,#C8D2C0_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
        
        {/* Simulated Road Vectors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
          <path d="M 0 100 Q 150 180 400 120 T 800 200" fill="none" stroke="#FFFFFF" strokeWidth="12" />
          <path d="M 120 0 Q 200 140 250 300" fill="none" stroke="#FFFFFF" strokeWidth="10" />
          <path d="M 0 100 Q 150 180 400 120 T 800 200" fill="none" stroke="#A4B598" strokeWidth="6" />
          <path d="M 120 0 Q 200 140 250 300" fill="none" stroke="#A4B598" strokeWidth="5" />
        </svg>

        {/* Store Hub Marker */}
        <div className="absolute top-10 left-12 bg-white/90 border border-[#71883F] px-2 py-1 rounded-lg text-[10px] font-bold text-[#71883F] flex items-center gap-1 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#71883F]" />
          <span>Fathima Hub</span>
        </div>

        {/* Selected Pin Marker in Center */}
        <div className="relative z-10 flex flex-col items-center animate-bounce">
          <div className="px-3 py-1 bg-[#171717] text-white rounded-full text-[10px] font-mono font-bold shadow-md flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 text-[#71883F]" />
            <span>Delivery Pin ({selectedPin.lat.toFixed(3)}, {selectedPin.lng.toFixed(3)})</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#71883F] text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-[#71883F]/20">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="w-4 h-1.5 bg-black/30 rounded-full blur-xs mt-1" />
        </div>

        {/* Map Adjust Pin Controls */}
        <div className="absolute bottom-3 right-3 z-20 bg-white/90 backdrop-blur-xs border border-[#E8E8E3] rounded-xl p-1.5 flex items-center gap-1 shadow-md">
          <button
            type="button"
            onClick={() => handlePinOffset(0.002, 0)}
            className="w-7 h-7 bg-white hover:bg-[#F7F8F3] text-[#171717] font-bold rounded-lg text-xs flex items-center justify-center cursor-pointer"
            title="Nudge North"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => handlePinOffset(-0.002, 0)}
            className="w-7 h-7 bg-white hover:bg-[#F7F8F3] text-[#171717] font-bold rounded-lg text-xs flex items-center justify-center cursor-pointer"
            title="Nudge South"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => handlePinOffset(0, -0.002)}
            className="w-7 h-7 bg-white hover:bg-[#F7F8F3] text-[#171717] font-bold rounded-lg text-xs flex items-center justify-center cursor-pointer"
            title="Nudge West"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => handlePinOffset(0, 0.002)}
            className="w-7 h-7 bg-white hover:bg-[#F7F8F3] text-[#171717] font-bold rounded-lg text-xs flex items-center justify-center cursor-pointer"
            title="Nudge East"
          >
            →
          </button>
        </div>

        {/* Delivery Coverage Badge Overlay */}
        <div className="absolute top-3 right-3 z-20">
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 ${
              isServiceable
                ? 'bg-emerald-600 text-white'
                : 'bg-rose-600 text-white'
            }`}
          >
            {isServiceable ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{isServiceable ? `Serviceable (${distanceKm} km)` : 'Unserviceable Zone'}</span>
          </div>
        </div>
      </div>

      {/* Delivery Speed & Distance Information Banner */}
      <div className="bg-[#EFF4E6] border border-[#71883F]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#71883F] text-white flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <p className="font-extrabold text-[#171717] text-sm">Estimated Delivery: {deliveryEstDays}</p>
            <p className="text-[#6B6B6B]">
              Distance from Trivandrum Hub: <span className="font-bold text-[#171717]">{distanceKm} km</span> • Map Pin Verified
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold uppercase text-[#71883F] bg-white px-2.5 py-1 rounded-lg border border-[#71883F]/20">
            Verified Address
          </span>
        </div>
      </div>

      {/* Normalized Address Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="text-xs font-bold text-[#171717] block mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={addressForm.fullName}
            onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
            placeholder="e.g. Anjali Nair"
            className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#171717] block mb-1">Phone Number (For Delivery OTP) *</label>
          <input
            type="tel"
            required
            value={addressForm.phone}
            onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
            placeholder="+91 98450 12345"
            className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] font-mono outline-none focus:border-[#71883F]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#171717] block mb-1">House / Flat / Building No. *</label>
          <input
            type="text"
            required
            value={addressForm.house}
            onChange={(e) => setAddressForm({ ...addressForm, house: e.target.value })}
            placeholder="e.g. TC 14/820, Olive Villa"
            className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#171717] block mb-1">Street / Road Name *</label>
          <input
            type="text"
            required
            value={addressForm.street}
            onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
            placeholder="e.g. MG Road, Near Ayurveda College"
            className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#171717] block mb-1">City / District *</label>
          <input
            type="text"
            required
            value={addressForm.city}
            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
            placeholder="Trivandrum"
            className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] outline-none focus:border-[#71883F]"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-[#171717] block mb-1">Postal Pincode *</label>
          <input
            type="text"
            required
            value={addressForm.pinCode}
            onChange={(e) => setAddressForm({ ...addressForm, pinCode: e.target.value })}
            placeholder="695001"
            className="w-full px-3 py-2 bg-white border border-[#E8E8E3] rounded-xl text-xs text-[#171717] font-mono outline-none focus:border-[#71883F]"
          />
        </div>
      </div>

    </div>
  );
};
