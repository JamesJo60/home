import { Opening, Project } from "@/types/project";
import { edgeAngle, pointAlongEdge, polygonBounds } from "@/lib/geometry";

export type ElevationSide = "front" | "rear" | "left" | "right";

export interface ElevationOpening {
  id: string;
  kind: "door" | "window";
  x: number; // mm from left edge of the elevation
  width: number;
  sillHeight: number; // mm from floor
  height: number;
  floorY: number; // mm, elevation-space Y of the floor this opening sits on (0 = ground floor top of slab)
}

export interface ElevationFloorBand {
  floorId: string;
  floorName: string;
  y: number; // bottom of this floor band in elevation space (mm, 0 = ground)
  height: number;
  openings: ElevationOpening[];
}

export interface ElevationData {
  side: ElevationSide;
  width: number; // mm, overall elevation width
  totalHeight: number;
  bands: ElevationFloorBand[];
  parapetHeight: number;
  roofOverhang: number;
}

const TOLERANCE = 350; // mm, how close a wall edge must be to the footprint boundary to count as "on this side"

export function buildElevation(project: Project, side: ElevationSide): ElevationData {
  const floors = [...project.floors].sort((a, b) => a.level - b.level);

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const floor of floors) {
    for (const room of floor.rooms) {
      const b = polygonBounds(room.points);
      minX = Math.min(minX, b.minX);
      maxX = Math.max(maxX, b.maxX);
      minY = Math.min(minY, b.minY);
      maxY = Math.max(maxY, b.maxY);
    }
  }
  if (!Number.isFinite(minX)) {
    minX = 0;
    maxX = project.plotWidth;
    minY = 0;
    maxY = project.plotDepth;
  }

  const width = side === "front" || side === "rear" ? maxX - minX : maxY - minY;

  let cumulativeY = 0;
  const bands: ElevationFloorBand[] = [];

  for (const floor of floors) {
    const floorOpenings: ElevationOpening[] = [];

    for (const opening of floor.openings) {
      const room = floor.rooms.find((r) => r.id === opening.roomId);
      if (!room) continue;
      const a = room.points[opening.edgeIndex];
      const b = room.points[(opening.edgeIndex + 1) % room.points.length];
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;

      const onSide =
        (side === "front" && Math.abs(midY - maxY) < TOLERANCE) ||
        (side === "rear" && Math.abs(midY - minY) < TOLERANCE) ||
        (side === "left" && Math.abs(midX - minX) < TOLERANCE) ||
        (side === "right" && Math.abs(midX - maxX) < TOLERANCE);
      if (!onSide) continue;

      const angle = edgeAngle(room.points, opening.edgeIndex);
      const isHorizontalEdge = Math.abs(Math.sin(angle)) < 0.2;
      // for front/rear elevation we need edges running horizontally (along X)
      // for left/right elevation we need edges running vertically (along Y)
      if ((side === "front" || side === "rear") && !isHorizontalEdge) continue;
      if ((side === "left" || side === "right") && isHorizontalEdge) continue;

      const center = pointAlongEdge(room.points, opening.edgeIndex, opening.position);
      const x = side === "front" || side === "rear" ? center.x - minX : center.y - minY;

      floorOpenings.push({
        id: opening.id,
        kind: opening.kind,
        x: x - opening.width / 2,
        width: opening.width,
        sillHeight: opening.sillHeight,
        height: opening.height,
        floorY: cumulativeY,
      });
    }

    bands.push({
      floorId: floor.id,
      floorName: floor.name,
      y: cumulativeY,
      height: floor.floorToFloorHeight,
      openings: floorOpenings,
    });
    cumulativeY += floor.floorToFloorHeight;
  }

  return {
    side,
    width,
    totalHeight: cumulativeY + project.exterior.parapetHeight,
    bands,
    parapetHeight: project.exterior.parapetHeight,
    roofOverhang: project.exterior.roofOverhang,
  };
}

export function openingsOnSide(project: Project, side: ElevationSide): Opening[] {
  return buildElevation(project, side).bands.flatMap((b) => b.openings) as unknown as Opening[];
}
