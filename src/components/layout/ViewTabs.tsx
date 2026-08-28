import { MainView, useProjectStore } from "@/store/projectStore";

const TABS: { id: MainView; label: string }[] = [
  { id: "plan", label: "2D PLAN" },
  { id: "3d", label: "3D MODEL" },
  { id: "front", label: "FRONT" },
  { id: "rear", label: "REAR" },
  { id: "left", label: "LEFT" },
  { id: "right", label: "RIGHT" },
];

export default function ViewTabs() {
  const activeView = useProjectStore((s) => s.activeView);
  const setView = useProjectStore((s) => s.setView);

  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`view-tab ${activeView === t.id ? "active" : ""}`}
          onClick={() => setView(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
