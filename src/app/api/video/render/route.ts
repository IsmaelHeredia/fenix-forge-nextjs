import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { mkdir, writeFile, readFile } from "fs/promises";
import { ensureDirs, UPLOADS_DIR, OUTPUT_DIR, cleanupPath } from "@/lib/file-storage";
import { buildVideoSegment, concatVideoSegments } from "@/lib/ffmpeg/video";

import os from "os";
import { createLimiter } from "@/lib/concurrency";

export const runtime = "nodejs";

type TrackMeta = {
  index: number;
  displayName: string;
  durationSec: number;
  showText: boolean;
  textColor: string;
  textStrokeColor: string;
};

export async function POST(req: NextRequest) {
  const jobId = crypto.randomUUID();
  const jobDir = path.join(UPLOADS_DIR, jobId);
  const finalOutput = path.join(OUTPUT_DIR, `${jobId}.mp4`);
  const listFile = path.join(jobDir, "concat_list.txt");

  try {
    await ensureDirs();
    await mkdir(jobDir, { recursive: true });

    const formData = await req.formData();
    const mode = formData.get("mode") as string;
    const meta: TrackMeta[] = JSON.parse(formData.get("meta") as string);
    const audioFiles = formData.getAll("audio") as File[];

    if (!audioFiles.length) {
      return NextResponse.json({ error: "No se recibió audio" }, { status: 400 });
    }

    const audioPaths: string[] = [];
    for (let i = 0; i < audioFiles.length; i++) {
      const ext = path.extname(audioFiles[i].name) || ".mp3";
      const p = path.join(jobDir, `audio_${i}${ext}`);
      await writeFile(p, Buffer.from(await audioFiles[i].arrayBuffer()));
      audioPaths.push(p);
    }

    let singleImagePath: string | null = null;
    const singleImage = formData.get("singleImage") as File | null;
    if (mode === "single-image" && singleImage) {
      const ext = path.extname(singleImage.name) || ".jpg";
      singleImagePath = path.join(jobDir, `single${ext}`);
      await writeFile(singleImagePath, Buffer.from(await singleImage.arrayBuffer()));
    }

    const perTrackImagePaths: Record<number, string> = {};
    if (mode === "per-track-image") {
      for (let i = 0; i < meta.length; i++) {
        const img = formData.get(`image_${i}`) as File | null;
        if (img) {
          const ext = path.extname(img.name) || ".jpg";
          const p = path.join(jobDir, `image_${i}${ext}`);
          await writeFile(p, Buffer.from(await img.arrayBuffer()));
          perTrackImagePaths[i] = p;
        }
      }
    }

    const concurrency = Math.max(1, os.cpus().length - 1);
    const limit = createLimiter(concurrency);
    console.log(`[ffmpeg video] generando ${meta.length} segmentos con concurrencia ${concurrency}`);

    const segmentPaths: string[] = new Array(meta.length);

    await Promise.all(
      meta.map((m, i) =>
        limit(async () => {
          const imagePath = mode === "single-image" ? singleImagePath : perTrackImagePaths[i] ?? null;
          const segmentPath = path.join(jobDir, `segment_${i}.mp4`);

          await buildVideoSegment({
            imagePath,
            audioPath: audioPaths[i],
            durationSec: m.durationSec,
            outputPath: segmentPath,
            segmentLabel: `${i + 1}/${meta.length} — ${m.displayName}`,
            textConfig: m.showText
              ? { text: m.displayName, color: m.textColor, strokeColor: m.textStrokeColor }
              : null,
          });

          segmentPaths[i] = segmentPath;
        })
      )
    );

    await concatVideoSegments(segmentPaths, listFile, finalOutput);
    const videoBuffer = await readFile(finalOutput);

    return new NextResponse(videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="video-${jobId.slice(0, 8)}.mp4"`,
      },
    });
  } catch (err) {
    console.error("Error generando video:", err);
    return NextResponse.json({ error: "Error al generar el video" }, { status: 500 });
  } finally {
    await cleanupPath(jobDir);
    await cleanupPath(finalOutput);
  }
}