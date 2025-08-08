export async function cropToBlob(
  imageUrl: string,
  crop: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    img,
    crop.x, crop.y, crop.width, crop.height,  // src rect
    0, 0, crop.width, crop.height             // dest rect
  );
  return new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), "image/png", 0.92);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
