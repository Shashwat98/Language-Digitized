export async function svgToThumbnailBlob(svg: string, width = 192): Promise<Blob> {
  // Render SVG to canvas then to Blob (PNG)
  const svgBlob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);
  const img = await loadImage(url);
  const scale = width / img.naturalWidth;
  const w = width;
  const h = Math.round(img.naturalHeight * scale);

  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const out = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/png", 0.92));
  URL.revokeObjectURL(url);
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
