import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, Check, Sparkles, AlertCircle, FileImage, Layers } from 'lucide-react';
import { compressImageTo200KB, formatFileSize, CompressionResult } from '../../utils/imageCompressor';
import { useStore } from '../../context/StoreContext';

interface LogoUploaderProps {
  logoUrl?: string;
  logoType?: 'text' | 'image' | 'both';
  logoHeight?: number;
  onUpdateSettings?: (settings: { logoUrl?: string; logoType?: 'text' | 'image' | 'both'; logoHeight?: number }) => void;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  logoUrl = '',
  logoType = 'text',
  logoHeight = 36,
  onUpdateSettings,
}) => {
  const { storeSettings, updateStoreSettings, showToast } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStats, setUploadStats] = useState<CompressionResult | null>(null);
  const [localUrl, setLocalUrl] = useState<string>(logoUrl || storeSettings?.logoUrl || '');
  const [localType, setLocalType] = useState<'text' | 'image' | 'both'>(
    logoType || storeSettings?.logoType || 'text'
  );
  const [localHeight, setLocalHeight] = useState<number>(
    logoHeight || storeSettings?.logoHeight || 36
  );

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP, SVG)', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      // Compress image for optimal performance and persistent storage
      const result = await compressImageTo200KB(file);
      setUploadStats(result);
      setLocalUrl(result.dataUrl);
      
      const newType = localType === 'text' ? 'image' : localType;
      setLocalType(newType);

      // Save directly to global store configuration & storage
      updateStoreSettings({
        logoUrl: result.dataUrl,
        logoType: newType,
        logoHeight: localHeight,
      });

      if (onUpdateSettings) {
        onUpdateSettings({
          logoUrl: result.dataUrl,
          logoType: newType,
          logoHeight: localHeight,
        });
      }

      showToast(`Store logo uploaded & compressed (${formatFileSize(result.compressedSize)})! Applied globally.`, 'success');
    } catch (err) {
      console.error('Error processing logo upload:', err);
      showToast('Failed to process image file. Please try another image.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = () => {
    setLocalUrl('');
    setLocalType('text');
    setUploadStats(null);

    updateStoreSettings({
      logoUrl: '',
      logoType: 'text',
    });

    if (onUpdateSettings) {
      onUpdateSettings({
        logoUrl: '',
        logoType: 'text',
      });
    }

    showToast('Logo removed. Store returned to text wordmark.', 'info');
  };

  const handleTypeChange = (type: 'text' | 'image' | 'both') => {
    setLocalType(type);
    updateStoreSettings({ logoType: type });
    if (onUpdateSettings) onUpdateSettings({ logoType: type });
  };

  const handleHeightChange = (height: number) => {
    setLocalHeight(height);
    updateStoreSettings({ logoHeight: height });
    if (onUpdateSettings) onUpdateSettings({ logoHeight: height });
  };

  const applyPreset = (presetUrl: string, name: string) => {
    setLocalUrl(presetUrl);
    setLocalType('image');
    setUploadStats(null);

    updateStoreSettings({
      logoUrl: presetUrl,
      logoType: 'image',
      logoHeight: localHeight,
    });

    if (onUpdateSettings) {
      onUpdateSettings({
        logoUrl: presetUrl,
        logoType: 'image',
        logoHeight: localHeight,
      });
    }

    showToast(`Preset logo "${name}" applied live!`, 'success');
  };

  return (
    <div className="bg-white border border-[#E8E8E3] rounded-2xl p-6 space-y-6 shadow-2xs text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E3] pb-4">
        <div>
          <h4 className="font-bold text-sm text-[#171717] uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#71883F]" />
            Store Logo & Brand Identity Upload
          </h4>
          <p className="text-[11px] text-[#6B6B6B] mt-0.5">
            Upload your company logo. Images are automatically compressed & saved to persistent store configuration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {localUrl && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Logo
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              updateStoreSettings({
                logoUrl: localUrl,
                logoType: localType,
                logoHeight: localHeight,
              });
              showToast('Global store logo configuration saved & synced!', 'success');
            }}
            className="px-3.5 py-1.5 bg-[#71883F] hover:bg-[#5F7334] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Apply Global Sync
          </button>
        </div>
      </div>

      {/* Format Selector */}
      <div>
        <label className="font-bold text-[#171717] block mb-2 text-xs">Logo Display Mode</label>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => handleTypeChange('text')}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              localType === 'text'
                ? 'border-[#71883F] bg-[#EFF4E6] text-[#71883F] font-bold shadow-2xs'
                : 'border-[#E8E8E3] bg-white text-[#171717] hover:bg-[#FAF7F2]'
            }`}
          >
            <span className="block text-xs font-bold">Text Wordmark</span>
            <span className="text-[10px] text-[#6B6B6B] block mt-0.5">Styled store name text</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('image')}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              localType === 'image'
                ? 'border-[#71883F] bg-[#EFF4E6] text-[#71883F] font-bold shadow-2xs'
                : 'border-[#E8E8E3] bg-white text-[#171717] hover:bg-[#FAF7F2]'
            }`}
          >
            <span className="block text-xs font-bold">Image Logo Only</span>
            <span className="text-[10px] text-[#6B6B6B] block mt-0.5">Clean graphic symbol/badge</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('both')}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              localType === 'both'
                ? 'border-[#71883F] bg-[#EFF4E6] text-[#71883F] font-bold shadow-2xs'
                : 'border-[#E8E8E3] bg-white text-[#171717] hover:bg-[#FAF7F2]'
            }`}
          >
            <span className="block text-xs font-bold">Image + Text</span>
            <span className="text-[10px] text-[#6B6B6B] block mt-0.5">Icon alongside store name</span>
          </button>
        </div>
      </div>

      {/* Upload Zone & URL Option */}
      {(localType === 'image' || localType === 'both') && (
        <div className="space-y-4 pt-2 border-t border-[#E8E8E3]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Drag & Drop File Area */}
            <div>
              <label className="font-semibold text-[#171717] block mb-1">
                Drag & Drop Logo Image File
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/svg+xml"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="logo-file-uploader-element"
              />

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[130px] ${
                  isDragging
                    ? 'border-[#71883F] bg-[#EFF4E6]'
                    : isProcessing
                    ? 'border-amber-400 bg-amber-50/50'
                    : 'border-[#E8E8E3] hover:border-[#71883F] bg-[#FAF7F2] hover:bg-[#EFF4E6]/40'
                }`}
              >
                {isProcessing ? (
                  <div className="space-y-2 py-1">
                    <div className="w-6 h-6 border-2 border-[#71883F] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-[#71883F]">Compressing & Optimizing Logo...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-[#EFF4E6] text-[#71883F] flex items-center justify-center mb-2 shadow-2xs">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[#171717]">
                      Click or drag logo file here
                    </p>
                    <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                      Supports PNG, SVG, WEBP, JPG (Auto-compressed &lt; 200KB)
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Direct URL Input */}
            <div>
              <label className="font-semibold text-[#171717] block mb-1">
                Or Paste Direct Image Web URL
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={localUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setLocalUrl(url);
                    updateStoreSettings({ logoUrl: url });
                    if (onUpdateSettings) onUpdateSettings({ logoUrl: url });
                  }}
                  placeholder="https://example.com/logo.png or data:image/..."
                  className="w-full px-3 py-2.5 border border-[#E8E8E3] rounded-xl text-[#171717] outline-none focus:border-[#71883F] bg-white text-xs"
                />

                {/* Upload Stats Badge */}
                {uploadStats && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Image Compressed
                      </span>
                      <span className="font-mono">
                        {Math.round((1 - uploadStats.compressedSize / uploadStats.originalSize) * 100)}% Saved
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-emerald-700 font-mono">
                      <span>Original: {formatFileSize(uploadStats.originalSize)}</span>
                      <span>Optimized: {formatFileSize(uploadStats.compressedSize)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logo Height Slider */}
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E8E3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-[#171717] flex items-center gap-2 text-xs">
                  <span>Header Logo Height:</span>
                  <span className="bg-[#71883F] text-white px-2 py-0.5 rounded text-[11px] font-mono">
                    {localHeight}px
                  </span>
                </label>
                <span className="text-[10px] text-[#6B6B6B]">Min: 20px | Max: 64px</span>
              </div>
              <input
                type="range"
                min={20}
                max={64}
                step={2}
                value={localHeight}
                onChange={(e) => handleHeightChange(parseInt(e.target.value))}
                className="w-full accent-[#71883F] cursor-pointer"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="font-semibold text-[#171717] block mb-1.5 text-[11px] uppercase tracking-wider text-[#6B6B6B]">
              Quick Sample Logo Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80',
                    'Fountain Pen Emblem'
                  )
                }
                className="p-2 border border-[#E8E8E3] hover:border-[#71883F] rounded-lg bg-white flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <img
                  src="https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80"
                  alt="Preset 1"
                  className="w-7 h-7 rounded object-cover"
                />
                <span className="text-[11px] font-semibold text-[#171717]">Fountain Pen Emblem</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=300&q=80',
                    'Golden Crown Monogram'
                  )
                }
                className="p-2 border border-[#E8E8E3] hover:border-[#71883F] rounded-lg bg-white flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <img
                  src="https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=300&q=80"
                  alt="Preset 2"
                  className="w-7 h-7 rounded object-cover"
                />
                <span className="text-[11px] font-semibold text-[#171717]">Golden Crown Monogram</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=300&q=80',
                    'Stationers Parchment Seal'
                  )
                }
                className="p-2 border border-[#E8E8E3] hover:border-[#71883F] rounded-lg bg-white flex items-center gap-2 transition-colors cursor-pointer text-left"
              >
                <img
                  src="https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=300&q=80"
                  alt="Preset 3"
                  className="w-7 h-7 rounded object-cover"
                />
                <span className="text-[11px] font-semibold text-[#171717]">Stationers Parchment Seal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Realtime Live Header Preview */}
      <div className="pt-2 border-t border-[#E8E8E3]">
        <p className="font-semibold text-[11px] text-[#6B6B6B] uppercase tracking-wider mb-2">
          Realtime Global Header Logo Preview
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Light Header */}
          <div className="bg-white border border-[#E8E8E3] p-4 rounded-xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2.5">
              {localType === 'image' && localUrl ? (
                <img
                  src={localUrl}
                  alt="Preview"
                  style={{ height: `${localHeight}px` }}
                  className="max-w-[160px] object-contain"
                />
              ) : localType === 'both' && localUrl ? (
                <>
                  <img
                    src={localUrl}
                    alt="Preview"
                    style={{ height: `${localHeight}px` }}
                    className="max-w-[100px] object-contain"
                  />
                  <div>
                    <span className="font-extrabold text-[#171717] block leading-tight">
                      {storeSettings?.storeName || 'FATHIMA STORES'}
                    </span>
                    <span className="text-[9px] text-[#6B6B6B]">{storeSettings?.tagline}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded bg-[#71883F] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {storeSettings?.storeName?.substring(0, 2).toUpperCase() || 'FS'}
                  </div>
                  <div>
                    <span className="font-extrabold text-[#171717] block leading-tight">
                      {storeSettings?.storeName || 'FATHIMA STORES'}
                    </span>
                    <span className="text-[9px] text-[#6B6B6B]">{storeSettings?.tagline}</span>
                  </div>
                </>
              )}
            </div>
            <span className="text-[10px] bg-neutral-100 text-[#6B6B6B] px-2 py-0.5 rounded font-mono shrink-0">
              Light Header
            </span>
          </div>

          {/* Dark Header */}
          <div className="bg-[#171717] p-4 rounded-xl flex items-center justify-between text-white shadow-2xs">
            <div className="flex items-center gap-2.5">
              {localType === 'image' && localUrl ? (
                <img
                  src={localUrl}
                  alt="Preview"
                  style={{ height: `${localHeight}px` }}
                  className="max-w-[160px] object-contain brightness-110"
                />
              ) : localType === 'both' && localUrl ? (
                <>
                  <img
                    src={localUrl}
                    alt="Preview"
                    style={{ height: `${localHeight}px` }}
                    className="max-w-[100px] object-contain brightness-110"
                  />
                  <div>
                    <span className="font-extrabold text-white block leading-tight">
                      {storeSettings?.storeName || 'FATHIMA STORES'}
                    </span>
                    <span className="text-[9px] text-neutral-400">{storeSettings?.tagline}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded bg-[#71883F] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {storeSettings?.storeName?.substring(0, 2).toUpperCase() || 'FS'}
                  </div>
                  <div>
                    <span className="font-extrabold text-white block leading-tight">
                      {storeSettings?.storeName || 'FATHIMA STORES'}
                    </span>
                    <span className="text-[9px] text-neutral-400">{storeSettings?.tagline}</span>
                  </div>
                </>
              )}
            </div>
            <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded font-mono shrink-0">
              Dark Header
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
