import { useState } from "react";
import { useActiveFloor, useProjectStore } from "@/store/projectStore";
import Modal from "@/components/dialogs/Modal";
import { fileToReferenceImage } from "@/lib/uploadDrawing";

export default function UploadDrawingDialog({ onClose }: { onClose: () => void }) {
  const activeFloor = useActiveFloor();
  const setReferenceImage = useProjectStore((s) => s.setReferenceImage);
  const project = useProjectStore((s) => s.project);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const ref = await fileToReferenceImage(file, project.plotWidth);
      setReferenceImage(activeFloor.id, ref);
      onClose();
    } catch (e) {
      console.error(e);
      setError("Couldn't read that file. Try a JPG, PNG, or PDF export of your drawing.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Upload Drawing" onClose={onClose}>
      <p className="helper-text">
        Upload your existing floor plan (PDF, JPG, JPEG, PNG, or a scanned drawing) for{" "}
        <b>{activeFloor.name}</b>. It's placed as a locked-scale reference layer you can trace
        over — use Calibrate afterwards to set its exact scale.
      </p>
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {busy && <p className="helper-text">Reading file…</p>}
      {error && <p className="helper-text" style={{ color: "var(--danger)" }}>{error}</p>}
    </Modal>
  );
}
