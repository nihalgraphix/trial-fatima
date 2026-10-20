import React, { PropsWithChildren, useEffect, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

export const GoogleMapsWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);

    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  if (!apiKey) {
    console.warn('VITE_GOOGLE_MAPS_API_KEY is not defined. Google Maps features will be disabled.');
    return <>{children}</>;
  }

  return (
    <APIProvider
      apiKey={apiKey}
      region="IN"
      language="en"
      onLoad={() => console.log('Google Maps API loaded')}
      onError={(err) => console.error('Google Maps API load error:', err)}
    >
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-[100] shadow-sm">
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
  );
};
