import { useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { Room, RoomType } from "@/types/project";
import { formatLength, mmToSqFt, mmToSqM, parseLength } from "@/lib/units";
import { polygonArea, polygonBounds, resizeRect, ResizeAnchor } from "@/lib/geometry";

const ROOM_TYPES: RoomType[] = [
  "bedroom",
  "living",
  "drawing",
  "dining",
  "kitchen",
  "dry-kitchen",
  "bathroom",
  "dressing",
  "store",
  "corridor",
  "lobby",
  "stairs",
  "veranda",
  "porch",
  "balcony",
  "terrace",
  "parking",
  "lawn",
  "column",
  "furniture",
  "other",
];

export default function RoomProperties({ room }: { room: Room }) {
  const unit = useProjectStore((s) => s.unit);
  const updateRoom = useProjectStore((s) => s.updateRoom);
  const removeRoom = useProjectStore((s) => s.removeRoom);
  const duplicateRoom = useProjectStore((s) => s.duplicateRoom);
  const select = useProjectStore((s) => s.select);
  const viewOnly = useProjectStore((s) => s.viewOnly);

  const [widthAnchor, setWidthAnchor] = useState<ResizeAnchor>("start");
  const [depthAnchor, setDepthAnchor] = useState<ResizeAnchor>("start");

  const b = polygonBounds(room.points);
  const width = b.maxX - b.minX;
  const depth = b.maxY - b.minY;
  const areaMm2 = polygonArea(room.points);

  const setWidth = (text: string) => {
    const mm = parseLength(text, unit);
    if (mm === null || viewOnly) return;
    updateRoom(room.id, (r) => {
      r.points = resizeRect(r.points, "width", mm, widthAnchor);
    });
  };
  const setDepth = (text: string) => {
    const mm = parseLength(text, unit);
    if (mm === null || viewOnly) return;
    updateRoom(room.id, (r) => {
      r.points = resizeRect(r.points, "depth", mm, depthAnchor);
    });
  };

  return (
    <div className="panel-section">
      <div className="panel-title">Room</div>

      <div className="field-row">
        <label>Name</label>
        <input
          type="text"
          value={room.name}
          disabled={viewOnly}
          onChange={(e) => updateRoom(room.id, (r) => (r.name = e.target.value))}
        />
      </div>

      <div className="field-row">
        <label>Type</label>
        <select
          value={room.type}
          disabled={viewOnly}
          onChange={(e) => updateRoom(room.id, (r) => (r.type = e.target.value as RoomType))}
        >
          {ROOM_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <label>Width</label>
        <input
          type="text"
          key={`w-${room.id}-${width}`}
          defaultValue={formatLength(width, unit)}
          disabled={viewOnly}
          onBlur={(e) => setWidth(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      </div>
      {!viewOnly && (
        <div className="chip-row">
          {(["start", "both", "end"] as ResizeAnchor[]).map((a) => (
            <button
              key={a}
              className={`chip ${widthAnchor === a ? "active" : ""}`}
              onClick={() => setWidthAnchor(a)}
            >
              {a === "start" ? "move left wall" : a === "end" ? "move right wall" : "expand both"}
            </button>
          ))}
        </div>
      )}

      <div className="field-row">
        <label>Depth</label>
        <input
          type="text"
          key={`d-${room.id}-${depth}`}
          defaultValue={formatLength(depth, unit)}
          disabled={viewOnly}
          onBlur={(e) => setDepth(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        />
      </div>
      {!viewOnly && (
        <div className="chip-row">
          {(["start", "both", "end"] as ResizeAnchor[]).map((a) => (
            <button
              key={a}
              className={`chip ${depthAnchor === a ? "active" : ""}`}
              onClick={() => setDepthAnchor(a)}
            >
              {a === "start" ? "move top wall" : a === "end" ? "move bottom wall" : "expand both"}
            </button>
          ))}
        </div>
      )}

      <div className="field-row">
        <label>Ceiling height</label>
        <input
          type="text"
          key={`c-${room.id}-${room.ceilingHeight}`}
          defaultValue={formatLength(room.ceilingHeight, unit)}
          disabled={viewOnly}
          onBlur={(e) => {
            const mm = parseLength(e.target.value, unit);
            if (mm !== null) updateRoom(room.id, (r) => (r.ceilingHeight = mm));
          }}
        />
      </div>

      <div className="field-row">
        <label>Wall thickness</label>
        <input
          type="text"
          key={`t-${room.id}-${room.wallThickness}`}
          defaultValue={formatLength(room.wallThickness, unit)}
          disabled={viewOnly}
          onBlur={(e) => {
            const mm = parseLength(e.target.value, unit);
            if (mm !== null) updateRoom(room.id, (r) => (r.wallThickness = mm));
          }}
        />
      </div>

      <div className="stat-line">
        <span>Area</span>
        <b>
          {mmToSqFt(areaMm2).toFixed(1)} sq ft · {mmToSqM(areaMm2).toFixed(2)} sq m
        </b>
      </div>

      {!viewOnly && (
        <div className="btn-row">
          <button className="btn" onClick={() => duplicateRoom(room.id)}>
            Duplicate
          </button>
          <button
            className="btn"
            onClick={() => updateRoom(room.id, (r) => (r.locked = !r.locked))}
          >
            {room.locked ? "Unlock" : "Lock"}
          </button>
          <button
            className="btn danger"
            onClick={() => {
              if (confirm(`Delete "${room.name}"?`)) removeRoom(room.id);
            }}
          >
            Delete
          </button>
        </div>
      )}
      {!viewOnly && (
        <button className="btn small" onClick={() => select(null)}>
          Deselect
        </button>
      )}
    </div>
  );
}
