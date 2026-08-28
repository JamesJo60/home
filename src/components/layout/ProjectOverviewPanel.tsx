import { useActiveFloor, useProjectStore } from "@/store/projectStore";
import { formatLength, mmToSqFt, mmToSqM, parseLength } from "@/lib/units";
import { computeFloorAreaTotals } from "@/lib/areaTotals";

export default function ProjectOverviewPanel() {
  const project = useProjectStore((s) => s.project);
  const unit = useProjectStore((s) => s.unit);
  const activeFloor = useActiveFloor();
  const updateProject = useProjectStore((s) => s.updateProject);
  const viewOnly = useProjectStore((s) => s.viewOnly);

  const totals = computeFloorAreaTotals(activeFloor);

  return (
    <>
      <div className="panel-section">
        <div className="panel-title">Project</div>
        <div className="field-row">
          <label>Name</label>
          <input
            type="text"
            defaultValue={project.name}
            disabled={viewOnly}
            onBlur={(e) => updateProject((d) => (d.name = e.target.value))}
          />
        </div>
        <div className="field-row">
          <label>Address</label>
          <input
            type="text"
            defaultValue={project.address}
            disabled={viewOnly}
            onBlur={(e) => updateProject((d) => (d.address = e.target.value))}
          />
        </div>
        <div className="field-row">
          <label>Plot width</label>
          <input
            type="text"
            key={`pw-${project.plotWidth}`}
            defaultValue={formatLength(project.plotWidth, unit)}
            disabled={viewOnly}
            onBlur={(e) => {
              const mm = parseLength(e.target.value, unit);
              if (mm !== null) updateProject((d) => (d.plotWidth = mm));
            }}
          />
        </div>
        <div className="field-row">
          <label>Plot depth</label>
          <input
            type="text"
            key={`pd-${project.plotDepth}`}
            defaultValue={formatLength(project.plotDepth, unit)}
            disabled={viewOnly}
            onBlur={(e) => {
              const mm = parseLength(e.target.value, unit);
              if (mm !== null) updateProject((d) => (d.plotDepth = mm));
            }}
          />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">{activeFloor.name} — Areas</div>
        <div className="field-row">
          <label>Floor-to-floor height</label>
          <input
            type="text"
            key={`fh-${activeFloor.id}-${activeFloor.floorToFloorHeight}`}
            defaultValue={formatLength(activeFloor.floorToFloorHeight, unit)}
            disabled={viewOnly}
            onBlur={(e) => {
              const mm = parseLength(e.target.value, unit);
              if (mm !== null) {
                updateProject((d) => {
                  const f = d.floors.find((fl) => fl.id === activeFloor.id);
                  if (f) f.floorToFloorHeight = mm;
                });
              }
            }}
          />
        </div>
        <div className="stat-line">
          <span>Covered area</span>
          <b>{mmToSqFt(totals.coveredAreaMm2).toFixed(0)} sq ft</b>
        </div>
        <div className="stat-line">
          <span>Veranda / terrace</span>
          <b>{mmToSqFt(totals.verandaAreaMm2).toFixed(0)} sq ft</b>
        </div>
        <div className="stat-line">
          <span>Open (parking / lawn)</span>
          <b>{mmToSqFt(totals.openAreaMm2).toFixed(0)} sq ft</b>
        </div>
        <div className="stat-line">
          <span>Total floor area</span>
          <b>
            {mmToSqFt(totals.floorAreaMm2).toFixed(0)} sq ft ·{" "}
            {mmToSqM(totals.floorAreaMm2).toFixed(1)} sq m
          </b>
        </div>
      </div>
    </>
  );
}
