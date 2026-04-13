'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Camera, ChevronRight, Wand as Wand2, ArrowLeft, SlidersHorizontal, Images, LayoutTemplate, CircleCheck as CheckCircle2, ImagePlus } from 'lucide-react';
import Header from '@/components/layout/Header';
import StepIndicator from '@/components/layout/StepIndicator';
import DropZone from '@/components/upload/DropZone';
import CountryPresetSelector from '@/components/settings/CountryPresetSelector';
import ProcessingPanel from '@/components/processing/ProcessingPanel';
import PhotoPreviewCard from '@/components/preview/PhotoPreviewCard';
import A4Preview from '@/components/preview/A4Preview';
import InteractiveCropDialog from '@/components/preview/InteractiveCropDialog';
import ExportPanel from '@/components/export/ExportPanel';
import ManualOverridePanel from '@/components/settings/ManualOverridePanel';
import { usePhotoProcessor } from '@/hooks/usePhotoProcessor';
import { COUNTRY_PRESETS, getPresetById, PAPER_SIZES } from '@/lib/presets';
import { CountryPreset, ManualAdjustments, PaperSize, ProcessedPhoto } from '@/lib/types';
import { LayoutGrid, calculateLayout } from '@/lib/layoutGenerator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AppStep = 'upload' | 'process' | 'download';

export default function Home() {
  const [step, setStep] = useState<AppStep>('upload');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [presetId, setPresetId] = useState('bd');
  const [customPreset, setCustomPreset] = useState<Partial<CountryPreset>>({});
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [activeEditId, setActiveEditId] = useState<string | null>(null);
  const [manualAdjustments, setManualAdjustments] = useState<Partial<ManualAdjustments>>({});
  const [activeTab, setActiveTab] = useState<'photos' | 'a4'>('photos');
  const [showInteractiveCrop, setShowInteractiveCrop] = useState(false);
  const [mixMultiple, setMixMultiple] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [customRows, setCustomRows] = useState<number | undefined>(undefined);
  const [customCols, setCustomCols] = useState<number | undefined>(undefined);
  const [customSpacing, setCustomSpacing] = useState<number>(4);
  const [paperId, setPaperId] = useState('a4');
  const [showExport, setShowExport] = useState(true);

  const processor = usePhotoProcessor();

  const effectivePreset = useMemo(() => {
    return presetId === 'custom'
      ? ({ ...COUNTRY_PRESETS.find((p) => p.id === 'custom')!, ...customPreset } as CountryPreset)
      : getPresetById(presetId);
  }, [presetId, customPreset]);

  const paper = useMemo(() =>
    PAPER_SIZES.find(p => p.id === paperId) || PAPER_SIZES[0],
    [paperId]
  );

  const layout = useMemo(() => {
    return calculateLayout(effectivePreset, customSpacing, customSpacing, customCols, customRows, paper);
  }, [effectivePreset, customSpacing, customCols, customRows, paper]);

  const handleFilesSelected = useCallback((files: File[], append: boolean = true) => {
    if (append) {
      setSelectedFiles((prev) => [...prev, ...files]);
    } else {
      setSelectedFiles(files);
    }
  }, []);

  const handleProcess = useCallback(async () => {
    if (!selectedFiles.length) return;
    setStep('process');
    await processor.processFiles(selectedFiles, presetId, manualAdjustments);
    setStep('download');
  }, [selectedFiles, presetId, manualAdjustments, processor]);

  const handleBack = useCallback(() => {
    processor.reset();
    setStep('upload');
    setSelectedFiles([]);
    setShowManualOverride(false);
    setActiveEditId(null);
  }, [processor]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddMore = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAddMoreFiles = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setActiveTab('photos'); // Show the photos grid to see the new additions
      await processor.processFiles(files, presetId, manualAdjustments, true);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processor, presetId, manualAdjustments]);

  const handleManualAdjustmentsChange = useCallback((adj: Partial<ManualAdjustments>) => {
    setManualAdjustments(adj);
  }, []);

  const handleCrop = useCallback((id: string) => {
    setActiveEditId(id);
    setShowInteractiveCrop(true);
  }, []);
  const handleReprocess = useCallback(async () => {
    if (activeEditId) {
      const photo = processor.photos.find((p: ProcessedPhoto) => p.id === activeEditId);
      if (photo) {
        await processor.reprocessPhoto(photo, manualAdjustments, presetId);
      }
    } else if (processor.photos.length > 0) {
      await processor.reprocessAllPhotos(manualAdjustments, presetId);
    }
  }, [activeEditId, manualAdjustments, presetId, processor]);

  const reprocessRef = useRef(handleReprocess);
  useEffect(() => {
    reprocessRef.current = handleReprocess;
  }, [handleReprocess]);

  useEffect(() => {
    if (step === 'download') {
      const timer = setTimeout(() => {
        reprocessRef.current();
      }, 500); // Slightly longer for batch updates
      return () => clearTimeout(timer);
    }
  }, [manualAdjustments, step]); // Removed handleReprocess to break the feedback loop


  const successCount = processor.photos.filter((p: ProcessedPhoto) => p.processedUrl).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAddMoreFiles}
        multiple
        accept="image/*"
        className="hidden"
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {step === 'upload' && (
          <div className="animate-fade-up">
            <HeroSection />

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="space-y-5">
                <SectionCard
                  title="1. Choose Country Preset"
                  icon={<span className="text-base">🌍</span>}
                >
                  <CountryPresetSelector
                    selectedId={presetId}
                    onSelect={setPresetId}
                    customPreset={customPreset}
                    onCustomChange={setCustomPreset}
                  />
                </SectionCard>

                <SectionCard
                  title="2. Upload Your Photos"
                  icon={<Camera className="h-4 w-4 text-blue-600" />}
                >
                  <DropZone onFilesSelected={handleFilesSelected} />
                </SectionCard>
              </div>

              <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
                <PreviewCard preset={effectivePreset} />

                <Button
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all disabled:shadow-none"
                  onClick={handleProcess}
                  disabled={!selectedFiles.length}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Passport Photos
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>

                {!selectedFiles.length && (
                  <p className="text-center text-xs text-muted-foreground">
                    Upload at least one photo to continue
                  </p>
                )}

                <FeaturesGrid />
              </div>
            </div>
          </div>
        )}

        {step === 'process' && (
          <div className="flex min-h-[60vh] items-center justify-center animate-fade-in">
            <div className="w-full max-w-md space-y-4">
              <div className="mb-6 text-center">
                <StepIndicator currentStep="process" />
              </div>
              <ProcessingPanel
                status={processor.status}
                progress={processor.progress}
                message={processor.message}
              />
              {processor.error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
                  {processor.error}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'download' && processor.photos.length > 0 && (
          <div className="animate-fade-up space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleBack} className="h-8">
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Back
                </Button>
                <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">
                    {successCount} photo{successCount !== 1 ? 's' : ''} ready
                  </span>
                </div>
              </div>
              <StepIndicator currentStep="download" />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
                  {[
                    { id: 'photos', label: 'Individual Photos', icon: <Images className="h-3.5 w-3.5" /> },
                    { id: 'a4', label: 'Print Layout', icon: <LayoutTemplate className="h-3.5 w-3.5" /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'photos' | 'a4')}
                      className={cn(
                        'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-medium transition-all',
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'photos' && (
                  <div className="animate-fade-in">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {processor.photos.map((photo) => (
                        <PhotoPreviewCard
                          key={photo.id}
                          photo={photo}
                          onRemove={processor.removePhoto}
                          onEdit={(id) => {
                            setActiveEditId(id);
                            setShowManualOverride(true);
                            setShowExport(false);
                          }}
                          onCrop={handleCrop}
                        />
                      ))}
                      <button
                        onClick={handleAddMore}
                        className="group flex flex-col overflow-hidden rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 transition-all hover:border-blue-400 hover:bg-blue-50/60 dark:border-blue-900/30 dark:bg-blue-950/20 dark:hover:border-blue-700"
                      >
                        <div className="relative flex aspect-[3/4] w-full flex-col items-center justify-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 ring-4 ring-white transition-transform group-hover:scale-110 dark:bg-blue-900/50 dark:ring-blue-950">
                            <ImagePlus className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="bg-white/50 p-2.5 dark:bg-transparent">
                          <div className="flex h-[26px] items-center justify-center rounded-lg border border-blue-100 bg-blue-50/50 px-2 dark:border-blue-900/50 dark:bg-blue-900/20">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                              Add More
                            </span>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'a4' && (
                  <div className="animate-fade-in">
                    <A4Preview
                      photos={processor.photos.filter((p: ProcessedPhoto) => p.processedUrl)}
                      preset={effectivePreset}
                      paper={paper}
                      layout={layout}
                      mixMultiple={mixMultiple}
                      showGuides={showGuides}
                      gutterMm={customSpacing}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
                {/* 1. Manual Adjustments Panel */}
                <button
                  onClick={() => {
                    const newState = !showManualOverride;
                    setShowManualOverride(newState);
                    if (newState) setShowExport(false); // Collapse export when opening manual
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                    <span>Manual Adjustments</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Advanced</span>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform duration-200',
                        showManualOverride && 'rotate-90'
                      )}
                    />
                  </div>
                </button>

                {showManualOverride && (
                  <div className="animate-fade-up">
                    {activeEditId ? (
                      <div className="space-y-2 pb-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs text-muted-foreground font-medium">
                            Editing item #{processor.photos.findIndex((p) => p.id === activeEditId) + 1}
                          </span>
                          <button
                            onClick={() => setActiveEditId(null)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                          >
                            Batch edit all
                          </button>
                        </div>
                      </div>
                    ) : null}
                    <ManualOverridePanel
                      adjustments={manualAdjustments}
                      onChange={handleManualAdjustmentsChange}
                      onReprocess={handleReprocess}
                      isProcessing={processor.status === 'cropping' || processor.status === 'enhancing'}
                    />
                  </div>
                )}

                {/* 2. Export Panel */}
                <button
                  onClick={() => {
                    const newState = !showExport;
                    setShowExport(newState);
                    if (newState) setShowManualOverride(false); // Collapse manual when opening export
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-blue-600" />
                    <span>Download & Export</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform duration-200',
                      showExport && 'rotate-90'
                    )}
                  />
                </button>

                {showExport && (
                  <div className="animate-fade-up">
                    <ExportPanel
                      photos={processor.photos.filter((p: ProcessedPhoto) => p.processedUrl)}
                      preset={effectivePreset}
                      paper={paper}
                      onPaperChange={setPaperId}
                      layout={layout}
                      mixMultiple={mixMultiple}
                      setMixMultiple={setMixMultiple}
                      showGuides={showGuides}
                      setShowGuides={setShowGuides}
                      customRows={customRows}
                      setCustomRows={setCustomRows}
                      customCols={customCols}
                      setCustomCols={setCustomCols}
                      customSpacing={customSpacing}
                      setCustomSpacing={setCustomSpacing}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {showInteractiveCrop && activeEditId && (
        <InteractiveCropDialog
          isOpen={showInteractiveCrop}
          onClose={() => setShowInteractiveCrop(false)}
          imageUrl={processor.photos.find((p: any) => p.id === activeEditId)?.originalUrl || ''}
          preset={effectivePreset}
          initialAdjustments={manualAdjustments}
          onComplete={setManualAdjustments}
        />
      )}

      <footer className="mt-16 border-t border-border/40 bg-card/30 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-600">
              <Camera className="h-3 w-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-foreground">AutoPassport Pro</span>
          </div>
          <p className="text-xs text-muted-foreground">
            100% client-side processing. Your photos never leave your device.
          </p>
        </div>
      </footer>
    </div>
  );
}

function HeroSection() {
  return (
    <div className="text-center py-2">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
        <Wand2 className="h-3 w-3" />
        Instant Passport Photos — Zero effort
      </div>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Passport Photos,{' '}
        <span className="text-blue-600">Simplified</span>
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Upload any photo, crop to ICAO standards, enhance quality,
        and arrange on A4 for printing — all instantly in your browser.
      </p>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function PreviewCard({ preset }: { preset: CountryPreset }) {
  const aspectRatio = preset.widthMm / preset.heightMm;
  const previewH = 90;
  const previewW = previewH * aspectRatio;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold">Selected Format</h3>
      <div className="flex items-center gap-5">
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div
            className="rounded-lg border-2 border-dashed border-blue-300/60 bg-gradient-to-b from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 flex items-center justify-center"
            style={{ width: previewW, height: previewH }}
          >
            <Camera className="h-5 w-5 text-blue-300" strokeWidth={1.5} />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {preset.flag} {preset.name}
          </span>
        </div>

        <div className="space-y-2 text-xs flex-1">
          <Spec label="Size" value={`${preset.widthMm}×${preset.heightMm}mm`} />
          <Spec label="Resolution" value={`${preset.dpi} DPI`} />
          <Spec label="Standard" value="ICAO Compliant" />
          {preset.notes && <Spec label="Background" value={preset.notes} />}
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

function FeaturesGrid() {
  const features = [
    { icon: '✂️', title: 'Smart Crop', desc: 'ICAO head ratios' },
    { icon: '✨', title: 'Auto Enhance', desc: 'Color & sharpness' },
    { icon: '🖨️', title: '300 DPI Export', desc: 'Print-ready PDF' },
    { icon: '🔒', title: 'Privacy First', desc: '100% Client-side' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {features.map((f) => (
        <div
          key={f.title}
          className="rounded-xl border border-border bg-card p-3 text-center transition-colors hover:border-blue-200 hover:bg-blue-50/20 dark:hover:bg-blue-950/10"
        >
          <div className="text-xl">{f.icon}</div>
          <div className="mt-1.5 text-xs font-semibold text-foreground">{f.title}</div>
          <div className="text-[10px] text-muted-foreground leading-relaxed">{f.desc}</div>
        </div>
      ))}
    </div>
  );
}
