import { useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import Modal from "@/components/dialogs/Modal";

export default function VersionsDialog({ onClose }: { onClose: () => void }) {
  const [, force] = useState(0);
  const listVersionMetas = useProjectStore((s) => s.listVersionMetas);
  const loadVersionById = useProjectStore((s) => s.loadVersionById);
  const duplicateAsNewVersion = useProjectStore((s) => s.duplicateAsNewVersion);
  const removeVersion = useProjectStore((s) => s.removeVersion);
  const activeVersionId = useProjectStore((s) => s.activeVersionId);

  const versions = listVersionMetas();

  const handleDuplicate = () => {
    const name = prompt(
      "Name this new design option:",
      `Option ${String.fromCharCode(65 + versions.length)}`
    );
    if (!name) return;
    duplicateAsNewVersion(name);
    onClose();
  };

  return (
    <Modal title="Design versions" onClose={onClose}>
      <p className="helper-text">
        Compare alternative designs — duplicate before making a big change so you can always go
        back.
      </p>
      <div className="btn-row">
        <button className="btn primary" onClick={handleDuplicate}>
          Duplicate current as new version
        </button>
      </div>
      <div className="panel-section">
        {versions.length === 0 && <p className="helper-text">No saved versions yet.</p>}
        {versions.map((v) => (
          <div
            key={v.id}
            className="comment-item"
            style={{ borderColor: v.id === activeVersionId ? "var(--accent)" : undefined }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>
                {v.name} {v.id === activeVersionId ? "· current" : ""}
              </b>
            </div>
            <div className="meta">Updated {new Date(v.updatedAt).toLocaleString()}</div>
            <div className="btn-row">
              <button
                className="btn small"
                disabled={v.id === activeVersionId}
                onClick={() => {
                  loadVersionById(v.id);
                  onClose();
                }}
              >
                Open
              </button>
              <button
                className="btn small danger"
                disabled={v.id === activeVersionId}
                onClick={() => {
                  if (confirm(`Delete version "${v.name}"? This can't be undone.`)) {
                    removeVersion(v.id);
                    force((n) => n + 1);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
