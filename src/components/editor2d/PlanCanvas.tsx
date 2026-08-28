import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useActiveFloor, useProjectStore } from "@/store/projectStore";
import { LengthUnit, Room, Vec2 } from "@/types/project";
import {
  moveRect,
  polygonBounds,
  rectFromCorners,
  resizeRect,
  snapToGrid,
  uuid,
} from "@/lib/geometry";
import { formatLength, parseLength } from "@/lib/units";
import { defaultOpeningSize } from "@/lib/openingDefaults";
import RoomShape, { HandleId } from "@/components/editor2d/RoomShape";

interface ViewState {
  scale: number; // screen px per mm
  ox: number;
  oy: number;
}

type DragMode =
  | { kind: "pan"; startClient: Vec2; startView: ViewState }
  | { kind: "draw-room"; start: Vec2 }
  | { kind: "move-room"; room: Room; startFloorPointer: Vec2; startPoints: Vec2[] }
  | { kind: "resize-room"; room: Room; handle: HandleId; startPoints: Vec2[] }
  | { kind: "ref-image"; startClient: Vec2; startX: number; startY: number };

export default function PlanCanvas() {
  const project = useProjectStore((s) => s.project);
  const activeFloor = useActiveFloor();
  const tool = useProjectStore((s) => s.tool);
  const setTool = useProjectStore((s) => s.setTool);
  const unit = useProjectStore((s) => s.unit);
  const drawRoomType = useProjectStore((s) => s.drawRoomType);
  const drawOpeningType = useProjectStore((s) => s.drawOpeningType);
  const selection = useProjectStore((s) => s.selection);
  const select = useProjectStore((s) => s.select);
  const addRoom = useProjectStore((s) => s.addRoom);
  const addOpening = useProjectStore((s) => s.addOpening);
  const updateRoom = useProjectStore((s) => s.updateRoom);
  const setReferenceImage = useProjectStore((s) => s.setReferenceImage);
  const viewOnly = useProjectStore((s) => s.viewOnly);

  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ViewState>({ scale: 0.05, ox: 40, oy: 40 });
  const dragRef = useRef<DragMode | null>(null);
  const [previewRect, setPreviewRect] = useState<Vec2[] | null>(null);
  const [liveRoom, setLiveRoom] = useState<{ id: string; points: Vec2[] } | null>(null);
  const [measurePoints, setMeasurePoints] = useState<Vec2[]>([]);
  const [calibratePoints, setCalibratePoints] = useState<Vec2[]>([]);
  const fitted = useRef(false);

  useLayoutEffect(() => {
    if (fitted.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pad = 60;
    const scale = Math.min(
      (rect.width - pad * 2) / project.plotWidth,
      (rect.height - pad * 2) / project.plotDepth
    );
    setView({
      scale: Math.max(0.01, scale),
      ox: pad,
      oy: pad,
    });
    fitted.current = true;
  }, [project.plotWidth, project.plotDepth]);

  const screenToFloor = useCallback(
    (clientX: number, clientY: number): Vec2 => {
      const rect = containerRef.current!.getBoundingClientRect();
      return {
        x: (clientX - rect.left - view.ox) / view.scale,
        y: (clientY - rect.top - view.oy) / view.scale,
      };
    },
    [view]
  );

  const invScale = 1 / view.scale;

  // ---------- wheel zoom ----------
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const factor = Math.exp(-e.deltaY * 0.0012);
    const newScale = Math.min(2, Math.max(0.005, view.scale * factor));
    const floorX = (cx - view.ox) / view.scale;
    const floorY = (cy - view.oy) / view.scale;
    setView({
      scale: newScale,
      ox: cx - floorX * newScale,
      oy: cy - floorY * newScale,
    });
  };

  // ---------- pinch (touch) ----------
  const pointers = useRef<Map<number, Vec2>>(new Map());
  const pinchStart = useRef<{ dist: number; scale: number; center: Vec2; ox: number; oy: number } | null>(
    null
  );

  const onBackgroundPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStart.current = { dist, scale: view.scale, center: { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }, ox: view.ox, oy: view.oy };
      dragRef.current = null;
      return;
    }

    const floor = screenToFloor(e.clientX, e.clientY);

    if (tool === "measure") {
      setMeasurePoints((pts) => (pts.length >= 2 ? [floor] : [...pts, floor]));
      return;
    }
    if (tool === "calibrate") {
      setCalibratePoints((pts) => {
        const next = pts.length >= 2 ? [floor] : [...pts, floor];
        if (next.length === 2) runCalibration(next);
        return next;
      });
      return;
    }
    if (tool === "room" && !viewOnly) {
      dragRef.current = { kind: "draw-room", start: snapToGrid(floor) };
      setPreviewRect(null);
      window.addEventListener("pointermove", onWindowPointerMove);
      window.addEventListener("pointerup", onWindowPointerUp);
      return;
    }
    if (tool === "select") {
      select(null);
      dragRef.current = { kind: "pan", startClient: { x: e.clientX, y: e.clientY }, startView: view };
      window.addEventListener("pointermove", onWindowPointerMove);
      window.addEventListener("pointerup", onWindowPointerUp);
    }
  };

  const runCalibration = (pts: Vec2[]) => {
    const ref = activeFloor.referenceImage;
    const measuredMm = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    if (measuredMm < 1) {
      setCalibratePoints([]);
      return;
    }
    const input = prompt(
      `You clicked two points ${formatLength(measuredMm, unit)} apart at the drawing's current scale.\nWhat is the real-world length between them? (e.g. 36'-0" or 10973mm)`
    );
    setCalibratePoints([]);
    if (!input) return;
    const realMm = parseLength(input, unit);
    if (!realMm || realMm <= 0) {
      alert("Couldn't understand that length — calibration cancelled.");
      return;
    }
    const ratio = realMm / measuredMm;
    if (ref) {
      setReferenceImage(activeFloor.id, {
        ...ref,
        width: ref.width * ratio,
        height: ref.height * ratio,
      });
    } else {
      alert("Upload a reference drawing first, then calibrate it.");
    }
    setTool("select");
  };

  const onWindowPointerMove = (e: PointerEvent) => {
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }
    if (pinchStart.current && pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const rect = containerRef.current!.getBoundingClientRect();
      const c = pinchStart.current;
      const newScale = Math.min(2, Math.max(0.005, c.scale * (dist / c.dist)));
      const floorX = (c.center.x - rect.left - c.ox) / c.scale;
      const floorY = (c.center.y - rect.top - c.oy) / c.scale;
      setView({
        scale: newScale,
        ox: c.center.x - rect.left - floorX * newScale,
        oy: c.center.y - rect.top - floorY * newScale,
      });
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;
    const floor = screenToFloor(e.clientX, e.clientY);

    if (drag.kind === "pan") {
      const dx = e.clientX - drag.startClient.x;
      const dy = e.clientY - drag.startClient.y;
      setView({ scale: drag.startView.scale, ox: drag.startView.ox + dx, oy: drag.startView.oy + dy });
    } else if (drag.kind === "draw-room") {
      setPreviewRect(rectFromCorners(drag.start, snapToGrid(floor)));
    } else if (drag.kind === "move-room") {
      const dx = snapToGrid(floor).x - snapToGrid(drag.startFloorPointer).x;
      const dy = snapToGrid(floor).y - snapToGrid(drag.startFloorPointer).y;
      setLiveRoom({ id: drag.room.id, points: moveRect(drag.startPoints, dx, dy) });
    } else if (drag.kind === "resize-room") {
      const snapped = snapToGrid(floor);
      const axisMap: Record<string, "width" | "depth"> = {
        "edge-top": "depth",
        "edge-bottom": "depth",
        "edge-left": "width",
        "edge-right": "width",
      };
      const anchorMap: Record<string, "start" | "end"> = {
        "edge-top": "end",
        "edge-bottom": "start",
        "edge-left": "end",
        "edge-right": "start",
      };
      const axis = axisMap[drag.handle];
      const anchor = anchorMap[drag.handle];
      const b = polygonBounds(drag.startPoints);
      let value: number;
      if (axis === "width") {
        value = anchor === "end" ? b.maxX - snapped.x : snapped.x - b.minX;
      } else {
        value = anchor === "end" ? b.maxY - snapped.y : snapped.y - b.minY;
      }
      setLiveRoom({ id: drag.room.id, points: resizeRect(drag.startPoints, axis, value, anchor) });
    } else if (drag.kind === "ref-image") {
      const dx = (e.clientX - drag.startClient.x) / view.scale;
      const dy = (e.clientY - drag.startClient.y) / view.scale;
      const ref = activeFloor.referenceImage;
      if (ref) setReferenceImage(activeFloor.id, { ...ref, x: drag.startX + dx, y: drag.startY + dy });
    }
  };

  const onWindowPointerUp = (e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;

    const drag = dragRef.current;
    if (drag?.kind === "draw-room") {
      const floor = screenToFloor(e.clientX, e.clientY);
      const rect = rectFromCorners(drag.start, snapToGrid(floor));
      const b = polygonBounds(rect);
      if (b.maxX - b.minX > 200 && b.maxY - b.minY > 200) {
        const room: Room = {
          id: uuid(),
          name: labelForType(drawRoomType),
          type: drawRoomType,
          points: rect,
          wallThickness: 114.3,
          ceilingHeight: 3048,
          color: colorForType(drawRoomType),
        };
        addRoom(room);
        select({ kind: "room", id: room.id });
      }
      setPreviewRect(null);
      setTool("select");
    } else if (drag?.kind === "move-room" || drag?.kind === "resize-room") {
      if (liveRoom && liveRoom.id === drag.room.id) {
        const points = liveRoom.points;
        updateRoom(drag.room.id, (r) => (r.points = points));
      }
      setLiveRoom(null);
    }

    dragRef.current = null;
    window.removeEventListener("pointermove", onWindowPointerMove);
    window.removeEventListener("pointerup", onWindowPointerUp);
  };

  useEffect(
    () => () => {
      window.removeEventListener("pointermove", onWindowPointerMove);
      window.removeEventListener("pointerup", onWindowPointerUp);
    },
    []
  );

  const startHandleDrag = (room: Room, handle: HandleId, e: React.PointerEvent) => {
    if (handle === "move") {
      dragRef.current = {
        kind: "move-room",
        room,
        startFloorPointer: screenToFloor(e.clientX, e.clientY),
        startPoints: room.points,
      };
    } else {
      dragRef.current = { kind: "resize-room", room, handle, startPoints: room.points };
    }
    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
  };

  const placeOpening = (room: Room, e: React.PointerEvent) => {
    const floor = screenToFloor(e.clientX, e.clientY);
    const edges = [
      { idx: 0, a: room.points[0], b: room.points[1] },
      { idx: 1, a: room.points[1], b: room.points[2] },
      { idx: 2, a: room.points[2], b: room.points[3] },
      { idx: 3, a: room.points[3], b: room.points[0] },
    ];
    let best = { idx: 0, t: 0.5, dist: Infinity };
    for (const edge of edges) {
      const dx = edge.b.x - edge.a.x;
      const dy = edge.b.y - edge.a.y;
      const len2 = dx * dx + dy * dy || 1;
      let t = ((floor.x - edge.a.x) * dx + (floor.y - edge.a.y) * dy) / len2;
      t = Math.max(0.02, Math.min(0.98, t));
      const px = edge.a.x + dx * t;
      const py = edge.a.y + dy * t;
      const dist = Math.hypot(floor.x - px, floor.y - py);
      if (dist < best.dist) best = { idx: edge.idx, t, dist };
    }
    const size = defaultOpeningSize(drawOpeningType);
    addOpening({
      id: uuid(),
      kind: tool === "door" ? "door" : "window",
      type: drawOpeningType,
      roomId: room.id,
      edgeIndex: best.idx,
      position: best.t,
      ...size,
    });
    setTool("select");
  };

  const startRefDrag = (e: React.PointerEvent) => {
    const ref = activeFloor.referenceImage;
    if (!ref || ref.locked || tool !== "select") return;
    e.stopPropagation();
    dragRef.current = { kind: "ref-image", startClient: { x: e.clientX, y: e.clientY }, startX: ref.x, startY: ref.y };
    window.addEventListener("pointermove", onWindowPointerMove);
    window.addEventListener("pointerup", onWindowPointerUp);
  };

  const ref = activeFloor.referenceImage;

  return (
    <div
      ref={containerRef}
      className="workspace-canvas"
      onWheel={onWheel}
      onPointerDown={onBackgroundPointerDown}
      style={{ cursor: tool === "room" ? "crosshair" : tool === "measure" || tool === "calibrate" ? "crosshair" : "default" }}
    >
      <svg width="100%" height="100%">
        <g transform={`translate(${view.ox},${view.oy}) scale(${view.scale})`}>
          {/* grid */}
          <GridPattern plotWidth={project.plotWidth} plotDepth={project.plotDepth} />

          {/* plot boundary */}
          <rect
            x={0}
            y={0}
            width={project.plotWidth}
            height={project.plotDepth}
            fill="none"
            stroke="#c0392b"
            strokeWidth={40}
            strokeDasharray="120,60"
          />

          {ref && ref.visible && (
            <image
              href={ref.dataUrl}
              x={ref.x}
              y={ref.y}
              width={ref.width}
              height={ref.height}
              opacity={ref.opacity}
              transform={`rotate(${ref.rotation} ${ref.x + ref.width / 2} ${ref.y + ref.height / 2})`}
              onPointerDown={startRefDrag}
              style={{ cursor: ref.locked ? "default" : "move" }}
            />
          )}

          {activeFloor.rooms.map((room) => {
            const displayRoom = liveRoom && liveRoom.id === room.id ? { ...room, points: liveRoom.points } : room;
            return (
              <RoomShape
                key={room.id}
                room={displayRoom}
                openings={activeFloor.openings}
                selected={selection?.kind === "room" && selection.id === room.id}
                unit={unit}
                invScale={invScale}
                viewOnly={viewOnly}
                tool={tool}
                onSelectRoom={(id) => select({ kind: "room", id })}
                onSelectOpening={(id) => select({ kind: "opening", id })}
                onStartHandleDrag={startHandleDrag}
                onResizeCommit={(r, axis, value) =>
                  updateRoom(r.id, (rm) => (rm.points = resizeRect(rm.points, axis, value, "start")))
                }
                onPlaceOpening={placeOpening}
              />
            );
          })}

          {previewRect && (
            <rect
              x={polygonBounds(previewRect).minX}
              y={polygonBounds(previewRect).minY}
              width={polygonBounds(previewRect).maxX - polygonBounds(previewRect).minX}
              height={polygonBounds(previewRect).maxY - polygonBounds(previewRect).minY}
              fill="#2f6f4f33"
              stroke="#2f6f4f"
              strokeWidth={40}
              strokeDasharray="80,40"
            />
          )}

          {measurePoints.length > 0 && (
            <MeasureOverlay points={measurePoints} unit={unit} invScale={invScale} />
          )}
          {calibratePoints.length === 1 && (
            <circle cx={calibratePoints[0].x} cy={calibratePoints[0].y} r={12 * invScale} fill="#b8860b" />
          )}
        </g>
      </svg>

      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          fontSize: 12,
          background: "rgba(255,255,255,0.9)",
          padding: "4px 8px",
          borderRadius: 6,
          color: "#6b7280",
        }}
      >
        {toolHint(tool)}
      </div>
    </div>
  );
}

function toolHint(tool: string) {
  switch (tool) {
    case "room":
      return "Drag on the canvas to draw a room.";
    case "door":
      return "Click a wall to place a door.";
    case "window":
      return "Click a wall to place a window.";
    case "measure":
      return "Click two points to measure the distance between them.";
    case "calibrate":
      return "Click two points of a known real-world length on the reference drawing.";
    default:
      return "Scroll / pinch to zoom, drag empty space to pan.";
  }
}

function labelForType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ");
}
function colorForType(type: string) {
  const map: Record<string, string> = {
    bedroom: "#cfe0f7",
    bathroom: "#d3f4f4",
    kitchen: "#faf1c6",
    living: "#d7f3e3",
    drawing: "#d7f3e3",
    dining: "#d7f3e3",
    store: "#e6def7",
    corridor: "#e6def7",
    lobby: "#e6def7",
    stairs: "#e6def7",
    veranda: "#e3edd8",
    porch: "#e3edd8",
    balcony: "#e3edd8",
    terrace: "#e3edd8",
    parking: "#dfe3e6",
    lawn: "#e3edd8",
    column: "#c7c7c7",
    furniture: "#d9c9a3",
  };
  return map[type] ?? "#eeeeee";
}

function GridPattern({ plotWidth, plotDepth }: { plotWidth: number; plotDepth: number }) {
  const step = 609.6; // 2 ft
  const lines: JSX.Element[] = [];
  for (let x = 0; x <= plotWidth + step; x += step) {
    lines.push(<line key={`v${x}`} x1={x} y1={-500} x2={x} y2={plotDepth + 500} stroke="#e2e6ea" strokeWidth={12} />);
  }
  for (let y = 0; y <= plotDepth + step; y += step) {
    lines.push(<line key={`h${y}`} x1={-500} y1={y} x2={plotWidth + 500} y2={y} stroke="#e2e6ea" strokeWidth={12} />);
  }
  return <g>{lines}</g>;
}

function MeasureOverlay({
  points,
  unit,
  invScale,
}: {
  points: Vec2[];
  unit: LengthUnit;
  invScale: number;
}) {
  if (points.length < 2) {
    return <circle cx={points[0].x} cy={points[0].y} r={12 * invScale} fill="#2f6f4f" />;
  }
  const [a, b] = points;
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#2f6f4f" strokeWidth={20} strokeDasharray="60,30" />
      <circle cx={a.x} cy={a.y} r={12 * invScale} fill="#2f6f4f" />
      <circle cx={b.x} cy={b.y} r={12 * invScale} fill="#2f6f4f" />
      <text
        x={(a.x + b.x) / 2}
        y={(a.y + b.y) / 2 - 10 * invScale}
        textAnchor="middle"
        className="dim-label"
        fontSize={13 * invScale}
      >
        {formatLength(dist, unit)}
      </text>
    </g>
  );
}
