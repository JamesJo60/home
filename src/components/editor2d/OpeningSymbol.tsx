import { Opening, Vec2 } from "@/types/project";

interface Props {
  opening: Opening;
  a: Vec2;
  b: Vec2;
  thickness: number;
  selected: boolean;
  onSelect: () => void;
}

export default function OpeningSymbol({ opening, a, b, thickness, selected, onSelect }: Props) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len; // wall normal
  const ny = dx / len;
  const half = thickness / 2;

  if (opening.kind === "window") {
    return (
      <g onPointerDown={(e) => (e.stopPropagation(), onSelect())} style={{ cursor: "pointer" }}>
        <line
          x1={a.x + nx * half}
          y1={a.y + ny * half}
          x2={b.x + nx * half}
          y2={b.y + ny * half}
          stroke={selected ? "#2f6f4f" : "#1f6fb2"}
          strokeWidth={thickness * 0.18}
        />
        <line
          x1={a.x - nx * half}
          y1={a.y - ny * half}
          x2={b.x - nx * half}
          y2={b.y - ny * half}
          stroke={selected ? "#2f6f4f" : "#1f6fb2"}
          strokeWidth={thickness * 0.18}
        />
        <rect
          x={Math.min(a.x, b.x) - Math.abs(nx) * half}
          y={Math.min(a.y, b.y) - Math.abs(ny) * half}
          width={Math.abs(dx) + Math.abs(nx) * thickness || thickness}
          height={Math.abs(dy) + Math.abs(ny) * thickness || thickness}
          fill="transparent"
          onPointerDown={(e) => (e.stopPropagation(), onSelect())}
        />
      </g>
    );
  }

  // door: open gap + swing arc + leaf
  const hingeX = a.x;
  const hingeY = a.y;
  const leafEndX = a.x + nx * len;
  const leafEndY = a.y + ny * len;

  return (
    <g onPointerDown={(e) => (e.stopPropagation(), onSelect())} style={{ cursor: "pointer" }}>
      <rect
        x={Math.min(a.x, b.x) - Math.abs(nx) * half}
        y={Math.min(a.y, b.y) - Math.abs(ny) * half}
        width={Math.abs(dx) + Math.abs(nx) * thickness || thickness}
        height={Math.abs(dy) + Math.abs(ny) * thickness || thickness}
        fill="white"
      />
      <line
        x1={hingeX}
        y1={hingeY}
        x2={leafEndX}
        y2={leafEndY}
        stroke={selected ? "#2f6f4f" : "#7a5230"}
        strokeWidth={thickness * 0.14}
      />
      <path
        d={`M ${a.x + dx} ${a.y + dy} A ${len} ${len} 0 0 1 ${leafEndX} ${leafEndY}`}
        fill="none"
        stroke={selected ? "#2f6f4f" : "#7a5230"}
        strokeWidth={thickness * 0.06}
        strokeDasharray={`${thickness * 0.15} ${thickness * 0.15}`}
      />
    </g>
  );
}
