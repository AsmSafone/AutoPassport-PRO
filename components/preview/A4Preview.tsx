'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { ProcessedPhoto, CountryPreset } from '@/lib/types';
import { calculateLayout, renderA4Canvas, LayoutGrid } from '@/lib/layoutGenerator';

interface A4PreviewProps {
  photos: ProcessedPhoto[];
  preset: CountryPreset;
  mixMultiple?: boolean;
  showGuides?: boolean;
  manualRows?: number;
  manualCols?: number;
  gutterMm?: number;
  onLayoutReady?: (layout: LayoutGrid) => void;
}

export default function A4Preview({
  photos,
  preset,
  mixMultiple = false,
  showGuides = true,
  manualRows,
  manualCols,
  gutterMm,
  onLayoutReady,
}: A4PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<LayoutGrid | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [scale, setScale] = useState(1);

  const lastLayoutRef = useRef<string>('');

  const render = useCallback(async () => {
    if (!photos.length) return;
    setIsRendering(true);

    try {
      const newLayout = calculateLayout(preset, undefined, gutterMm, manualCols, manualRows);
      
      // Only notify parent if the layout structure has changed to avoid infinite loops
      const layoutKey = `${newLayout.columns}-${newLayout.rows}-${newLayout.photoWidthPx}-${newLayout.photoHeightPx}-${newLayout.gutterPx}`;
      if (layoutKey !== lastLayoutRef.current) {
        lastLayoutRef.current = layoutKey;
        setLayout(newLayout);
        onLayoutReady?.(newLayout);
      } else if (!layout) {
        setLayout(newLayout);
      }

      const canvas = await renderA4Canvas(newLayout, photos, mixMultiple, showGuides);

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
      console.error('A4 render error:', err);
    } finally {
      setIsRendering(false);
    }
  }, [photos, preset, mixMultiple, showGuides, onLayoutReady, manualRows, manualCols, gutterMm]);

  useEffect(() => {
    render();
  }, [render]);

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
          <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 shadow-sm">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Rendering layout...</span>
          </div>
        </div>
      )}

      <div
        className="mx-auto overflow-hidden rounded-xl shadow-2xl"
        style={{
          width: canvasW * scale || '100%',
          height: canvasH * scale || 'auto',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: canvasW * scale || '100%',
            height: canvasH * scale || 'auto',
            maxWidth: '100%',
          }}
        />
      </div>

      {layout && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{layout.columns}×{layout.rows} grid</span>
          <span>{layout.totalPhotos} photos per sheet</span>
          <span>A4 (210×297mm)</span>
        </div>
      )}
    </div>
  );
}
