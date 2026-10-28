import React, { useState, useEffect } from 'react';
import { PosThemeSettings, PosUser, PresetThemeId } from '../../types/pos';
import {
  PRESET_THEMES,
  DEFAULT_THEME_SETTINGS,
  isValidHex,
} from '../../utils/themePresets';
import {
  saveThemeSettings,
  resetThemeSettings,
  applyThemeCssVariables,
} from '../../services/themeApi';
import {
  Palette,
  Save,
  RotateCcw,
  Check,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Eye,
  ShoppingBag,
  Layers,
  Monitor,
  CheckCircle2,
  X,
} from 'lucide-react';

interface AppearanceSettingsViewProps {
  currentUser: PosUser;
  currentTheme: PosThemeSettings;
  onThemeSaved: (updatedTheme: PosThemeSettings) => void;
}

export const AppearanceSettingsView: React.FC<AppearanceSettingsViewProps> = ({
  currentUser,
  currentTheme,
  onThemeSaved,
}) => {
  const isManagerOrAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';

  // Local working copy of settings for live preview before saving
  const [draftTheme, setDraftTheme] = useState<PosThemeSettings>(currentTheme);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Sync when prop updates from external broadcast
  useEffect(() => {
    setDraftTheme(currentTheme);
  }, [currentTheme]);

  // Live preview: apply CSS variables dynamically to the page while editing
  useEffect(() => {
    applyThemeCssVariables(draftTheme);
    return () => {
      // Revert to saved theme if unmounted without saving
      applyThemeCssVariables(currentTheme);
    };
  }, [draftTheme, currentTheme]);

  // Apply a preset theme
  const handleSelectPreset = (presetId: PresetThemeId) => {
    const preset = PRESET_THEMES[presetId];
    if (!preset) return;

    setDraftTheme((prev) => ({
      ...prev,
      ...preset.settings,
      selected_theme: presetId,
    }));
    setSaveStatus({ type: null, message: '' });
  };

  // Update a single color field
  const handleColorChange = (key: keyof PosThemeSettings, value: string) => {
    setDraftTheme((prev) => ({
      ...prev,
      [key]: value,
      selected_theme: 'custom',
    }));
    setSaveStatus({ type: null, message: '' });
  };

  // Save changes to backend database API
  const handleSaveChanges = async () => {
    if (!isManagerOrAdmin) {
      setSaveStatus({
        type: 'error',
        message: 'Only administrators and managers have permission to modify theme settings.',
      });
      return;
    }

    // Validate all HEX color fields
    const colorFields: (keyof PosThemeSettings)[] = [
      'pos_background_color',
      'header_background_color',
      'catalogue_background_color',
      'product_card_background_color',
      'order_panel_background_color',
      'sidebar_background_color',
      'primary_button_color',
      'text_color',
      'accent_color',
    ];

    for (const field of colorFields) {
      const val = draftTheme[field] as string;
      if (!isValidHex(val)) {
        setSaveStatus({
          type: 'error',
          message: `Invalid HEX code for ${field.replace(/_/g, ' ')}: "${val}". Please enter a valid hex format like #0B1228 or #FFF.`,
        });
        return;
      }
    }

    setIsSaving(true);
    setSaveStatus({ type: null, message: '' });

    const result = await saveThemeSettings(draftTheme, currentUser);
    setIsSaving(false);

    if (result.success) {
      setSaveStatus({
        type: 'success',
        message: 'Theme settings successfully saved to the database and broadcasted across all connected POS terminals.',
      });
      onThemeSaved(result.data);
    } else {
      setSaveStatus({
        type: 'error',
        message: result.error || 'Failed to save theme settings to server.',
      });
    }
  };

  // Reset to default theme
  const handleResetToDefault = async () => {
    if (!isManagerOrAdmin) return;
    if (!window.confirm('Reset all POS colours to the default Midnight Navy theme?')) return;

    setIsSaving(true);
    const result = await resetThemeSettings(currentUser);
    setIsSaving(false);

    if (result.success) {
      setDraftTheme(result.data);
      onThemeSaved(result.data);
      setSaveStatus({
        type: 'success',
        message: 'POS appearance reset to default Midnight Navy theme in database.',
      });
    }
  };

  // Cancel / revert unsaved edits
  const handleCancel = () => {
    setDraftTheme(currentTheme);
    applyThemeCssVariables(currentTheme);
    setSaveStatus({ type: null, message: 'Unsaved changes discarded.' });
  };

  if (!isManagerOrAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-neutral-900 border border-red-500/30 rounded-2xl text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Administrator Access Required</h2>
        <p className="text-xs text-neutral-400 leading-relaxed">
          The POS Appearance & Theme Settings module is restricted to authorized Store Administrators and Managers. Cashier accounts may operate the POS terminal but are not permitted to change store appearance settings.
        </p>
      </div>
    );
  }

  const colorControls: {
    key: keyof PosThemeSettings;
    label: string;
    description: string;
  }[] = [
    {
      key: 'pos_background_color',
      label: 'POS Main Background',
      description: 'Primary canvas background for terminal screens and workspace',
    },
    {
      key: 'header_background_color',
      label: 'Header & Navigation Bar',
      description: 'Top persistent navbar, terminal wordmark, and cashier shift banner',
    },
    {
      key: 'catalogue_background_color',
      label: 'Product Catalogue Background',
      description: 'Background for item grid, search bar, and category filter strip',
    },
    {
      key: 'product_card_background_color',
      label: 'Product Card Background',
      description: 'Individual product inventory card tiles and visual thumbnails',
    },
    {
      key: 'order_panel_background_color',
      label: 'Order Panel Background',
      description: 'Right-hand side current order cart panel and receipt summary',
    },
    {
      key: 'sidebar_background_color',
      label: 'Sidebar & Dashboard Background',
      description: 'Admin portal navigation drawer, filter strips, and report tables',
    },
    {
      key: 'primary_button_color',
      label: 'Primary Button Colour',
      description: 'Checkout, Tender, Payment confirmation, and action buttons',
    },
    {
      key: 'text_color',
      label: 'Text Colour',
      description: 'Primary text font colour for headers, titles, and item labels',
    },
    {
      key: 'accent_color',
      label: 'Accent & Highlight Colour',
      description: 'Active tab badges, category highlights, and stock counters',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in text-neutral-100">
      {/* Top Header Banner */}
      <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Appearance & Theme Settings</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider">
                  Admin Control
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Customize POS background and UI colours. Changes persist in the database and apply dynamically across all terminals.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3.5 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/80 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleResetToDefault}
            disabled={isSaving}
            className="px-3.5 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700/80 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset to factory Midnight Navy theme"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
            <span>Reset to Default</span>
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {saveStatus.type && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-fade-in ${
            saveStatus.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{saveStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus({ type: null, message: '' })}
            className="text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PRESET THEMES BAR */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Recommended Preset Themes</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Select an official curated palette or customize individual colour codes below
            </p>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Current preset: <strong className="text-amber-400 uppercase">{draftTheme.selected_theme}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {(Object.values(PRESET_THEMES) as (typeof PRESET_THEMES)[PresetThemeId][]).map((preset) => {
            const isSelected = draftTheme.selected_theme === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/40'
                    : 'border-neutral-800 bg-neutral-950/60 hover:bg-neutral-950 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-xs text-white">{preset.name}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-amber-400/90 font-mono block">
                    {preset.badge}
                  </span>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                    {preset.description}
                  </p>
                </div>

                {/* Swatch Strip */}
                <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-neutral-800/80">
                  <span
                    className="w-4 h-4 rounded-full border border-black/40 shadow-xs"
                    style={{ backgroundColor: preset.settings.pos_background_color }}
                    title={`POS Bg: ${preset.settings.pos_background_color}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/40 shadow-xs"
                    style={{ backgroundColor: preset.settings.product_card_background_color }}
                    title={`Card Bg: ${preset.settings.product_card_background_color}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/40 shadow-xs"
                    style={{ backgroundColor: preset.settings.primary_button_color }}
                    title={`Button: ${preset.settings.primary_button_color}`}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-black/40 shadow-xs"
                    style={{ backgroundColor: preset.settings.accent_color }}
                    title={`Accent: ${preset.settings.accent_color}`}
                  />
                  <span className="text-[10px] font-mono text-neutral-500 ml-auto">
                    {preset.settings.pos_background_color}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN SECTION: COLOUR PICKERS & LIVE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 9 COLOUR CONTROLS (7 COLS) */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Interface Colour Configuration</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Adjust HEX codes or use the palette picker to customize individual UI sections
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {colorControls.map(({ key, label, description }) => {
              const currentColor = (draftTheme[key] as string) || '#000000';
              const valid = isValidHex(currentColor);

              return (
                <div
                  key={key}
                  className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">{label}</span>
                      {!valid && (
                        <span className="text-[10px] text-red-400 font-mono bg-red-500/10 px-1.5 py-0.2 rounded border border-red-500/30">
                          Invalid HEX
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{description}</p>
                  </div>

                  {/* Picker and HEX Input Combo */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Visual Colour Swatch Button */}
                    <div className="relative flex items-center">
                      <input
                        type="color"
                        value={valid ? currentColor : '#0B1228'}
                        onChange={(e) => handleColorChange(key, e.target.value.toUpperCase())}
                        className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0 opacity-0 absolute inset-0 z-10"
                        title="Click to open visual colour picker"
                      />
                      <div
                        className="w-9 h-9 rounded-lg border border-neutral-700 shadow-md flex items-center justify-center transition-transform hover:scale-105"
                        style={{ backgroundColor: valid ? currentColor : '#0B1228' }}
                      >
                        <span className="sr-only">Pick colour</span>
                      </div>
                    </div>

                    {/* HEX Code Text Input */}
                    <div className="relative w-28">
                      <input
                        type="text"
                        maxLength={7}
                        value={currentColor}
                        onChange={(e) => {
                          let val = e.target.value.trim();
                          if (!val.startsWith('#') && val.length > 0) {
                            val = '#' + val;
                          }
                          handleColorChange(key, val.toUpperCase());
                        }}
                        placeholder="#0B1228"
                        className={`w-full bg-neutral-900 border text-xs font-mono font-bold px-2.5 py-2 rounded-lg text-center focus:outline-none uppercase ${
                          valid
                            ? 'border-neutral-750 text-white focus:border-amber-500'
                            : 'border-red-500 text-red-400 focus:border-red-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE LIVE PREVIEW MOCKUP (5 COLS) */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg space-y-4 lg:sticky lg:top-20">
          <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Live POS Terminal Preview</h3>
                <p className="text-[11px] text-neutral-400">
                  Real-time simulation of cashier checkout interface
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 font-bold uppercase">
              Simulated View
            </span>
          </div>

          {/* MOCKUP CONTAINER */}
          <div
            className="rounded-xl border border-neutral-800 overflow-hidden shadow-2xl transition-colors duration-200"
            style={{
              backgroundColor: draftTheme.pos_background_color,
              color: draftTheme.text_color,
            }}
          >
            {/* Mock Header */}
            <div
              className="p-3 border-b flex items-center justify-between text-xs"
              style={{
                backgroundColor: draftTheme.header_background_color,
                borderColor: 'var(--theme-border)',
                color: draftTheme.text_color,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded flex items-center justify-center font-black text-[9px]"
                  style={{
                    backgroundColor: draftTheme.primary_button_color,
                    color: '#000000',
                  }}
                >
                  GSR
                </div>
                <span className="font-bold text-[11px] truncate">THE GSR SALES TERMINAL</span>
              </div>
              <div
                className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold"
                style={{
                  backgroundColor: draftTheme.accent_color,
                  color: '#000000',
                }}
              >
                SHIFT #01 OPEN
              </div>
            </div>

            {/* Mock POS Body */}
            <div className="p-3 grid grid-cols-12 gap-2 text-xs">
              {/* Product Catalogue Mock (7 cols) */}
              <div
                className="col-span-7 p-2 rounded-lg border space-y-2"
                style={{
                  backgroundColor: draftTheme.catalogue_background_color,
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div className="flex items-center justify-between text-[10px] pb-1 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                  <span className="font-bold">Items Catalogue</span>
                  <span style={{ color: draftTheme.accent_color }}>24 items</span>
                </div>

                {/* Sample Product Cards */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { name: 'Cold Brew Coffee', price: '₹140', stock: '22 in stock' },
                    { name: 'Veg Club Sandwich', price: '₹180', stock: '14 in stock' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-md border text-[10px] space-y-1 shadow-xs"
                      style={{
                        backgroundColor: draftTheme.product_card_background_color,
                        borderColor: 'var(--theme-border)',
                        color: draftTheme.text_color,
                      }}
                    >
                      <div className="w-full h-8 rounded bg-black/20 flex items-center justify-center text-xs opacity-70">
                        ☕
                      </div>
                      <p className="font-semibold truncate">{item.name}</p>
                      <div className="flex justify-between items-center pt-0.5">
                        <span className="font-bold font-mono" style={{ color: draftTheme.accent_color }}>
                          {item.price}
                        </span>
                        <span className="text-[8px] opacity-70 font-mono">
                          {item.stock}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Panel Mock (5 cols) */}
              <div
                className="col-span-5 p-2 rounded-lg border space-y-2 flex flex-col justify-between"
                style={{
                  backgroundColor: draftTheme.order_panel_background_color,
                  borderColor: 'var(--theme-border)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] pb-1 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                    <span className="font-bold">Current Order</span>
                    <span className="font-mono text-[9px] opacity-80">#0042</span>
                  </div>

                  <div className="space-y-1 pt-1 text-[9px]">
                    <div className="flex justify-between">
                      <span className="truncate">Cold Brew x 1</span>
                      <span className="font-mono">₹140.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="truncate">Sandwich x 1</span>
                      <span className="font-mono">₹180.00</span>
                    </div>
                  </div>
                </div>

                {/* Subtotal and Action Button */}
                <div className="pt-2 border-t space-y-1.5" style={{ borderColor: 'var(--theme-border)' }}>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span>Payable:</span>
                    <span className="font-mono" style={{ color: draftTheme.accent_color }}>
                      ₹320.00
                    </span>
                  </div>

                  <button
                    type="button"
                    className="w-full py-1.5 px-2 rounded-md text-[10px] font-black uppercase tracking-wider text-center shadow-md"
                    style={{
                      backgroundColor: draftTheme.primary_button_color,
                      color: '#000000',
                    }}
                  >
                    Tender Cash / UPI
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Database Persistence Audit Note */}
          <div className="p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-xl space-y-1 text-[11px] text-neutral-400">
            <div className="flex items-center justify-between">
              <span>Database Record Status:</span>
              <span className="text-emerald-400 font-semibold font-mono">Synced</span>
            </div>
            {currentTheme.updated_by && (
              <div className="flex items-center justify-between text-[10px]">
                <span>Last Updated By:</span>
                <span className="text-neutral-200">{currentTheme.updated_by}</span>
              </div>
            )}
            {currentTheme.updated_at && (
              <div className="flex items-center justify-between text-[10px]">
                <span>Last Updated At:</span>
                <span className="text-neutral-300 font-mono">
                  {new Date(currentTheme.updated_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
