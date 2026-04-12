'use client';

import { useState } from 'react';
import { FileImage, Printer, ChevronRight, Loader as Loader2, Check, LayoutGrid, Images, Layout } from 'lucide-react';
import { ProcessedPhoto, CountryPreset, PaperSize } from '@/lib/types';
import { LayoutGrid as LayoutGridType } from '@/lib/layoutGenerator';
import { PAPER_SIZES } from '@/lib/presets';
import {
  exportPhotoPng,
  exportPaperPdf,
  exportPaperPng,
  exportPaperPrint,
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
  paper: PaperSize;
  onPaperChange: (id: string) => void;
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
  paper,
  onPaperChange,
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
  const maxCols = Math.max(1, Math.floor((paper.widthMm - customSpacing) / (preset.widthMm + customSpacing)));
  const maxRows = Math.max(1, Math.floor((paper.heightMm - customSpacing) / (preset.heightMm + customSpacing)));

  const handleExport = async (type: ExportOption) => {
    if (!photos.length || loading) return;
    setLoading(type);
    setSuccess(null);

    try {
      switch (type) {
        case 'single-png':
          if (activePhoto) await exportPhotoPng(activePhoto, `passport-${preset.id}-${Date.now()}.png`);
          break;
        case 'a4-pdf':
          if (layout) {
            await Promise.all([
              exportPaperPdf(layout, photos, preset, paper, mixMultiple, showGuides),
              exportPaperPrint(layout, photos, paper, mixMultiple, showGuides)
            ]);
          }
          break;
        case 'a4-png':
          if (layout) await exportPaperPng(layout, photos, paper, mixMultiple, showGuides);
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
      label: `Print Sheet PDF`,
      description: `Print ${layout?.totalPhotos ?? '—'} photos`,
      primary: true,
      disabled: !layout,
    },
    {
      id: 'single-png' as ExportOption,
      icon: <FileImage className="h-4 w-4" />,
      label: 'Single Photo PNG',
      description: `${activePhoto?.widthPx ?? '—'}×${activePhoto?.heightPx ?? '—'}px quality`,
      primary: false,
      disabled: !activePhoto,
    },
    {
      id: 'a4-png' as ExportOption,
      icon: <LayoutGrid className="h-4 w-4" />,
      label: 'Download Sheet PNG',
      description: 'The entire layout as high-res image',
      primary: false,
      disabled: !layout,
    },
    ...(photos.length > 1
      ? [
        {
          id: 'batch' as ExportOption,
          icon: <Images className="h-4 w-4" />,
          label: `Batch Download (${photos.length} photos)`,
          description: 'Save all processed photos as PNG',
          primary: false,
          disabled: false,
        },
      ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4 shadow-sm">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2">
          <Layout className="h-3 w-3" /> Paper & Layout Settings
        </h4>

        {/* Paper Size Selector */}
        <div className="grid grid-cols-2 gap-2">
          {PAPER_SIZES.map((p) => (
            <button
              key={p.id}
              onClick={() => onPaperChange(p.id)}
              className={cn(
                'group relative rounded-lg border px-3 py-2 text-left transition-all',
                paper.id === p.id
                  ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'border-border bg-card hover:bg-accent hover:border-blue-400/50'
              )}
            >
              <div className="text-[11px] font-bold truncate">{p.name}</div>
              <div className="text-[9px] opacity-70 font-medium">{p.widthMm}×{p.heightMm}mm</div>
              {paper.id === p.id && (
                <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {/* Visibility & Mix Toggles */}
        <div className="pt-2 border-t border-border/50 space-y-2.5">
          {photos.length > 1 && (
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold">Mix Photos</Label>
                <p className="text-[10px] text-muted-foreground leading-tight">Alternate uploaded images in grid</p>
              </div>
              <Switch checked={mixMultiple} onCheckedChange={setMixMultiple} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-semibold">Show Cut Guides</Label>
              <p className="text-[10px] text-muted-foreground leading-tight">Darker dashed lines for easy cutting</p>
            </div>
            <Switch checked={showGuides} onCheckedChange={setShowGuides} />
          </div>
        </div>

        {/* Manual Grid Controls */}
        <div className="pt-2 border-t border-border/50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Columns</Label>
              <Input
                type="number"
                value={Math.min(customCols ?? layout?.columns ?? 1, maxCols)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomCols(Math.min(parseInt(e.target.value) || 1, maxCols))}
                className="h-8 text-xs bg-background/50"
                max={maxCols} min={1}
              />
              <p className="text-[9px] font-medium text-muted-foreground px-1">Max: {maxCols}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Rows</Label>
              <Input
                type="number"
                value={Math.min(customRows ?? layout?.rows ?? 1, maxRows)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomRows(Math.min(parseInt(e.target.value) || 1, maxRows))}
                className="h-8 text-xs bg-background/50"
                max={maxRows} min={1}
              />
              <p className="text-[9px] font-medium text-muted-foreground px-1">Max: {maxRows}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Photo Spacing</Label>
              <span className="text-xs font-bold text-blue-600">{customSpacing}mm</span>
            </div>
            <Slider
              value={[customSpacing]}
              onValueChange={(vals) => setCustomSpacing(vals[0])}
              max={20} min={0} step={0.5} className="py-1"
            />
          </div>

          <button
            onClick={() => {
              setCustomCols(undefined);
              setCustomRows(undefined);
              setCustomSpacing(4);
            }}
            className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-bold transition-colors"
          >
            Reset to Optimized Layout
          </button>
        </div>
      </div>

      {/* Export Options Buttons */}
      <div className="grid gap-2">
        {exportButtons.map((btn) => {
          const isLoading = loading === btn.id;
          const isSuccess = success === btn.id;

          return (
            <button
              key={btn.id}
              onClick={() => handleExport(btn.id as ExportOption)}
              disabled={btn.disabled || !!loading}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all relative overflow-hidden',
                btn.primary
                  ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10'
                  : 'border-border bg-card hover:border-blue-400/50 hover:bg-muted/50 dark:hover:bg-blue-950/10 shadow-sm',
                isSuccess && !btn.primary && 'border-emerald-500 bg-emerald-50/20'
              )}
            >
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                btn.primary ? 'bg-white/20' : 'bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40'
              )}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSuccess ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  btn.icon
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('text-sm font-bold', btn.primary ? 'text-white' : 'text-foreground')}>
                  {btn.label}
                </div>
                <div className={cn('text-[11px]', btn.primary ? 'text-blue-100' : 'text-muted-foreground')}>
                  {btn.description}
                </div>
              </div>
              <ChevronRight className={cn(
                'h-4 w-4 opacity-30 transition-transform group-hover:translate-x-0.5',
                btn.primary ? 'text-white' : 'text-foreground'
              )} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
