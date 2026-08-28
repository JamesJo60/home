import { useProjectStore } from "@/store/projectStore";
import { LengthUnit } from "@/types/project";
import { createBlankProject } from "@/lib/sampleProject";
import { saveVersion, saveActiveVersionId } from "@/lib/persistence";
import { uuid } from "@/lib/geometry";

interface Props {
  onUpload: () => void;
  onShare: () => void;
  onVersions: () => void;
  onExport: () => void;
  onTogglePanel: () => void;
}

export default function TopToolbar({
  onUpload,
  onShare,
  onVersions,
  onExport,
  onTogglePanel,
}: Props) {
  const project = useProjectStore((s) => s.project);
  const unit = useProjectStore((s) => s.unit);
  const setUnit = useProjectStore((s) => s.setUnit);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const past = useProjectStore((s) => s.past);
  const future = useProjectStore((s) => s.future);
  const saveCurrentAsVersion = useProjectStore((s) => s.saveCurrentAsVersion);
  const loadProject = useProjectStore((s) => s.loadProject);
  const viewOnly = useProjectStore((s) => s.viewOnly);

  const handleNew = () => {
    if (viewOnly) return;
    if (!confirm("Start a new blank project? Your current project stays saved as a version.")) {
      return;
    }
    const blank = createBlankProject();
    const id = uuid();
    saveVersion(id, blank.name, blank);
    saveActiveVersionId(id);
    loadProject(blank, id);
  };

  const handleSave = () => {
    saveCurrentAsVersion();
  };

  return (
    <header className="topbar">
      <span className="brand">🏠 My House Design Studio</span>
      {viewOnly && <span className="badge view-only">View only</span>}

      {!viewOnly && (
        <>
          <button className="tb-btn" onClick={handleNew} title="New project">
            New
          </button>
          <button className="tb-btn" onClick={onVersions} title="Open a saved version">
            Open
          </button>
          <button className="tb-btn" onClick={handleSave} title="Save current version">
            Save
          </button>
          <div className="tb-sep" />
          <button className="tb-btn" onClick={undo} disabled={past.length === 0} title="Undo">
            ↶ Undo
          </button>
          <button className="tb-btn" onClick={redo} disabled={future.length === 0} title="Redo">
            ↷ Redo
          </button>
          <div className="tb-sep" />
          <button className="tb-btn" onClick={onUpload} title="Upload a drawing to trace">
            Upload Drawing
          </button>
        </>
      )}

      <div className="tb-spacer" />
      <span
        style={{ fontSize: 13, color: "var(--text-muted)", marginRight: 4 }}
        className="mono"
      >
        {project.name}
      </span>
      <select
        className="unit-select"
        value={unit}
        onChange={(e) => setUnit(e.target.value as LengthUnit)}
        title="Display units"
      >
        <option value="ft-in">ft-in</option>
        <option value="mm">mm</option>
        <option value="m">m</option>
      </select>
      <button className="tb-btn primary" onClick={onShare}>
        Share
      </button>
      <button className="tb-btn" onClick={onExport}>
        Export
      </button>
      <button className="tb-btn" onClick={onTogglePanel} title="Properties panel">
        ⚙︎
      </button>
    </header>
  );
}
