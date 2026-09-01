"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Loader2, Play, Square } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { formatTime, formatHumanDuration } from "@/lib/time";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { MusicTrack } from "@/types/track";

export function TrackItem({
  track,
  startSec,
  isPlaying,
  onTogglePlay,
}: {
  track: MusicTrack;
  startSec: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
}) {
  const removeTrack = useStudioStore((s) => s.removeTrack);
  const setDisplayName = useStudioStore((s) => s.setDisplayName);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const endSec = startSec + track.durationSec;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-3 rounded-lg border border-gruvbox-gray/20 bg-gruvbox-surface/50 px-3 py-2.5 sm:flex-nowrap"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-gruvbox-gray hover:text-gruvbox-text active:cursor-grabbing"
        aria-label="Reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="w-5 shrink-0 font-mono text-xs text-gruvbox-gray">
        {String(track.order + 1).padStart(2, "0")}
      </span>

      {track.status === "ready" && (
        <button
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Detener" : "Reproducir"}
          title={isPlaying ? "Detener" : "Reproducir"}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
            isPlaying
              ? "border-gruvbox-green bg-gruvbox-green text-gruvbox-bg"
              : "border-gruvbox-gray/40 text-gruvbox-text hover:border-gruvbox-green hover:text-gruvbox-green"
          }`}
        >
          {isPlaying ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}
        </button>
      )}

      <div className="min-w-0 flex-1">
        {track.status === "reading" ? (
          <div className="space-y-1.5">
            <p className="truncate text-sm text-gruvbox-text">{track.fileName}</p>
            <ProgressBar value={track.uploadProgress} />
          </div>
        ) : track.status === "error" ? (
          <p className="text-sm text-gruvbox-red">Error leyendo {track.fileName}</p>
        ) : (
          <input
            value={track.displayName}
            onChange={(e) => setDisplayName(track.id, e.target.value)}
            className="w-full truncate bg-transparent text-sm font-medium text-gruvbox-text outline-none focus:underline"
          />
        )}
      </div>

      {track.status === "ready" && (
        <div className="flex shrink-0 flex-col items-end gap-0.5 font-mono text-xs">
          <span className="text-gruvbox-gray">
            {formatTime(startSec)} → {formatTime(endSec)}
          </span>
          <span className="text-gruvbox-text">dur. {formatHumanDuration(track.durationSec)}</span>
        </div>
      )}

      {track.status === "reading" && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gruvbox-gray" />}

      <button
        onClick={() => removeTrack(track.id)}
        className="shrink-0 text-gruvbox-gray hover:text-gruvbox-red"
        aria-label="Quitar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}