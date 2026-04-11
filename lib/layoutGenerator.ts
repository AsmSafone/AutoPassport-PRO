import { A4LayoutConfig, ProcessedPhoto, CountryPreset } from './types';
import { A4_CONFIG, mmToPx } from './presets';

export interface LayoutGrid {
  columns: number;
  rows: number;
  totalPhotos: number;
  photoWidthPx: number;
  photoHeightPx: number;
  marginPx: number;
  gutterPx: number;
  a4WidthPx: number;
  a4HeightPx: number;
  positions: Array<{ x: number; y: number; photoIndex: number }>;
}

export function calculateLayout(
  preset: CountryPreset,
  marginMm: number = A4_CONFIG.marginMm,
  gutterMm: number = A4_CONFIG.gutterMm,
  manualColumns?: number,
  manualRows?: number
): LayoutGrid {
  const dpi = 300;
  const a4W = mmToPx(A4_CONFIG.widthMm, dpi);
  const a4H = mmToPx(A4_CONFIG.heightMm, dpi);
  const margin = mmToPx(marginMm, dpi);
  const gutter = mmToPx(gutterMm, dpi);

  const photoW = mmToPx(preset.widthMm, dpi);
  const photoH = mmToPx(preset.heightMm, dpi);

  const usableW = a4W - 2 * margin;
  const usableH = a4H - 2 * margin;

  const columns = manualColumns ?? Math.floor((usableW + gutter) / (photoW + gutter));
  const rows = manualRows ?? Math.floor((usableH + gutter) / (photoH + gutter));

  const positions: Array<{ x: number; y: number; photoIndex: number }> = [];
  let photoIndex = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < columns; c++) {
      const x = margin + c * (photoW + gutter);
      const y = margin + r * (photoH + gutter);
      positions.push({ x, y, photoIndex: photoIndex % Math.max(1, 999) });
      photoIndex++;
    }
  }

  return {
    columns,
    rows,
    totalPhotos: columns * rows,
    photoWidthPx: photoW,
    photoHeightPx: photoH,
    marginPx: margin,
    gutterPx: gutter,
    a4WidthPx: a4W,
    a4HeightPx: a4H,
    positions,
  };
}

export async function renderA4Canvas(
  layout: LayoutGrid,
  photos: ProcessedPhoto[],
  mixMultiple: boolean = false,
  showGuides: boolean = true
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = layout.a4WidthPx;
  canvas.height = layout.a4HeightPx;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const imageCache: Record<string, HTMLImageElement> = {};

  const loadImg = (url: string): Promise<HTMLImageElement> => {
    if (imageCache[url]) return Promise.resolve(imageCache[url]);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        imageCache[url] = img;
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  for (let i = 0; i < layout.positions.length; i++) {
    const pos = layout.positions[i];
    let photoIdx: number;

    if (mixMultiple && photos.length > 1) {
      photoIdx = i % photos.length;
    } else {
      photoIdx = 0;
    }

    const photo = photos[photoIdx];
    if (!photo) continue;

    try {
      const img = await loadImg(photo.processedUrl);
      ctx.drawImage(img, pos.x, pos.y, layout.photoWidthPx, layout.photoHeightPx);
    } catch {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(pos.x, pos.y, layout.photoWidthPx, layout.photoHeightPx);
    }
  }

  if (showGuides) {
    ctx.strokeStyle = '#CCCCCC'; // Subtle gray for cutting
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);

    const photoW = layout.photoWidthPx;
    const photoH = layout.photoHeightPx;
    const gutter = layout.gutterPx;
    
    // Calculate actual bounds of the grid
    const gridWidth = layout.columns * photoW + (layout.columns - 1) * gutter;
    const gridHeight = layout.rows * photoH + (layout.rows - 1) * gutter;
    const xEnd = layout.marginPx + gridWidth;
    const yEnd = layout.marginPx + gridHeight;

    // Vertical guides (in gutters)
    for (let c = 0; c < layout.columns - 1; c++) {
      const x = layout.marginPx + (c + 1) * photoW + c * gutter + gutter / 2;
      ctx.beginPath();
      ctx.moveTo(x, layout.marginPx);
      ctx.lineTo(x, yEnd);
      ctx.stroke();
    }

    // Horizontal guides (in gutters)
    for (let r = 0; r < layout.rows - 1; r++) {
      const y = layout.marginPx + (r + 1) * photoH + r * gutter + gutter / 2;
      ctx.beginPath();
      ctx.moveTo(layout.marginPx, y);
      ctx.lineTo(xEnd, y);
      ctx.stroke();
    }

    // Border guide (restricted to occupied grid)
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(layout.marginPx, layout.marginPx, gridWidth, gridHeight);
    ctx.setLineDash([]);
  }

  return canvas;
}
