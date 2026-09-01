import type { MusicTrack, VideoTrackConfig, VideoGlobalConfig } from "@/types/track";

type RenderPayload = {
  tracks: MusicTrack[];
  videoConfigs: Record<string, VideoTrackConfig>;
  videoGlobal: VideoGlobalConfig;
};

export function renderVideoRequest(
  { tracks, videoConfigs, videoGlobal }: RenderPayload,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();

    const meta = tracks.map((t) => {
      const cfg = videoConfigs[t.id];
      return {
        displayName: t.displayName,
        durationSec: t.durationSec,
        showText: videoGlobal.disableAllText ? false : cfg?.showText ?? true,
        textColor: cfg?.textColor ?? "#ffffff",
        textStrokeColor: cfg?.textStrokeColor ?? "#000000",
      };
    });

    tracks.forEach((t, i) => {
      const ext = t.fileName.slice(t.fileName.lastIndexOf("."));
      formData.append("audio", t.file, `audio_${i}${ext}`);
      const cfg = videoConfigs[t.id];
      if (videoGlobal.mode === "per-track-image" && cfg?.imageFile) {
        formData.append(`image_${i}`, cfg.imageFile);
      }
    });

    if (videoGlobal.mode === "single-image" && videoGlobal.singleImageFile) {
      formData.append("singleImage", videoGlobal.singleImageFile);
    }

    formData.append("mode", videoGlobal.mode);
    formData.append("meta", JSON.stringify(meta));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/video/render");
    xhr.responseType = "blob";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200) resolve(xhr.response as Blob);
      else reject(new Error("Error al generar el video"));
    };
    xhr.onerror = () => reject(new Error("Error de red"));
    xhr.send(formData);
  });
}