// Super-lightweight vectorizer: threshold to binary + marching squares for contours
export type VectorizeOptions = {
  threshold?: number; // 0..255
};

export async function imageUrlToImageData(url: string): Promise<ImageData> {
  const img = await loadImage(url);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
}

export function thresholdImage(
  src: ImageData,
  threshold: number = 128
): Uint8Array {
  const { data, width, height } = src;
  const out = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b; // luminance
    out[p] = y < threshold ? 1 : 0; // 1 = ink (black)
  }
  return out;
}

// Basic marching squares to produce a list of polygon paths
export function marchingSquares(
  bin: Uint8Array,
  width: number,
  height: number
): number[][] {
  const paths: number[][] = [];
  // We’ll do a very simple trace: follow edges where cell transitions 0->1.
  const visited = new Uint8Array(width * height);

  function idx(x: number, y: number) { return y * width + x; }

  // helper to find a starting edge pixel
  function findStart(): [number, number] | null {
    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width - 1; x++) {
        const p = idx(x, y);
        if (!visited[p] && bin[p]) return [x, y];
      }
    }
    return null;
  }

  // Simple 4-neighbor contour trace
  while (true) {
    const start = findStart();
    if (!start) break;
    const [sx, sy] = start;
    const path: number[] = [];
    let x = sx, y = sy;
    let dir = 0; // 0:right,1:down,2:left,3:up

    const maxSteps = width * height * 4;
    for (let steps = 0; steps < maxSteps; steps++) {
      path.push(x, y);
      visited[idx(x, y)] = 1;

      // Marching rule: prefer keeping ink on left side to follow boundary
      // Try directions relative to current direction: left, straight, right, back
      const tryDirs = [(dir + 3) & 3, dir, (dir + 1) & 3, (dir + 2) & 3];

      let moved = false;
      for (const d of tryDirs) {
        const nx = x + (d === 0 ? 1 : d === 2 ? -1 : 0);
        const ny = y + (d === 1 ? 1 : d === 3 ? -1 : 0);
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (bin[idx(nx, ny)]) {
          x = nx; y = ny; dir = d;
          moved = true;
          break;
        }
      }
      if (!moved) break;

      if (x === sx && y === sy) {
        // closed loop
        break;
      }
    }

    if (path.length > 6) paths.push(path);
  }

  return paths;
}

export function pathsToSvgD(paths: number[][]): string[] {
  // convert [x,y,x,y,...] to "M x y L x y ... Z"
  return paths.map((pts) => {
    if (pts.length < 4) return "";
    let d = `M ${pts[0]} ${pts[1]}`;
    for (let i = 2; i < pts.length; i += 2) d += ` L ${pts[i]} ${pts[i + 1]}`;
    d += " Z";
    return d;
  }).filter(Boolean);
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
