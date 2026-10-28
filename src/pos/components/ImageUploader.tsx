import React, { useState, useRef } from 'react';
import {
  compressImageFile,
  formatFileSize,
  CompressionResult,
} from '../utils/imageCompressor';
import { ProductVisual } from './ProductVisual';
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Sliders,
  Layers,
  FileImage,
} from 'lucide-react';

interface ImageUploaderProps {
  productName: string;
  category: string;
  imageUrl?: string;
  imagePreset?: string;
  onImageChange: (dataUrl: string) => void;
  onImageDelete: () => void;
  onPresetChange: (preset: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  productName,
  category,
  imageUrl,
  imagePreset = 'coffee',
  onImageChange,
  onImageDelete,
  onPresetChange,
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<CompressionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }

    try {
      setIsCompressing(true);
      setErrorMsg(null);

      // Auto-compress image to max 800x800 webp/jpeg with 0.82 quality
      const result = await compressImageFile(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.82,
        format: 'image/webp',
      });

      setCompressionStats(result);
      onImageChange(result.dataUrl);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to compress and upload image.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // reset input so the same file can be re-selected if desired
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDelete = () => {
    onImageDelete();
    setCompressionStats(null);
    setErrorMsg(null);
  };

  return (
    <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-amber-400" />
          <span>Product Image & Auto-Compression Engine</span>
        </span>
        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
          Client-Side Optimization
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
        {/* Visual Preview Box (3 columns) */}
        <div className="sm:col-span-4 flex flex-col items-center">
          <div className="w-full aspect-square rounded-2xl overflow-hidden border border-neutral-800 shadow-lg relative group bg-neutral-900">
            <ProductVisual
              name={productName || 'Preview Item'}
              category={category}
              preset={imagePreset}
              imageUrl={imageUrl}
              aspectRatio="square"
              className="w-full h-full"
            />

            {/* Overlay Delete Button if image is present */}
            {imageUrl && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
                  title="Delete product image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-2 text-center">
            {imageUrl ? (
              <span className="text-[10px] text-emerald-400 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Custom image active
              </span>
            ) : (
              <span className="text-[10px] text-neutral-500 font-medium">
                Using vector fallback ({imagePreset})
              </span>
            )}
          </div>
        </div>

        {/* Upload & Compression Controls (8 columns) */}
        <div className="sm:col-span-8 space-y-3">
          {/* Hidden native file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept="image/*"
            className="hidden"
          />

          {/* Drag & Drop Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-900'
            }`}
          >
            {isCompressing ? (
              <div className="py-2 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-amber-300 font-semibold">
                  Auto-compressing image with canvas engine...
                </span>
                <span className="text-[10px] text-neutral-400">
                  Resizing and optimizing memory footprint
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-1">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-200">
                    Click to upload or drag & drop image
                  </span>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    JPG, PNG, WebP up to 15MB • Auto-compressed for fast POS caching
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Real-time Compression Statistics Banner */}
          {compressionStats && (
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Auto-Compression Complete</span>
                </span>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {compressionStats.savedPercentage}% smaller
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-neutral-300 pt-0.5">
                <div>
                  <span className="text-neutral-500 block">Original:</span>
                  <span className="text-neutral-400 line-through">
                    {formatFileSize(compressionStats.originalSizeBytes)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Compressed:</span>
                  <span className="font-bold text-emerald-300">
                    {formatFileSize(compressionStats.compressedSizeBytes)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Optimized Res:</span>
                  <span className="text-neutral-300">
                    {compressionStats.compressedDimensions.width}×
                    {compressionStats.compressedDimensions.height} px
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Delete & Action Strip */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              {imageUrl && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Image</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileImage className="w-3.5 h-3.5 text-neutral-400" />
                <span>{imageUrl ? 'Change Photo' : 'Select Photo'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[10px] text-neutral-400 hover:text-neutral-200 underline"
            >
              {showUrlInput ? 'Hide URL field' : 'Enter URL instead'}
            </button>
          </div>

          {/* Optional Direct URL field */}
          {showUrlInput && (
            <div className="pt-1">
              <input
                type="url"
                value={imageUrl || ''}
                onChange={(e) => onImageChange(e.target.value)}
                placeholder="Paste direct HTTPS image URL..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Preset Styles (Used when image is deleted / not uploaded) */}
          <div className="pt-1 border-t border-neutral-800/80">
            <label className="text-[10px] font-semibold text-neutral-400 block mb-1">
              Fallback Visual Style Preset (used when image is removed):
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { id: 'coffee', label: 'Coffee' },
                { id: 'burger', label: 'Burger' },
                { id: 'bakery', label: 'Bakery' },
                { id: 'dessert', label: 'Dessert' },
                { id: 'drink', label: 'Soda' },
                { id: 'retail', label: 'Merch' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPresetChange(p.id)}
                  className={`py-1 px-1.5 text-center text-[10px] rounded-lg transition-colors font-medium cursor-pointer ${
                    imagePreset === p.id
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
