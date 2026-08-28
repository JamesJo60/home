import { useRef } from "react";
import { useProjectStore } from "@/store/projectStore";
import { ElevationSide, buildElevation } from "@/lib/elevation";
import { formatLength } from "@/lib/units";

export default function ElevationView({ side }: { side: ElevationSide }) {
  const project = useProjectStore((s) => s.project);
  const unit = useProjectStore((s) => s.unit);
  const containerRef = useRef<HTMLDivElement>(null);

  const data = buildElevation(project, side);
  const pad = 800;
  const totalW = data.width + pad * 2;
  const totalH = data.totalHeight + pad * 2 + 600;

  const groundFillColor = project.exterior.wallColor;

  return (
    <div ref={containerRef} className="workspace-canvas" style={{ background: "#eaf1f6" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${totalW} ${totalH}`} preserveAspectRatio="xMidYMid meet">
        <rect x={0} y={0} width={totalW} height={totalH} fill="#eaf1f6" />
        {/* ground line */}
        <line
          x1={0}
          y1={data.totalHeight + pad}
          x2={totalW}
          y2={data.totalHeight + pad}
          stroke="#5b6470"
          strokeWidth={16}
        />
        <text x={20} y={data.totalHeight + pad + 40} fontSize={130} fill="#5b6470">
          Ground level
        </text>

        <g transform={`translate(${pad}, ${pad})`}>
          {data.bands
            .slice()
            .reverse()
            .map((band) => {
              const yTop = data.totalHeight - band.y - band.height;
              return (
                <g key={band.floorId}>
                  <rect
                    x={0}
                    y={yTop}
                    width={data.width}
                    height={band.height}
                    fill={groundFillColor}
                    stroke="#4a4438"
                    strokeWidth={10}
                  />
                  {band.openings.map((o) => {
                    const oy = yTop + band.height - o.sillHeight - o.height;
                    return (
                      <rect
                        key={o.id}
                        x={o.x}
                        y={o.kind === "door" ? yTop + band.height - o.height : oy}
                        width={o.width}
                        height={o.kind === "door" ? o.height : o.height}
                        fill={o.kind === "door" ? "#7a5230" : "#8fc7e8"}
                        stroke="#33383f"
                        strokeWidth={6}
                        fillOpacity={0.85}
                      />
                    );
                  })}
                  <text x={10} y={yTop + 40} fontSize={110} fill="#33383f">
                    {band.floorName} · {formatLength(band.height, unit)}
                  </text>
                </g>
              );
            })}

          {/* parapet — sits above all floor bands, at the very top of the elevation */}
          <rect
            x={0}
            y={0}
            width={data.width}
            height={data.parapetHeight}
            fill={project.exterior.accentColor}
            stroke="#33383f"
            strokeWidth={10}
          />

          {/* overall height dimension */}
          <text x={data.width + 40} y={40} fontSize={120} fill="#1c2128">
            {formatLength(data.totalHeight, unit)} overall
          </text>
          <text x={0} y={-40} fontSize={140} fill="#1c2128" fontWeight={700}>
            {side.toUpperCase()} ELEVATION — {formatLength(data.width, unit)} wide
          </text>
        </g>
      </svg>
    </div>
  );
}
