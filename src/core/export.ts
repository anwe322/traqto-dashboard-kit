export type ExportFormat = "csv" | "svg" | "png";

export type ExportPayload = {
  filename: string;
  data?: Array<Record<string, unknown>> | null;
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsvCell(value: unknown): string {
  if (value == null) return "";
  const s = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV(rows: Array<Record<string, unknown>>): string {
  if (!rows || rows.length === 0) return "";
  const headerSet = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) headerSet.add(k);
  const headers = Array.from(headerSet);
  const lines = [headers.join(";")];
  for (const r of rows) {
    lines.push(headers.map((h) => escapeCsvCell(r[h])).join(";"));
  }
  return "﻿" + lines.join("\n");
}

export function exportCSV(filename: string, rows: Array<Record<string, unknown>>) {
  const csv = toCSV(rows);
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

export function findSvgIn(root: HTMLElement): SVGSVGElement | null {
  return root.querySelector("svg");
}

function serializeSvg(svg: SVGSVGElement): { source: string; width: number; height: number } {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (!clone.getAttribute("xmlns:xlink")) clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  const rect = svg.getBoundingClientRect();
  const width = rect.width || svg.clientWidth || 800;
  const height = rect.height || svg.clientHeight || 400;
  if (!clone.getAttribute("width")) clone.setAttribute("width", String(width));
  if (!clone.getAttribute("height")) clone.setAttribute("height", String(height));
  if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  return {
    source: new XMLSerializer().serializeToString(clone),
    width,
    height,
  };
}

export function exportSVG(filename: string, root: HTMLElement) {
  const svg = findSvgIn(root);
  if (!svg) throw new Error("Kein SVG zum Exportieren gefunden");
  const { source } = serializeSvg(svg);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, filename.endsWith(".svg") ? filename : `${filename}.svg`);
}

export function exportPNG(filename: string, root: HTMLElement, scale = 2): Promise<void> {
  const svg = findSvgIn(root);
  if (!svg) return Promise.reject(new Error("Kein SVG zum Exportieren gefunden"));
  const { source, width, height } = serializeSvg(svg);
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas-Context nicht verfügbar"));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((png) => {
          URL.revokeObjectURL(url);
          if (!png) {
            reject(new Error("PNG-Konvertierung fehlgeschlagen"));
            return;
          }
          downloadBlob(png, filename.endsWith(".png") ? filename : `${filename}.png`);
          resolve();
        }, "image/png");
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("SVG konnte nicht als Bild geladen werden"));
    };
    img.src = url;
  });
}

export function exportWidget(
  format: ExportFormat,
  filename: string,
  root: HTMLElement,
  data?: Array<Record<string, unknown>> | null,
): void | Promise<void> {
  if (format === "csv") {
    if (!data || data.length === 0) throw new Error("Keine Daten zum Export vorhanden");
    return exportCSV(filename, data);
  }
  if (format === "svg") return exportSVG(filename, root);
  if (format === "png") return exportPNG(filename, root);
}