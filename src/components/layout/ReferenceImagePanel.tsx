import { useActiveFloor, useProjectStore } from "@/store/projectStore";
import { formatLength, parseLength } from "@/lib/units";

export default function ReferenceImagePanel() {
  const activeFloor = useActiveFloor();
  const unit = useProjectStore((s) => s.unit);
  const setReferenceImage = useProjectStore((s) => s.setReferenceImage);
  const setTool = useProjectStore((s) => s.setTool);
  const viewOnly = useProjectStore((s) => s.viewOnly);
  const ref = activeFloor.referenceImage;

  if (!ref) return null;

  const update = (patch: Partial<typeof ref>) => setReferenceImage(activeFloor.id, { ...ref, ...patch });

  return (
    <div className="panel-section">
      <div className="panel-title">Reference Drawing</div>
      <p className="helper-text">{ref.fileName}</p>

      <div className="field-row">
        <label>Visible</label>
        <input
          type="checkbox"
          checked={ref.visible}
          disabled={viewOnly}
          onChange={(e) => update({ visible: e.target.checked })}
        />
      </div>
      <div className="field-row">
        <label>Locked</label>
        <input
          type="checkbox"
          checked={ref.locked}
          disabled={viewOnly}
          onChange={(e) => update({ locked: e.target.checked })}
        />
      </div>
      <div className="field-row">
        <label>Opacity</label>
        <input
          type="range"
          min={5}
          max={100}
          value={Math.round(ref.opacity * 100)}
          disabled={viewOnly}
          onChange={(e) => update({ opacity: Number(e.target.value) / 100 })}
        />
      </div>
      <div className="field-row">
        <label>Rotation°</label>
        <input
          type="range"
          min={0}
          max={359}
          value={ref.rotation}
          disabled={viewOnly}
          onChange={(e) => update({ rotation: Number(e.target.value) })}
        />
      </div>
      <div className="field-row">
        <label>Width</label>
        <input
          type="text"
          key={`rw-${ref.width}`}
          defaultValue={formatLength(ref.width, unit)}
          disabled={viewOnly || ref.locked}
          onBlur={(e) => {
            const mm = parseLength(e.target.value, unit);
            if (mm !== null) update({ width: mm });
          }}
        />
      </div>
      <div className="field-row">
        <label>Height</label>
        <input
          type="text"
          key={`rh-${ref.height}`}
          defaultValue={formatLength(ref.height, unit)}
          disabled={viewOnly || ref.locked}
          onBlur={(e) => {
            const mm = parseLength(e.target.value, unit);
            if (mm !== null) update({ height: mm });
          }}
        />
      </div>

      {!viewOnly && (
        <div className="btn-row">
          <button className="btn" onClick={() => setTool("calibrate")}>
            Calibrate scale
          </button>
          <button className="btn danger" onClick={() => setReferenceImage(activeFloor.id, undefined)}>
            Remove
          </button>
        </div>
      )}
      <p className="helper-text">
        Drag the image on the canvas to reposition it (when unlocked). Use Calibrate to click two
        points of a known real-world length and auto-scale the whole drawing.
      </p>
    </div>
  );
}
