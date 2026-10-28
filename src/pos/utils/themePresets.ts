import { PosThemeSettings, PresetThemeId } from '../types/pos';

export const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function isValidHex(color: string): boolean {
  return HEX_REGEX.test(color.trim());
}

export interface PresetThemeDefinition {
  id: PresetThemeId;
  name: string;
  badge: string;
  description: string;
  settings: Omit<PosThemeSettings, 'updated_by' | 'updated_at'>;
}

export const PRESET_THEMES: Record<PresetThemeId, PresetThemeDefinition> = {
  dark: {
    id: 'dark',
    name: 'Midnight Navy',
    badge: 'Standard Dark',
    description: 'Professional dark POS background with high contrast readability',
    settings: {
      pos_background_color: '#0B1228',
      header_background_color: '#0E172E',
      catalogue_background_color: '#0B1228',
      product_card_background_color: '#121D38',
      order_panel_background_color: '#0E172E',
      sidebar_background_color: '#0E172E',
      primary_button_color: '#F59E0B',
      text_color: '#F1F5F9',
      accent_color: '#38BDF8',
      selected_theme: 'dark',
    },
  },
  deep_blue: {
    id: 'deep_blue',
    name: 'Deep Blue',
    badge: 'Enterprise',
    description: 'Modern enterprise fintech appearance with crisp navy depths',
    settings: {
      pos_background_color: '#172554',
      header_background_color: '#1E3A8A',
      catalogue_background_color: '#172554',
      product_card_background_color: '#1E293B',
      order_panel_background_color: '#1E3A8A',
      sidebar_background_color: '#1E3A8A',
      primary_button_color: '#3B82F6',
      text_color: '#F8FAFC',
      accent_color: '#60A5FA',
      selected_theme: 'deep_blue',
    },
  },
  light: {
    id: 'light',
    name: 'Light Professional',
    badge: 'Day Mode',
    description: 'Bright daylight background with rich charcoal text and subtle cards',
    settings: {
      pos_background_color: '#F3F6FA',
      header_background_color: '#FFFFFF',
      catalogue_background_color: '#F3F6FA',
      product_card_background_color: '#FFFFFF',
      order_panel_background_color: '#FFFFFF',
      sidebar_background_color: '#F8FAFC',
      primary_button_color: '#2563EB',
      text_color: '#0F172A',
      accent_color: '#0284C7',
      selected_theme: 'light',
    },
  },
  forest_green: {
    id: 'forest_green',
    name: 'Forest Green',
    badge: 'Canteen POS',
    description: 'Fresh organic botanical palette tailored for canteen and cafeteria POS',
    settings: {
      pos_background_color: '#102A22',
      header_background_color: '#0C241D',
      catalogue_background_color: '#102A22',
      product_card_background_color: '#163A30',
      order_panel_background_color: '#0C241D',
      sidebar_background_color: '#0C241D',
      primary_button_color: '#10B981',
      text_color: '#ECFDF5',
      accent_color: '#34D399',
      selected_theme: 'forest_green',
    },
  },
  custom: {
    id: 'custom',
    name: 'Custom Theme',
    badge: 'Tailored',
    description: 'Custom fine-tuned palette configured by store administrator',
    settings: {
      pos_background_color: '#0B1228',
      header_background_color: '#0E172E',
      catalogue_background_color: '#0B1228',
      product_card_background_color: '#121D38',
      order_panel_background_color: '#0E172E',
      sidebar_background_color: '#0E172E',
      primary_button_color: '#F59E0B',
      text_color: '#F1F5F9',
      accent_color: '#38BDF8',
      selected_theme: 'custom',
    },
  },
};

export const DEFAULT_THEME_SETTINGS: PosThemeSettings = {
  ...PRESET_THEMES.dark.settings,
  updated_by: 'System Administrator',
  updated_at: new Date().toISOString(),
};
