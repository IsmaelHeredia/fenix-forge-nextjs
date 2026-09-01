export function mergeAudioRequest(
  files: File[],
  onProgress?: (percent: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/audio/merge");
    xhr.responseType = "blob";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) resolve(xhr.response as Blob);
      else reject(new Error("Error al combinar los MP3"));
    };

    xhr.onerror = () => reject(new Error("Error de red"));
    xhr.send(formData);
  });
}