/**
 * High-performance client-side image compression utility for POS sales items.
 * Resizes high-resolution camera photos / uploads down to POS-optimized dimensions
 * and converts them to efficient WebP/JPEG data URLs with minimal memory footprint.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  originalDimensions: { width: number; height: number };
  compressedDimensions: { width: number; height: number };
  savedPercentage: number;
  format: string;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function compressImageFile(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.82,
    format = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Failed to read image file.'));
    };

    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('Image reader returned empty result.'));
        return;
      }

      const img = new Image();
      img.onerror = () => {
        reject(new Error('Corrupt or unsupported image format.'));
      };

      img.onload = () => {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;

        // Calculate aspect-ratio preserved target dimensions
        let targetWidth = origWidth;
        let targetHeight = origHeight;

        if (origWidth > maxWidth || origHeight > maxHeight) {
          const ratio = Math.min(maxWidth / origWidth, maxHeight / origHeight);
          targetWidth = Math.round(origWidth * ratio);
          targetHeight = Math.round(origHeight * ratio);
        }

        // Create offscreen canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas 2D context not available.'));
          return;
        }

        // Enable high-quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fill white background for transparent PNGs converted to JPEG/WebP
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Convert to target format
        let compressedDataUrl = canvas.toDataURL(format, quality);

        // If WebP is not supported or yields empty, fallback to JPEG
        if (!compressedDataUrl || compressedDataUrl.startsWith('data:,')) {
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Estimate byte size of base64
        const head = compressedDataUrl.indexOf(',') + 1;
        const base64Len = compressedDataUrl.length - head;
        const compressedSizeBytes = Math.round((base64Len * 3) / 4);

        const savedBytes = Math.max(0, file.size - compressedSizeBytes);
        const savedPercentage =
          file.size > 0 ? Math.round((savedBytes / file.size) * 100) : 0;

        resolve({
          dataUrl: compressedDataUrl,
          originalSizeBytes: file.size,
          compressedSizeBytes,
          originalDimensions: { width: origWidth, height: origHeight },
          compressedDimensions: { width: targetWidth, height: targetHeight },
          savedPercentage,
          format,
        });
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}
