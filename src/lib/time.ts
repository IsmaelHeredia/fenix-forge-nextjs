export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return [hh, mm, ss].map((n) => String(n).padStart(2, "0")).join(":");
}

export function formatHumanDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;

  const parts: string[] = [];
  if (hh > 0) parts.push(`${hh} ${hh === 1 ? "hora" : "horas"}`);
  if (mm > 0) parts.push(`${mm} ${mm === 1 ? "minuto" : "minutos"}`);
  if (ss > 0 || parts.length === 0) parts.push(`${ss} ${ss === 1 ? "segundo" : "segundos"}`);

  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
}