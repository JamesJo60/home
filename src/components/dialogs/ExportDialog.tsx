import { useState } from "react";
import { useActiveFloor, useProjectStore } from "@/store/projectStore";
import Modal from "@/components/dialogs/Modal";
import { captureWorkspacePng, downloadDataUrl, exportFloorPdf } from "@/lib/exportUtils";

const PAPERS = ["A4", "A3", "A2", "A1"] as const;

export default function ExportDialog({ onClose }: { onClose: () => void }) {
  const project = useProjectStore((s) => s.project);
  const activeFloor = useActiveFloor();
  const activeView = useProjectStore((s) => s.activeView);
  const unit = useProjectStore((s) => s.unit);
  const [paper, setPaper] = useState<(typeof PAPERS)[number]>("A3");
  const [busy, setBusy] = useState(false);

  const exportPng = async () => {
    setBusy(true);
    const dataUrl = await captureWorkspacePng();
    setBusy(false);
    if (!dataUrl) {
      alert("Nothing to export in this view yet.");
      return;
    }
    downloadDataUrl(dataUrl, `${project.name}-${activeFloor.name}-${activeView}.png`);
  };

  const exportPdf = async () => {
    setBusy(true);
    const dataUrl = await captureWorkspacePng();
    await exportFloorPdf(project, activeFloor, unit, paper, dataUrl, activeView);
    setBusy(false);
  };

  return (
    <Modal title="Export" onClose={onClose}>
      <p className="helper-text">Exports capture the view currently open ({activeView.toUpperCase()}).</p>

      <div className="panel-section">
        <div className="panel-title">Image</div>
        <button className="btn" disabled={busy} onClick={exportPng}>
          Export PNG
        </button>
      </div>

      <div className="panel-section">
        <div className="panel-title">PDF sheet</div>
        <div className="field-row">
          <label>Paper size</label>
          <select value={paper} onChange={(e) => setPaper(e.target.value as any)}>
            {PAPERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <p className="helper-text">Includes the drawing plus a room / area schedule for {activeFloor.name}.</p>
        <button className="btn primary" disabled={busy} onClick={exportPdf}>
          Export PDF
        </button>
      </div>
    </Modal>
  );
}
