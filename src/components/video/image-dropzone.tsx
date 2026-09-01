"use client";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ImagePlus } from "lucide-react";

export function ImageDropzone({
  previewUrl,
  onSelect,
  compact = false,
}: {
  previewUrl: string | null;
  onSelect: (file: File) => void;
  compact?: boolean;
}) {
  const onDrop = useCallback((files: File[]) => {
    if (files[0]) onSelect(files[0]);
  }, [onSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative flex cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-dashed transition-colors ${
        compact ? "h-16 w-24" : "h-32 w-full"
      } ${
        isDragActive ? "border-gruvbox-green bg-gruvbox-green/10" : "border-gruvbox-gray/40 hover:border-gruvbox-gray/70"
      }`}
    >
      <input {...getInputProps()} />
      {previewUrl ? (
        <img src={previewUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <ImagePlus className={compact ? "h-4 w-4 text-gruvbox-gray" : "h-6 w-6 text-gruvbox-gray"} />
      )}
    </div>
  );
}