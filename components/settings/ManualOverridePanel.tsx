'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, Sun, Contrast, ZoomIn, MoveHorizontal, MoveVertical, RefreshCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ManualAdjustments } from '@/lib/types';

const DEFAULT_ADJUSTMENTS: ManualAdjustments = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  brightness: 5,
  contrast: 10,
  sharpness: 30,
  removeBackground: false,
  bgColor: '#FFFFFF',
  rotation: 0,
};

interface ManualOverridePanelProps {
  adjustments: Partial<ManualAdjustments>;
  onChange: (adjustments: Partial<ManualAdjustments>) => void;
  onReprocess: () => void;
  isProcessing?: boolean;
}

export default function ManualOverridePanel({
  adjustments,
  onChange,
  onReprocess,
  isProcessing,
}: ManualOverridePanelProps) {
  const [localAdj, setLocalAdj] = useState<ManualAdjustments>({
    ...DEFAULT_ADJUSTMENTS,
    ...adjustments,
  });

  // Sync with props when they change from outside
  useEffect(() => {
    setLocalAdj((prev) => ({ ...prev, ...adjustments }));
  }, [adjustments]);

  const update = (key: keyof ManualAdjustments, value: number | boolean | string) => {
    const updated = { ...localAdj, [key]: value };
    setLocalAdj(updated);
    onChange(updated);
  };

  const reset = () => {
    setLocalAdj(DEFAULT_ADJUSTMENTS);
    onChange(DEFAULT_ADJUSTMENTS);
  };

  const SliderControl = ({
    label,
    icon,
    adjKey,
    min,
    max,
    step = 1,
    format = (v: number) => v.toFixed(1),
  }: {
    label: string;
    icon: React.ReactNode;
    adjKey: keyof ManualAdjustments;
    min: number;
    max: number;
    step?: number;
    format?: (v: number) => string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{icon}</span>
          <Label className="text-xs font-medium">{label}</Label>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {format(localAdj[adjKey] as number)}
        </span>
      </div>
      <Slider
        value={[localAdj[adjKey] as number]}
        onValueChange={([v]) => update(adjKey, v)}
        min={min}
        max={max}
        step={step}
        className="h-1.5"
      />
    </div>
  );

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Manual Adjustments</h3>
          {isProcessing && (
            <div className="flex items-center gap-1 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-medium text-blue-500">Updating...</span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={reset}>
          <RotateCcw className="mr-1 h-3 w-3" />
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Crop & Position
            </p>
          </div>
          <div className="space-y-3 rounded-lg bg-muted/40 p-3">
            <SliderControl
              label="Zoom"
              icon={<ZoomIn className="h-3.5 w-3.5" />}
              adjKey="zoom"
              min={0.5}
              max={3}
              step={0.05}
              format={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <SliderControl
              label="Horizontal"
              icon={<MoveHorizontal className="h-3.5 w-3.5" />}
              adjKey="offsetX"
              min={-200}
              max={200}
              step={1}
              format={(v) => `${v}px`}
            />
            <SliderControl
              label="Vertical"
              icon={<MoveVertical className="h-3.5 w-3.5" />}
              adjKey="offsetY"
              min={-200}
              max={200}
              step={1}
              format={(v) => `${v}px`}
            />
            <SliderControl
              label="Rotation"
              icon={<RotateCcw className="h-3.5 w-3.5" />}
              adjKey="rotation"
              min={-15}
              max={15}
              step={0.5}
              format={(v) => `${v > 0 ? '+' : ''}${v}°`}
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Enhancement
          </p>
          <div className="space-y-3 rounded-lg bg-muted/40 p-3">
            <SliderControl
              label="Brightness"
              icon={<Sun className="h-3.5 w-3.5" />}
              adjKey="brightness"
              min={-50}
              max={50}
              step={1}
              format={(v) => `${v > 0 ? '+' : ''}${v}`}
            />
            <SliderControl
              label="Contrast"
              icon={<Contrast className="h-3.5 w-3.5" />}
              adjKey="contrast"
              min={-50}
              max={50}
              step={1}
              format={(v) => `${v > 0 ? '+' : ''}${v}`}
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Background
          </p>
          <div className="space-y-3 rounded-lg bg-muted/40 p-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Change Background</Label>
                <p className="text-[10px] text-muted-foreground">AI Subject Isolation</p>
              </div>
              <Switch
                checked={localAdj.removeBackground}
                onCheckedChange={(v) => update('removeBackground', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-medium">Choose Background Color</Label>
                <p className="text-[10px] text-muted-foreground">Applied behind the subject</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localAdj.bgColor}
                  onChange={(e) => update('bgColor', e.target.value)}
                  className="h-7 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
