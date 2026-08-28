import { Floor, RoomType } from "@/types/project";
import { polygonArea } from "@/lib/geometry";

const VERANDA_TYPES: RoomType[] = ["veranda", "porch", "balcony", "terrace"];
const OPEN_TYPES: RoomType[] = ["parking", "lawn"];
const NON_STRUCTURAL_TYPES: RoomType[] = ["column", "furniture"];

export interface AreaTotals {
  coveredAreaMm2: number;
  verandaAreaMm2: number;
  openAreaMm2: number;
  floorAreaMm2: number;
}

export function computeFloorAreaTotals(floor: Floor): AreaTotals {
  let coveredAreaMm2 = 0;
  let verandaAreaMm2 = 0;
  let openAreaMm2 = 0;

  for (const room of floor.rooms) {
    if (NON_STRUCTURAL_TYPES.includes(room.type)) continue;
    const area = polygonArea(room.points);
    if (VERANDA_TYPES.includes(room.type)) verandaAreaMm2 += area;
    else if (OPEN_TYPES.includes(room.type)) openAreaMm2 += area;
    else coveredAreaMm2 += area;
  }

  return {
    coveredAreaMm2,
    verandaAreaMm2,
    openAreaMm2,
    floorAreaMm2: coveredAreaMm2 + verandaAreaMm2,
  };
}
