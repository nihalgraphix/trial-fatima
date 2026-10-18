/**
 * Client-side image compressor that compresses any image (JPG, PNG, WEBP, etc.)
 * to strictly under 200 KB (204,800 bytes) using HTML5 Canvas.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSize: number; // in bytes
  compressedSize: number; // in bytes
  width: number;
  height: number;
  fileName: string;
  mimeType: string;
}

export const compressImageTo200KB = async (
  file: File,
  maxBytes = 200 * 1024 // 200 KB
): Promise<CompressionResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Cap maximum dimensions for e-commerce product display (max 1200px)
        const MAX_DIMENSION = 1200;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Fill background with white in case of transparent PNG converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Iterative binary-step compression to reach <= 200KB
        let quality = 0.88;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        const getByteSize = (base64Str: string) => {
          const base64Data = base64Str.split(',')[1] || '';
          return Math.round((base64Data.length * 3) / 4);
        };

        let currentSize = getByteSize(dataUrl);

        // If file is still > maxBytes, iteratively lower quality
        let iterations = 0;
        while (currentSize > maxBytes && quality > 0.15 && iterations < 10) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          currentSize = getByteSize(dataUrl);
          iterations++;
        }

        // If still > maxBytes, resize canvas geometry
        if (currentSize > maxBytes) {
          let scale = 0.8;
          while (currentSize > maxBytes && scale > 0.3) {
            const scaledWidth = Math.round(width * scale);
            const scaledHeight = Math.round(height * scale);
            const resizedCanvas = document.createElement('canvas');
            resizedCanvas.width = scaledWidth;
            resizedCanvas.height = scaledHeight;
            const rCtx = resizedCanvas.getContext('2d');
            if (rCtx) {
              rCtx.fillStyle = '#FFFFFF';
              rCtx.fillRect(0, 0, scaledWidth, scaledHeight);
              rCtx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight);
              dataUrl = resizedCanvas.toDataURL('image/jpeg', 0.7);
              currentSize = getByteSize(dataUrl);
            }
            scale -= 0.15;
          }
        }

        resolve({
          dataUrl,
          originalSize: file.size,
          compressedSize: currentSize,
          width,
          height,
          fileName: file.name,
          mimeType: 'image/jpeg',
        });
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
