export function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\u2019") // comilla tipográfica, evita romper el filtro
    .replace(/%/g, "\\%");
}