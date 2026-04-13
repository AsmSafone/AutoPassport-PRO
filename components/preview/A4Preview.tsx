'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { ProcessedPhoto, CountryPreset, PaperSize } from '@/lib/types';
import { renderPaperCanvas, LayoutGrid } from '@/lib/layoutGenerator';

interface A4PreviewProps {
  photos: ProcessedPhoto[];
  preset: CountryPreset;
  paper: PaperSize;
  layout: LayoutGrid;
  mixMultiple?: boolean;
  showGuides?: boolean;
  gutterMm?: number;
}

export default function A4Preview({
  photos,
  preset,
  paper,
  layout,
  mixMultiple = false,
  showGuides = true,
}: A4PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [scale, setScale] = useState(1);

  const render = useCallback(async () => {
    if (!photos.length || !layout) return;
    setIsRendering(true);

    try {
      const canvas = await renderPaperCanvas(layout, photos, mixMultiple, showGuides);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')!;
        canvasRef.current.width = canvas.width;
        canvasRef.current.height = canvas.height;
        ctx.drawImage(canvas, 0, 0);
        if (containerRef.current) {
          const containerW = containerRef.current.clientWidth - 32;
          setScale(containerW / canvas.width);
        }
      }
    } catch (err) {
      console.error('Render error:', err);
    } finally {
      setIsRendering(false);
    }
  }, [photos, layout, mixMultiple, showGuides]);

  useEffect(() => { render(); }, [render]);
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (canvasRef.current && containerRef.current) {
        const containerW = containerRef.current.clientWidth - 32;
        setScale(containerW / canvasRef.current.width);
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const canvasW = canvasRef.current?.width ?? 0;
  const canvasH = canvasRef.current?.height ?? 0;

  return (
    <div ref={containerRef} className="relative">
      {isRendering && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 shadow-sm border">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Updating...</span>
          </div>
        </div>
      )}
      <div className="mx-auto overflow-hidden rounded-xl shadow-2xl border bg-white" style={{ width: canvasW * scale || '100%', height: canvasH * scale || 'auto' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{layout.columns}×{layout.rows} grid</span>
        <span>{layout.totalPhotos} photos</span>
        <span>{paper.name}</span>
      </div>
    </div>
  );
}
