import { useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import TopToolbar from "@/components/layout/TopToolbar";
import ViewTabs from "@/components/layout/ViewTabs";
import LeftToolbar from "@/components/layout/LeftToolbar";
import RightPanel from "@/components/layout/RightPanel";
import FloorBar from "@/components/layout/FloorBar";
import PlanCanvas from "@/components/editor2d/PlanCanvas";
import Scene3D from "@/components/viewer3d/Scene3D";
import ElevationView from "@/components/elevation/ElevationView";
import UploadDrawingDialog from "@/components/dialogs/UploadDrawingDialog";
import ShareDialog from "@/components/dialogs/ShareDialog";
import VersionsDialog from "@/components/dialogs/VersionsDialog";
import ExportDialog from "@/components/dialogs/ExportDialog";

export default function AppLayout() {
  const activeView = useProjectStore((s) => s.activeView);
  const viewOnly = useProjectStore((s) => s.viewOnly);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  return (
    <div className="app-shell">
      <TopToolbar
        onUpload={() => setUploadOpen(true)}
        onShare={() => setShareOpen(true)}
        onVersions={() => setVersionsOpen(true)}
        onExport={() => setExportOpen(true)}
        onTogglePanel={() => setRightPanelOpen((v) => !v)}
      />
      <ViewTabs />
      <LeftToolbar />
      <main className="workspace" id="capture-workspace">
        {activeView === "plan" && <PlanCanvas />}
        {activeView === "3d" && <Scene3D />}
        {(activeView === "front" ||
          activeView === "rear" ||
          activeView === "left" ||
          activeView === "right") && <ElevationView side={activeView} />}
      </main>
      <div className={`right-panel ${rightPanelOpen ? "open" : ""}`}>
        <RightPanel onCloseMobile={() => setRightPanelOpen(false)} />
      </div>
      <FloorBar />

      {uploadOpen && !viewOnly && <UploadDrawingDialog onClose={() => setUploadOpen(false)} />}
      {shareOpen && <ShareDialog onClose={() => setShareOpen(false)} />}
      {versionsOpen && !viewOnly && <VersionsDialog onClose={() => setVersionsOpen(false)} />}
      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
    </div>
  );
}
