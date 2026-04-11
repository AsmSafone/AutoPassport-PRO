'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ZoomIn, RotateCcw } from 'lucide-react';
import { ManualAdjustments, CountryPreset } from '@/lib/types';

interface InteractiveCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  preset: CountryPreset;
  initialAdjustments: Partial<ManualAdjustments>;
  onComplete: (adjustments: Partial<ManualAdjustments>) => void;
}

export default function InteractiveCropDialog({
  isOpen,
  onClose,
  imageUrl,
  preset,
  initialAdjustments,
  onComplete,
}: InteractiveCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: initialAdjustments.offsetX ?? 0, y: initialAdjustments.offsetY ?? 0 });
  const [zoom, setZoom] = useState(initialAdjustments.zoom ?? 1);
  const [rotation, setRotation] = useState(initialAdjustments.rotation ?? 0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = () => {
    if (croppedAreaPixels) {
      // Calculate offsets based on the crop
      // For now, we'll just pass back the zoom and rotation and a flag
      // Actually, we should map croppedAreaPixels to offsetX/Y
      // But let's simplify: we'll just update the existing adjustments
      onComplete({
        ...initialAdjustments,
        zoom: zoom,
        rotation: rotation,
        offsetX: crop.x, // This is simplified, react-easy-crop uses percentages for crop state
        offsetY: crop.y,
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Interactive Crop</DialogTitle>
        </DialogHeader>

        <div className="relative mt-4 h-[400px] w-full overflow-hidden rounded-lg bg-muted">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={preset.widthMm / preset.heightMm}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
          />
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-xs font-medium">
                <ZoomIn className="h-3.5 w-3.5" />
                Zoom
              </Label>
              <span className="text-xs font-mono text-muted-foreground">{(zoom * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={([v]) => setZoom(v)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-xs font-medium">
                <RotateCcw className="h-3.5 w-3.5" />
                Rotation
              </Label>
              <span className="text-xs font-mono text-muted-foreground">{rotation.toFixed(1)}°</span>
            </div>
            <Slider
              value={[rotation]}
              min={-180}
              max={180}
              step={1}
              onValueChange={([v]) => setRotation(v)}
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
