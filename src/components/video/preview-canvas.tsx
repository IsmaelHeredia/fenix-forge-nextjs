"use client";
import { useEffect, useRef } from "react";

const PREVIEW_W = 480;
const PREVIEW_H = 270;

const SCALE = PREVIEW_W / 1280;
const MAX_LINES = 2;
const BASE_FONT_SIZE = Math.round(54 * SCALE);
const MIN_FONT_SIZE = Math.round(26 * SCALE);
const BOTTOM_MARGIN = Math.round(60 * SCALE);
const SIDE_MARGIN_RATIO = 0.88;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidthPx: number, fontSize: number): string[] {
  ctx.font = `bold ${fontSize}px sans-serif`;
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidthPx || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function computeLayout(ctx: CanvasRenderingContext2D, text: string, maxWidthPx: number) {
  let fontSize = BASE_FONT_SIZE;
  let lines = wrapText(ctx, text, maxWidthPx, fontSize);

  const anyLineTooWide = () => {
    ctx.font = `bold ${fontSize}px sans-serif`;
    return lines.some((l) => ctx.measureText(l).width > maxWidthPx);
  };

  while ((lines.length > MAX_LINES || anyLineTooWide()) && fontSize > MIN_FONT_SIZE) {
    fontSize -= 1;
    lines = wrapText(ctx, text, maxWidthPx, fontSize);
  }

  if (lines.length > MAX_LINES) {
    const kept = lines.slice(0, MAX_LINES);
    let last = kept[MAX_LINES - 1];
    ctx.font = `bold ${fontSize}px sans-serif`;
    while (ctx.measureText(last + "…").width > maxWidthPx && last.length > 1) {
      last = last.slice(0, -1);
    }
    kept[MAX_LINES - 1] = last.trimEnd() + "…";
    lines = kept;
  }

  return { lines, fontSize };
}

export function PreviewCanvas({
  imageUrl,
  text,
  showText,
  textColor,
  strokeColor,
  backgroundColor = "#282828",
}: {
  imageUrl: string | null;
  text: string;
  showText: boolean;
  textColor: string;
  strokeColor: string;
  backgroundColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    function drawText() {
      if (!ctx || !showText || !text) return;
      const maxWidthPx = PREVIEW_W * SIDE_MARGIN_RATIO;
      const { lines, fontSize } = computeLayout(ctx, text, maxWidthPx);
      const lineHeight = Math.round(fontSize * 1.3);

      ctx.textAlign = "center";
      ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.08));
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = textColor;
      ctx.font = `bold ${fontSize}px sans-serif`;

      lines.forEach((line, idx) => {
        const distanceFromBottom = lines.length - 1 - idx;
        const y = PREVIEW_H - BOTTOM_MARGIN - distanceFromBottom * lineHeight;
        ctx.strokeText(line, PREVIEW_W / 2, y);
        ctx.fillText(line, PREVIEW_W / 2, y);
      });
    }

    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);

    if (imageUrl) {
      const img = new Image();
      img.onload = () => {
        const scale = Math.max(PREVIEW_W / img.width, PREVIEW_H / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (PREVIEW_W - w) / 2, (PREVIEW_H - h) / 2, w, h);
        drawText();
      };
      img.src = imageUrl;
    } else {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);
      drawText();
    }
  }, [imageUrl, text, showText, textColor, strokeColor, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      width={PREVIEW_W}
      height={PREVIEW_H}
      className="w-full max-w-full rounded-lg border border-gruvbox-gray/30"
    />
  );
}