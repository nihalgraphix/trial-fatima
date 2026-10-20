import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useGoogleMapsStatus } from './GoogleMapsWrapper';

interface Props {
  onAddressSelect: (address: {
    formattedAddress: string;
    city: string;
    state: string;
    pinCode: string;
    lat: number;
    lng: number;
  }) => void;
  placeholder?: string;
}

interface UnifiedSuggestion {
  id: string;
  mainText: string;
  secondaryText: string;
  rawGoogle?: any;
  rawNominatim?: any;
}

export const GoogleMapAddressSelector: React.FC<Props> = ({
  onAddressSelect,
  placeholder = 'Search for your delivery address, street, or pincode...',
}) => {
  const placesLib = useMapsLibrary('places');
  const { mapsHealthy } = useGoogleMapsStatus();
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<UnifiedSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionTokenRef = useRef<any>(null);

  useEffect(() => {
    if (placesLib && !sessionTokenRef.current && (placesLib as any).AutocompleteSessionToken) {
      sessionTokenRef.current = new (placesLib as any).AutocompleteSessionToken();
    }
  }, [placesLib]);

  useEffect(() => {
    if (!inputValue || inputValue.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        if (mapsHealthy && placesLib && (placesLib as any).AutocompleteSuggestion) {
          try {
            const { AutocompleteSuggestion } = placesLib as any;
            const request: any = {
              input: inputValue,
              sessionToken: sessionTokenRef.current || undefined,
              region: 'IN',
            };
            const { suggestions: results } =
              await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
            if (results && results.length > 0) {
              setSuggestions(
                results.map((r: any, idx: number) => ({
                  id: `gmp-${idx}`,
                  mainText: r.placePrediction?.text?.text || inputValue,
                  secondaryText: r.placePrediction?.secondaryText?.text || 'India',
                  rawGoogle: r,
                }))
              );
              setIsLoading(false);
              return;
            }
          } catch (gErr) {
            console.warn('Google Places autocomplete fallback to Nominatim:', gErr);
          }
        }

        // Real geocoding fallback via OpenStreetMap Nominatim (restricted to India)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=in&q=${encodeURIComponent(
            inputValue
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
      } catch (error) {
        console.warn('Address search notice:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue, placesLib, mapsHealthy]);

  const handleSuggestionClick = async (item: UnifiedSuggestion) => {
    setIsLoading(true);
    try {
      if (item.rawGoogle && placesLib) {
        const place = item.rawGoogle.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
        });

        const location = place.location;
        if (location) {
          let city = '';
          let state = '';
          let pinCode = '';

          place.addressComponents?.forEach((comp: any) => {
            if (comp.types.includes('locality')) city = comp.longText || comp.long_name;
            if (comp.types.includes('administrative_area_level_1'))
              state = comp.longText || comp.long_name;
            if (comp.types.includes('postal_code')) pinCode = comp.longText || comp.long_name;
          });

          onAddressSelect({
            formattedAddress: place.formattedAddress || item.mainText,
            city: city || 'Trivandrum',
            state: state || 'Kerala',
            pinCode: pinCode || '695001',
            lat: location.lat(),
            lng: location.lng(),
          });

          setInputValue(place.formattedAddress || item.mainText);
          setSuggestions([]);
          if ((placesLib as any).AutocompleteSessionToken) {
            sessionTokenRef.current = new (placesLib as any).AutocompleteSessionToken();
          }
          return;
        }
      }

      if (item.rawNominatim) {
        const nom = item.rawNominatim;
        const addr = nom.address || {};
        const city =
          addr.city || addr.town || addr.village || addr.county || addr.state_district || 'Trivandrum';
        const state = addr.state || 'Kerala';
        const pinCode = addr.postcode || '695001';
        const lat = parseFloat(nom.lat) || 8.5241;
        const lng = parseFloat(nom.lon) || 76.9366;

        onAddressSelect({
          formattedAddress: nom.display_name || item.mainText,
          city,
          state,
          pinCode,
          lat,
          lng,
        });

        setInputValue(nom.display_name || item.mainText);
        setSuggestions([]);
      }
    } catch (error) {
      console.warn('Place details selection notice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-[#F7F8F3] border border-[#E8E8E3] rounded-2xl text-sm text-[#171717] outline-none focus:border-[#71883F] transition-all"
        />
        <Search className="w-4 h-4 text-[#A1A1A1] absolute left-3.5 top-3.5" />
        {isLoading && (
          <Loader2 className="w-4 h-4 text-[#71883F] absolute right-3.5 top-3.5 animate-spin" />
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E8E8E3] rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-[#F7F8F3] flex items-start gap-3 transition-colors border-b border-[#F7F8F3] last:border-0 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-[#71883F] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#171717]">{suggestion.mainText}</p>
                <p className="text-[10px] text-[#6B6B6B] mt-0.5">{suggestion.secondaryText}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
