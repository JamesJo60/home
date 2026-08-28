import { Vec2 } from "@/types/project";

export function polygonArea(points: Vec2[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2;
}

export function polygonBounds(points: Vec2[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

export function edgeLength(points: Vec2[], edgeIndex: number): number {
  const a = points[edgeIndex];
  const b = points[(edgeIndex + 1) % points.length];
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function pointAlongEdge(points: Vec2[], edgeIndex: number, t: number): Vec2 {
  const a = points[edgeIndex];
  const b = points[(edgeIndex + 1) % points.length];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function edgeAngle(points: Vec2[], edgeIndex: number): number {
  const a = points[edgeIndex];
  const b = points[(edgeIndex + 1) % points.length];
  return Math.atan2(b.y - a.y, b.x - a.x);
}

const GRID_MM = 152.4; // 6" grid
const ANGLE_SNAP_DEG = 45;

/** Snap a free point to the nearest grid intersection. */
export function snapToGrid(p: Vec2, gridMm: number = GRID_MM): Vec2 {
  return {
    x: Math.round(p.x / gridMm) * gridMm,
    y: Math.round(p.y / gridMm) * gridMm,
  };
}

/** Snap a drag delta so the resulting angle from `origin` is a multiple of 45deg. */
export function snapAngle(origin: Vec2, target: Vec2, stepDeg: number = ANGLE_SNAP_DEG): Vec2 {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return target;
  const angle = Math.atan2(dy, dx);
  const step = (stepDeg * Math.PI) / 180;
  const snapped = Math.round(angle / step) * step;
  return {
    x: origin.x + Math.cos(snapped) * dist,
    y: origin.y + Math.sin(snapped) * dist,
  };
}

/** Build an axis-aligned rectangle (clockwise) from two opposite corners. */
export function rectFromCorners(a: Vec2, b: Vec2): Vec2[] {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function uuid(): string {
  return crypto.randomUUID();
}

export type ResizeAnchor = "start" | "end" | "both";

/**
 * Resize a rectangular room in place along one axis. Rooms are always stored as a
 * 4-point clockwise rectangle: [minX,minY] [maxX,minY] [maxX,maxY] [minX,maxY].
 * This is the function behind "click a dimension, type a new value" — it moves
 * exactly the wall(s) implied by `anchor` and leaves the rest of the geometry alone.
 */
export function resizeRect(
  points: Vec2[],
  axis: "width" | "depth",
  newValueMm: number,
  anchor: ResizeAnchor
): Vec2[] {
  const b = polygonBounds(points);
  const value = Math.max(150, newValueMm); // never collapse below 150mm
  let min: number, max: number;
  if (axis === "width") {
    const [curMin, curMax] = [b.minX, b.maxX];
    if (anchor === "start") {
      min = curMin;
      max = curMin + value;
    } else if (anchor === "end") {
      max = curMax;
      min = curMax - value;
    } else {
      const center = (curMin + curMax) / 2;
      min = center - value / 2;
      max = center + value / 2;
    }
    return [
      { x: min, y: b.minY },
      { x: max, y: b.minY },
      { x: max, y: b.maxY },
      { x: min, y: b.maxY },
    ];
  } else {
    const [curMin, curMax] = [b.minY, b.maxY];
    if (anchor === "start") {
      min = curMin;
      max = curMin + value;
    } else if (anchor === "end") {
      max = curMax;
      min = curMax - value;
    } else {
      const center = (curMin + curMax) / 2;
      min = center - value / 2;
      max = center + value / 2;
    }
    return [
      { x: b.minX, y: min },
      { x: b.maxX, y: min },
      { x: b.maxX, y: max },
      { x: b.minX, y: max },
    ];
  }
}

export function moveRect(points: Vec2[], dx: number, dy: number): Vec2[] {
  return points.map((p) => ({ x: p.x + dx, y: p.y + dy }));
}
