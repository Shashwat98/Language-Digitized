import { useParams, Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import CanvasStage from "../components/CanvasStage";
import ImageCropper from "../components/ImageCropper";

// NEW: libs for vectorize + svg + thumb + db + export
import { useInscriptionStore } from "../state/useInscriptionStore";
import { saveAs } from "file-saver";
import { nanoid } from "nanoid";
import { svgToThumbnailBlob } from "../lib/thumb";
import { wrapAsSvg } from "../lib/svg";
import {
  imageUrlToImageData,
  thresholdImage,
  marchingSquares,
  pathsToSvgD,
} from "../lib/vectorize";

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();

  const [tool, setTool] = useState<"pan" | "pen" | "eraser">("pen");
  const [showImage, setShowImage] = useState(true);
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState("#111827");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // file + crop modal state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputNoCropRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  // NEW: vector result + canvas logical size
  const [vectorSvg, setVectorSvg] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number }>({
    w: 1024,
    h: 1024,
  });

  // NEW: DB handle
  const { save: saveToDB } = useInscriptionStore();

  // cleanup old object URLs
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  // NEW: probe image natural size when we set an image
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () =>
      setCanvasSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = imageUrl;
  }, [imageUrl]);

  const onImportClick = () => fileInputRef.current?.click();
  const onImportNoCropClick = () => fileInputNoCropRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) {
      setSelectedFile(f);
      setCropOpen(true);
      e.currentTarget.value = "";
    }
  };
  const onFileChangeNoCrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) {
      const url = URL.createObjectURL(f);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(url);
      e.currentTarget.value = "";
    }
  };

  // === Step 5 features ===

  async function handleAutoDigitize() {
    if (!imageUrl) {
      alert("Import an image first.");
      return;
    }
    const imgData = await imageUrlToImageData(imageUrl);
    const bin = thresholdImage(imgData, 128); // TODO: make adjustable later
    const paths = marchingSquares(bin, imgData.width, imgData.height);
    const ds = pathsToSvgD(paths);

    const svg = wrapAsSvg(
      imgData.width,
      imgData.height,
      ds.map((d) => ({ d, stroke: "#111", strokeWidth: 2 }))
    );
    setVectorSvg(svg);
    alert("Auto-digitize complete. You can now Save or Export.");
  }

  async function handleSave() {
    // Prefer auto-digitized SVG; fallback to empty SVG (we’ll add stroke export later)
    const svg = vectorSvg ?? wrapAsSvg(canvasSize.w, canvasSize.h, [], "#fff");
    const thumb = await svgToThumbnailBlob(svg);

    await saveToDB({
      id: id || nanoid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title: "",
      tags: [],
      notes: "",
      svg,
      thumbPng: thumb,
    });

    alert("Saved to IndexedDB.");
  }

  async function handleExportSVG() {
    if (!vectorSvg) {
      alert("Nothing to export yet. Try Auto Digitize or Save first.");
      return;
    }
    const blob = new Blob([vectorSvg], { type: "image/svg+xml" });
    saveAs(blob, `inscription-${id}.svg`);
  }

  async function handleExportPNG() {
    if (!vectorSvg) {
      alert("Nothing to export yet. Try Auto Digitize or Save first.");
      return;
    }
    const png = await svgToThumbnailBlob(
      vectorSvg,
      Math.min(2048, canvasSize.w)
    );
    saveAs(png, `inscription-${id}.png`);
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm opacity-80 hover:opacity-100">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">Editor</h1>
          <span className="text-xs opacity-60">ID: {id}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTool("pen")}
            className={`rounded border px-3 py-1.5 text-sm ${
              tool === "pen" ? "bg-gray-100" : ""
            }`}
          >
            Pen
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`rounded border px-3 py-1.5 text-sm ${
              tool === "eraser" ? "bg-gray-100" : ""
            }`}
          >
            Eraser
          </button>
          <button
            onClick={() => setTool("pan")}
            className={`rounded border px-3 py-1.5 text-sm ${
              tool === "pan" ? "bg-gray-100" : ""
            }`}
          >
            Pan
          </button>

          <label className="ml-3 text-sm">
            Size
            <input
              type="range"
              min={1}
              max={16}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="ml-2 align-middle"
            />
          </label>

          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="ml-2 h-8 w-8 rounded border p-0"
          />

          <label className="ml-3 text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={showImage}
              onChange={(e) => setShowImage(e.target.checked)}
            />
            Image
          </label>

          <button
            onClick={onImportClick}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Import (Crop)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />

          <button
            onClick={onImportNoCropClick}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Import (Skip Crop)
          </button>
          <input
            ref={fileInputNoCropRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChangeNoCrop}
          />

          <button
            className="rounded border px-3 py-1.5 text-sm"
            disabled={!canUndo}
            onClick={() =>
              document.dispatchEvent(new CustomEvent("canvas:undo"))
            }
          >
            Undo
          </button>
          <button
            className="rounded border px-3 py-1.5 text-sm"
            disabled={!canRedo}
            onClick={() =>
              document.dispatchEvent(new CustomEvent("canvas:redo"))
            }
          >
            Redo
          </button>

          {/* Step 5 actions */}
          <button
            onClick={handleAutoDigitize}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Auto Digitize
          </button>
          <button
            onClick={handleSave}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Save
          </button>
          <button
            onClick={handleExportSVG}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Export SVG
          </button>
          <button
            onClick={handleExportPNG}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Export PNG
          </button>
        </div>
      </header>

      <main className="flex-1">
        <CanvasStage
          imageUrl={imageUrl}
          showImage={showImage}
          activeTool={tool}
          strokeWidth={strokeWidth}
          strokeColor={strokeColor}
          onStackChange={(u, r) => {
            setCanUndo(u);
            setCanRedo(r);
          }}
        />
      </main>

      <ImageCropper
        file={selectedFile}
        open={cropOpen}
        onCancel={() => {
          setCropOpen(false);
          setSelectedFile(null);
        }}
        onConfirm={(_blob, outUrl) => {
          setCropOpen(false);
          setSelectedFile(null);
          if (imageUrl) URL.revokeObjectURL(imageUrl);
          setImageUrl(outUrl); // set as Image Layer
        }}
      />
    </div>
  );
}
