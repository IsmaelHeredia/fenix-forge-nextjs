"use client";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { Loader2, Download, RotateCcw } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { useJobStore } from "@/lib/job-store";
import { useToastStore } from "@/lib/toast-store";
import { formatTime, formatHumanDuration } from "@/lib/time";
import { VideoTrackItem } from "./video-track-item";
import { ImageDropzone } from "./image-dropzone";
import { PreviewCanvas } from "./preview-canvas";
import { renderVideoRequest } from "@/lib/api/render-video";
import { playCompletionSound } from "@/lib/notify-sound";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useLiveElapsed } from "@/lib/hooks/use-live-elapsed";

export function VideoTab() {
  const tracks = useStudioStore((s) => s.tracks);
  const videoConfigs = useStudioStore((s) => s.videoConfigs);
  const videoGlobal = useStudioStore((s) => s.videoGlobal);
  const setVideoGlobal = useStudioStore((s) => s.setVideoGlobal);
  const reorderTracks = useStudioStore((s) => s.reorderTracks);

  const job = useJobStore((s) => s.jobs.video);
  const startJob = useJobStore((s) => s.startJob);
  const setProgress = useJobStore((s) => s.setProgress);
  const setProcessing = useJobStore((s) => s.setProcessing);
  const finishJob = useJobStore((s) => s.finishJob);
  const failJob = useJobStore((s) => s.failJob);
  const resetJob = useJobStore((s) => s.resetJob);

  const totalDurationSec = useStudioStore((s) => s.totalDurationSec());

  const showToast = useToastStore((s) => s.showToast);

  const sorted = [...tracks].sort((a, b) => a.order - b.order);
  const readyTracks = sorted.filter((t) => t.status === "ready");

  let acc = 0;
  const withStart = sorted.map((t) => {
    const startSec = acc;
    acc += t.durationSec;
    return { track: t, startSec };
  });

  const [previewTrackId, setPreviewTrackId] = useState<string | null>(sorted[0]?.id ?? null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = sorted.findIndex((t) => t.id === active.id);
    const toIndex = sorted.findIndex((t) => t.id === over.id);
    reorderTracks(fromIndex, toIndex);
  }

  const previewTrack = sorted.find((t) => t.id === previewTrackId) ?? sorted[0];
  const previewConfig = previewTrack ? videoConfigs[previewTrack.id] : undefined;

  const effectiveImageUrl =
    videoGlobal.mode === "single-image" ? videoGlobal.singleImagePreviewUrl : previewConfig?.imagePreviewUrl ?? null;

  function handleSingleImageSelect(file: File) {
    if (videoGlobal.singleImagePreviewUrl) URL.revokeObjectURL(videoGlobal.singleImagePreviewUrl);
    setVideoGlobal({ singleImageFile: file, singleImagePreviewUrl: URL.createObjectURL(file) });
  }

  async function handleRender() {
    startJob("video");

    try {
      const blob = await renderVideoRequest({ tracks: readyTracks, videoConfigs, videoGlobal }, (percent) => {
        setProgress("video", percent);
        if (percent >= 100) setProcessing("video");
      });

      const elapsed = (Date.now() - useJobStore.getState().jobs.video.startTime) / 1000;
      const url = URL.createObjectURL(blob);
      finishJob("video", url, elapsed);
      playCompletionSound();
      showToast({
        message: "Video generado con éxito",
        description: `Listo en ${formatHumanDuration(elapsed)}`,
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      failJob("video");
      showToast({ message: "Error al generar el video", description: "Revisá la terminal para más detalle", variant: "error" });
    }
  }

  function handleReset() {
    if (job.resultUrl) URL.revokeObjectURL(job.resultUrl);
    resetJob("video");
  }

  const isBusy = job.status === "uploading" || job.status === "processing";

  const liveElapsed = useLiveElapsed(job.startTime, isBusy);

  if (readyTracks.length === 0) {
    return <p className="py-6 text-center text-sm text-gruvbox-gray">Primero agregá canciones en la pestaña Música.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <div className="space-y-3 rounded-lg border border-gruvbox-gray/20 bg-gruvbox-surface/30 p-4">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gruvbox-text">
                <input
                  type="radio"
                  checked={videoGlobal.mode === "per-track-image"}
                  onChange={() => setVideoGlobal({ mode: "per-track-image" })}
                  className="accent-gruvbox-green"
                />
                Imagen distinta por canción
              </label>
              <label className="flex items-center gap-2 text-sm text-gruvbox-text">
                <input
                  type="radio"
                  checked={videoGlobal.mode === "single-image"}
                  onChange={() => setVideoGlobal({ mode: "single-image" })}
                  className="accent-gruvbox-green"
                />
                Misma imagen para todo el video
              </label>
            </div>

            {videoGlobal.mode === "single-image" && (
              <div className="max-w-xs">
                <ImageDropzone previewUrl={videoGlobal.singleImagePreviewUrl} onSelect={handleSingleImageSelect} />
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-gruvbox-text">
              <input
                type="checkbox"
                checked={videoGlobal.disableAllText}
                onChange={(e) => setVideoGlobal({ disableAllText: e.target.checked })}
                className="accent-gruvbox-green"
              />
              Video sin texto (ignora el texto de cada canción)
            </label>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sorted.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {withStart.map(({ track, startSec }) => (
                  <VideoTrackItem
                    key={track.id}
                    track={track}
                    startSec={startSec}
                    showImageUpload={videoGlobal.mode === "per-track-image"}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="rounded-lg border border-gruvbox-gray/20 bg-gruvbox-surface/30 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-gruvbox-gray">
                {readyTracks.length} de {sorted.length} canciones listas ·{" "}
                <span className="text-gruvbox-text">{formatHumanDuration(totalDurationSec)}</span> total
              </span>

              {job.status === "done" && job.resultUrl ? (
                <div className="flex items-center gap-2">
                  <a
                    href={job.resultUrl}
                    download="video.mp4"
                    className="flex items-center gap-2 rounded-md bg-gruvbox-green px-4 py-2 text-sm font-medium text-gruvbox-bg hover:opacity-90"
                  >
                    <Download className="h-4 w-4" />
                    Descargar MP4
                  </a>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 rounded-md border border-gruvbox-gray/40 px-3 py-2 text-sm text-gruvbox-gray hover:text-gruvbox-text"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRender}
                  disabled={isBusy}
                  className="flex items-center gap-2 rounded-md bg-gruvbox-green px-4 py-2 text-sm font-medium text-gruvbox-bg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {job.status === "idle" && "Generar MP4"}
                  {job.status === "uploading" && "Subiendo..."}
                  {job.status === "processing" && "Renderizando con ffmpeg..."}
                  {job.status === "error" && "Reintentar"}
                </button>
              )}
            </div>

            {job.status === "uploading" && (
              <div className="mt-3">
                <ProgressBar value={job.uploadProgress} />
              </div>
            )}
            {job.status === "processing" && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-gruvbox-gray">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gruvbox-yellow" />
                Dando forma a tu video, llevamos {formatHumanDuration(liveElapsed)}...
              </p>
            )}
            {job.status === "done" && job.elapsedSec !== null && (
              <p className="mt-2 text-xs text-gruvbox-green">
                ✓ Video listo en <span className="text-gruvbox-green">{formatHumanDuration(job.elapsedSec)}</span>
              </p>
            )}
            {job.status === "error" && (
              <p className="mt-2 text-xs text-gruvbox-red">Algo falló. Revisá la terminal para más detalle.</p>
            )}
          </div>
        </div>

        <div className="space-y-2 lg:sticky lg:top-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gruvbox-text">Vista previa</p>
            <select
              value={previewTrackId ?? ""}
              onChange={(e) => setPreviewTrackId(e.target.value)}
              className="max-w-[55%] rounded-md border border-gruvbox-gray/40 bg-gruvbox-surface px-2 py-1 text-xs text-gruvbox-text"
            >
              {sorted.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName}
                </option>
              ))}
            </select>
          </div>
          <PreviewCanvas
            imageUrl={effectiveImageUrl}
            text={previewTrack?.displayName ?? ""}
            showText={!videoGlobal.disableAllText && (previewConfig?.showText ?? true)}
            textColor={previewConfig?.textColor ?? "#ffffff"}
            strokeColor={previewConfig?.textStrokeColor ?? "#000000"}
          />
        </div>
      </div>
    </div>
  );
}