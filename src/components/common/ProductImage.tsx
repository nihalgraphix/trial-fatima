import React from 'react';

interface ProductImageProps {
  imageKey?: string;
  name: string;
  category?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero' | 'banner';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  imageKey = '',
  name,
  category = '',
  className = '',
  size = 'md',
}) => {
  // If imageKey is an external or uploaded URL (starts with http, https, or data:)
  if (imageKey.startsWith('http') || imageKey.startsWith('data:') || imageKey.startsWith('/images/')) {
    return (
      <div className={`relative overflow-hidden flex items-center justify-center bg-[#F9F9F7] ${className}`}>
        <img
          src={imageKey}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // fallback gracefully
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Render stylized, high-fidelity SVG stationery art matching the reference look
  const renderItemGraphic = () => {
    switch (imageKey) {
      case 'fathima-backpack':
      case 'slate-backpack':
      case 'bags':
        const isOlive = imageKey === 'fathima-backpack' || imageKey === 'bags';
        const bagColor = isOlive ? '#71883F' : '#4B5563';
        const bagPocketColor = isOlive ? '#5D7332' : '#374151';
        return (
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[85%] drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
            {/* Top Loop */}
            <path d="M85 35 C85 15, 115 15, 115 35" fill="none" stroke="#2B2D26" strokeWidth="6" strokeLinecap="round" />
            {/* Main Backpack Body */}
            <path
              d="M50 80 C50 45, 150 45, 150 80 L155 200 C155 215, 145 220, 100 220 C55 220, 45 215, 45 200 Z"
              fill={bagColor}
            />
            {/* Main Zipper Arc */}
            <path d="M58 82 C58 55, 142 55, 142 82" fill="none" stroke="#2B2D26" strokeWidth="2.5" strokeDasharray="3,2" />
            {/* Front Utility Pocket */}
            <rect x="62" y="125" width="76" height="75" rx="14" fill={bagPocketColor} />
            <path d="M68 135 L132 135" stroke="#2B2D26" strokeWidth="2" strokeDasharray="3,2" />
            {/* Brand Patch */}
            <rect x="85" y="155" width="30" height="14" rx="3" fill="#F7F8F3" />
            <text x="100" y="165" fontSize="6" fontWeight="bold" fill="#2B2D26" textAnchor="middle" letterSpacing="0.5">FATHIMA</text>
            {/* Zipper Pull Tag */}
            <rect x="96" y="137" width="8" height="16" rx="2" fill="#D4AF37" />
          </svg>
        );

      case 'classmate-spiral':
      case 'brustro-sketchbook':
      case 'notebooks':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[85%] drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
            {/* Shadow & notebook base */}
            <rect x="48" y="32" width="124" height="175" rx="8" fill="#E8ECE9" />
            <rect x="42" y="28" width="124" height="175" rx="8" fill="#FBFBF9" stroke="#E2E4DE" strokeWidth="2" />
            {/* Cover Accent Stripe */}
            <rect x="42" y="28" width="24" height="175" rx="4" fill="#71883F" fillOpacity="0.15" />
            {/* Lined Grid Pattern Simulation */}
            <line x1="75" y1="65" x2="150" y2="65" stroke="#71883F" strokeWidth="3" strokeLinecap="round" />
            <line x1="75" y1="85" x2="145" y2="85" stroke="#E2E5DC" strokeWidth="2" strokeLinecap="round" />
            <line x1="75" y1="105" x2="140" y2="105" stroke="#E2E5DC" strokeWidth="2" strokeLinecap="round" />
            <line x1="75" y1="125" x2="148" y2="125" stroke="#E2E5DC" strokeWidth="2" strokeLinecap="round" />
            <line x1="75" y1="145" x2="130" y2="145" stroke="#E2E5DC" strokeWidth="2" strokeLinecap="round" />
            <line x1="75" y1="165" x2="142" y2="165" stroke="#E2E5DC" strokeWidth="2" strokeLinecap="round" />
            {/* Spiral Rings */}
            {[45, 60, 75, 90, 105, 120, 135, 150, 165, 180].map((y) => (
              <g key={y}>
                <ellipse cx="42" cy={y} rx="6" ry="3.5" fill="#374151" />
                <ellipse cx="42" cy={y - 1} rx="4" ry="2" fill="#D1D5DB" />
              </g>
            ))}
            {/* Badge label */}
            <rect x="75" y="48" width="46" height="10" rx="3" fill="#71883F" />
            <text x="98" y="55.5" fontSize="6" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">CLASSMATE</text>
          </svg>
        );

      case 'bullet-journal':
      case 'classmate-longbook':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[85%] drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
            <rect x="45" y="25" width="118" height="185" rx="10" fill="#586E30" />
            {/* Spine Fold */}
            <rect x="45" y="25" width="18" height="185" rx="3" fill="#4B5E27" />
            {/* Gold foil embossed badge */}
            <rect x="75" y="90" width="60" height="35" rx="4" fill="#4B5E27" stroke="#D4AF37" strokeWidth="1.5" />
            <text x="105" y="106" fontSize="7" fontWeight="bold" fill="#E6CA65" textAnchor="middle" letterSpacing="1">JOURNAL</text>
            <text x="105" y="117" fontSize="5" fill="#E6CA65" textAnchor="middle">120 GSM DOTS</text>
            {/* Elastic Ribbon */}
            <rect x="145" y="25" width="8" height="185" fill="#3D4D20" />
          </svg>
        );

      case 'cello-butterflow':
      case 'pilot-v7':
      case 'parker-vector':
      case 'hauser-xo':
      case 'writing':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[85%] drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
            {/* Diagonal Writing Pen */}
            <g transform="rotate(35 100 120)">
              {/* Nib / Tip */}
              <polygon points="100,20 96,35 104,35" fill="#D1D5DB" />
              <line x1="100" y1="20" x2="100" y2="30" stroke="#1F2937" strokeWidth="1" />
              {/* Grip Section */}
              <rect x="94" y="35" width="12" height="35" rx="2" fill="#71883F" />
              {/* Barrel */}
              <rect x="94" y="70" width="12" height="100" rx="1" fill="#1F2937" />
              {/* Metallic Ring */}
              <rect x="94" y="68" width="12" height="3" fill="#F3F4F6" />
              {/* Pen Clip */}
              <rect x="89" y="80" width="5" height="45" rx="2" fill="#D4AF37" />
              <circle cx="91.5" cy="125" r="2.5" fill="#D4AF37" />
              {/* End Cap */}
              <rect x="95" y="170" width="10" height="10" rx="3" fill="#374151" />
            </g>
          </svg>
        );

      case 'camlin-geometry':
      case 'school-supplies':
      case 'exam-pad':
      case 'doms-duo':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[85%] drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
            {/* Tin Geometry Box */}
            <rect x="35" y="55" width="130" height="130" rx="16" fill="#F4F6F0" stroke="#71883F" strokeWidth="2.5" />
            <rect x="42" y="62" width="116" height="116" rx="12" fill="#FFFFFF" />
            {/* Compass Instrument Graphic */}
            <path d="M100 75 L82 145" stroke="#4B5563" strokeWidth="4" strokeLinecap="round" />
            <path d="M100 75 L118 145" stroke="#4B5563" strokeWidth="4" strokeLinecap="round" />
            <circle cx="100" cy="75" r="7" fill="#71883F" />
            {/* Protractor Arc */}
            <path d="M68 150 A32 32 0 0 1 132 150 Z" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="2,3" />
            <text x="100" y="165" fontSize="7" fontWeight="bold" fill="#71883F" textAnchor="middle" letterSpacing="0.5">CAMLIN SCHOLAR</text>
          </svg>
        );

      case 'faber-castell-pencils':
      case 'faber-connector':
      case 'camlin-water-colour':
      case 'art-craft':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[85%] drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
            {/* Color Pencil Fan Arrangement */}
            {[-24, -12, 0, 12, 24].map((deg, idx) => {
              const colors = ['#EF4444', '#F59E0B', '#71883F', '#3B82F6', '#8B5CF6'];
              return (
                <g key={deg} transform={`rotate(${deg} 100 190)`}>
                  {/* Wood tip */}
                  <polygon points="100,50 96,65 104,65" fill="#FDE68A" />
                  {/* Lead tip */}
                  <polygon points="100,50 98,58 102,58" fill={colors[idx]} />
                  {/* Hexagon pencil body */}
                  <rect x="96" y="65" width="8" height="95" rx="1" fill={colors[idx]} />
                  <line x1="100" y1="65" x2="100" y2="160" stroke="#000000" strokeOpacity="0.15" strokeWidth="1" />
                </g>
              );
            })}
            {/* Brand Base Ribbon */}
            <rect x="55" y="170" width="90" height="24" rx="6" fill="#1C3829" />
            <text x="100" y="185" fontSize="7.5" fontWeight="bold" fill="#FDE68A" textAnchor="middle" letterSpacing="0.8">FABER-CASTELL</text>
          </svg>
        );

      case 'casio-calculator':
      case 'casio-desktop-calc':
      case 'calculators':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[85%] drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
            {/* Calculator Body */}
            <rect x="52" y="32" width="96" height="175" rx="12" fill="#26282B" stroke="#374151" strokeWidth="2" />
            {/* Solar Panel & Logo */}
            <text x="65" y="48" fontSize="6.5" fontWeight="bold" fill="#9CA3AF">CASIO</text>
            <rect x="110" y="42" width="28" height="8" rx="2" fill="#4B3A26" />
            {/* LCD Display Screen */}
            <rect x="62" y="56" width="76" height="32" rx="4" fill="#C2D1BA" stroke="#1F2937" strokeWidth="1.5" />
            <text x="132" y="77" fontSize="12" fontFamily="monospace" fontWeight="bold" fill="#1F2937" textAnchor="end">1,248.50</text>
            <text x="66" y="66" fontSize="5" fontFamily="monospace" fill="#4B5563">DEG STAT</text>
            {/* Keypad Grid */}
            <g fill="#4B5563">
              {[96, 114, 132, 150, 168, 186].map((rowY) => (
                <React.Fragment key={rowY}>
                  <rect x="62" y={rowY} width="15" height="12" rx="2" />
                  <rect x="82" y={rowY} width="15" height="12" rx="2" />
                  <rect x="102" y={rowY} width="15" height="12" rx="2" />
                  <rect x="122" y={rowY} width="15" height="12" rx="2" fill={rowY >= 168 ? '#71883F' : '#374151'} />
                </React.Fragment>
              ))}
            </g>
          </svg>
        );

      case 'sticky-notes':
      case 'office-supplies':
      case 'kangaro-stapler':
      case 'hole-punch':
      case 'scissors':
      case 'scotch-tape':
      case 'paper-clips':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[85%] drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
            {/* Pastel Sticky Cube Stack */}
            <g transform="rotate(-6 100 120)">
              <rect x="52" y="65" width="96" height="96" rx="6" fill="#D9E7CB" />
            </g>
            <g transform="rotate(3 100 120)">
              <rect x="52" y="62" width="96" height="96" rx="6" fill="#FCE7C5" />
            </g>
            <g>
              <rect x="52" y="58" width="96" height="96" rx="6" fill="#F7F8F3" stroke="#E2E5DC" strokeWidth="2" />
              {/* Folded corner */}
              <polygon points="148,58 148,76 130,58" fill="#E2E5DC" />
              <line x1="68" y1="85" x2="132" y2="85" stroke="#71883F" strokeWidth="3" strokeLinecap="round" />
              <line x1="68" y1="105" x2="125" y2="105" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
              <line x1="68" y1="125" x2="115" y2="125" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
              <circle cx="125" cy="135" r="8" fill="#71883F" />
              <text x="125" y="138" fontSize="9" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">✓</text>
            </g>
          </svg>
        );

      case 'solo-binder':
      case 'solo-display-book':
      case 'document-wallet':
      case 'files-folders':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[85%] drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
            {/* Executive Ring Binder File */}
            <rect x="42" y="35" width="120" height="170" rx="8" fill="#1E293B" />
            <rect x="42" y="35" width="22" height="170" rx="4" fill="#0F172A" />
            {/* Spine Label Slot */}
            <rect x="46" y="65" width="14" height="65" rx="2" fill="#F8FAFC" />
            <text x="53" y="100" fontSize="5.5" fontWeight="bold" fill="#0F172A" transform="rotate(-90 53 100)" textAnchor="middle">SOLO 2-D RING</text>
            {/* Silver Edge Clip & Ring Hole */}
            <circle cx="53" cy="155" r="4" fill="#94A3B8" stroke="#334155" strokeWidth="1.5" />
            <rect x="145" y="112" width="10" height="16" rx="2" fill="#94A3B8" />
          </svg>
        );

      case 'mesh-organizer':
      case 'wooden-stand':
      case 'desk-accessories':
        return (
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[85%] drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
            {/* Desktop Organizer with Stand */}
            <rect x="40" y="110" width="120" height="85" rx="8" fill="#2B303A" />
            <rect x="46" y="116" width="108" height="40" rx="4" fill="#3D4553" stroke="#525C6E" strokeWidth="1.5" strokeDasharray="3,2" />
            <rect x="46" y="162" width="108" height="26" rx="4" fill="#1F232B" />
            <circle cx="100" cy="175" r="4" fill="#71883F" />
            {/* Pens sticking up out of back slot */}
            <rect x="62" y="55" width="6" height="60" rx="2" fill="#71883F" />
            <rect x="74" y="48" width="6" height="68" rx="2" fill="#F59E0B" />
            <rect x="86" y="60" width="6" height="55" rx="2" fill="#3B82F6" />
            {/* Ruler sticking out */}
            <polygon points="115,40 128,40 128,110 115,110" fill="#E2E8F0" />
            <line x1="120" y1="50" x2="128" y2="50" stroke="#64748B" strokeWidth="1.5" />
            <line x1="122" y1="60" x2="128" y2="60" stroke="#64748B" strokeWidth="1.5" />
            <line x1="120" y1="70" x2="128" y2="70" stroke="#64748B" strokeWidth="1.5" />
          </svg>
        );

      default:
        // Default clean stationery art
        return (
          <svg viewBox="0 0 200 240" className="w-full h-full max-h-[85%] drop-shadow-sm transition-transform duration-300 group-hover:scale-105">
            <rect x="45" y="45" width="110" height="150" rx="10" fill="#F7F8F3" stroke="#71883F" strokeWidth="2" />
            <circle cx="100" cy="100" r="32" fill="#EFF4E6" />
            <text x="100" y="106" fontSize="18" fontWeight="bold" fill="#71883F" textAnchor="middle">FS</text>
            <rect x="65" y="145" width="70" height="6" rx="3" fill="#D1D5DB" />
            <rect x="75" y="158" width="50" height="5" rx="2.5" fill="#E5E7EB" />
          </svg>
        );
    }
  };

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-[#F9F9F7] select-none ${className}`}>
      {renderItemGraphic()}
    </div>
  );
};
