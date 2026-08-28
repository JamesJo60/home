import { Opening, Room } from "@/types/project";
import { edgeLength } from "@/lib/geometry";

export interface WallSegment {
  t1: number;
  t2: number;
}

export interface OpeningPlacement {
  opening: Opening;
  t1: number;
  t2: number;
}

export function edgeThickness(room: Room, edgeIndex: number): number {
  const override = room.edgeOverrides?.find((o) => o.edgeIndex === edgeIndex);
  return override?.thickness ?? room.wallThickness;
}

export function edgeIsExterior(room: Room, edgeIndex: number): boolean {
  return room.edgeOverrides?.find((o) => o.edgeIndex === edgeIndex)?.isExterior ?? false;
}

/** Solid wall segments and opening placements (in t=0..1 along the edge) for one edge. */
export function computeEdgeLayout(
  room: Room,
  edgeIndex: number,
  openings: Opening[]
): { solids: WallSegment[]; placements: OpeningPlacement[] } {
  const L = edgeLength(room.points, edgeIndex);
  const onEdge = openings
    .filter((o) => o.roomId === room.id && o.edgeIndex === edgeIndex)
    .map((o) => {
      const centerMm = o.position * L;
      const halfW = o.width / 2;
      let t1 = (centerMm - halfW) / L;
      let t2 = (centerMm + halfW) / L;
      t1 = Math.max(0, Math.min(1, t1));
      t2 = Math.max(0, Math.min(1, t2));
      return { opening: o, t1, t2 };
    })
    .sort((a, b) => a.t1 - b.t1);

  const solids: WallSegment[] = [];
  let cursor = 0;
  for (const p of onEdge) {
    if (p.t1 > cursor) solids.push({ t1: cursor, t2: p.t1 });
    cursor = Math.max(cursor, p.t2);
  }
  if (cursor < 1) solids.push({ t1: cursor, t2: 1 });

  return { solids, placements: onEdge };
}
