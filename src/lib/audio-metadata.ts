export function readAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();

    audio.addEventListener("loadedmetadata", () => {
      resolve(audio.duration);
      URL.revokeObjectURL(url);
    });

    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error(`No se pudo leer "${file.name}". ¿Es un MP3 válido?`));
    });

    audio.src = url;
  });
}