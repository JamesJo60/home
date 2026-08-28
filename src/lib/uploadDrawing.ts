import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { ReferenceImage } from "@/types/project";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function pdfFirstPageToDataUrl(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return { dataUrl: canvas.toDataURL("image/png"), w: canvas.width, h: canvas.height };
}

export async function fileToReferenceImage(file: File, plotWidthMm: number): Promise<ReferenceImage> {
  let dataUrl: string;
  let w: number;
  let h: number;

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const res = await pdfFirstPageToDataUrl(file);
    dataUrl = res.dataUrl;
    w = res.w;
    h = res.h;
  } else {
    dataUrl = await readFileAsDataUrl(file);
    const size = await loadImageSize(dataUrl);
    w = size.w;
    h = size.h;
  }

  const width = plotWidthMm; // default: fit the drawing to the plot width, user recalibrates for accuracy
  const height = width * (h / w);

  return {
    dataUrl,
    fileName: file.name,
    x: 0,
    y: 0,
    width,
    height,
    rotation: 0,
    opacity: 0.6,
    locked: false,
    visible: true,
  };
}
