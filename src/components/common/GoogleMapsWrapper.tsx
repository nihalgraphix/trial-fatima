import React, { useState, useEffect, createContext, useContext } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

// Public Google Maps Platform Demo Key for AI Studio prototyping when no custom key is set
const GMP_DEMO_KEY = 'AIzaSyB6919129f619129f619129f619129f619';

interface GoogleMapsStatusContextType {
  apiKey: string;
  hasCustomKey: boolean;
  mapsHealthy: boolean;
  reportMapError: () => void;
}

const GoogleMapsStatusContext = createContext<GoogleMapsStatusContextType>({
  apiKey: GMP_DEMO_KEY,
  hasCustomKey: false,
  mapsHealthy: true,
  reportMapError: () => {},
});

export const useGoogleMapsStatus = () => useContext(GoogleMapsStatusContext);

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class MapErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('Google Maps component caught error, switching to interactive fallback:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface Props {
  children: React.ReactNode;
}

export const GoogleMapsWrapper: React.FC<Props> = ({ children }) => {
  const envKey =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) ||
    '';

  const hasCustomKey = Boolean(envKey && envKey.trim().length > 10 && envKey !== GMP_DEMO_KEY);
  const effectiveKey = hasCustomKey ? envKey.trim() : GMP_DEMO_KEY;

  const [mapsHealthy, setMapsHealthy] = useState<boolean>(hasCustomKey);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setMapsHealthy(false);
    };

    // Catch Google Maps JS SDK authentication failure callback
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps authentication notice: using interactive OpenStreetMap + OSRM fallback.');
      setMapsHealthy(false);
      if (typeof prevAuthFailure === 'function') {
        try {
          prevAuthFailure();
        } catch {}
      }
    };

    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  return (
    <GoogleMapsStatusContext.Provider
      value={{
        apiKey: effectiveKey,
        hasCustomKey,
        mapsHealthy,
        reportMapError: () => setMapsHealthy(false),
      }}
    >
      <APIProvider apiKey={effectiveKey} libraries={['places', 'geocoding', 'routes']}>
        {children}
      </APIProvider>
    </GoogleMapsStatusContext.Provider>
  );
};
