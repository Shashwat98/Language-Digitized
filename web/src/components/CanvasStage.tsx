import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Line, Image as KonvaImage } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type React from "react";
import useImage from "use-image";
import { undo as undoStack, redo as redoStack } from "../lib/undo";
import { createStack, push, undo, redo, canUndo, canRedo, type Stack } from "../lib/undo";

export type Stroke = {
  id: string;
  tool: "pen" | "eraser";
  points: number[];        // x1,y1,x2,y2,...
  color: string;
  width: number;
};

type Props = {
  imageUrl?: string;       // background image (cropped later)
  showImage: boolean;
  activeTool: "pan" | "pen" | "eraser";
  strokeWidth: number;
  strokeColor: string;
  onStackChange?: (canUndo: boolean, canRedo: boolean) => void;
};

export default function CanvasStage({
  imageUrl,
  showImage,
  activeTool,
  strokeWidth,
  strokeColor,
  onStackChange,
}: Props) {
  const [bg] = useImage(imageUrl ?? "");
  const stageRef = useRef<any>(null);
  const isDrawing = useRef(false);

  // zoom/pan
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [spacePanning, setSpacePanning] = useState(false);

  // drawing stack
  const [stack, setStack] = useState<Stack<Stroke[]>>(() => createStack<Stroke[]>([]));
  useEffect(() => onStackChange?.(canUndo(stack), canRedo(stack)), [stack, onStackChange]);

  const handlePointerDown = (e: KonvaEventObject<PointerEvent>) => {
    const stage = stageRef.current;
    const isPan = activeTool === "pan" || spacePanning;
    if (isPan) {
      stage.draggable(true);
      return;
    }
    stage.draggable(false);
    isDrawing.current = true;
    const lp = getLocalPointer(stage);
    if (!lp) return;
    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      tool: activeTool === "eraser" ? "eraser" : "pen",
      points: [lp.x, lp.y],
      color: activeTool === "eraser" ? "#000000" : strokeColor,
      width: strokeWidth,
    };
    setStack(s => push(s, [...s.present, newStroke]));
  };

  const handlePointerMove = (e: KonvaEventObject<PointerEvent>) => {
    if (!isDrawing.current) return;
    const stage = stageRef.current;
    const lp = getLocalPointer(stage);
    if (!lp) return;
    setStack(s => {
      const next = [...s.present];
      const last = next[next.length - 1];
      last.points = last.points.concat([lp.x, lp.y]);
      return { ...s, present: next };
    });
  };

  const handlePointerUp = () => {
    isDrawing.current = false;
  };

  // wheel zoom (Ctrl/Cmd + wheel), pan otherwise
  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const scaleBy = 1.05;
      const oldScale = scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };
      const direction = e.evt.deltaY > 0 ? 1 : -1;
      const newScale = direction > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      setScale(newScale);
      setPos({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    } else {
      setPos(p => ({ x: p.x - e.evt.deltaX, y: p.y - e.evt.deltaY }));
    }
  };

  // spacebar pan
  useEffect(() => {
    const down = (e: KeyboardEvent) => e.code === "Space" && setSpacePanning(true);
    const up = (e: KeyboardEvent) => e.code === "Space" && setSpacePanning(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  //undo
  useEffect(() => {
  const onUndo = () => setStack(s => undoStack(s));
  const onRedo = () => setStack(s => redoStack(s));
  document.addEventListener("canvas:undo", onUndo as EventListener);
  document.addEventListener("canvas:redo", onRedo as EventListener);
  return () => {
    document.removeEventListener("canvas:undo", onUndo as EventListener);
    document.removeEventListener("canvas:redo", onRedo as EventListener);
  };
}, []);

  const lines = stack.present;

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth} height={window.innerHeight}
      scaleX={scale} scaleY={scale}
      x={pos.x} y={pos.y}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={onWheel}
      className={activeTool === "eraser" ? "cursor-crosshair" : activeTool === "pen" ? "cursor-pencil" : "cursor-grab"}
    >
      <Layer listening={showImage}>
        {showImage && bg && <KonvaImage image={bg} opacity={0.9} />}
      </Layer>
      <Layer>
        {lines.map(s => (
          <Line
            key={s.id}
            points={s.points}
            stroke={s.tool === "eraser" ? "#ffffff" : s.color}
            strokeWidth={s.width}
            tension={0.3}
            lineCap="round"
            lineJoin="round"
            globalCompositeOperation={s.tool === "eraser" ? "destination-out" : "source-over"}
          />
        ))}
      </Layer>
    </Stage>
  );
}

function getLocalPointer(stage: any) {
  const pos = stage.getPointerPosition();
  if (!pos) return undefined;
  const transform = stage.getAbsoluteTransform().copy().invert();
  return transform.point(pos); // returns local stage coords
}

// expose tiny helpers for EditorPage
export function useLocalUndo(
  stack: Stack<Stroke[]>,
  setStack: React.Dispatch<React.SetStateAction<Stack<Stroke[]>>>
) {
  return {
    undo: () => setStack((s) => undo<Stroke[]>(s)),
    redo: () => setStack((s) => redo<Stroke[]>(s)),
    canUndo: canUndo(stack),
    canRedo: canRedo(stack),
  };
}
