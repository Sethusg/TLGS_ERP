import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Palette,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { LeadersSchoolLogo } from '../LeadersSchoolLogo';

export interface NavAppearanceSettings {
  logoUrl: string | null;
  highlightColor: string;
}

interface NavAppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: NavAppearanceSettings;
  onSaveSettings: (settings: NavAppearanceSettings) => void;
}

export const PRESET_HIGHLIGHT_COLORS = [
  { name: 'Royal Gold (Official)', hex: '#D4AF37', textContrast: '#0B1F3A' },
  { name: 'International Cobalt', hex: '#2563eb', textContrast: '#FFFFFF' },
  { name: 'Emerald Green', hex: '#059669', textContrast: '#FFFFFF' },
  { name: 'Imperial Crimson', hex: '#dc2626', textContrast: '#FFFFFF' },
  { name: 'Royal Violet', hex: '#7c3aed', textContrast: '#FFFFFF' },
  { name: 'Midnight Cyan', hex: '#0891b2', textContrast: '#FFFFFF' },
  { name: 'Warm Amber', hex: '#d97706', textContrast: '#0B1F3A' },
  { name: 'Slate Indigo', hex: '#4f46e5', textContrast: '#FFFFFF' },
];

export const NavAppearanceModal: React.FC<NavAppearanceModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSaveSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'logo' | 'color'>('logo');
  const [logoUrl, setLogoUrl] = useState<string | null>(currentSettings.logoUrl);
  const [highlightColor, setHighlightColor] = useState<string>(
    currentSettings.highlightColor || '#D4AF37'
  );
  const [urlInput, setUrlInput] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB. Please choose a smaller file.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setLogoUrl(base64Data);
    };
    reader.onerror = () => {
      setUploadError('Error reading uploaded image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setLogoUrl(urlInput.trim());
    setUrlInput('');
    setUploadError(null);
  };

  const handleResetLogo = () => {
    setLogoUrl(null);
    setUrlInput('');
    setUploadError(null);
  };

  const handleSave = () => {
    onSaveSettings({
      logoUrl,
      highlightColor,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#0B1F3A] text-white flex items-center justify-between border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center text-[#0B1F3A]">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white">
                Customize School Logo & Navigation Menu
              </h3>
              <p className="text-[11px] text-slate-300">
                The Leaders Group of Schools UI appearance settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('logo')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'logo'
                ? 'border-[#0B1F3A] text-[#0B1F3A] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
            <span>School Logo</span>
          </button>
          <button
            onClick={() => setActiveTab('color')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'color'
                ? 'border-[#0B1F3A] text-[#0B1F3A] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-4 h-4 text-[#D4AF37]" />
            <span>Menu Highlight Colour</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-700 text-xs">
          {/* TAB 1: SCHOOL LOGO */}
          {activeTab === 'logo' && (
            <div className="space-y-4">
              {/* Live Preview Box */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Navigation Bar Logo Preview
                </label>
                <div className="p-4 bg-[#0B1F3A] rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <LeadersSchoolLogo customLogoUrl={logoUrl} variant="full" />
                  </div>
                  <span className="text-[10px] text-[#D4AF37] bg-[#D4AF37]/15 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                    Live Navbar Preview
                  </span>
                </div>
              </div>

              {/* Upload Controls */}
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Upload Custom School Logo
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose Image from Device</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                    title="Reset to official The Leaders Group of Schools logo"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Use Official Crest</span>
                  </button>
                </div>

                {uploadError && (
                  <p className="text-[11px] text-red-600 font-medium">{uploadError}</p>
                )}

                {/* Paste URL */}
                <div className="pt-2">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Or Enter Direct Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://example.com/school-logo.png"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#0B1F3A] focus:border-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      disabled={!urlInput.trim()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Tips & Recommendations */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong className="font-semibold">Logo Guidelines:</strong> Use transparent PNG or SVG with horizontal proportions for best clarity against the dark navy background (#0B1F3A).
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: MENU HIGHLIGHT COLOUR */}
          {activeTab === 'color' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Active Menu Highlight Mockup
                </label>
                {/* Visual Navbar Mockup */}
                <div className="p-3 bg-[#0B1F3A] rounded-xl border border-slate-800 flex items-center justify-center gap-1.5 overflow-x-auto">
                  <div className="px-3 py-1.5 text-[11px] text-white/80 font-medium">HOME</div>
                  <div className="px-3 py-1.5 text-[11px] text-white/80 font-medium">STUDENT</div>
                  {/* Active Highlight Demo */}
                  <div
                    style={{ backgroundColor: highlightColor }}
                    className="px-3.5 py-1.5 text-[11px] font-bold rounded-t-sm shadow-md transition-all flex items-center gap-1"
                  >
                    <span
                      style={{
                        color:
                          highlightColor.toLowerCase() === '#d4af37' ||
                          highlightColor.toLowerCase() === '#f59e0b'
                            ? '#0B1F3A'
                            : '#FFFFFF',
                      }}
                    >
                      LMS (ACTIVE)
                    </span>
                  </div>
                  <div className="px-3 py-1.5 text-[11px] text-white/80 font-medium">CONTACT</div>
                </div>
              </div>

              {/* Color Swatches Grid */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Preset Palette Options
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_HIGHLIGHT_COLORS.map((c) => {
                    const isSelected = highlightColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setHighlightColor(c.hex)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#0B1F3A] ring-2 ring-[#0B1F3A]/20 bg-slate-50 font-bold'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-5 h-5 rounded-full border border-black/10 shrink-0 shadow-2xs"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-xs text-slate-800">{c.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-slate-800" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Hex Color Picker */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Custom Hex Colour</p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase">{highlightColor}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHighlightColor('#D4AF37')}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Reset to Gold (#D4AF37)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-[#0B1F3A] hover:bg-[#122b4f] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer border border-[#D4AF37]/40"
          >
            <Check className="w-4 h-4 text-[#D4AF37]" />
            <span>Apply Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
