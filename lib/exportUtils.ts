import { ProcessedPhoto, CountryPreset, PaperSize } from './types';
import { LayoutGrid, renderPaperCanvas } from './layoutGenerator';

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function exportPhotoPng(photo: ProcessedPhoto, filename?: string): Promise<void> {
  const name = filename || `passport-photo-${photo.id}.png`;
  downloadDataUrl(photo.processedUrl, name);
}

export async function exportPaperPdf(
  layout: LayoutGrid,
  photos: ProcessedPhoto[],
  preset: CountryPreset,
  paper: PaperSize,
  mixMultiple: boolean = false,
  showGuides: boolean = false
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const canvas = await renderPaperCanvas(layout, photos, mixMultiple, showGuides);
  const imgData = canvas.toDataURL('image/jpeg', 1.0);

  const pdf = new jsPDF({
    orientation: layout.paperWidthPx > layout.paperHeightPx ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [paper.widthMm, paper.heightMm],
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, paper.widthMm, paper.heightMm);
  pdf.save(`passport-photos-${paper.id}-${preset.id}-${Date.now()}.pdf`);
}

export async function exportPaperPng(
  layout: LayoutGrid,
  photos: ProcessedPhoto[],
  paper: PaperSize,
  mixMultiple: boolean = false,
  showGuides: boolean = false
): Promise<void> {
  const canvas = await renderPaperCanvas(layout, photos, mixMultiple, showGuides);
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  downloadDataUrl(dataUrl, `passport-photos-${paper.id}-${Date.now()}.png`);
}

export async function exportPaperPrint(
  layout: LayoutGrid,
  photos: ProcessedPhoto[],
  paper: PaperSize,
  mixMultiple: boolean = false,
  showGuides: boolean = false
): Promise<void> {
  const canvas = await renderPaperCanvas(layout, photos, mixMultiple, showGuides);
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  
  const iframe = document.createElement('iframe');
  iframe.style.visibility = 'hidden';
  iframe.style.position = 'fixed';
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
            @page { size: ${paper.widthMm}mm ${paper.heightMm}mm; margin: 0; }
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
    const cleanup = () => { if (document.body.contains(iframe)) document.body.removeChild(iframe); };
    iframe.contentWindow?.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 60000);
  }
}

export async function exportBatchZip(photos: ProcessedPhoto[]): Promise<void> {
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    await new Promise((r) => setTimeout(r, 100));
    downloadDataUrl(photo.processedUrl, `passport-photo-${i + 1}.png`);
  }
}
