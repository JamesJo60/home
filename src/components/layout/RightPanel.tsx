import { useActiveFloor, useProjectStore } from "@/store/projectStore";
import { CommentTarget } from "@/types/project";
import RoomProperties from "@/components/layout/RoomProperties";
import OpeningProperties from "@/components/layout/OpeningProperties";
import ProjectOverviewPanel from "@/components/layout/ProjectOverviewPanel";
import ReferenceImagePanel from "@/components/layout/ReferenceImagePanel";
import ExteriorDesignPanel from "@/components/layout/ExteriorDesignPanel";
import CommentsPanel from "@/components/layout/CommentsPanel";

export default function RightPanel({ onCloseMobile }: { onCloseMobile: () => void }) {
  const selection = useProjectStore((s) => s.selection);
  const activeFloor = useActiveFloor();
  const activeView = useProjectStore((s) => s.activeView);

  const selectedRoom = selection?.kind === "room" ? activeFloor.rooms.find((r) => r.id === selection.id) : undefined;
  const selectedOpening =
    selection?.kind === "opening" ? activeFloor.openings.find((o) => o.id === selection.id) : undefined;

  let commentTarget: CommentTarget = { kind: "general" };
  if (selectedRoom) commentTarget = { kind: "room", floorId: activeFloor.id, roomId: selectedRoom.id };
  else if (selectedOpening)
    commentTarget = { kind: "opening", floorId: activeFloor.id, openingId: selectedOpening.id };
  else if (activeView === "front" || activeView === "rear" || activeView === "left" || activeView === "right")
    commentTarget = { kind: "elevation", side: activeView };

  return (
    <>
      <button className="btn small" onClick={onCloseMobile} style={{ alignSelf: "flex-end" }}>
        Close ✕
      </button>

      {selectedRoom && <RoomProperties room={selectedRoom} />}
      {selectedOpening && <OpeningProperties opening={selectedOpening} />}

      {!selectedRoom && !selectedOpening && activeView === "plan" && (
        <>
          <ProjectOverviewPanel />
          <ReferenceImagePanel />
        </>
      )}

      {!selectedRoom && !selectedOpening && activeView !== "plan" && activeView !== "3d" && (
        <ExteriorDesignPanel />
      )}

      {!selectedRoom && !selectedOpening && activeView === "3d" && <ExteriorDesignPanel />}

      <CommentsPanel target={commentTarget} />
    </>
  );
}
