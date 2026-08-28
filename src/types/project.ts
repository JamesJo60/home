// Canonical internal unit for all geometry is millimetres (mm).
// This keeps every downstream calculation (area, elevation projection,
// 3D extrusion) working off one unambiguous number instead of re-parsing
// feet/inches strings in multiple places.

export type RoomType =
  | "bedroom"
  | "living"
  | "drawing"
  | "dining"
  | "kitchen"
  | "dry-kitchen"
  | "bathroom"
  | "dressing"
  | "store"
  | "corridor"
  | "lobby"
  | "stairs"
  | "veranda"
  | "porch"
  | "balcony"
  | "terrace"
  | "parking"
  | "lawn"
  | "column"
  | "furniture"
  | "other";

export const NO_WALL_ROOM_TYPES: RoomType[] = ["column", "furniture"];

export interface Vec2 {
  x: number; // mm
  y: number; // mm
}

export interface RoomEdgeOverride {
  /** index of the edge (point[i] -> point[i+1]) this override applies to */
  edgeIndex: number;
  thickness: number; // mm, overrides the room's default wall thickness for this edge
  isExterior: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  /** Polygon in floor-local mm coordinates, drawn clockwise. MVP: always a rectangle (4 points). */
  points: Vec2[];
  wallThickness: number; // mm, default thickness for all edges unless overridden
  edgeOverrides?: RoomEdgeOverride[];
  ceilingHeight: number; // mm
  color: string;
  locked?: boolean;
  hidden?: boolean;
}

export type OpeningType =
  | "single-door"
  | "double-door"
  | "sliding-door"
  | "entrance-door"
  | "fixed-window"
  | "sliding-window"
  | "casement-window"
  | "louvered-window";

export interface Opening {
  id: string;
  kind: "door" | "window";
  type: OpeningType;
  roomId: string;
  edgeIndex: number;
  /** 0..1 position of the opening's center along the edge */
  position: number;
  width: number; // mm
  height: number; // mm
  sillHeight: number; // mm, 0 for doors
  locked?: boolean;
}

export interface ReferenceImage {
  dataUrl: string;
  fileName: string;
  x: number; // mm, top-left placement in floor space
  y: number;
  width: number; // mm, rendered width (drives scale together with calibration)
  height: number; // mm
  rotation: number; // degrees
  opacity: number; // 0..1
  locked: boolean;
  visible: boolean;
}

export interface Floor {
  id: string;
  name: string;
  /** stacking order, 0 = ground, negative = below ground, positive = above */
  level: number;
  floorToFloorHeight: number; // mm
  rooms: Room[];
  openings: Opening[];
  referenceImage?: ReferenceImage;
}

export type CommentTarget =
  | { kind: "room"; floorId: string; roomId: string }
  | { kind: "opening"; floorId: string; openingId: string }
  | { kind: "elevation"; side: "front" | "rear" | "left" | "right" }
  | { kind: "version"; versionId: string }
  | { kind: "general" };

export interface Comment {
  id: string;
  target: CommentTarget;
  author: string;
  text: string;
  createdAt: string;
  resolved: boolean;
}

export type ExteriorStyle =
  | "modern"
  | "traditional"
  | "mountain-village"
  | "contemporary"
  | "minimalist";

export type RoofStyle = "flat-rcc" | "sloping" | "gable" | "hip" | "combination";

export interface ExteriorDesign {
  style: ExteriorStyle;
  roofStyle: RoofStyle;
  roofSlopeDeg: number;
  roofOverhang: number; // mm
  parapetHeight: number; // mm
  wallFinish: "plaster" | "brick" | "stone-cladding" | "wood";
  wallColor: string;
  accentColor: string;
}

export interface Project {
  id: string;
  name: string;
  plotWidth: number; // mm
  plotDepth: number; // mm
  address: string;
  floors: Floor[];
  exterior: ExteriorDesign;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface VersionMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type LengthUnit = "ft-in" | "mm" | "m";

export const DEFAULT_EXTERIOR_WALL_THICKNESS = 228.6; // 9"
export const DEFAULT_INTERIOR_WALL_THICKNESS = 114.3; // 4.5"
export const DEFAULT_CEILING_HEIGHT = 3048; // 10'
export const DEFAULT_FLOOR_TO_FLOOR = 3200; // ~10'6"
