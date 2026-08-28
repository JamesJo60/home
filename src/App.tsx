import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { decodeShareLinkFromHash } from "@/lib/share";
import { uuid } from "@/lib/geometry";
import { saveVersion, saveActiveVersionId } from "@/lib/persistence";
import AppLayout from "@/components/layout/AppLayout";

export default function App() {
  const loadProject = useProjectStore((s) => s.loadProject);
  const setViewOnly = useProjectStore((s) => s.setViewOnly);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const bundle = decodeShareLinkFromHash(window.location.hash);
    if (bundle) {
      // Opened from a share link: import the shared project as its own local
      // version so edits (in edit mode) or comments (in view mode) persist in
      // this browser, then drop the huge hash from the URL bar.
      const versionId = uuid();
      saveVersion(versionId, `${bundle.project.name} (shared)`, bundle.project);
      saveActiveVersionId(versionId);
      loadProject(bundle.project, versionId);
      setViewOnly(bundle.mode === "view");
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return null;
  return <AppLayout />;
}
