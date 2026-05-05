import { CountryPreset, PaperSize } from './types';

export const COUNTRY_PRESETS: CountryPreset[] = [
  {
    id: 'bd',
    name: 'Bangladesh',
    flag: '🇧🇩',
    widthMm: 45,
    heightMm: 55,
    widthIn: 1.77,
    heightIn: 2.17,
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
    id: 'stamp',
    name: 'Stamp Size',
    flag: '📮',
    widthMm: 20,
    heightMm: 25,
    dpi: 300,
    headRatioMin: 0.50,
    headRatioMax: 0.70,
    headFromTop: 0.10,
    bgColor: '#FFFFFF',
    notes: 'Standard White or Blue',
  },
  {
    id: 'custom',
    name: 'Custom Size',
    flag: '⚙️',
    widthMm: 45,
    heightMm: 55,
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

export const PAPER_SIZES: PaperSize[] = [
  { id: 'a4', name: 'A4 (210×297mm)', widthMm: 210, heightMm: 297 },
  { id: 'letter', name: 'Letter (8.5×11")', widthMm: 215.9, heightMm: 279.4 },
  { id: '4x6', name: '4×6" (10×15cm)', widthMm: 101.6, heightMm: 152.4 },
  { id: '5x7', name: '5×7" (13×18cm)', widthMm: 127.0, heightMm: 177.8 },
];
