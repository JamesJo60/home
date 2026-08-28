import {
  DEFAULT_CEILING_HEIGHT,
  DEFAULT_EXTERIOR_WALL_THICKNESS,
  DEFAULT_FLOOR_TO_FLOOR,
  DEFAULT_INTERIOR_WALL_THICKNESS,
  Floor,
  Project,
  Room,
  RoomType,
} from "@/types/project";
import { uuid } from "@/lib/geometry";

const FT = 304.8; // mm per foot

function rect(xFt: number, yFt: number, wFt: number, dFt: number) {
  const x = xFt * FT;
  const y = yFt * FT;
  const w = wFt * FT;
  const d = dFt * FT;
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + d },
    { x, y: y + d },
  ];
}

const ROOM_COLORS: Record<RoomType, string> = {
  bedroom: "#cfe0f7",
  living: "#d7f3e3",
  drawing: "#d7f3e3",
  dining: "#d7f3e3",
  kitchen: "#faf1c6",
  "dry-kitchen": "#faf1c6",
  bathroom: "#d3f4f4",
  dressing: "#d3f4f4",
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
  other: "#eeeeee",
};

let seq = 0;
function room(
  name: string,
  type: RoomType,
  xFt: number,
  yFt: number,
  wFt: number,
  dFt: number,
  exterior: boolean[] = [true, true, true, true]
): Room {
  seq += 1;
  return {
    id: `sample-room-${seq}`,
    name,
    type,
    points: rect(xFt, yFt, wFt, dFt),
    wallThickness: DEFAULT_INTERIOR_WALL_THICKNESS,
    edgeOverrides: exterior
      .map((isExt, edgeIndex) =>
        isExt
          ? { edgeIndex, thickness: DEFAULT_EXTERIOR_WALL_THICKNESS, isExterior: true }
          : null
      )
      .filter(Boolean) as Room["edgeOverrides"],
    ceilingHeight: DEFAULT_CEILING_HEIGHT,
    color: ROOM_COLORS[type],
  };
}

/**
 * All room names & clear (internal) dimensions below are taken directly from the official
 * "Furniture Layout Plan" (drawing A466-007, Syed Brothers — Engineers, Architects &
 * Consultants, architect Aftab Ahmad) for Plot No. 667, Golden Model Town, Islamabad — the PDF
 * in `reference-drawings/pdf/`. The wall centerlines below are a clean re-layout for this
 * editor (that PDF's exact CAD wall geometry isn't machine-readable, and a few circulation
 * areas — stairs, open-to-sky shafts — aren't dimensioned on the drawing) — use
 * Upload Drawing + Calibrate to trace the exact wall positions if you need precision.
 * Ground, First and Top share the same bedroom-wing footprint, matching how the real
 * drawings stack those floors.
 */

function upperWingRooms(): Room[] {
  return [
    room("Bed Room", "bedroom", 0, 0, 15.5, 13, [true, false, false, true]),
    room("Dress", "dressing", 15.5, 0, 6, 6, [false, false, false, true]),
    room("Bath", "bathroom", 21.5, 0, 7.5, 6, [false, true, false, true]),
    room("Bed Room", "bedroom", 15.5, 6, 14, 11.75, [false, true, false, false]),
    room("Lobby", "lobby", 0, 13, 15.5, 4.75),
  ];
}

function buildBasement(): Floor {
  const rooms: Room[] = [
    room("Bed Room", "bedroom", 0, 0, 12.5, 12.5, [true, false, false, true]),
    room("Bath", "bathroom", 12.5, 0, 12, 6, [false, true, false, true]),
    room("Dress", "dressing", 12.5, 6, 5.25, 6, [false, false, false, false]),
    room("Bath", "bathroom", 17.75, 6, 6.25, 6),
    room("Bed Room", "bedroom", 12.5, 12, 12, 11.75, [false, true, false, false]),
    room("T.V Lounge", "living", 0, 12.5, 17.75, 16, [true, false, false, false]),
    room("Kitchen", "kitchen", 17.75, 23.75, 10.5, 12.5, [false, true, false, false]),
    room("Store", "store", 0, 28.5, 7, 7),
    room("Dress", "dressing", 11.75, 36.25, 5.625, 6),
    room("Bath", "bathroom", 17.375, 36.25, 6.75, 6, [false, true, false, false]),
    room("Bed Room", "bedroom", 0, 35.5, 11.75, 15.75, [true, false, false, true]),
    room("Sunken", "veranda", 0, 51.25, 11.75, 4, [true, true, false, true]),
  ];
  return {
    id: "floor-basement",
    name: "Basement",
    level: -1,
    floorToFloorHeight: DEFAULT_FLOOR_TO_FLOOR,
    rooms,
    openings: [],
  };
}

function buildGroundFloor(): Floor {
  const rooms: Room[] = [
    ...upperWingRooms(),
    room("Bath", "bathroom", 0, 17.75, 11, 4.5, [true, false, false, true]),
    room("T.V Lounge", "living", 0, 22.25, 14.5, 16, [true, false, false, false]),
    room("O.T.S", "veranda", 14.5, 17.75, 3, 20.5, [false, false, false, false]),
    room("Kitchen", "kitchen", 17.5, 17.75, 12, 12.5, [false, true, false, false]),
    room("D/Kitchen", "dry-kitchen", 17.5, 30.25, 12, 5.5, [false, true, false, false]),
    room("Dining", "dining", 0, 38.25, 11, 12, [true, false, false, false]),
    room("Lobby", "lobby", 11, 38.25, 6, 16),
    room("Stairs", "stairs", 17, 38.25, 12.5, 12, [false, true, false, false]),
    room("Powder", "bathroom", 11, 50.25, 3.5, 4.5),
    room("Drawing Room", "drawing", 0, 50.25, 12.25, 13.25, [true, false, false, false]),
    room("Porch / Car Parking", "parking", 11, 54.75, 18.5, 20, [false, true, false, false]),
    room("Sunken", "veranda", 0, 63.5, 12.25, 4, [true, false, false, false]),
    room("Lawn", "lawn", 0, 67.5, 12.25, 7, [true, true, false, true]),
  ];
  return {
    id: "floor-ground",
    name: "Ground Floor",
    level: 0,
    floorToFloorHeight: DEFAULT_FLOOR_TO_FLOOR,
    rooms,
    openings: [],
  };
}

function buildFirstFloor(): Floor {
  const rooms: Room[] = [
    ...upperWingRooms(),
    room("Bath", "bathroom", 0, 17.75, 11, 4.5, [true, false, false, true]),
    room("T.V Lounge", "living", 0, 22.25, 14.5, 16, [true, false, false, false]),
    room("O.T.S", "veranda", 14.5, 17.75, 3, 20.5, [false, false, false, false]),
    room("Kitchen", "kitchen", 17.5, 17.75, 12, 12.5, [false, true, false, false]),
    room("Laundry", "other", 17.5, 30.25, 12, 5.5, [false, true, false, false]),
    room("Bath", "bathroom", 0, 38.25, 11, 5.5, [true, false, false, false]),
    room("Dress", "dressing", 0, 43.75, 11, 6, [true, false, false, false]),
    room("Bed Room", "bedroom", 0, 49.75, 16.75, 13.25, [true, false, false, true]),
    room("Stairs", "stairs", 17, 38.25, 12.5, 12, [false, true, false, false]),
    room("Terrace", "terrace", 11, 50.25, 18.5, 13.5, [false, true, true, false]),
  ];
  return {
    id: "floor-first",
    name: "First Floor",
    level: 1,
    floorToFloorHeight: DEFAULT_FLOOR_TO_FLOOR,
    rooms,
    openings: [],
  };
}

function buildTopFloor(): Floor {
  const rooms: Room[] = [
    ...upperWingRooms(),
    room("Top Roof / Sitting", "terrace", 0, 17.75, 14.5, 20.5, [true, false, false, true]),
    room("O.T.S", "veranda", 14.5, 17.75, 3, 20.5, [false, false, false, false]),
    room("Kitchen", "kitchen", 17, 17.75, 11.5, 12.5, [false, true, false, false]),
    room("Laundry", "other", 17, 30.25, 12, 5.5, [false, true, false, false]),
    room("Top Roof", "terrace", 0, 38.25, 16.75, 24.75, [true, false, false, true]),
    room("Stairs", "stairs", 17, 38.25, 12, 12, [false, true, false, false]),
    room("Terrace", "terrace", 11, 50.25, 18.5, 13.5, [false, true, true, false]),
  ];
  return {
    id: "floor-top",
    name: "Top Floor / Roof",
    level: 2,
    floorToFloorHeight: DEFAULT_FLOOR_TO_FLOOR,
    rooms,
    openings: [],
  };
}

export function createSampleProject(): Project {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    name: "Plot 667 — Golden Model Town, Islamabad",
    plotWidth: 40 * FT,
    plotDepth: 76 * FT,
    address: "Plot No. 667, Golden Model Town, Islamabad",
    floors: [buildBasement(), buildGroundFloor(), buildFirstFloor(), buildTopFloor()],
    exterior: {
      style: "contemporary",
      roofStyle: "flat-rcc",
      roofSlopeDeg: 0,
      roofOverhang: 450,
      parapetHeight: 900,
      wallFinish: "plaster",
      wallColor: "#f2ede3",
      accentColor: "#8a6d3b",
    },
    comments: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createBlankProject(name = "Untitled Project"): Project {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    name,
    plotWidth: 40 * FT,
    plotDepth: 60 * FT,
    address: "",
    floors: [
      {
        id: "floor-ground",
        name: "Ground Floor",
        level: 0,
        floorToFloorHeight: DEFAULT_FLOOR_TO_FLOOR,
        rooms: [],
        openings: [],
      },
    ],
    exterior: {
      style: "modern",
      roofStyle: "flat-rcc",
      roofSlopeDeg: 0,
      roofOverhang: 450,
      parapetHeight: 900,
      wallFinish: "plaster",
      wallColor: "#f2ede3",
      accentColor: "#8a6d3b",
    },
    comments: [],
    createdAt: now,
    updatedAt: now,
  };
}
