import { useMemo, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import Modal from "@/components/dialogs/Modal";
import { encodeShareLink } from "@/lib/share";

export default function ShareDialog({ onClose }: { onClose: () => void }) {
  const project = useProjectStore((s) => s.project);
  const [copied, setCopied] = useState<"view" | "edit" | null>(null);

  const viewLink = useMemo(() => encodeShareLink(project, "view"), [project]);
  const editLink = useMemo(() => encodeShareLink(project, "edit"), [project]);

  const copy = async (link: string, which: "view" | "edit") => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      prompt("Copy this link:", link);
    }
  };

  const tooLarge = viewLink.length > 60000;

  return (
    <Modal title="Share with family" onClose={onClose}>
      <p className="helper-text">
        These links work without any account or server: the whole design is packed into the link
        itself, so whoever opens it gets a live, working copy in their own browser — they can
        rotate the 3D model, check dimensions, and leave comments. There's no automatic sync back
        to you (that needs a real backend), so ask them to send you the interesting bits, or have
        them use the Edit link and send <i>their</i> link back to you.
      </p>
      {tooLarge && (
        <p className="helper-text" style={{ color: "var(--warning)" }}>
          This project is quite large — some chat apps truncate very long links. If the link
          doesn't open correctly, use Export → PDF/PNG instead, or trim unused floors first.
        </p>
      )}

      <div className="panel-section">
        <div className="panel-title">View only</div>
        <p className="helper-text">Family can view plans, elevations, rotate the 3D model, and comment — no edits.</p>
        <div className="btn-row">
          <button className="btn primary" onClick={() => copy(viewLink, "view")}>
            {copied === "view" ? "Copied!" : "Copy view-only link"}
          </button>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-title">Can edit</div>
        <p className="helper-text">Whoever opens this link gets a fully editable copy of the current design.</p>
        <div className="btn-row">
          <button className="btn" onClick={() => copy(editLink, "edit")}>
            {copied === "edit" ? "Copied!" : "Copy edit link"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
