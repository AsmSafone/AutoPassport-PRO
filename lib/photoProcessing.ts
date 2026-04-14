import { CountryPreset, ManualAdjustments } from './types';
import { mmToPx } from './presets';


export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

async function removeImageBackground(imageSource: HTMLImageElement | string): Promise<HTMLImageElement | null> {
  try {
    console.log('Starting background removal via API...');

    let sourceBlob: Blob;
    if (typeof imageSource === 'string') {
      const resp = await fetch(imageSource);
      sourceBlob = await resp.blob();
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = imageSource.naturalWidth;
      canvas.height = imageSource.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(imageSource, 0, 0);
      sourceBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to blob failed'));
        }, 'image/png'); // Using PNG as in user's example
      });
    }

    const formData = new FormData();
    formData.append('image', sourceBlob, 'image.png');

    const PROXIES = [
      "https://proxy.corsfix.com/?",
      "https://corsproxy.io/?",
      "https://thingproxy.freeboard.io/fetch/",
      "http://cors.safothebot.workers.dev/",
      "" // Direct fallback
    ];

    let lastError: Error | null = null;

    for (const proxy of PROXIES) {
      try {
        console.log(`Attempting background removal via ${proxy ? 'proxy: ' + proxy : 'direct'}`);
        const response = await fetch(`${proxy}https://api.rembg.com/rmbg`, {
          method: "POST",
          headers: {
            "accept": "image/*, application/json, text/plain, */*",
            "Referer": "https://www.rembg.com/"
          },
          body: formData
        });

        if (response.ok) {
          const resultBlob = await response.blob();
          const url = URL.createObjectURL(resultBlob);
          const img = await loadImageFromUrl(url);
          return img;
        } else {
          lastError = new Error(`Rembg API failed via ${proxy || 'direct'}: ${response.status}`);
          console.warn(lastError.message);
        }
      } catch (e: any) {
        lastError = e;
        console.warn(`Request failed for ${proxy || 'direct'}:`, e.message);
      }
    }

    if (lastError) {
      throw lastError;
    }

    return null; // Fallback if no proxies configured
  } catch (error) {
    console.error('Background removal failed:', error);
    return null;
  }
}

function rotateCanvas(
  srcCanvas: HTMLCanvasElement,
  angleDeg: number
): HTMLCanvasElement {
  if (Math.abs(angleDeg) < 0.5) return srcCanvas;

  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const newW = Math.ceil(srcCanvas.width * cos + srcCanvas.height * sin);
  const newH = Math.ceil(srcCanvas.width * sin + srcCanvas.height * cos);

  const canvas = document.createElement('canvas');
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext('2d')!;

  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.drawImage(srcCanvas, -srcCanvas.width / 2, -srcCanvas.height / 2);

  return canvas;
}

function applyEnhancements(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  adjustments: Partial<ManualAdjustments>
): void {
  const brightness = (adjustments.brightness ?? 5) * 1.5;
  const contrast = (adjustments.contrast ?? 10) * 1.5;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = Math.min(255, Math.max(0, r + brightness));
    g = Math.min(255, Math.max(0, g + brightness));
    b = Math.min(255, Math.max(0, b + brightness));

    r = Math.min(255, Math.max(0, factor * (r - 128) + 128));
    g = Math.min(255, Math.max(0, factor * (g - 128) + 128));
    b = Math.min(255, Math.max(0, factor * (b - 128) + 128));

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyUnsharpMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number = 0.4
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const blurred = ctx.getImageData(0, 0, width, height);
  const blurData = blurred.data;

  const radius = 2;
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kernelSum = 16;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0;
      let k = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          r += data[idx] * kernel[k];
          g += data[idx + 1] * kernel[k];
          b += data[idx + 2] * kernel[k];
          k++;
        }
      }
      const idx = (y * width + x) * 4;
      blurData[idx] = r / kernelSum;
      blurData[idx + 1] = g / kernelSum;
      blurData[idx + 2] = b / kernelSum;
    }
  }

  const sharpAmount = amount * 1.2;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] + sharpAmount * (data[i] - blurData[i])));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + sharpAmount * (data[i + 1] - blurData[i + 1])));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + sharpAmount * (data[i + 2] - blurData[i + 2])));
  }

  ctx.putImageData(imageData, 0, 0);
}

export interface ProcessPhotoOptions {
  preset: CountryPreset;
  adjustments?: Partial<ManualAdjustments>;
  sourceImage: HTMLImageElement;
  subjectImage?: HTMLImageElement; // Already background-removed image if available
}

export async function processPassportPhoto(options: ProcessPhotoOptions): Promise<string | { processedUrl: string, bgRemovedUrl?: string }> {
  const { preset, adjustments = {}, sourceImage, subjectImage } = options;

  let processedSource = sourceImage;
  let bgRemovedUrl: string | undefined = undefined;

  if (adjustments.removeBackground) {
    if (subjectImage) {
      processedSource = subjectImage;
    } else {
      const bgRemovedImg = await removeImageBackground(sourceImage);
      if (bgRemovedImg) {
        processedSource = bgRemovedImg;

        // Create a blob URL for caching if it's new
        const canvas = document.createElement('canvas');
        canvas.width = bgRemovedImg.naturalWidth;
        canvas.height = bgRemovedImg.naturalHeight;
        canvas.getContext('2d')?.drawImage(bgRemovedImg, 0, 0);
        bgRemovedUrl = canvas.toDataURL('image/png');
      } else {
        processedSource = sourceImage;
        bgRemovedUrl = undefined;
      }
    }
  }

  const targetW = mmToPx(preset.widthMm, preset.dpi);
  const targetH = mmToPx(preset.heightMm, preset.dpi);

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = processedSource.naturalWidth;
  srcCanvas.height = processedSource.naturalHeight;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.drawImage(processedSource, 0, 0);

  let workCanvas = srcCanvas;

  const rotation = adjustments.rotation ?? 0;
  if (Math.abs(rotation) > 0.5) {
    workCanvas = rotateCanvas(srcCanvas, rotation);
  }

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = targetW;
  outputCanvas.height = targetH;
  const ctx = outputCanvas.getContext('2d', { alpha: true })!;

  const bgColor = adjustments.bgColor ?? preset.bgColor;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, targetW, targetH);

  const zoom = adjustments.zoom ?? 1;
  const baseScale = Math.max(targetW / workCanvas.width, targetH / workCanvas.height);
  const scale = baseScale * zoom;
  const drawW = workCanvas.width * scale;
  const drawH = workCanvas.height * scale;

  const drawX = (targetW - drawW) / 2 + (adjustments.offsetX ?? 0);
  const drawY = (targetH - drawH) / 2 + (adjustments.offsetY ?? 0);

  // Use high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(workCanvas, drawX, drawY, drawW, drawH);

  applyEnhancements(ctx, targetW, targetH, adjustments);
  applyUnsharpMask(ctx, targetW, targetH, 0.4);

  const finalUrl = outputCanvas.toDataURL('image/png', 1.0);

  if (bgRemovedUrl) {
    return { processedUrl: finalUrl, bgRemovedUrl };
  }
  return { processedUrl: finalUrl };
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas to blob failed'));
    }, type, quality);
  });
}

