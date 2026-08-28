import { ToolMode, useProjectStore } from "@/store/projectStore";

const TOOLS: { id: ToolMode; icon: string; label: string; viewOnlyOk?: boolean }[] = [
  { id: "select", icon: "↖", label: "Select", viewOnlyOk: true },
  { id: "room", icon: "▭", label: "Room" },
  { id: "door", icon: "🚪", label: "Door" },
  { id: "window", icon: "▤", label: "Window" },
  { id: "measure", icon: "📏", label: "Measure", viewOnlyOk: true },
  { id: "calibrate", icon: "⌖", label: "Calibrate" },
];

export default function LeftToolbar() {
  const tool = useProjectStore((s) => s.tool);
  const setTool = useProjectStore((s) => s.setTool);
  const activeView = useProjectStore((s) => s.activeView);
  const viewOnly = useProjectStore((s) => s.viewOnly);

  if (activeView !== "plan") {
    return <aside className="left-toolbar" />;
  }

  return (
    <aside className="left-toolbar">
      {TOOLS.map((t) => {
        const disabled = viewOnly && !t.viewOnlyOk;
        return (
          <button
            key={t.id}
            className={`tool-btn ${tool === t.id ? "active" : ""}`}
            onClick={() => setTool(t.id)}
            title={t.label}
            disabled={disabled}
          >
            {t.icon}
          </button>
        );
      })}
    </aside>
  );
}
