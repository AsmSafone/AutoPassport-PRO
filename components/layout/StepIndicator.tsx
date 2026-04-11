'use client';

import { Check, Upload, Cpu, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  { id: 'upload', label: 'Upload', icon: <Upload className="h-3.5 w-3.5" /> },
  { id: 'process', label: 'Process', icon: <Cpu className="h-3.5 w-3.5" /> },
  { id: 'download', label: 'Download', icon: <Download className="h-3.5 w-3.5" /> },
];

interface StepIndicatorProps {
  currentStep: 'upload' | 'process' | 'download';
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300',
                  isDone && 'border-blue-600 bg-blue-600 text-white',
                  isActive && 'border-blue-600 bg-blue-600/10 text-blue-600 ring-2 ring-blue-600/20',
                  isUpcoming && 'border-border bg-background text-muted-foreground'
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.icon}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive && 'text-blue-600',
                  isUpcoming && 'text-muted-foreground',
                  isDone && 'text-blue-600'
                )}
              >
                {step.label}
              </span>
            </div>

            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-2 mb-4 h-0.5 w-12 transition-all duration-500',
                  index < currentIndex ? 'bg-blue-600' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
