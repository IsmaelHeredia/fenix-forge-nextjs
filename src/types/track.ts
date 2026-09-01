export type MusicTrack = {
  id: string;
  file: File;
  fileName: string;
  displayName: string;
  durationSec: number;
  order: number;
  uploadProgress: number;
  status: "pending" | "reading" | "ready" | "error";
};

export type VideoTrackConfig = {
  trackId: string;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  showText: boolean;
  textColor: string;
  textStrokeColor: string;
};

export type VideoGlobalConfig = {
  mode: "per-track-image" | "single-image";
  singleImageFile: File | null;
  singleImagePreviewUrl: string | null;
  disableAllText: boolean;
};