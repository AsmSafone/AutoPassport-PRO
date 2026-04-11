'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, ImagePlus, CircleAlert as AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_SIZE_MB = 20;
const MAX_FILES = 10;

interface DropZoneProps {
  onFilesSelected: (files: File[], append?: boolean) => void;
  disabled?: boolean;
}

export default function DropZone({ onFilesSelected, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): { valid: File[]; error: string | null } => {
    const valid: File[] = [];
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
        return { valid: [], error: `${file.name} is not a supported format. Use JPG, PNG, or WEBP.` };
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return { valid: [], error: `${file.name} is too large. Max size is ${MAX_SIZE_MB}MB.` };
      }
      valid.push(file);
    }
    if (valid.length > MAX_FILES) {
      return { valid: valid.slice(0, MAX_FILES), error: `Only first ${MAX_FILES} images will be processed.` };
    }
    return { valid, error: null };
  };

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      const { valid, error } = validateFiles(files);
      setError(error);

      if (valid.length > 0) {
        const newPreviews = valid.map((f) => ({
          url: URL.createObjectURL(f),
          name: f.name,
        }));
        setPreviews((prev) => [...prev, ...newPreviews]);
        onFilesSelected(valid);
      }
    },
    [onFilesSelected]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const clearPreviews = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews([]);
    setError(null);
    onFilesSelected([], false);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (previews.length > 0) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {previews.map((preview, i) => (
            <div
              key={i}
              className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted"
            >
              <img
                src={preview.url}
                alt={preview.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-1.5">
                <p className="truncate text-[10px] text-white">{preview.name}</p>
              </div>
            </div>
          ))}
          <button
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[3/4] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 transition-colors hover:border-blue-500 hover:bg-blue-50/10"
          >
            <div className="flex flex-col items-center gap-1">
              <ImagePlus className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Add more</span>
            </div>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {previews.length} photo{previews.length !== 1 ? 's' : ''} selected
          </span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearPreviews}>
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'group relative flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200',
          isDragging
            ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 scale-[1.01]'
            : 'border-border bg-muted/30 hover:border-blue-400 hover:bg-blue-50/10 dark:hover:bg-blue-950/10',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200',
              isDragging ? 'bg-blue-600 scale-110' : 'bg-blue-600/10 group-hover:bg-blue-600/20'
            )}
          >
            <Upload
              className={cn(
                'h-7 w-7 transition-colors',
                isDragging ? 'text-white' : 'text-blue-600'
              )}
              strokeWidth={1.5}
            />
          </div>

          <div>
            <p className="text-base font-semibold text-foreground">
              {isDragging ? 'Drop your photos here' : 'Drop photos or click to browse'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              JPG, PNG, WEBP — Up to {MAX_SIZE_MB}MB per file, {MAX_FILES} photos max
            </p>
          </div>

          <Button
            variant="default"
            size="sm"
            className="pointer-events-none bg-blue-600 hover:bg-blue-700"
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Choose Photos
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
    </div>
  );
}
