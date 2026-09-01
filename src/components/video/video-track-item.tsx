"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { formatTime, formatHumanDuration } from "@/lib/time";
import { ImageDropzone } from "./image-dropzone";
import type { MusicTrack } from "@/types/track";

export function VideoTrackItem({
  track,
  startSec,
  showImageUpload,
}: {
  track: MusicTrack;
  startSec: number;
  showImageUpload: boolean;
}) {
  const config = useStudioStore((s) => s.videoConfigs[track.id]);
  const setVideoConfig = useStudioStore((s) => s.setVideoConfig);
  const setDisplayName = useStudioStore((s) => s.setDisplayName);
  const disableAllText = useStudioStore((s) => s.videoGlobal.disableAllText);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: track.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const showText = config?.showText ?? true;
  const textColor = config?.textColor ?? "#ffffff";
  const textStrokeColor = config?.textStrokeColor ?? "#000000";
  const endSec = startSec + track.durationSec;

  function handleImageSelect(file: File) {
    if (config?.imagePreviewUrl) URL.revokeObjectURL(config.imagePreviewUrl);
    setVideoConfig(track.id, { imageFile: file, imagePreviewUrl: URL.createObjectURL(file) });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-3 rounded-lg border border-gruvbox-gray/20 bg-gruvbox-surface/50 px-3 py-3 sm:flex-nowrap sm:gap-4"
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

      {showImageUpload && (
        <ImageDropzone previewUrl={config?.imagePreviewUrl ?? null} onSelect={handleImageSelect} compact />
      )}

      <div className="min-w-0 flex-1">
        <input
          value={track.displayName}
          onChange={(e) => setDisplayName(track.id, e.target.value)}
          className="w-full truncate bg-transparent text-sm font-medium text-gruvbox-text outline-none focus:underline"
        />
        <label className="mt-1 flex items-center gap-2 text-xs text-gruvbox-gray">
          <input
            type="checkbox"
            checked={showText}
            disabled={disableAllText}
            onChange={(e) => setVideoConfig(track.id, { showText: e.target.checked })}
          />
          Mostrar texto en este segmento
        </label>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5 font-mono text-xs">
        <span className="text-gruvbox-gray">
          {formatTime(startSec)} → {formatTime(endSec)}
        </span>
        <span className="text-gruvbox-text">dur. {formatHumanDuration(track.durationSec)}</span>
      </div>

      {showText && !disableAllText && (
        <div className="flex shrink-0 items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-gruvbox-gray">
            Texto
            <input
              type="color"
              value={textColor}
              onChange={(e) => setVideoConfig(track.id, { textColor: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border border-gruvbox-gray/40 bg-transparent"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-gruvbox-gray">
            Borde
            <input
              type="color"
              value={textStrokeColor}
              onChange={(e) => setVideoConfig(track.id, { textStrokeColor: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border border-gruvbox-gray/40 bg-transparent"
            />
          </label>
        </div>
      )}
    </div>
  );
}