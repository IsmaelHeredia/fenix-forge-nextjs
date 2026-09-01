import ffmpeg from "./config";
import { writeFile } from "fs/promises";

type AudioProbeInfo = {
  sampleRate: number;
  channels: number;
  codec: string;
};

function probeAudio(filePath: string): Promise<AudioProbeInfo> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      const stream = data.streams.find((s) => s.codec_type === "audio");
      if (!stream) return reject(new Error(`No se encontró stream de audio en ${filePath}`));
      resolve({
        sampleRate: Number(stream.sample_rate),
        channels: Number(stream.channels),
        codec: stream.codec_name ?? "unknown",
      });
    });
  });
}

async function canUseFastConcat(inputPaths: string[]): Promise<boolean> {
  try {
    const infos = await Promise.all(inputPaths.map(probeAudio));
    const first = infos[0];
    const compatible = infos.every(
      (info) => info.sampleRate === first.sampleRate && info.channels === first.channels && info.codec === first.codec
    );
    console.log(
      `[ffmpeg audio] verificación: ${compatible ? "compatibles ✓ (modo rápido)" : "distintos ✗ (modo seguro)"}`
    );
    return compatible;
  } catch (err) {
    console.warn("[ffmpeg audio] no se pudo verificar compatibilidad, se usará el método seguro:", err);
    return false;
  }
}

function mergeAudioFast(inputPaths: string[], listFilePath: string, outputPath: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const listContent = inputPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
    await writeFile(listFilePath, listContent);

    ffmpeg()
      .input(listFilePath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c", "copy"])
      .output(outputPath)
      .on("start", () => console.log("[ffmpeg audio] modo rápido (copy, sin recodificar)"))
      .on("end", () => {
        console.log("[ffmpeg audio] listo:", outputPath);
        resolve();
      })
      .on("error", (err) => reject(err))
      .run();
  });
}

function mergeAudioSafe(inputPaths: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    inputPaths.forEach((p) => command.input(p));

    const filterInputs = inputPaths.map((_, i) => `[${i}:a]`).join("");
    const filterComplex = `${filterInputs}concat=n=${inputPaths.length}:v=0:a=1[outa]`;

    command
      .complexFilter(filterComplex, "outa")
      .audioCodec("libmp3lame")
      .audioBitrate("192k")
      .output(outputPath)
      .on("start", (cmd) => console.log("[ffmpeg audio] modo seguro (recodificando):", cmd))
      .on("progress", (p) => console.log(`[ffmpeg audio] ${p.timemark ?? ""} procesado`))
      .on("end", () => {
        console.log("[ffmpeg audio] listo:", outputPath);
        resolve();
      })
      .on("error", (err) => reject(err))
      .run();
  });
}

export async function mergeAudioFiles(inputPaths: string[], outputPath: string, listFilePath: string): Promise<void> {
  const canFast = await canUseFastConcat(inputPaths);

  if (canFast) {
    try {
      await mergeAudioFast(inputPaths, listFilePath, outputPath);
      return;
    } catch (err) {
      console.warn("[ffmpeg audio] el modo rápido falló igual, reintentando con el método seguro:", err);
    }
  }

  await mergeAudioSafe(inputPaths, outputPath);
}