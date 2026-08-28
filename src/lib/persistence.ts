import { Project, VersionMeta } from "@/types/project";

const VERSION_PREFIX = "hds:version:";
const INDEX_KEY = "hds:versionIndex";
const ACTIVE_KEY = "hds:activeVersionId";

interface IndexEntry extends VersionMeta {}

function readIndex(): IndexEntry[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: IndexEntry[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
}

export function saveVersion(id: string, name: string | null, project: Project) {
  try {
    localStorage.setItem(VERSION_PREFIX + id, JSON.stringify(project));
  } catch (e) {
    console.error("Failed to save project locally (storage may be full).", e);
    return;
  }
  const index = readIndex();
  const now = new Date().toISOString();
  const existing = index.find((v) => v.id === id);
  if (existing) {
    existing.updatedAt = now;
    if (name) existing.name = name;
  } else {
    index.push({ id, name: name ?? project.name, createdAt: now, updatedAt: now });
  }
  writeIndex(index);
}

export function loadVersion(id: string): Project | null {
  try {
    const raw = localStorage.getItem(VERSION_PREFIX + id);
    return raw ? (JSON.parse(raw) as Project) : null;
  } catch {
    return null;
  }
}

export function deleteVersion(id: string) {
  localStorage.removeItem(VERSION_PREFIX + id);
  writeIndex(readIndex().filter((v) => v.id !== id));
}

export function listVersions(): VersionMeta[] {
  return readIndex().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function saveActiveVersionId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function loadActiveVersionId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}
