import { ProcessedPhoto, DownloadHistoryItem, CountryPreset } from './types';
import { LayoutGrid, renderA4Canvas } from './layoutGenerator';

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function exportPhotoPng(
  photo: ProcessedPhoto,
  filename?: string
): Promise<void> {
  const name = filename || `passport-photo-${photo.id}.png`;
  downloadDataUrl(photo.processedUrl, name);
}

export async function exportA4Pdf(
  layout: LayoutGrid,
  photos: ProcessedPhoto[],
  preset: CountryPreset,
  mixMultiple: boolean = false,
  showGuides: boolean = false
): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const canvas = await renderA4Canvas(layout, photos, mixMultiple, showGuides);
  const imgData = canvas.toDataURL('image/jpeg', 1.0);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  pdf.save(`passport-photos-a4-${preset.id}-${Date.now()}.pdf`);
}

export async function exportA4Png(
  layout: LayoutGrid,
  photos: ProcessedPhoto[],
  mixMultiple: boolean = false,
  showGuides: boolean = false
): Promise<void> {
  const canvas = await renderA4Canvas(layout, photos, mixMultiple, showGuides);
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  downloadDataUrl(dataUrl, `passport-photos-a4-${Date.now()}.png`);
}

export async function exportA4Print(
  layout: LayoutGrid,
  photos: ProcessedPhoto[],
  mixMultiple: boolean = false,
  showGuides: boolean = false
): Promise<void> {
  const canvas = await renderA4Canvas(layout, photos, mixMultiple, showGuides);
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  
  const iframe = document.createElement('iframe');
  iframe.style.visibility = 'hidden';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  
  document.body.appendChild(iframe);
  
  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.write(`
      <html>
        <head>
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }
            img { width: 100%; height: auto; display: block; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="setTimeout(() => { window.focus(); window.print(); }, 200);" />
        </body>
      </html>
    `);
    doc.close();
    
    // Cleanup after printing
    const cleanup = () => {
      document.body.removeChild(iframe);
    };
    
    iframe.contentWindow?.addEventListener('afterprint', cleanup);
    // Safety cleanup if afterprint doesn't fire
    setTimeout(() => {
      if (document.body.contains(iframe)) cleanup();
    }, 60000);
  }
}

export async function exportBatchZip(photos: ProcessedPhoto[]): Promise<void> {
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    await new Promise((r) => setTimeout(r, 100));
    downloadDataUrl(photo.processedUrl, `passport-photo-${i + 1}.png`);
  }
}

