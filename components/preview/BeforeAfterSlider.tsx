'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  className?: string;
}

export default function BeforeAfterSlider({ beforeUrl, afterUrl, className }: BeforeAfterSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return 50;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.min(100, Math.max(0, (x / rect.width) * 100));
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) setPosition(getPosition(e.clientX));
    },
    [isDragging, getPosition]
  );

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging) setPosition(getPosition(e.touches[0].clientX));
    },
    [isDragging, getPosition]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp, onTouchMove]);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden rounded-xl select-none cursor-col-resize', className)}
      onMouseDown={onMouseDown}
      onTouchStart={(e) => {
        setIsDragging(true);
        setPosition(getPosition(e.touches[0].clientX));
      }}
    >
      <img
        src={beforeUrl}
        alt="Before"
        className="w-full h-full object-cover"
        draggable={false}
      />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={afterUrl}
          alt="After"
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.4)]"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-white/50">
          <GripVertical className="h-4 w-4 text-gray-600" />
        </div>
      </div>

      <div className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
        Original
      </div>
      <div className="absolute right-2 top-2 rounded bg-blue-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
        Processed
      </div>
    </div>
  );
}
