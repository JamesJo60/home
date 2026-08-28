import { create } from "zustand";
import {
  Comment,
  Floor,
  LengthUnit,
  Opening,
  OpeningType,
  Project,
  ReferenceImage,
  Room,
  RoomType,
} from "@/types/project";
import { uuid } from "@/lib/geometry";
import { createSampleProject } from "@/lib/sampleProject";
import {
  deleteVersion,
  listVersions,
  loadActiveVersionId,
  loadVersion,
  saveActiveVersionId,
  saveVersion,
} from "@/lib/persistence";

export type MainView = "plan" | "3d" | "front" | "rear" | "left" | "right";
export type ToolMode =
  | "select"
  | "room"
  | "door"
  | "window"
  | "dimension"
  | "measure"
  | "calibrate";

export interface ViewOnlyState {
  active: boolean;
}

interface HistoryEntry {
  project: Project;
}

interface ProjectStore {
  project: Project;
  activeVersionId: string;
  activeFloorId: string;
  activeView: MainView;
  tool: ToolMode;
  drawRoomType: RoomType;
  drawOpeningType: OpeningType;
  unit: LengthUnit;
  selection: { kind: "room" | "opening"; id: string } | null;
  viewOnly: boolean;
  past: HistoryEntry[];
  future: HistoryEntry[];

  setView: (v: MainView) => void;
  setTool: (t: ToolMode) => void;
  setDrawRoomType: (t: RoomType) => void;
  setDrawOpeningType: (t: OpeningType) => void;
  setUnit: (u: LengthUnit) => void;
  setActiveFloor: (id: string) => void;
  select: (sel: ProjectStore["selection"]) => void;

  activeFloor: () => Floor;

  updateProject: (mutator: (draft: Project) => void, opts?: { record?: boolean }) => void;
  undo: () => void;
  redo: () => void;

  addFloor: (name: string, level: number, copyFromFloorId?: string) => void;
  removeFloor: (id: string) => void;

  addRoom: (room: Room) => void;
  updateRoom: (id: string, mutator: (r: Room) => void) => void;
  removeRoom: (id: string) => void;
  duplicateRoom: (id: string) => void;

  addOpening: (opening: Opening) => void;
  updateOpening: (id: string, mutator: (o: Opening) => void) => void;
  removeOpening: (id: string) => void;

  setReferenceImage: (floorId: string, ref: ReferenceImage | undefined) => void;

  addComment: (comment: Omit<Comment, "id" | "createdAt" | "resolved">) => void;
  resolveComment: (id: string, resolved: boolean) => void;

  saveCurrentAsVersion: (name?: string) => void;
  loadVersionById: (id: string) => void;
  duplicateAsNewVersion: (name: string) => void;
  listVersionMetas: () => ReturnType<typeof listVersions>;
  removeVersion: (id: string) => void;

  loadProject: (project: Project, versionId: string) => void;
  setViewOnly: (v: boolean) => void;
}

function cloneProject(p: Project): Project {
  return JSON.parse(JSON.stringify(p));
}

function bootstrap(): { project: Project; versionId: string } {
  const existingId = loadActiveVersionId();
  if (existingId) {
    const loaded = loadVersion(existingId);
    if (loaded) return { project: loaded, versionId: existingId };
  }
  const versions = listVersions();
  if (versions.length > 0) {
    const loaded = loadVersion(versions[0].id);
    if (loaded) return { project: loaded, versionId: versions[0].id };
  }
  const sample = createSampleProject();
  const versionId = uuid();
  saveVersion(versionId, "Original Plan", sample);
  saveActiveVersionId(versionId);
  return { project: sample, versionId };
}

const initial = bootstrap();

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: initial.project,
  activeVersionId: initial.versionId,
  activeFloorId: initial.project.floors[0]?.id ?? "",
  activeView: "plan",
  tool: "select",
  drawRoomType: "bedroom",
  drawOpeningType: "single-door",
  unit: "ft-in",
  selection: null,
  viewOnly: false,
  past: [],
  future: [],

  setView: (v) => set({ activeView: v }),
  setTool: (t) => set({ tool: t, selection: null }),
  setDrawRoomType: (t) => set({ drawRoomType: t }),
  setDrawOpeningType: (t) => set({ drawOpeningType: t }),
  setUnit: (u) => set({ unit: u }),
  setActiveFloor: (id) => set({ activeFloorId: id, selection: null }),
  select: (sel) => set({ selection: sel }),

  activeFloor: () => {
    const { project, activeFloorId } = get();
    return project.floors.find((f) => f.id === activeFloorId) ?? project.floors[0];
  },

  updateProject: (mutator, opts) => {
    const { project, past } = get();
    const draft = cloneProject(project);
    mutator(draft);
    draft.updatedAt = new Date().toISOString();
    const record = opts?.record !== false;
    set({
      project: draft,
      past: record ? [...past, { project }] : past,
      future: record ? [] : get().future,
    });
    if (record) {
      const { activeVersionId } = get();
      saveVersion(activeVersionId, null, draft);
    }
  },

  undo: () => {
    const { past, future, project } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      project: prev.project,
      past: past.slice(0, -1),
      future: [{ project }, ...future],
    });
    saveVersion(get().activeVersionId, null, prev.project);
  },
  redo: () => {
    const { past, future, project } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      project: next.project,
      past: [...past, { project }],
      future: future.slice(1),
    });
    saveVersion(get().activeVersionId, null, next.project);
  },

  addFloor: (name, level, copyFromFloorId) => {
    get().updateProject((draft) => {
      const source = copyFromFloorId
        ? draft.floors.find((f) => f.id === copyFromFloorId)
        : undefined;
      const newFloor: Floor = {
        id: uuid(),
        name,
        level,
        floorToFloorHeight: source?.floorToFloorHeight ?? 3200,
        rooms: source ? JSON.parse(JSON.stringify(source.rooms)) : [],
        openings: source ? JSON.parse(JSON.stringify(source.openings)) : [],
      };
      if (source) {
        // re-id rooms/openings so they don't collide with the source floor
        const idMap = new Map<string, string>();
        newFloor.rooms.forEach((r) => {
          const newId = uuid();
          idMap.set(r.id, newId);
          r.id = newId;
        });
        newFloor.openings.forEach((o) => {
          o.id = uuid();
          o.roomId = idMap.get(o.roomId) ?? o.roomId;
        });
      }
      draft.floors.push(newFloor);
    });
    const created = get().project.floors[get().project.floors.length - 1];
    set({ activeFloorId: created.id });
  },

  removeFloor: (id) => {
    get().updateProject((draft) => {
      draft.floors = draft.floors.filter((f) => f.id !== id);
    });
    const remaining = get().project.floors;
    if (remaining.length && get().activeFloorId === id) {
      set({ activeFloorId: remaining[0].id });
    }
  },

  addRoom: (room) => {
    get().updateProject((draft) => {
      const floor = draft.floors.find((f) => f.id === get().activeFloorId);
      floor?.rooms.push(room);
    });
  },
  updateRoom: (id, mutator) => {
    get().updateProject((draft) => {
      for (const floor of draft.floors) {
        const r = floor.rooms.find((rm) => rm.id === id);
        if (r) {
          mutator(r);
          return;
        }
      }
    });
  },
  removeRoom: (id) => {
    get().updateProject((draft) => {
      for (const floor of draft.floors) {
        floor.rooms = floor.rooms.filter((r) => r.id !== id);
        floor.openings = floor.openings.filter((o) => o.roomId !== id);
      }
    });
    set({ selection: null });
  },
  duplicateRoom: (id) => {
    get().updateProject((draft) => {
      for (const floor of draft.floors) {
        const r = floor.rooms.find((rm) => rm.id === id);
        if (r) {
          const copy: Room = JSON.parse(JSON.stringify(r));
          copy.id = uuid();
          copy.name = `${r.name} copy`;
          copy.points = copy.points.map((p) => ({ x: p.x + 300, y: p.y + 300 }));
          floor.rooms.push(copy);
          return;
        }
      }
    });
  },

  addOpening: (opening) => {
    get().updateProject((draft) => {
      const floor = draft.floors.find((f) => f.id === get().activeFloorId);
      floor?.openings.push(opening);
    });
  },
  updateOpening: (id, mutator) => {
    get().updateProject((draft) => {
      for (const floor of draft.floors) {
        const o = floor.openings.find((op) => op.id === id);
        if (o) {
          mutator(o);
          return;
        }
      }
    });
  },
  removeOpening: (id) => {
    get().updateProject((draft) => {
      for (const floor of draft.floors) {
        floor.openings = floor.openings.filter((o) => o.id !== id);
      }
    });
    set({ selection: null });
  },

  setReferenceImage: (floorId, ref) => {
    get().updateProject((draft) => {
      const floor = draft.floors.find((f) => f.id === floorId);
      if (floor) floor.referenceImage = ref;
    });
  },

  addComment: (comment) => {
    get().updateProject((draft) => {
      draft.comments.push({
        ...comment,
        id: uuid(),
        createdAt: new Date().toISOString(),
        resolved: false,
      });
    });
  },
  resolveComment: (id, resolved) => {
    get().updateProject((draft) => {
      const c = draft.comments.find((cm) => cm.id === id);
      if (c) c.resolved = resolved;
    });
  },

  saveCurrentAsVersion: (name) => {
    const { activeVersionId, project } = get();
    saveVersion(activeVersionId, name ?? null, project);
  },
  loadVersionById: (id) => {
    const loaded = loadVersion(id);
    if (!loaded) return;
    set({
      project: loaded,
      activeVersionId: id,
      activeFloorId: loaded.floors[0]?.id ?? "",
      past: [],
      future: [],
      selection: null,
    });
    saveActiveVersionId(id);
  },
  duplicateAsNewVersion: (name) => {
    const { project } = get();
    const copy = cloneProject(project);
    copy.id = uuid();
    copy.name = name;
    const newId = uuid();
    saveVersion(newId, name, copy);
    set({
      project: copy,
      activeVersionId: newId,
      past: [],
      future: [],
    });
    saveActiveVersionId(newId);
  },
  listVersionMetas: () => listVersions(),
  removeVersion: (id) => {
    deleteVersion(id);
  },

  loadProject: (project, versionId) => {
    set({
      project,
      activeVersionId: versionId,
      activeFloorId: project.floors[0]?.id ?? "",
      past: [],
      future: [],
      selection: null,
    });
  },
  setViewOnly: (v) => set({ viewOnly: v }),
}));

/**
 * `activeFloor` in the store above is a plain getter method, not reactive state —
 * its function reference never changes, so selecting it directly
 * (`useProjectStore(s => s.activeFloor)`) never re-renders a component when the
 * floor's rooms/openings change. This hook subscribes to the actual reactive
 * fields (`project`, `activeFloorId`) so components stay in sync.
 */
export function useActiveFloor(): Floor {
  const project = useProjectStore((s) => s.project);
  const activeFloorId = useProjectStore((s) => s.activeFloorId);
  return project.floors.find((f) => f.id === activeFloorId) ?? project.floors[0];
}
