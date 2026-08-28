import jsPDF from "jspdf";
import { Floor, LengthUnit, Project } from "@/types/project";
import { formatLength, mmToSqFt } from "@/lib/units";
import { polygonBounds } from "@/lib/geometry";

export async function captureWorkspacePng(): Promise<string | null> {
  const container = document.getElementById("capture-workspace");
  if (!container) return null;

  const svg = container.querySelector("svg");
  const canvas = container.querySelector("canvas");

  if (canvas) {
    try {
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  }

  if (svg) {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    clone.setAttribute("width", String(rect.width));
    clone.setAttribute("height", String(rect.height));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.style.background = "#ffffff";

    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("x", "0");
    bg.setAttribute("y", "0");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "#ffffff");
    clone.insertBefore(bg, clone.firstChild);

    const xml = new XMLSerializer().serializeToString(clone);
    const svgDataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = rect.width * 2;
        c.height = rect.height * 2;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
      img.src = svgDataUrl;
    });
  }

  return null;
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const PAPER_SIZES: Record<string, [number, number]> = {
  A4: [297, 210],
  A3: [420, 297],
  A2: [594, 420],
  A1: [841, 594],
};

export async function exportFloorPdf(
  project: Project,
  floor: Floor,
  unit: LengthUnit,
  paper: keyof typeof PAPER_SIZES,
  imageDataUrl: string | null,
  viewLabel: string
) {
  const [w, h] = PAPER_SIZES[paper];
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [w, h] });
  const margin = 10;

  doc.setFontSize(14);
  doc.text(project.name, margin, margin + 4);
  doc.setFontSize(9);
  doc.text(`${project.address || ""}   ·   ${floor.name}   ·   ${viewLabel}`, margin, margin + 10);
  doc.text(new Date().toLocaleDateString(), w - margin - 30, margin + 4);

  if (imageDataUrl) {
    const imgProps = doc.getImageProperties(imageDataUrl);
    const maxW = w - margin * 2;
    const maxH = h * 0.62;
    const ratio = Math.min(maxW / imgProps.width, maxH / imgProps.height);
    const drawW = imgProps.width * ratio;
    const drawH = imgProps.height * ratio;
    doc.addImage(imageDataUrl, "PNG", margin, margin + 14, drawW, drawH);
  }

  // room schedule table
  let y = margin + 14 + h * 0.62 + 6;
  doc.setFontSize(10);
  doc.text("Room Schedule", margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.text("Room", margin, y);
  doc.text("Type", margin + 60, y);
  doc.text("Size", margin + 100, y);
  doc.text("Area", margin + 140, y);
  y += 3;
  doc.line(margin, y, w - margin, y);
  y += 4;

  for (const room of floor.rooms) {
    if (y > h - margin) {
      doc.addPage([w, h], "landscape");
      y = margin;
    }
    const b = polygonBounds(room.points);
    const width = b.maxX - b.minX;
    const depth = b.maxY - b.minY;
    const area = width * depth;
    doc.text(room.name, margin, y);
    doc.text(room.type, margin + 60, y);
    doc.text(`${formatLength(width, unit)} x ${formatLength(depth, unit)}`, margin + 100, y);
    doc.text(`${mmToSqFt(area).toFixed(0)} sq ft`, margin + 140, y);
    y += 5;
  }

  doc.save(`${project.name.replace(/[^a-z0-9]+/gi, "-")}-${floor.name}-${viewLabel}.pdf`);
}
