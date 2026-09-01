"use client";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { useStudioStore } from "@/lib/store";
import { readAudioDuration } from "@/lib/audio-metadata";

export function UploadDropzone() {
  const addTracks = useStudioStore((s) => s.addTracks);
  const updateTrack = useStudioStore((s) => s.updateTrack);
  const tracks = useStudioStore((s) => s.tracks);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const before = tracks.length;
      addTracks(acceptedFiles);

      const newTracks = useStudioStore.getState().tracks.slice(before);

      newTracks.forEach(async (track, i) => {
        const file = acceptedFiles[i];
        updateTrack(track.id, { status: "reading", uploadProgress: 15 });
        try {
          updateTrack(track.id, { uploadProgress: 60 });
          const duration = await readAudioDuration(file);
          updateTrack(track.id, {
            durationSec: duration,
            status: "ready",
            uploadProgress: 100,
          });
        } catch (err) {
          updateTrack(track.id, { status: "error", uploadProgress: 0 });
        }
      });
    },
    [addTracks, updateTrack, tracks.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/mpeg": [".mp3"] },
    multiple: true,
  });

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
        isDragActive
          ? "border-gruvbox-green bg-gruvbox-green/10"
          : "border-gruvbox-gray/40 hover:border-gruvbox-gray/70"
      }`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="h-8 w-8 text-gruvbox-gray" />
      <p className="text-sm text-gruvbox-text">
        Arrastrá tus MP3 acá, o hacé click para elegirlos
      </p>
      <p className="text-xs text-gruvbox-gray">Podés seleccionar varios a la vez</p>
    </div>
  );
}