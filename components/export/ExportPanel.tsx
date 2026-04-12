'use client';

import { useState } from 'react';
import { Download, FileImage, Printer, Grid3x3 as Grid3X3, Layers, ChevronRight, Loader as Loader2, Check, LayoutGrid, Images } from 'lucide-react';
import { ProcessedPhoto, CountryPreset } from '@/lib/types';
import { LayoutGrid as LayoutGridType } from '@/lib/layoutGenerator';
import {
  exportPhotoPng,
  exportA4Pdf,
  exportA4Png,
  exportA4Print,
  exportBatchZip,
} from '@/lib/exportUtils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ExportPanelProps {
  photos: ProcessedPhoto[];
  preset: CountryPreset;
  layout: LayoutGridType | null;
  mixMultiple: boolean;
  setMixMultiple: (val: boolean) => void;
  showGuides: boolean;
  setShowGuides: (val: boolean) => void;
  customRows: number | undefined;
  setCustomRows: (val: number | undefined) => void;
  customCols: number | undefined;
  setCustomCols: (val: number | undefined) => void;
  customSpacing: number;
  setCustomSpacing: (val: number) => void;
}

type ExportOption = 'single-png' | 'a4-pdf' | 'a4-png' | 'batch';

export default function ExportPanel({
  photos,
  preset,
  layout,
  mixMultiple,
  setMixMultiple,
  showGuides,
  setShowGuides,
  customRows,
  setCustomRows,
  customCols,
  setCustomCols,
  customSpacing,
  setCustomSpacing,
}: ExportPanelProps) {
  const [loading, setLoading] = useState<ExportOption | null>(null);
  const [success, setSuccess] = useState<ExportOption | null>(null);

  const activePhoto = photos[0];

  const maxCols = Math.max(1, Math.floor((210 - customSpacing) / (preset.widthMm + customSpacing)));
  const maxRows = Math.max(1, Math.floor((297 - customSpacing) / (preset.heightMm + customSpacing)));

  const handleExport = async (type: ExportOption) => {
    if (!photos.length || loading) return;
    setLoading(type);
    setSuccess(null);

    try {
      switch (type) {
        case 'single-png':
          if (activePhoto) {
            await exportPhotoPng(activePhoto, `passport-${preset.id}-${Date.now()}.png`);
          }
          break;
        case 'a4-pdf':
          if (layout) {
            // Trigger both in parallel to avoid one finishing and stopping the other
            await Promise.all([
              exportA4Pdf(layout, photos, preset, mixMultiple, showGuides),
              exportA4Print(layout, photos, mixMultiple, showGuides)
            ]);
          }
          break;
        case 'a4-png':
          if (layout) {
            await exportA4Png(layout, photos, mixMultiple, showGuides);
          }
          break;
        case 'batch':
          await exportBatchZip(photos);
          break;
      }
      setSuccess(type);
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setLoading(null);
    }
  };

  const exportButtons = [
    {
      id: 'a4-pdf' as ExportOption,
      icon: <Printer className="h-4 w-4" />,
      label: 'Print-Ready PDF',
      description: `A4 sheet with ${layout?.totalPhotos ?? '—'} photos`,
      primary: true,
      disabled: !layout,
    },
    {
      id: 'single-png' as ExportOption,
      icon: <FileImage className="h-4 w-4" />,
      label: 'Single Photo PNG',
      description: `${activePhoto?.widthPx ?? '—'}×${activePhoto?.heightPx ?? '—'}px high quality`,
      primary: false,
      disabled: !activePhoto,
    },
    {
      id: 'a4-png' as ExportOption,
      icon: <LayoutGrid className="h-4 w-4" />,
      label: 'A4 Sheet PNG',
      description: 'Full-resolution sheet as image',
      primary: false,
      disabled: !layout,
    },
    ...(photos.length > 1
      ? [
        {
          id: 'batch' as ExportOption,
          icon: <Images className="h-4 w-4" />,
          label: `Batch Download (${photos.length} photos)`,
          description: 'Each photo as individual PNG',
          primary: false,
          disabled: false,
        },
      ]
      : []),
  ];

  return (
    <div className="space-y-4">
      {layout && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Layout Options
          </h4>

          {photos.length > 1 && (
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Mix Photos</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Alternate {photos.length} uploaded photos
                </p>
              </div>
              <Switch
                checked={mixMultiple}
                onCheckedChange={setMixMultiple}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Show Cut Guides</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dashed lines for precise cutting
              </p>
            </div>
            <Switch
              checked={showGuides}
              onCheckedChange={setShowGuides}
            />
          </div>

          <div className="pt-2 border-t border-border/50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Columns</Label>
                <Input
                  type="number"
                  value={Math.min(customCols ?? layout.columns, maxCols)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setCustomCols(Math.min(val, maxCols));
                  }}
                  className="h-8 text-xs"
                  max={maxCols}
                  min={1}
                />
                <p className="text-[9px] text-muted-foreground mt-0.5">Max: {maxCols}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Rows</Label>
                <Input
                  type="number"
                  value={Math.min(customRows ?? layout.rows, maxRows)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setCustomRows(Math.min(val, maxRows));
                  }}
                  className="h-8 text-xs"
                  max={maxRows}
                  min={1}
                />
                <p className="text-[9px] text-muted-foreground mt-0.5">Max: {maxRows}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Spacing (mm)</Label>
                <span className="text-xs font-medium">{customSpacing}mm</span>
              </div>
              <Slider
                value={[customSpacing]}
                onValueChange={(vals) => {
                  const newSpacing = vals[0];
                  setCustomSpacing(newSpacing);
                  
                  // Auto-clamp existing manual settings if they no longer fit
                  if (customCols) {
                    const newMaxCols = Math.max(1, Math.floor((210 - newSpacing) / (preset.widthMm + newSpacing)));
                    if (customCols > newMaxCols) setCustomCols(newMaxCols);
                  }
                  if (customRows) {
                    const newMaxRows = Math.max(1, Math.floor((297 - newSpacing) / (preset.heightMm + newSpacing)));
                    if (customRows > newMaxRows) setCustomRows(newMaxRows);
                  }
                }}
                max={20}
                min={0}
                step={0.5}
                className="py-1"
              />
            </div>

            <button
              onClick={() => {
                setCustomCols(undefined);
                setCustomRows(undefined);
                setCustomSpacing(4);
              }}
              className="text-[10px] text-blue-600 hover:underline font-medium"
            >
              Reset to Auto Layout
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {exportButtons.map((btn) => {
          const isLoading = loading === btn.id;
          const isSuccess = success === btn.id;

          return (
            <button
              key={btn.id}
              onClick={() => handleExport(btn.id)}
              disabled={btn.disabled || !!loading}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                btn.primary
                  ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                  : 'border-border bg-card hover:border-blue-400 hover:bg-blue-50/10 dark:hover:bg-blue-950/10 disabled:opacity-50',
                isSuccess && !btn.primary && 'border-emerald-500 bg-emerald-50/20'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                  btn.primary ? 'bg-white/20' : 'bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40'
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSuccess ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  btn.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('text-sm font-semibold', btn.primary ? 'text-white' : 'text-foreground')}>
                  {btn.label}
                </div>
                <div className={cn('text-xs', btn.primary ? 'text-blue-100' : 'text-muted-foreground')}>
                  {btn.description}
                </div>
              </div>
              {!isLoading && !isSuccess && (
                <ChevronRight
                  className={cn(
                    'h-4 w-4 shrink-0 opacity-50',
                    btn.primary ? 'text-white' : 'text-foreground'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
