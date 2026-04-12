import { ProcessedPhoto, CountryPreset, PaperSize } from './types';
import { A4_CONFIG, mmToPx } from './presets';

export interface LayoutGrid {
  columns: number;
  rows: number;
  totalPhotos: number;
  photoWidthPx: number;
  photoHeightPx: number;
  marginPx: number;
  gutterPx: number;
  paperWidthPx: number;
  paperHeightPx: number;
  positions: Array<{ x: number; y: number; photoIndex: number }>;
}

export function calculateLayout(
  preset: CountryPreset,
  marginMm: number = A4_CONFIG.marginMm,
  gutterMm: number = A4_CONFIG.gutterMm,
  manualColumns?: number,
  manualRows?: number,
  paper?: PaperSize
): LayoutGrid {
  const dpi = 300;
  const pW = paper?.widthMm ?? A4_CONFIG.widthMm;
  const pH = paper?.heightMm ?? A4_CONFIG.heightMm;
  
  const pWidthPx = mmToPx(pW, dpi);
  const pHeightPx = mmToPx(pH, dpi);
  const margin = mmToPx(marginMm, dpi);
  const gutter = mmToPx(gutterMm, dpi);

  const photoW = mmToPx(preset.widthMm, dpi);
  const photoH = mmToPx(preset.heightMm, dpi);

  const usableW = pWidthPx - 2 * margin;
  const usableH = pHeightPx - 2 * margin;

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
    paperWidthPx: pWidthPx,
    paperHeightPx: pHeightPx,
    positions,
  };
}

export async function renderPaperCanvas(
  layout: LayoutGrid,
  photos: ProcessedPhoto[],
  mixMultiple: boolean = false,
  showGuides: boolean = true
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = layout.paperWidthPx;
  canvas.height = layout.paperHeightPx;
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
    ctx.strokeStyle = '#999999'; // Darker gray for better visibility
    ctx.lineWidth = 1.0; // Thicker lines
    ctx.setLineDash([4, 4]); // Slightly longer dashes

    const photoW = layout.photoWidthPx;
    const photoH = layout.photoHeightPx;
    const gutter = layout.gutterPx;
    
    const gridWidth = layout.columns * photoW + (layout.columns - 1) * gutter;
    const gridHeight = layout.rows * photoH + (layout.rows - 1) * gutter;
    const xEnd = layout.marginPx + gridWidth;
    const yEnd = layout.marginPx + gridHeight;

    for (let c = 0; c < layout.columns - 1; c++) {
      const x = layout.marginPx + (c + 1) * photoW + c * gutter + gutter / 2;
      ctx.beginPath();
      ctx.moveTo(x, layout.marginPx);
      ctx.lineTo(x, yEnd);
      ctx.stroke();
    }

    for (let r = 0; r < layout.rows - 1; r++) {
      const y = layout.marginPx + (r + 1) * photoH + r * gutter + gutter / 2;
      ctx.beginPath();
      ctx.moveTo(layout.marginPx, y);
      ctx.lineTo(xEnd, y);
      ctx.stroke();
    }

    ctx.setLineDash([10, 5]);
    ctx.strokeRect(layout.marginPx, layout.marginPx, gridWidth, gridHeight);
    ctx.setLineDash([]);
  }

  return canvas;
}
