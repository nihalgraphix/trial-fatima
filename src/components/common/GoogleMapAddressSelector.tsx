import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useMapsLibrary, useMap } from '@vis.gl/react-google-maps';
import { Search, MapPin, Loader2 } from 'lucide-react';

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

export const GoogleMapAddressSelector: React.FC<Props> = ({ onAddressSelect, placeholder = "Search for your delivery address..." }) => {
  const placesLib = useMapsLibrary('places');
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Initialize session token
  useEffect(() => {
    if (placesLib && !sessionTokenRef.current) {
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    }
  }, [placesLib]);

  // Fetch suggestions
  useEffect(() => {
    if (!placesLib || !inputValue || inputValue.length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const { AutocompleteSuggestion } = placesLib;
        const request: google.maps.places.AutocompleteRequest = {
          input: inputValue,
          sessionToken: sessionTokenRef.current!,
          // Restrict to India as per previous context (Trivandrum/Kerala mentioned)
          region: 'IN'
        };

        const { suggestions: results } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        setSuggestions(results || []);
      } catch (error) {
        console.error("Autocomplete error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue, placesLib]);

  const handleSuggestionClick = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!placesLib || !suggestion.placePrediction) return;

    setIsLoading(true);
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'addressComponents']
      });

      const location = place.location;
      if (!location) throw new Error("No location found for this place");

      // Extract components
      let city = '';
      let state = '';
      let pinCode = '';

      place.addressComponents?.forEach(comp => {
        if (comp.types.includes('locality')) city = comp.longText;
        if (comp.types.includes('administrative_area_level_1')) state = comp.longText;
        if (comp.types.includes('postal_code')) pinCode = comp.longText;
      });

      onAddressSelect({
        formattedAddress: place.formattedAddress || '',
        city,
        state,
        pinCode,
        lat: location.lat(),
        lng: location.lng()
      });

      setInputValue(place.formattedAddress || '');
      setSuggestions([]);
      
      // Reset session token after successful selection
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    } catch (error) {
      console.error("Place details error:", error);
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
        {isLoading && <Loader2 className="w-4 h-4 text-[#71883F] absolute right-3.5 top-3.5 animate-spin" />}
      </div>

      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#E8E8E3] rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-[#F7F8F3] flex items-start gap-3 transition-colors border-b border-[#F7F8F3] last:border-0"
            >
              <MapPin className="w-4 h-4 text-[#71883F] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#171717]">{suggestion.placePrediction?.text.text}</p>
                <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                  {suggestion.placePrediction?.structuredFormat.secondaryText?.text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
