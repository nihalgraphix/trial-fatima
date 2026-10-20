import React, { useState, useEffect, createContext, useContext } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

interface GoogleMapsStatusContextType {
  apiKey: string;
  hasCustomKey: boolean;
  mapsHealthy: boolean;
  quotaExceeded: boolean;
  reportMapError: () => void;
}

const GoogleMapsStatusContext = createContext<GoogleMapsStatusContextType>({
  apiKey: '',
  hasCustomKey: true,
  mapsHealthy: true,
  quotaExceeded: false,
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
    console.warn('Google Maps component error boundary notice:', error);
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
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY) ||
    '';

  const effectiveKey = envKey.trim();
  const [mapsHealthy, setMapsHealthy] = useState<boolean>(true);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };

    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      setQuotaExceeded(true);
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
        hasCustomKey: Boolean(effectiveKey),
        mapsHealthy,
        quotaExceeded,
        reportMapError: () => setMapsHealthy(false),
      }}
    >
      <APIProvider
        apiKey={effectiveKey}
        libraries={['places', 'routes', 'marker']}
      >
        {quotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}
        {children}
      </APIProvider>
    </GoogleMapsStatusContext.Provider>
  );
};
