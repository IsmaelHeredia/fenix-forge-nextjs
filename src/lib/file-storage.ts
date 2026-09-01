import { mkdir, writeFile, rm } from "fs/promises";
import path from "path";

const TMP_ROOT = path.join(process.cwd(), "tmp");
export const UPLOADS_DIR = path.join(TMP_ROOT, "uploads");
export const OUTPUT_DIR = path.join(TMP_ROOT, "output");

export async function ensureDirs() {
  await mkdir(UPLOADS_DIR, { recursive: true });
  await mkdir(OUTPUT_DIR, { recursive: true });
}

export async function saveJobFiles(jobId: string, files: File[]): Promise<string[]> {
  const jobDir = path.join(UPLOADS_DIR, jobId);
  await mkdir(jobDir, { recursive: true });

  const paths: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = path.extname(file.name) || ".mp3";
    const filePath = path.join(jobDir, `${String(i).padStart(3, "0")}${ext}`);
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
    paths.push(filePath);
  }
  return paths;
}

export async function cleanupPath(p: string) {
  await rm(p, { recursive: true, force: true }).catch(() => {});
}