import { useState } from "react";
import { useProjectStore } from "@/store/projectStore";

const PRESET_NAMES = ["Basement", "Ground Floor", "First Floor", "Second Floor", "Roof"];

export default function FloorBar() {
  const project = useProjectStore((s) => s.project);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  const setActiveFloor = useProjectStore((s) => s.setActiveFloor);
  const addFloor = useProjectStore((s) => s.addFloor);
  const removeFloor = useProjectStore((s) => s.removeFloor);
  const viewOnly = useProjectStore((s) => s.viewOnly);
  const [adding, setAdding] = useState(false);

  const floors = [...project.floors].sort((a, b) => a.level - b.level);

  const handleAdd = () => {
    const name = prompt(
      "Name for the new floor:",
      PRESET_NAMES.find((n) => !floors.some((f) => f.name === n)) ?? "New Floor"
    );
    if (!name) return;
    const copyFrom = floors.length
      ? confirm("Copy the layout from the current floor to start from? Cancel = start blank.")
        ? activeFloorId
        : undefined
      : undefined;
    const nextLevel = floors.length ? Math.max(...floors.map((f) => f.level)) + 1 : 0;
    addFloor(name, nextLevel, copyFrom);
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    if (floors.length <= 1) {
      alert("A project needs at least one floor.");
      return;
    }
    if (confirm("Remove this floor and everything drawn on it?")) removeFloor(id);
  };

  return (
    <div className="floorbar">
      {floors.map((f) => (
        <button
          key={f.id}
          className={`floor-chip ${f.id === activeFloorId ? "active" : ""}`}
          onClick={() => setActiveFloor(f.id)}
          onDoubleClick={() => !viewOnly && handleRemove(f.id)}
          title={viewOnly ? f.name : `${f.name} (double-click to remove)`}
        >
          {f.name}
        </button>
      ))}
      {!viewOnly && (
        <button className="floor-chip" onClick={handleAdd} disabled={adding}>
          + Add floor
        </button>
      )}
    </div>
  );
}
