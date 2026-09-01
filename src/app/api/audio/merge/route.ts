import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";
import { ensureDirs, saveJobFiles, cleanupPath, UPLOADS_DIR, OUTPUT_DIR } from "@/lib/file-storage";
import { mergeAudioFiles } from "@/lib/ffmpeg/audio";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const jobId = crypto.randomUUID();
  const jobUploadsDir = path.join(UPLOADS_DIR, jobId);
  const outputPath = path.join(OUTPUT_DIR, `${jobId}.mp3`);

  try {
    await ensureDirs();

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No se recibieron archivos" }, { status: 400 });
    }

    const inputPaths = await saveJobFiles(jobId, files);
    const listFile = path.join(jobUploadsDir, "concat_list.txt");
    await mergeAudioFiles(inputPaths, outputPath, listFile);

    const audioBuffer = await readFile(outputPath);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="mix-${jobId.slice(0, 8)}.mp3"`,
      },
    });
  } catch (err) {
    console.error("Error combinando audio:", err);
    return NextResponse.json({ error: "Error al combinar los MP3" }, { status: 500 });
  } finally {
    await cleanupPath(jobUploadsDir);
    await cleanupPath(outputPath);
  }
}