import { OpeningType } from "@/types/project";

export function defaultOpeningSize(type: OpeningType): {
  width: number;
  height: number;
  sillHeight: number;
} {
  switch (type) {
    case "single-door":
      return { width: 900, height: 2100, sillHeight: 0 };
    case "double-door":
      return { width: 1500, height: 2100, sillHeight: 0 };
    case "sliding-door":
      return { width: 1800, height: 2100, sillHeight: 0 };
    case "entrance-door":
      return { width: 1050, height: 2100, sillHeight: 0 };
    case "fixed-window":
    case "sliding-window":
    case "casement-window":
      return { width: 1200, height: 1200, sillHeight: 900 };
    case "louvered-window":
      return { width: 600, height: 1500, sillHeight: 900 };
  }
}
