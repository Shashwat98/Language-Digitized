import { useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { cropToBlob } from "../lib/crop";

type Props = {
  file: File | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob, objectUrl: string) => void;
};

export default function ImageCropper({ file, open, onCancel, onConfirm }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => { URL.revokeObjectURL(url); };
  }, [file]);

  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-[min(92vw,900px)] h-[min(82vh,680px)] rounded-xl shadow-xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b font-medium">Crop Image</div>

        <div className="flex-1 relative bg-neutral-50">
          {objectUrl && (
            <Cropper
              image={objectUrl}
              crop={crop}
              zoom={zoom}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              aspect={undefined}              // freeform crop
              restrictPosition={false}
              minZoom={1}
              maxZoom={8}
              zoomSpeed={0.2}
              showGrid={false}
            />
          )}
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm">Zoom</label>
            <input
              type="range" min={1} max={8} step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onCancel} className="rounded border px-3 py-1.5 text-sm">
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!objectUrl || !croppedArea) return;
                const blob = await cropToBlob(objectUrl, {
                  x: Math.round(croppedArea.x),
                  y: Math.round(croppedArea.y),
                  width: Math.round(croppedArea.width),
                  height: Math.round(croppedArea.height),
                });
                const outUrl = URL.createObjectURL(blob);
                onConfirm(blob, outUrl);
              }}
              className="rounded border px-3 py-1.5 text-sm bg-gray-900 text-white"
            >
              Use Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
