import { useState } from "react";
import { Opening, LengthUnit, Room } from "@/types/project";
import { polygonBounds, resizeRect } from "@/lib/geometry";
import { formatLength, parseLength } from "@/lib/units";
import { computeEdgeLayout, edgeThickness } from "@/lib/wallSegments";
import OpeningSymbol from "@/components/editor2d/OpeningSymbol";

export type HandleId = "edge-top" | "edge-right" | "edge-bottom" | "edge-left" | "move";

interface Props {
  room: Room;
  openings: Opening[];
  selected: boolean;
  unit: LengthUnit;
  invScale: number; // mm per screen-px, used to keep stroke/handle sizes visually constant
  viewOnly: boolean;
  tool: string;
  onSelectRoom: (id: string) => void;
  onSelectOpening: (id: string) => void;
  onStartHandleDrag: (room: Room, handle: HandleId, e: React.PointerEvent) => void;
  onResizeCommit: (room: Room, axis: "width" | "depth", valueMm: number) => void;
  onPlaceOpening: (room: Room, screenEvent: React.PointerEvent) => void;
}

export default function RoomShape({
  room,
  openings,
  selected,
  unit,
  invScale,
  viewOnly,
  tool,
  onSelectRoom,
  onSelectOpening,
  onStartHandleDrag,
  onResizeCommit,
  onPlaceOpening,
}: Props) {
  const b = polygonBounds(room.points);
  const width = b.maxX - b.minX;
  const depth = b.maxY - b.minY;
  const [editing, setEditing] = useState<"width" | "depth" | null>(null);

  const handleSize = 9 * invScale;
  const strokeColor = selected ? "#2f6f4f" : "#33383f";

  const edges = [
    { idx: 0, a: room.points[0], b: room.points[1] }, // top
    { idx: 1, a: room.points[1], b: room.points[2] }, // right
    { idx: 2, a: room.points[2], b: room.points[3] }, // bottom
    { idx: 3, a: room.points[3], b: room.points[0] }, // left
  ];

  return (
    <g>
      <rect
        x={b.minX}
        y={b.minY}
        width={width}
        height={depth}
        fill={room.hidden ? "transparent" : room.color}
        fillOpacity={room.type === "column" || room.type === "furniture" ? 0.9 : 0.85}
        stroke="none"
        onPointerDown={(e) => {
          e.stopPropagation();
          if (!viewOnly && (tool === "door" || tool === "window")) {
            onPlaceOpening(room, e);
            return;
          }
          onSelectRoom(room.id);
          if (!viewOnly && !room.locked && tool === "select") onStartHandleDrag(room, "move", e);
        }}
        style={{
          cursor:
            !viewOnly && (tool === "door" || tool === "window")
              ? "crosshair"
              : viewOnly || room.locked
                ? "pointer"
                : "move",
        }}
      />

      {edges.map((edge) => {
        const thickness = edgeThickness(room, edge.idx);
        const { solids, placements } = computeEdgeLayout(room, edge.idx, openings);
        const dx = edge.b.x - edge.a.x;
        const dy = edge.b.y - edge.a.y;
        return (
          <g key={edge.idx}>
            {solids.map((s, i) => (
              <line
                key={i}
                x1={edge.a.x + dx * s.t1}
                y1={edge.a.y + dy * s.t1}
                x2={edge.a.x + dx * s.t2}
                y2={edge.a.y + dy * s.t2}
                stroke={strokeColor}
                strokeWidth={thickness}
                strokeLinecap="square"
              />
            ))}
            {placements.map((p) => (
              <OpeningSymbol
                key={p.opening.id}
                opening={p.opening}
                a={{ x: edge.a.x + dx * p.t1, y: edge.a.y + dy * p.t1 }}
                b={{ x: edge.a.x + dx * p.t2, y: edge.a.y + dy * p.t2 }}
                thickness={thickness}
                selected={false}
                onSelect={() => onSelectOpening(p.opening.id)}
              />
            ))}
          </g>
        );
      })}

      {!room.hidden && (
        <text
          x={(b.minX + b.maxX) / 2}
          y={(b.minY + b.maxY) / 2}
          textAnchor="middle"
          fontSize={13 * invScale}
          fill="#20242b"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <tspan x={(b.minX + b.maxX) / 2} dy={-2}>
            {room.name}
          </tspan>
          <tspan x={(b.minX + b.maxX) / 2} dy={14 * invScale} fontSize={10.5 * invScale} fill="#4b5563">
            {formatLength(width, unit)} × {formatLength(depth, unit)}
          </tspan>
        </text>
      )}

      {selected && !viewOnly && (
        <>
          {/* edge move handles */}
          <rect
            x={b.minX + width / 2 - handleSize}
            y={b.minY - handleSize / 2}
            width={handleSize * 2}
            height={handleSize}
            fill="#2f6f4f"
            style={{ cursor: "ns-resize" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartHandleDrag(room, "edge-top", e);
            }}
          />
          <rect
            x={b.minX + width / 2 - handleSize}
            y={b.maxY - handleSize / 2}
            width={handleSize * 2}
            height={handleSize}
            fill="#2f6f4f"
            style={{ cursor: "ns-resize" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartHandleDrag(room, "edge-bottom", e);
            }}
          />
          <rect
            x={b.minX - handleSize / 2}
            y={b.minY + depth / 2 - handleSize}
            width={handleSize}
            height={handleSize * 2}
            fill="#2f6f4f"
            style={{ cursor: "ew-resize" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartHandleDrag(room, "edge-left", e);
            }}
          />
          <rect
            x={b.maxX - handleSize / 2}
            y={b.minY + depth / 2 - handleSize}
            width={handleSize}
            height={handleSize * 2}
            fill="#2f6f4f"
            style={{ cursor: "ew-resize" }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartHandleDrag(room, "edge-right", e);
            }}
          />

          {/* clickable dimension labels */}
          <DimLabel
            x={(b.minX + b.maxX) / 2}
            y={b.minY - 14 * invScale}
            invScale={invScale}
            text={formatLength(width, unit)}
            editing={editing === "width"}
            onClick={() => setEditing("width")}
            onSubmit={(text) => {
              const mm = parseLength(text, unit);
              if (mm !== null) onResizeCommit(room, "width", mm);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
          <DimLabel
            x={b.minX - 34 * invScale}
            y={(b.minY + b.maxY) / 2}
            invScale={invScale}
            text={formatLength(depth, unit)}
            editing={editing === "depth"}
            onClick={() => setEditing("depth")}
            onSubmit={(text) => {
              const mm = parseLength(text, unit);
              if (mm !== null) onResizeCommit(room, "depth", mm);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        </>
      )}
    </g>
  );
}

function DimLabel({
  x,
  y,
  invScale,
  text,
  editing,
  onClick,
  onSubmit,
  onCancel,
}: {
  x: number;
  y: number;
  invScale: number;
  text: string;
  editing: boolean;
  onClick: () => void;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}) {
  if (editing) {
    const w = 70 * invScale;
    const h = 20 * invScale;
    return (
      <foreignObject x={x - w / 2} y={y - h / 2} width={w} height={h}>
        <input
          autoFocus
          defaultValue={text}
          style={{
            width: "100%",
            height: "100%",
            fontSize: 11 * invScale,
            textAlign: "center",
            border: "1px solid #2f6f4f",
            borderRadius: 4,
          }}
          onBlur={(e) => onSubmit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit((e.target as HTMLInputElement).value);
            if (e.key === "Escape") onCancel();
          }}
        />
      </foreignObject>
    );
  }
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      className="dim-label"
      fontSize={11 * invScale}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {text}
    </text>
  );
}
