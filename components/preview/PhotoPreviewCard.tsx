'use client';

import { useState } from 'react';
import { CircleCheck as CheckCircle2, TriangleAlert as AlertTriangle, Circle as XCircle, Trash2, Settings, ArrowLeftRight, Scissors } from 'lucide-react';
import { ProcessedPhoto } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import BeforeAfterSlider from './BeforeAfterSlider';

interface PhotoPreviewCardProps {
  photo: ProcessedPhoto;
  onRemove: (id: string) => void;
  onEdit?: (id: string) => void;
  onCrop?: (id: string) => void;
}

const qualityConfig = {
  good: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  adjust: {
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
  },
  poor: {
    icon: <XCircle className="h-3.5 w-3.5" />,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/40',
    border: 'border-red-200 dark:border-red-800',
  },
};

export default function PhotoPreviewCard({ photo, onRemove, onEdit, onCrop }: PhotoPreviewCardProps) {
  const [showComparison, setShowComparison] = useState(false);
  const qc = qualityConfig[photo.quality];

  if (!photo.processedUrl) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
        <XCircle className="mx-auto mb-2 h-6 w-6 text-destructive" />
        <p className="text-xs text-destructive">Processing failed</p>
        <Button variant="ghost" size="sm" className="mt-2 h-6 text-xs" onClick={() => onRemove(photo.id)}>
          Remove
        </Button>
      </div>
    );
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[3/4] bg-muted">
        {showComparison && photo.originalUrl ? (
          <BeforeAfterSlider
            beforeUrl={photo.originalUrl}
            afterUrl={photo.processedUrl}
            className="h-full w-full"
          />
        ) : (
          <img
            src={photo.processedUrl}
            alt="Processed passport photo"
            className="h-full w-full object-cover"
          />
        )}

        <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100">
          {photo.originalUrl && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              title="Compare before/after"
            >
              <ArrowLeftRight className="h-3 w-3" />
            </button>
          )}
          {onCrop && (
            <button
              onClick={() => onCrop(photo.id)}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600/90 text-white backdrop-blur-sm transition-colors hover:bg-blue-600"
              title="Crop Photo"
            >
              <Scissors className="h-3 w-3" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(photo.id)}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              title="Adjustments"
            >
              <Settings className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => onRemove(photo.id)}
            className="flex h-6 w-6 items-center justify-center rounded-md bg-red-600/80 text-white backdrop-blur-sm transition-colors hover:bg-red-600"
            title="Remove"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="p-2.5">
        <div className="flex items-center justify-between">
          <div className={cn('flex items-center gap-1.5 rounded-lg border px-2 py-1', qc.bg, qc.border)}>
            <span className={qc.color}>{qc.icon}</span>
            <span className={cn('text-[10px] font-semibold uppercase tracking-wider', qc.color)}>
              {photo.quality}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            {photo.widthPx}×{photo.heightPx}px
          </span>
        </div>
      </div>
    </div>
  );
}
