import ffmpeg from "./config";
import { writeFile } from "fs/promises";
import { escapeDrawtext } from "./text-escape";

const WIDTH = 1280;
const HEIGHT = 720;
const FONT_PATH = process.env.FFMPEG_FONT_PATH;

type TextConfig = {
  text: string;
  color: string;
  strokeColor: string;
};

type BuildSegmentOptions = {
  imagePath: string | null;
  audioPath: string;
  durationSec: number;
  outputPath: string;
  textConfig: TextConfig | null;
  fallbackColor?: string;
  segmentLabel?: string;
};

function toFfmpegColor(hex: string): string {
  return `0x${hex.replace("#", "")}`;
}

const MAX_LINES = 2;
const MIN_FONT_SIZE = 26;
const BASE_FONT_SIZE = 54;
const BOTTOM_MARGIN = 60;

function estimateWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.58;
}

function wrapIntoLines(text: string, maxWidthPx: number, fontSize: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (estimateWidth(candidate, fontSize) <= maxWidthPx || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function computeTextLayout(text: string, maxWidthPx: number) {
  let fontSize = BASE_FONT_SIZE;
  let lines = wrapIntoLines(text, maxWidthPx, fontSize);

  while (
    (lines.length > MAX_LINES || lines.some((l) => estimateWidth(l, fontSize) > maxWidthPx)) &&
    fontSize > MIN_FONT_SIZE
  ) {
    fontSize -= 4;
    lines = wrapIntoLines(text, maxWidthPx, fontSize);
  }

  if (lines.length > MAX_LINES) {
    const kept = lines.slice(0, MAX_LINES);
    let last = kept[MAX_LINES - 1];
    while (estimateWidth(last + "…", fontSize) > maxWidthPx && last.length > 1) {
      last = last.slice(0, -1);
    }
    kept[MAX_LINES - 1] = last.trimEnd() + "…";
    lines = kept;
  }

  return { lines, fontSize };
}

function buildFilters(hasImage: boolean, textConfig: TextConfig | null): string[] {
  const filters: string[] = [];

  if (hasImage) {
    filters.push(`scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase`);
    filters.push(`crop=${WIDTH}:${HEIGHT}`);
  }

  if (textConfig) {
    const maxWidthPx = WIDTH * 0.88;
    const { lines, fontSize } = computeTextLayout(textConfig.text, maxWidthPx);
    const lineHeightPx = Math.round(fontSize * 1.3);

    lines.forEach((line, idx) => {
      const distanceFromBottomLine = lines.length - 1 - idx;
      const yExpr = `h-th-${BOTTOM_MARGIN + distanceFromBottomLine * lineHeightPx}`;

      filters.push(
        [
          `drawtext=fontfile='${FONT_PATH}'`,
          `text='${escapeDrawtext(line)}'`,
          `fontcolor=${toFfmpegColor(textConfig.color)}`,
          `fontsize=${fontSize}`,
          `borderw=3`,
          `bordercolor=${toFfmpegColor(textConfig.strokeColor)}`,
          `x=(w-text_w)/2`,
          `y=${yExpr}`,
        ].join(":")
      );
    });
  }

  return filters;
}

export function buildVideoSegment(opts: BuildSegmentOptions): Promise<void> {
  const { imagePath, audioPath, durationSec, outputPath, textConfig, fallbackColor, segmentLabel } = opts;
  const label = segmentLabel ?? outputPath;

  return new Promise((resolve, reject) => {
    const command = ffmpeg();

    if (imagePath) {
      command.input(imagePath).inputOptions(["-loop 1"]);
    } else {
      const bg = (fallbackColor ?? "#282828").replace("#", "");
      command.input(`color=c=0x${bg}:s=${WIDTH}x${HEIGHT}:d=${durationSec}`).inputOptions(["-f", "lavfi"]);
    }

    command.input(audioPath);

    command
      .videoFilters(buildFilters(!!imagePath, textConfig))
      .outputOptions([
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-t", String(durationSec),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-tune", "stillimage",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
      ])
      .output(outputPath)
      .on("start", () => console.log(`[ffmpeg video] iniciando segmento: ${label}`))
      .on("progress", (p) => console.log(`[ffmpeg video] ${label} — ${p.timemark ?? ""}`))
      .on("end", () => {
        console.log(`[ffmpeg video] segmento listo: ${label}`);
        resolve();
      })
      .on("error", (err) => reject(err))
      .run();
  });
}

export function concatVideoSegments(
  segmentPaths: string[],
  listFilePath: string,
  outputPath: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const listContent = segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
    await writeFile(listFilePath, listContent);

    ffmpeg()
      .input(listFilePath)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c", "copy"])
      .output(outputPath)
      .on("start", () => console.log("[ffmpeg video] uniendo segmentos finales..."))
      .on("end", () => {
        console.log("[ffmpeg video] video final listo:", outputPath);
        resolve();
      })
      .on("error", (err) => reject(err))
      .run();
  });
}