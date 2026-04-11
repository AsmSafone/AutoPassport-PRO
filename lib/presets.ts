import { CountryPreset } from './types';

export const COUNTRY_PRESETS: CountryPreset[] = [
  {
    id: 'bd',
    name: 'Bangladesh',
    flag: '🇧🇩',
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    headRatioMin: 0.60,
    headRatioMax: 0.75,
    headFromTop: 0.12,
    bgColor: '#FFFFFF',
    notes: 'White or Blue',
  },
  {
    id: 'us',
    name: 'USA',
    flag: '🇺🇸',
    widthMm: 50.8,
    heightMm: 50.8,
    widthIn: 2,
    heightIn: 2,
    dpi: 300,
    headRatioMin: 0.50,
    headRatioMax: 0.69,
    headFromTop: 0.13,
    bgColor: '#FFFFFF',
    notes: 'White or Plain',
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    flag: '🇬🇧',
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    headRatioMin: 0.60,
    headRatioMax: 0.75,
    headFromTop: 0.10,
    bgColor: '#F5F5F0',
    notes: 'Light grey or Cream',
  },
  {
    id: 'eu',
    name: 'European Union',
    flag: '🇪🇺',
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    headRatioMin: 0.60,
    headRatioMax: 0.75,
    headFromTop: 0.10,
    bgColor: '#FFFFFF',
    notes: 'ICAO standard, White',
  },
  {
    id: 'in',
    name: 'India',
    flag: '🇮🇳',
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    headRatioMin: 0.60,
    headRatioMax: 0.75,
    headFromTop: 0.12,
    bgColor: '#FFFFFF',
    notes: 'White or Plain',
  },
  {
    id: 'ca',
    name: 'Canada',
    flag: '🇨🇦',
    widthMm: 50,
    heightMm: 70,
    dpi: 300,
    headRatioMin: 0.31,
    headRatioMax: 0.36,
    headFromTop: 0.10,
    bgColor: '#FFFFFF',
    notes: 'White or Light',
  },
  {
    id: 'au',
    name: 'Australia',
    flag: '🇦🇺',
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    headRatioMin: 0.60,
    headRatioMax: 0.80,
    headFromTop: 0.10,
    bgColor: '#FFFFFF',
    notes: 'White or Off-White',
  },
  {
    id: 'custom',
    name: 'Custom Size',
    flag: '⚙️',
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    headRatioMin: 0.60,
    headRatioMax: 0.75,
    headFromTop: 0.12,
    bgColor: '#FFFFFF',
  },
];

export const getPresetById = (id: string): CountryPreset => {
  return COUNTRY_PRESETS.find((p) => p.id === id) || COUNTRY_PRESETS[0];
};

export const mmToPx = (mm: number, dpi: number): number => {
  return Math.round((mm / 25.4) * dpi);
};

export const pxToMm = (px: number, dpi: number): number => {
  return (px / dpi) * 25.4;
};

export const getPresetDimensions = (preset: CountryPreset) => {
  const widthPx = mmToPx(preset.widthMm, preset.dpi);
  const heightPx = mmToPx(preset.heightMm, preset.dpi);
  return { widthPx, heightPx };
};

export const A4_CONFIG = {
  widthMm: 210,
  heightMm: 297,
  marginMm: 10,
  gutterMm: 3,
};
