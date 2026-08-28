import { Floor, Room } from "@/types/project";
import { computeEdgeLayout, edgeThickness } from "@/lib/wallSegments";
import { polygonBounds } from "@/lib/geometry";

export interface BoxSpec {
  key: string;
  roomId: string;
  cx: number; // mm, floor-space x
  cz: number; // mm, floor-space y (depth)
  cy: number; // mm, vertical center from this floor's base
  sx: number;
  sz: number;
  sy: number;
  color: string;
  opacity?: number;
  kind: "wall" | "glazing" | "slab" | "roof" | "furniture" | "column";
}

const GLAZING_COLOR = "#8fc7e8";

export function buildFloorBoxes(floor: Floor, wallColor: string): BoxSpec[] {
  const boxes: BoxSpec[] = [];
  const H = floor.floorToFloorHeight;

  for (const room of floor.rooms) {
    if (room.hidden) continue;
    const b = polygonBounds(room.points);

    if (room.type === "furniture") {
      boxes.push({
        key: `${room.id}-furn`,
        roomId: room.id,
        cx: (b.minX + b.maxX) / 2,
        cz: (b.minY + b.maxY) / 2,
        cy: 400,
        sx: b.maxX - b.minX,
        sz: b.maxY - b.minY,
        sy: 800,
        color: room.color,
        kind: "furniture",
      });
      continue;
    }
    if (room.type === "column") {
      boxes.push({
        key: `${room.id}-col`,
        roomId: room.id,
        cx: (b.minX + b.maxX) / 2,
        cz: (b.minY + b.maxY) / 2,
        cy: H / 2,
        sx: b.maxX - b.minX,
        sz: b.maxY - b.minY,
        sy: H,
        color: "#9aa1a8",
        kind: "column",
      });
      continue;
    }

    // thin floor slab under every room
    boxes.push({
      key: `${room.id}-slab`,
      roomId: room.id,
      cx: (b.minX + b.maxX) / 2,
      cz: (b.minY + b.maxY) / 2,
      cy: 50,
      sx: b.maxX - b.minX,
      sz: b.maxY - b.minY,
      sy: 100,
      color: "#d9d3c7",
      kind: "slab",
    });

    const edges = [
      { idx: 0, a: room.points[0], b: room.points[1], horizontal: true },
      { idx: 1, a: room.points[1], b: room.points[2], horizontal: false },
      { idx: 2, a: room.points[2], b: room.points[3], horizontal: true },
      { idx: 3, a: room.points[3], b: room.points[0], horizontal: false },
    ];

    for (const edge of edges) {
      const thickness = edgeThickness(room, edge.idx);
      const { solids, placements } = computeEdgeLayout(room, edge.idx, floor.openings);
      const dx = edge.b.x - edge.a.x;
      const dy = edge.b.y - edge.a.y;

      const pushWallBox = (t1: number, t2: number, yFrom: number, yTo: number, kind: BoxSpec["kind"] = "wall", color = wallColor, opacity = 1) => {
        const ax = edge.a.x + dx * t1;
        const ay = edge.a.y + dy * t1;
        const bx = edge.a.x + dx * t2;
        const by = edge.a.y + dy * t2;
        const cx = (ax + bx) / 2;
        const cz = (ay + by) / 2;
        const length = Math.hypot(bx - ax, by - ay);
        boxes.push({
          key: `${room.id}-e${edge.idx}-${t1.toFixed(3)}-${yFrom}`,
          roomId: room.id,
          cx,
          cz,
          cy: (yFrom + yTo) / 2,
          sx: edge.horizontal ? length : thickness,
          sz: edge.horizontal ? thickness : length,
          sy: Math.max(1, yTo - yFrom),
          color,
          opacity,
          kind,
        });
      };

      for (const s of solids) pushWallBox(s.t1, s.t2, 0, H);
      for (const p of placements) {
        if (p.opening.kind === "door") {
          pushWallBox(p.t1, p.t2, p.opening.height, H);
        } else {
          if (p.opening.sillHeight > 0) pushWallBox(p.t1, p.t2, 0, p.opening.sillHeight);
          pushWallBox(p.t1, p.t2, p.opening.sillHeight, p.opening.sillHeight + p.opening.height, "glazing", GLAZING_COLOR, 0.35);
          if (p.opening.sillHeight + p.opening.height < H) {
            pushWallBox(p.t1, p.t2, p.opening.sillHeight + p.opening.height, H);
          }
        }
      }
    }
  }

  return boxes;
}

export function floorFootprintBounds(floor: Floor) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const room of floor.rooms) {
    const b = polygonBounds(room.points);
    minX = Math.min(minX, b.minX);
    maxX = Math.max(maxX, b.maxX);
    minY = Math.min(minY, b.minY);
    maxY = Math.max(maxY, b.maxY);
  }
  if (!Number.isFinite(minX)) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  return { minX, maxX, minY, maxY };
}
