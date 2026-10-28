import React from 'react';
import {
  InternationalThemeId,
  INTERNATIONAL_THEMES,
} from '../utils/theme';
import { Palette, Check, X, Sparkles, Globe } from 'lucide-react';

interface ThemeSelectorModalProps {
  currentTheme: InternationalThemeId;
  onSelectTheme: (themeId: InternationalThemeId) => void;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  currentTheme,
  onSelectTheme,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                International Dashboard Color Palettes
              </h3>
              <p className="text-xs text-slate-400">
                Select an enterprise terminal theme for the dashboard and all pages
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme List */}
        <div className="space-y-2.5">
          {Object.values(INTERNATIONAL_THEMES).map((theme) => {
            const isSelected = currentTheme === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/10 shadow-md ring-1 ring-sky-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Color Swatch Preview Dot */}
                  <div className="flex items-center -space-x-1 shrink-0">
                    <span
                      className="w-5 h-5 rounded-full border border-black/40 shadow-xs"
                      style={{
                        backgroundColor:
                          theme.id === 'slate'
                            ? '#0b1329'
                            : theme.id === 'obsidian'
                            ? '#0f1014'
                            : theme.id === 'tokyo'
                            ? '#070b18'
                            : theme.id === 'emerald'
                            ? '#061412'
                            : '#f1f5f9',
                      }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: theme.accent }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{theme.flag}</span>
                      <span className="font-bold text-sm text-white">{theme.name}</span>
                      {isSelected && (
                        <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 text-[10px] font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{theme.subtitle}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-700" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Persists automatically across sessions</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
