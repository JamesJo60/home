import { useProjectStore } from "@/store/projectStore";
import { Opening, OpeningType } from "@/types/project";
import { formatLength, parseLength } from "@/lib/units";

const DOOR_TYPES: OpeningType[] = ["single-door", "double-door", "sliding-door", "entrance-door"];
const WINDOW_TYPES: OpeningType[] = [
  "fixed-window",
  "sliding-window",
  "casement-window",
  "louvered-window",
];

export default function OpeningProperties({ opening }: { opening: Opening }) {
  const unit = useProjectStore((s) => s.unit);
  const updateOpening = useProjectStore((s) => s.updateOpening);
  const removeOpening = useProjectStore((s) => s.removeOpening);
  const select = useProjectStore((s) => s.select);
  const viewOnly = useProjectStore((s) => s.viewOnly);
  const options = opening.kind === "door" ? DOOR_TYPES : WINDOW_TYPES;

  return (
    <div className="panel-section">
      <div className="panel-title">{opening.kind === "door" ? "Door" : "Window"}</div>

      <div className="field-row">
        <label>Type</label>
        <select
          value={opening.type}
          disabled={viewOnly}
          onChange={(e) =>
            updateOpening(opening.id, (o) => (o.type = e.target.value as OpeningType))
          }
        >
          {options.map((t) => (
            <option key={t} value={t}>
              {t.replace("-", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <label>Width</label>
        <input
          type="text"
          key={`w-${opening.id}-${opening.width}`}
          defaultValue={formatLength(opening.width, unit)}
          disabled={viewOnly}
          onBlur={(e) => {
            const mm = parseLength(e.target.value, unit);
            if (mm !== null) updateOpening(opening.id, (o) => (o.width = mm));
          }}
        />
      </div>

      <div className="field-row">
        <label>Height</label>
        <input
          type="text"
          key={`h-${opening.id}-${opening.height}`}
          defaultValue={formatLength(opening.height, unit)}
          disabled={viewOnly}
          onBlur={(e) => {
            const mm = parseLength(e.target.value, unit);
            if (mm !== null) updateOpening(opening.id, (o) => (o.height = mm));
          }}
        />
      </div>

      {opening.kind === "window" && (
        <div className="field-row">
          <label>Sill height</label>
          <input
            type="text"
            key={`s-${opening.id}-${opening.sillHeight}`}
            defaultValue={formatLength(opening.sillHeight, unit)}
            disabled={viewOnly}
            onBlur={(e) => {
              const mm = parseLength(e.target.value, unit);
              if (mm !== null) updateOpening(opening.id, (o) => (o.sillHeight = mm));
            }}
          />
        </div>
      )}

      <div className="field-row">
        <label>Position on wall</label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(opening.position * 100)}
          disabled={viewOnly}
          onChange={(e) =>
            updateOpening(opening.id, (o) => (o.position = Number(e.target.value) / 100))
          }
        />
      </div>

      {!viewOnly && (
        <div className="btn-row">
          <button
            className="btn danger"
            onClick={() => {
              if (confirm("Remove this opening?")) removeOpening(opening.id);
            }}
          >
            Delete
          </button>
          <button className="btn small" onClick={() => select(null)}>
            Deselect
          </button>
        </div>
      )}
    </div>
  );
}
