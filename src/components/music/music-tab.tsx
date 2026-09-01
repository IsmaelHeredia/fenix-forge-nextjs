"use client";
import { Loader2, Download, RotateCcw } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { useJobStore } from "@/lib/job-store";
import { useToastStore } from "@/lib/toast-store";
import { formatTime, formatHumanDuration } from "@/lib/time";
import { mergeAudioRequest } from "@/lib/api/merge-audio";
import { playCompletionSound } from "@/lib/notify-sound";
import { UploadDropzone } from "./upload-dropzone";
import { TrackList } from "./track-list";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useLiveElapsed } from "@/lib/hooks/use-live-elapsed";

export function MusicTab() {
  const tracks = useStudioStore((s) => s.tracks);
  const totalDurationSec = useStudioStore((s) => s.totalDurationSec());
  const readyCount = tracks.filter((t) => t.status === "ready").length;

  const job = useJobStore((s) => s.jobs.music);
  const startJob = useJobStore((s) => s.startJob);
  const setProgress = useJobStore((s) => s.setProgress);
  const setProcessing = useJobStore((s) => s.setProcessing);
  const finishJob = useJobStore((s) => s.finishJob);
  const failJob = useJobStore((s) => s.failJob);
  const resetJob = useJobStore((s) => s.resetJob);

  const showToast = useToastStore((s) => s.showToast);

  async function handleMerge() {
    startJob("music");

    const sorted = [...tracks].sort((a, b) => a.order - b.order);
    const files = sorted.map((t) => t.file);

    try {
      const blob = await mergeAudioRequest(files, (percent) => {
        setProgress("music", percent);
        if (percent >= 100) setProcessing("music");
      });

      const elapsed = (Date.now() - useJobStore.getState().jobs.music.startTime) / 1000;
      const url = URL.createObjectURL(blob);
      finishJob("music", url, elapsed);
      playCompletionSound();
      showToast({
        message: "MP3 combinado con éxito",
        description: `Listo en ${formatHumanDuration(elapsed)}`,
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      failJob("music");
      showToast({ message: "Error al combinar el audio", description: "Revisá la terminal para más detalle", variant: "error" });
    }
  }

  function handleReset() {
    if (job.resultUrl) URL.revokeObjectURL(job.resultUrl);
    resetJob("music");
  }

  const isBusy = job.status === "uploading" || job.status === "processing";

  const liveElapsed = useLiveElapsed(job.startTime, isBusy);

  return (
    <div className="space-y-6">
      <UploadDropzone />
      <TrackList />

      {tracks.length > 0 && (
        <div className="rounded-lg border border-gruvbox-gray/20 bg-gruvbox-surface/30 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gruvbox-gray">
              {readyCount} de {tracks.length} canciones listas ·{" "}
              <span className="text-gruvbox-text">{formatHumanDuration(totalDurationSec)}</span> total
            </div>

            {job.status === "done" && job.resultUrl ? (
              <div className="flex items-center gap-2">
                <a
                  href={job.resultUrl}
                  download="mix.mp3"
                  className="flex items-center gap-2 rounded-md bg-gruvbox-green px-4 py-2 text-sm font-medium text-gruvbox-bg hover:opacity-90"
                >
                  <Download className="h-4 w-4" />
                  Descargar MP3
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
                onClick={handleMerge}
                disabled={readyCount === 0 || readyCount !== tracks.length || isBusy}
                className="flex items-center gap-2 rounded-md bg-gruvbox-green px-4 py-2 text-sm font-medium text-gruvbox-bg disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                {job.status === "idle" && "Combinar MP3"}
                {job.status === "uploading" && "Subiendo..."}
                {job.status === "processing" && "Combinando con ffmpeg..."}
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
              Combinando tus canciones, llevamos {formatHumanDuration(liveElapsed)}...
            </p>
          )}

          {job.status === "done" && job.elapsedSec !== null && (
            <p className="mt-2 text-xs text-gruvbox-green">
              ✓ Listo en <span className="text-gruvbox-green">{formatHumanDuration(job.elapsedSec)}</span>
            </p>
          )}

          {job.status === "error" && (
            <p className="mt-2 text-xs text-gruvbox-red">
              Algo falló. Revisá la terminal para más detalle.
            </p>
          )}
        </div>
      )}
    </div>
  );
}