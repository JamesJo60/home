import { useProjectStore } from "@/store/projectStore";
import { ExteriorStyle, RoofStyle } from "@/types/project";
import { formatLength, parseLength } from "@/lib/units";

const STYLES: ExteriorStyle[] = [
  "modern",
  "traditional",
  "mountain-village",
  "contemporary",
  "minimalist",
];
const ROOFS: RoofStyle[] = ["flat-rcc", "sloping", "gable", "hip", "combination"];
const FINISHES = ["plaster", "brick", "stone-cladding", "wood"] as const;

export default function ExteriorDesignPanel() {
  const exterior = useProjectStore((s) => s.project.exterior);
  const unit = useProjectStore((s) => s.unit);
  const updateProject = useProjectStore((s) => s.updateProject);
  const viewOnly = useProjectStore((s) => s.viewOnly);

  const set = (patch: Partial<typeof exterior>) =>
    updateProject((d) => Object.assign(d.exterior, patch));

  return (
    <div className="panel-section">
      <div className="panel-title">Elevation Design Studio</div>
      <p className="helper-text">
        Only appearance changes here — your room dimensions stay exactly as drawn.
      </p>

      <div className="field-row">
        <label>Style</label>
        <select
          value={exterior.style}
          disabled={viewOnly}
          onChange={(e) => set({ style: e.target.value as ExteriorStyle })}
        >
          {STYLES.map((s) => (
            <option key={s} value={s}>
              {s.replace("-", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <label>Wall finish</label>
        <select
          value={exterior.wallFinish}
          disabled={viewOnly}
          onChange={(e) => set({ wallFinish: e.target.value as typeof exterior.wallFinish })}
        >
          {FINISHES.map((f) => (
            <option key={f} value={f}>
              {f.replace("-", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <label>Wall colour</label>
        <input
          type="color"
          value={exterior.wallColor}
          disabled={viewOnly}
          onChange={(e) => set({ wallColor: e.target.value })}
        />
      </div>
      <div className="field-row">
        <label>Accent colour</label>
        <input
          type="color"
          value={exterior.accentColor}
          disabled={viewOnly}
          onChange={(e) => set({ accentColor: e.target.value })}
        />
      </div>

      <div className="panel-title" style={{ marginTop: 6 }}>
        Roof
      </div>
      <div className="field-row">
        <label>Roof style</label>
        <select
          value={exterior.roofStyle}
          disabled={viewOnly}
          onChange={(e) => set({ roofStyle: e.target.value as RoofStyle })}
        >
          {ROOFS.map((r) => (
            <option key={r} value={r}>
              {r.replace("-", " ")}
            </option>
          ))}
        </select>
      </div>
      {exterior.roofStyle !== "flat-rcc" && (
        <div className="field-row">
          <label>Roof slope°</label>
          <input
            type="range"
            min={5}
            max={60}
            value={exterior.roofSlopeDeg}
            disabled={viewOnly}
            onChange={(e) => set({ roofSlopeDeg: Number(e.target.value) })}
          />
        </div>
      )}
      <div className="field-row">
        <label>Overhang</label>
        <input
          type="text"
          key={`ov-${exterior.roofOverhang}`}
          defaultValue={formatLength(exterior.roofOverhang, unit)}
          disabled={viewOnly}
          onBlur={(e) => {
            const mm = parseLength(e.target.value, unit);
            if (mm !== null) set({ roofOverhang: mm });
          }}
        />
      </div>
      <div className="field-row">
        <label>Parapet height</label>
        <input
          type="text"
          key={`pa-${exterior.parapetHeight}`}
          defaultValue={formatLength(exterior.parapetHeight, unit)}
          disabled={viewOnly}
          onBlur={(e) => {
            const mm = parseLength(e.target.value, unit);
            if (mm !== null) set({ parapetHeight: mm });
          }}
        />
      </div>
    </div>
  );
}
