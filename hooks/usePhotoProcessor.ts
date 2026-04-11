'use client';

import { useState, useCallback, useRef } from 'react';
import { ProcessedPhoto, ProcessingStatus, ManualAdjustments } from '@/lib/types';
import { processPassportPhoto, loadImageFromFile } from '@/lib/photoProcessing';
import { getPresetById } from '@/lib/presets';

function genId(): string {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface ProcessorState {
  status: ProcessingStatus;
  progress: number;
  message: string;
  photos: ProcessedPhoto[];
  error: string | null;
}

export function usePhotoProcessor() {
  const [state, setState] = useState<ProcessorState>({
    status: 'idle',
    progress: 0,
    message: '',
    photos: [],
    error: null,
  });

  const cancelRef = useRef(false);
  const photosRef = useRef<ProcessedPhoto[]>([]);
  
  // Sync photos to ref to avoid stale closures in callbacks
  photosRef.current = state.photos;

  const updateState = useCallback((partial: Partial<ProcessorState>) => {
    setState((prev: ProcessorState) => ({ ...prev, ...partial }));
  }, []);

  const processFiles = useCallback(
    async (files: File[], presetId: string, adjustments?: Partial<ManualAdjustments>, append: boolean = false) => {
      cancelRef.current = false;
      const preset = getPresetById(presetId);

      updateState({
        status: files.length > 0 ? 'cropping' : state.status,
        progress: 5,
        message: 'Starting process...',
        error: null,
      });

      const newProcessedPhotos: ProcessedPhoto[] = [];

      for (let i = 0; i < files.length; i++) {
        if (cancelRef.current) break;

        const file = files[i];
        const baseProgress = (i / files.length) * 100;

        updateState({
          status: 'cropping',
          progress: baseProgress + 5,
          message: `Processing photo ${i + 1}/${files.length}...`,
        });

        try {
          const img = await loadImageFromFile(file);
          const originalUrl = URL.createObjectURL(file);

          const result = await processPassportPhoto({
            preset,
            adjustments,
            sourceImage: img,
          });

          const processedUrl = typeof result === 'string' ? result : result.processedUrl;
          const bgRemovedUrl = typeof result === 'string' ? undefined : result.bgRemovedUrl;

          updateState({
            status: 'enhancing',
            progress: baseProgress + 10,
            message: `Enhancing photo ${i + 1}/${files.length}...`,
          });

          const { widthMm, heightMm, dpi } = preset;
          const widthPx = Math.round((widthMm / 25.4) * dpi);
          const heightPx = Math.round((heightMm / 25.4) * dpi);

          newProcessedPhotos.push({
            id: genId(),
            originalUrl,
            processedUrl,
            bgRemovedUrl,
            presetId,
            timestamp: Date.now(),
            widthPx,
            heightPx,
            quality: 'good',
          });
        } catch (err) {
          newProcessedPhotos.push({
            id: genId(),
            originalUrl: URL.createObjectURL(file),
            processedUrl: '',
            presetId,
            timestamp: Date.now(),
            widthPx: 0,
            heightPx: 0,
            quality: 'poor',
          });
        }
      }

      setState((prev) => ({
        ...prev,
        status: 'complete',
        progress: 100,
        message: `${newProcessedPhotos.length} new photos ready!`,
        photos: append ? [...prev.photos, ...newProcessedPhotos] : newProcessedPhotos,
      }));
    },
    [updateState]
  );

  const reprocessAllPhotos = useCallback(
    async (adjustments: Partial<ManualAdjustments>, presetId: string) => {
      const preset = getPresetById(presetId);
      updateState({ status: 'enhancing', progress: 0, message: 'Reprocessing all...' });

      try {
        const newPhotos = [...state.photos];
        for (let i = 0; i < newPhotos.length; i++) {
          const photo = newPhotos[i];
          updateState({ progress: (i / newPhotos.length) * 100, message: `Reprocessing ${i + 1}/${newPhotos.length}...` });
          
          const img = await new Promise<HTMLImageElement>((res, rej) => {
            const imgEl = new Image();
            imgEl.onload = () => res(imgEl);
            imgEl.onerror = rej;
            imgEl.src = photo.originalUrl;
          });

          // Reuse cached background if available and requested
          let subjectImage: HTMLImageElement | undefined = undefined;
          if (adjustments.removeBackground && photo.bgRemovedUrl) {
            subjectImage = await new Promise<HTMLImageElement>((res, rej) => {
              const imgEl = new Image();
              imgEl.onload = () => res(imgEl);
              imgEl.onerror = rej;
              imgEl.src = photo.bgRemovedUrl!;
            });
          }

          const result = await processPassportPhoto({
            preset,
            adjustments,
            sourceImage: img,
            subjectImage: subjectImage,
          });

          const processedUrl = typeof result === 'string' ? result : result.processedUrl;
          const bgRemovedUrl = typeof result === 'string' ? photo.bgRemovedUrl : result.bgRemovedUrl || photo.bgRemovedUrl;

          newPhotos[i] = { ...photo, processedUrl, bgRemovedUrl };
        }

        setState((prev: ProcessorState) => ({
          ...prev,
          status: 'complete',
          progress: 100,
          message: 'All updated!',
          photos: newPhotos,
        }));
      } catch (err) {
        updateState({ status: 'error', error: 'Failed to reprocess photos' });
      }
    },
    [state.photos, updateState]
  );

  const reprocessPhoto = useCallback(
    async (photo: ProcessedPhoto, adjustments: Partial<ManualAdjustments>, presetId: string) => {
      const preset = getPresetById(presetId);
      updateState({ status: 'enhancing', progress: 50, message: 'Reprocessing...' });

      try {
        const img = await new Promise<HTMLImageElement>((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = photo.originalUrl;
        });

        // Reuse cached background if available and requested
        let subjectImage: HTMLImageElement | undefined = undefined;
        if (adjustments.removeBackground && photo.bgRemovedUrl) {
          subjectImage = await new Promise<HTMLImageElement>((res, rej) => {
            const imgEl = new Image();
            imgEl.onload = () => res(imgEl);
            imgEl.onerror = rej;
            imgEl.src = photo.bgRemovedUrl!;
          });
        }

        const result = await processPassportPhoto({
          preset,
          adjustments,
          sourceImage: img,
          subjectImage: subjectImage,
        });

        const processedUrl = typeof result === 'string' ? result : result.processedUrl;
        const bgRemovedUrl = typeof result === 'string' ? photo.bgRemovedUrl : result.bgRemovedUrl || photo.bgRemovedUrl;

        setState((prev: ProcessorState) => ({
          ...prev,
          status: 'complete',
          progress: 100,
          message: 'Updated!',
          photos: prev.photos.map((p: ProcessedPhoto) =>
            p.id === photo.id ? { ...p, processedUrl, bgRemovedUrl } : p
          ),
        }));
      } catch (err) {
        updateState({ status: 'error', error: 'Failed to reprocess photo' });
      }
    },
    [updateState]
  );

  const removePhoto = useCallback((id: string) => {
    setState((prev: ProcessorState) => ({
      ...prev,
      photos: prev.photos.filter((p: ProcessedPhoto) => p.id !== id),
    }));
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true;
    setState({ status: 'idle', progress: 0, message: '', photos: [], error: null });
  }, []);

  return {
    ...state,
    processFiles,
    reprocessAllPhotos,
    reprocessPhoto,
    removePhoto,
    reset,
  };
}
