'use client';

import { useEffect, useRef } from 'react';
import { Loader as Loader2, Cpu, Scan, Sparkles, CircleCheck as CheckCircle2 } from 'lucide-react';
import { ProcessingStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProcessingPanelProps {
  status: ProcessingStatus;
  progress: number;
  message: string;
}

const statusIcons: Record<ProcessingStatus, React.ReactNode> = {
  idle: null,
  cropping: <Cpu className="h-5 w-5" />,
  enhancing: <Sparkles className="h-5 w-5" />,
  complete: <CheckCircle2 className="h-5 w-5" />,
  error: null,
};

const statusColors: Record<ProcessingStatus, string> = {
  idle: 'text-muted-foreground',
  cropping: 'text-amber-500',
  enhancing: 'text-emerald-500',
  complete: 'text-emerald-600',
  error: 'text-destructive',
};

const processingSteps = [
  { label: 'Loading AI', key: 'cropping', threshold: 10 },
  { label: 'Processing background', key: 'cropping', threshold: 40 },
  { label: 'Aligning & cropping', key: 'cropping', threshold: 70 },
  { label: 'Enhancing quality', key: 'enhancing', threshold: 90 },
  { label: 'Finalizing', key: 'enhancing', threshold: 98 },
];

export default function ProcessingPanel({ status, progress, message }: ProcessingPanelProps) {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.width = `${progress}%`;
    }
  }, [progress]);

  if (status === 'idle') return null;

  const isProcessing = status !== 'complete' && status !== 'error';
  const currentStepIdx = processingSteps.findLastIndex((s) => progress >= s.threshold);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
            status === 'complete' ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-blue-100 dark:bg-blue-950'
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          ) : status === 'complete' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          ) : (
            statusIcons[status]
          )}
        </div>
        <div>
          <div className={cn('text-sm font-semibold', statusColors[status])}>
            {status === 'complete' ? 'Processing Complete!' : status === 'error' ? 'Processing Failed' : 'Processing...'}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{message}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span className="font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            ref={progressRef}
            className={cn(
              'h-full rounded-full transition-all duration-300',
              status === 'complete' ? 'bg-emerald-500' : 'bg-blue-600'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {isProcessing && (
        <div className="mt-4 space-y-1.5">
          {processingSteps.map((step, i) => {
            const isActive = i === currentStepIdx + 1;
            const isDone = i <= currentStepIdx;
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-all',
                  isActive && 'bg-blue-50 dark:bg-blue-950/40',
                  isDone && 'opacity-60'
                )}
              >
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors',
                    isDone ? 'bg-emerald-500' : isActive ? 'bg-blue-500 animate-pulse' : 'bg-border'
                  )}
                />
                <span
                  className={cn(
                    isDone ? 'text-muted-foreground line-through' : isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
                {isActive && <Loader2 className="ml-auto h-3 w-3 animate-spin text-blue-500" />}
                {isDone && <CheckCircle2 className="ml-auto h-3 w-3 text-emerald-500" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
