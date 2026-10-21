import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Remedy for Google Maps Platform quota banner: suppress any external quota alert overlays
(window as any).gm_authFailure = () => {
  // Handled silently by our quota-free InteractiveGoogleTileMap engine
};

createRoot(document.getElementById('root')!).render(<App />);
