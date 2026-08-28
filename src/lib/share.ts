import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import { Project } from "@/types/project";

export interface ShareBundle {
  project: Project;
  mode: "view" | "edit";
}

/**
 * No backend is wired up for this app (that would need a hosted database such as
 * Supabase/Firebase, which requires creating a third-party account on the user's
 * behalf — outside what this assistant can do). Instead, sharing works entirely
 * client-side: the whole project is compressed into the URL hash. Anyone who opens
 * the link gets a fully working copy of the design in their own browser, in
 * view-only or edit mode. There's no live sync back to the original author —
 * that would need a real backend.
 */
export function encodeShareLink(project: Project, mode: "view" | "edit"): string {
  const bundle: ShareBundle = { project, mode };
  const packed = compressToEncodedURIComponent(JSON.stringify(bundle));
  const url = new URL(window.location.href);
  url.hash = `share=${packed}`;
  return url.toString();
}

export function decodeShareLinkFromHash(hash: string): ShareBundle | null {
  const match = hash.match(/share=([^&]+)/);
  if (!match) return null;
  try {
    const json = decompressFromEncodedURIComponent(match[1]);
    if (!json) return null;
    return JSON.parse(json) as ShareBundle;
  } catch {
    return null;
  }
}
