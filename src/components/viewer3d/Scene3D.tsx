import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, PerspectiveCamera, Grid } from "@react-three/drei";
import { useProjectStore } from "@/store/projectStore";
import { buildFloorBoxes, floorFootprintBounds } from "@/lib/threeGeometry";

const MM = 0.001; // scene units are metres; convert mm -> m

function RoofGroup({
  centerX,
  centerZ,
  totalHeight,
  footprintW,
  footprintD,
  overhang,
  parapetHeight,
  slabColor,
  parapetColor,
}: {
  centerX: number;
  centerZ: number;
  totalHeight: number;
  footprintW: number;
  footprintD: number;
  overhang: number;
  parapetHeight: number;
  slabColor: string;
  parapetColor: string;
}) {
  const slabThickness = 0.15;
  const w = footprintW + overhang * 2;
  const d = footprintD + overhang * 2;
  const frameThickness = 0.15;
  const slabY = totalHeight + slabThickness / 2;
  const parapetY = totalHeight + slabThickness + parapetHeight / 2;

  return (
    <group>
      <mesh position={[centerX, slabY, centerZ]}>
        <boxGeometry args={[w, slabThickness, d]} />
        <meshStandardMaterial color={slabColor} />
      </mesh>
      {parapetHeight > 0 && (
        <>
          <mesh position={[centerX, parapetY, centerZ - d / 2 + frameThickness / 2]}>
            <boxGeometry args={[w, parapetHeight, frameThickness]} />
            <meshStandardMaterial color={parapetColor} />
          </mesh>
          <mesh position={[centerX, parapetY, centerZ + d / 2 - frameThickness / 2]}>
            <boxGeometry args={[w, parapetHeight, frameThickness]} />
            <meshStandardMaterial color={parapetColor} />
          </mesh>
          <mesh position={[centerX - w / 2 + frameThickness / 2, parapetY, centerZ]}>
            <boxGeometry args={[frameThickness, parapetHeight, d]} />
            <meshStandardMaterial color={parapetColor} />
          </mesh>
          <mesh position={[centerX + w / 2 - frameThickness / 2, parapetY, centerZ]}>
            <boxGeometry args={[frameThickness, parapetHeight, d]} />
            <meshStandardMaterial color={parapetColor} />
          </mesh>
        </>
      )}
    </group>
  );
}

export default function Scene3D() {
  const project = useProjectStore((s) => s.project);
  const select = useProjectStore((s) => s.select);
  const setActiveFloor = useProjectStore((s) => s.setActiveFloor);

  const floors = useMemo(() => [...project.floors].sort((a, b) => a.level - b.level), [project.floors]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [showRoof, setShowRoof] = useState(true);
  const [ortho, setOrtho] = useState(false);

  let base = 0;
  const withBase = floors.map((f) => {
    const b = base;
    base += f.floorToFloorHeight;
    return { floor: f, base: b };
  });

  const overallBounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const f of floors) {
      const b = floorFootprintBounds(f);
      minX = Math.min(minX, b.minX);
      maxX = Math.max(maxX, b.maxX);
      minY = Math.min(minY, b.minY);
      maxY = Math.max(maxY, b.maxY);
    }
    if (!Number.isFinite(minX)) return { minX: 0, maxX: project.plotWidth, minY: 0, maxY: project.plotDepth };
    return { minX, maxX, minY, maxY };
  }, [floors, project.plotWidth, project.plotDepth]);

  const centerX = ((overallBounds.minX + overallBounds.maxX) / 2) * MM;
  const centerZ = ((overallBounds.minY + overallBounds.maxY) / 2) * MM;
  const span = Math.max(overallBounds.maxX - overallBounds.minX, overallBounds.maxY - overallBounds.minY, 6000) * MM;
  const totalHeight = base * MM;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        gl={{ preserveDrawingBuffer: true }}
        shadows
        onCreated={({ gl }) => {
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            console.warn("WebGL context lost in 3D view — most GPUs cap simultaneous contexts; a page refresh recovers it.", e);
          });
        }}
        style={{ background: "#dfe7ec" }}
      >
        {ortho ? (
          <OrthographicCamera
            makeDefault
            position={[centerX + span, totalHeight + span * 0.6, centerZ + span]}
            zoom={60}
            near={0.1}
            far={span * 10 + 100}
          />
        ) : (
          <PerspectiveCamera
            makeDefault
            position={[centerX + span * 1.1, totalHeight + span * 0.8, centerZ + span * 1.1]}
            fov={45}
            near={0.1}
            far={span * 10 + 100}
          />
        )}
        <OrbitControls target={[centerX, totalHeight / 2, centerZ]} makeDefault />
        <ambientLight intensity={0.65} />
        <directionalLight position={[centerX + span, span * 2, centerZ + span]} intensity={0.9} castShadow />
        <Grid
          position={[centerX, -0.01, centerZ]}
          args={[span * 3, span * 3]}
          cellColor="#c7cdd2"
          sectionColor="#9aa3ab"
          infiniteGrid
        />

        {withBase.map(({ floor, base: floorBase }) => {
          if (hidden.has(floor.id)) return null;
          const boxes = buildFloorBoxes(floor, project.exterior.wallColor);
          return (
            <group key={floor.id} onDoubleClick={() => setActiveFloor(floor.id)}>
              {boxes.map((b) => (
                <mesh
                  key={b.key}
                  position={[b.cx * MM, (floorBase + b.cy) * MM, b.cz * MM]}
                  onClick={(e) => {
                    e.stopPropagation();
                    select({ kind: "room", id: b.roomId });
                  }}
                  castShadow={b.kind === "wall"}
                  receiveShadow
                >
                  <boxGeometry args={[b.sx * MM, b.sy * MM, b.sz * MM]} />
                  <meshStandardMaterial
                    color={b.kind === "column" ? "#9aa1a8" : b.kind === "slab" ? "#d9d3c7" : b.color}
                    transparent={b.opacity !== undefined && b.opacity < 1}
                    opacity={b.opacity ?? 1}
                  />
                </mesh>
              ))}
            </group>
          );
        })}

        {showRoof && (
          <RoofGroup
            centerX={centerX}
            centerZ={centerZ}
            totalHeight={totalHeight}
            footprintW={(overallBounds.maxX - overallBounds.minX) * MM}
            footprintD={(overallBounds.maxY - overallBounds.minY) * MM}
            overhang={project.exterior.roofOverhang * MM}
            parapetHeight={project.exterior.parapetHeight * MM}
            slabColor={project.exterior.wallColor}
            parapetColor={project.exterior.accentColor}
          />
        )}
      </Canvas>

      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: "rgba(255,255,255,0.92)",
          borderRadius: 8,
          padding: "8px 10px",
          fontSize: 12,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          maxWidth: 200,
        }}
      >
        <b>Floors</b>
        {floors.map((f) => (
          <label key={f.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={!hidden.has(f.id)}
              onChange={() =>
                setHidden((prev) => {
                  const next = new Set(prev);
                  if (next.has(f.id)) next.delete(f.id);
                  else next.add(f.id);
                  return next;
                })
              }
            />
            {f.name}
          </label>
        ))}
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={showRoof} onChange={(e) => setShowRoof(e.target.checked)} />
          Roof
        </label>
        <hr style={{ width: "100%", border: "none", borderTop: "1px solid var(--border)" }} />
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input type="checkbox" checked={ortho} onChange={(e) => setOrtho(e.target.checked)} />
          Orthographic
        </label>
        <span className="helper-text">Double-click a floor to make it active for editing.</span>
      </div>
    </div>
  );
}
