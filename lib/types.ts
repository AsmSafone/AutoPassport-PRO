export interface CountryPreset {
  id: string;
  name: string;
  flag: string;
  widthMm: number;
  heightMm: number;
  dpi: number;
  headRatioMin: number;
  headRatioMax: number;
  headFromTop: number;
  bgColor: string;
  notes?: string;
}

export interface PaperSize {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
}

export type ProcessingStatus =
  | 'idle'
  | 'cropping'
  | 'enhancing'
  | 'complete'
  | 'error';

export interface ProcessedPhoto {
  id: string;
  originalUrl: string;
  processedUrl: string;
  presetId: string;
  timestamp: number;
  widthPx: number;
  heightPx: number;
  bgRemovedUrl?: string;
  quality: 'good' | 'adjust' | 'poor';
}

export interface ProcessPhotoOptions {
  preset: CountryPreset;
  adjustments?: Partial<ManualAdjustments>;
  sourceImage: HTMLImageElement;
  subjectImage?: HTMLImageElement; // Already background-removed image
}

export interface A4LayoutConfig {
  photos: ProcessedPhoto[];
  preset: CountryPreset;
  columns: number;
  rows: number;
  marginMm: number;
  gutterMm: number;
  showGuides: boolean;
  mixMultiple: boolean;
}

export interface ManualAdjustments {
  zoom: number;
  offsetX: number;
  offsetY: number;
  brightness: number;
  contrast: number;
  sharpness: number;
  removeBackground: boolean;
  bgColor: string;
  rotation: number;
}

export interface DownloadHistoryItem {
  id: string;
  filename: string;
  format: 'png' | 'pdf';
  presetName: string;
  photoCount: number;
  timestamp: number;
  thumbnailUrl: string;
}

export interface AppState {
  step: 'upload' | 'process' | 'download';
  selectedPresetId: string;
  photos: ProcessedPhoto[];
  processingStatus: ProcessingStatus;
  processingProgress: number;
  processingMessage: string;
  activePhotoId: string | null;
  manualAdjustments: Record<string, ManualAdjustments>;
  showManualOverride: boolean;
  layoutConfig: Partial<A4LayoutConfig>;
}
