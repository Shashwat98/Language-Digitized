import type { Stroke } from "../components/CanvasStage";

export function strokesToPathD(strokes: Stroke[]): string[] {
  return strokes.map((s) => {
    const pts = s.points;
    if (pts.length < 4) return "";
    let d = `M ${pts[0]} ${pts[1]}`;
    for (let i = 2; i < pts.length; i += 2) d += ` L ${pts[i]} ${pts[i + 1]}`;
    return d;
  }).filter(Boolean);
}

export function wrapAsSvg(
  width: number,
  height: number,
  paths: { d: string; stroke?: string; strokeWidth?: number }[],
  bg?: string
): string {
  const ns = `xmlns="http://www.w3.org/2000/svg"`;
  const view = `viewBox="0 0 ${width} ${height}"`;
  const rect = bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : "";
  const content = paths
    .map(p => `<path d="${p.d}" fill="none" stroke="${p.stroke ?? "#111"}" stroke-width="${p.strokeWidth ?? 2}" stroke-linecap="round" stroke-linejoin="round"/>`)
    .join("");
  return `<svg ${ns} width="${width}" height="${height}" ${view}>${rect}${content}</svg>`;
}
