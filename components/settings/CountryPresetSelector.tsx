'use client';

import { useState } from 'react';
import { Check, ChevronDown, Settings2 } from 'lucide-react';
import { COUNTRY_PRESETS, getPresetById } from '@/lib/presets';
import { CountryPreset } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CountryPresetSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  customPreset?: Partial<CountryPreset>;
  onCustomChange?: (preset: Partial<CountryPreset>) => void;
}

export default function CountryPresetSelector({
  selectedId,
  onSelect,
  customPreset = {},
  onCustomChange,
}: CountryPresetSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = getPresetById(selectedId);
  const isCustom = selectedId === 'custom';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {COUNTRY_PRESETS.filter((p) => p.id !== 'custom').map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            className={cn(
              'group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-left transition-all hover:border-blue-400',
              selectedId === preset.id
                ? 'border-blue-600 bg-blue-600/5 ring-1 ring-blue-600/30'
                : 'border-border bg-card hover:bg-muted/40'
            )}
          >
            {selectedId === preset.id && (
              <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600">
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </div>
            )}
            <span className="text-xl">{preset.flag}</span>
            <div className="text-center">
              <div className="text-xs font-semibold text-foreground">{preset.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {preset.widthMm}×{preset.heightMm}mm
              </div>
            </div>
          </button>
        ))}

        <button
          onClick={() => onSelect('custom')}
          className={cn(
            'group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-left transition-all hover:border-blue-400',
            isCustom
              ? 'border-blue-600 bg-blue-600/5 ring-1 ring-blue-600/30'
              : 'border-border bg-card hover:bg-muted/40'
          )}
        >
          {isCustom && (
            <div className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600">
              <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
            </div>
          )}
          <span className="text-xl">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
          </span>
          <div className="text-center">
            <div className="text-xs font-semibold text-foreground">Custom</div>
            <div className="text-[10px] text-muted-foreground">Any size</div>
          </div>
        </button>
      </div>

      {isCustom && onCustomChange && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 dark:border-blue-800 dark:bg-blue-950/20">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Width (mm)</Label>
              <Input
                type="number"
                value={customPreset.widthMm ?? 35}
                onChange={(e) => onCustomChange({ ...customPreset, widthMm: Number(e.target.value) })}
                className="mt-1 h-8 text-xs"
                min={10}
                max={200}
              />
            </div>
            <div>
              <Label className="text-xs">Height (mm)</Label>
              <Input
                type="number"
                value={customPreset.heightMm ?? 45}
                onChange={(e) => onCustomChange({ ...customPreset, heightMm: Number(e.target.value) })}
                className="mt-1 h-8 text-xs"
                min={10}
                max={200}
              />
            </div>
            <div>
              <Label className="text-xs">DPI</Label>
              <Input
                type="number"
                value={customPreset.dpi ?? 300}
                onChange={(e) => onCustomChange({ ...customPreset, dpi: Number(e.target.value) })}
                className="mt-1 h-8 text-xs"
                min={72}
                max={600}
                step={50}
              />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{selected.name}</span>
        {' — '}
        {selected.widthMm}×{selected.heightMm}mm at {selected.dpi} DPI
        {selected.notes && ` • ${selected.notes} Background`}
      </div>
    </div>
  );
}
