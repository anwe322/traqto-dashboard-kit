import type { DashboardLayout, LayoutItem, PaletteName } from "./types";
import { palettes } from "../theme/tokens";

/**
 * Freigabe-Link: serialisiert ein Dashboard-Layout in einen URL-sicheren
 * String, damit eine Dashboard-Ansicht per Link geteilt werden kann.
 * Der Empfänger sieht das Dashboard schreibgeschützt (readOnly-Modus des
 * DashboardProvider) — die Daten selbst lädt weiterhin sein eigener Client
 * über die Widget-Registry, im Link steckt nur Layout + Konfiguration.
 */

const SHARE_FORMAT_VERSION = 1;
const DEFAULT_PARAM = "share";

type ShareEnvelope = {
  tdk: number;
  layout: DashboardLayout;
};

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string | null {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const bin = atob(b64 + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function sanitizeItem(raw: unknown): LayoutItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.i !== "string" || r.i.length === 0) return null;
  if (typeof r.widgetId !== "string" || r.widgetId.length === 0) return null;
  if (!isFiniteNumber(r.x) || !isFiniteNumber(r.y) || !isFiniteNumber(r.w) || !isFiniteNumber(r.h)) return null;
  const config =
    r.config && typeof r.config === "object" && !Array.isArray(r.config)
      ? (r.config as Record<string, unknown>)
      : {};
  return { i: r.i, widgetId: r.widgetId, x: r.x, y: r.y, w: r.w, h: r.h, config };
}

/**
 * Prüft ein von außen kommendes (deserialisiertes) Layout und übernimmt nur
 * bekannte Felder in erwarteter Form. Ungültige Items werden verworfen;
 * ist gar nichts Brauchbares enthalten, kommt `null` zurück.
 */
export function sanitizeSharedLayout(raw: unknown): DashboardLayout | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.items)) return null;
  const items = r.items.map(sanitizeItem).filter((it): it is LayoutItem => it !== null);
  if (items.length === 0) return null;
  const palette =
    typeof r.palette === "string" && r.palette in palettes ? (r.palette as PaletteName) : undefined;
  const version = isFiniteNumber(r.version) ? r.version : 1;
  return { version, items, ...(palette ? { palette } : {}) };
}

/** Serialisiert ein Layout in einen kompakten, URL-sicheren String (base64url). */
export function encodeShareLayout(layout: DashboardLayout): string {
  const envelope: ShareEnvelope = { tdk: SHARE_FORMAT_VERSION, layout };
  return toBase64Url(JSON.stringify(envelope));
}

/** Gegenstück zu {@link encodeShareLayout}; liefert `null` bei ungültigem/fremdem Payload. */
export function decodeShareLayout(encoded: string): DashboardLayout | null {
  const json = fromBase64Url(encoded.trim());
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Partial<ShareEnvelope>;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.tdk !== SHARE_FORMAT_VERSION) return null;
    return sanitizeSharedLayout(parsed.layout);
  } catch {
    return null;
  }
}

export type CreateShareLinkOptions = {
  /** Basis-URL des Links; Default: aktuelle Seite ohne Query/Hash. */
  baseUrl?: string;
  /** Name des Hash-Parameters, Default `share`. */
  param?: string;
};

/**
 * Baut einen vollständigen Freigabe-Link. Der Payload liegt im URL-Fragment
 * (`#share=…`), damit er nicht in Server-Logs oder Referrern landet.
 */
export function createShareLink(layout: DashboardLayout, options: CreateShareLinkOptions = {}): string {
  const param = options.param ?? DEFAULT_PARAM;
  let base = options.baseUrl;
  if (!base) {
    if (typeof window === "undefined") {
      throw new Error("createShareLink: ohne window bitte options.baseUrl angeben");
    }
    base = window.location.origin + window.location.pathname;
  }
  const cleanBase = base.split("#")[0];
  return `${cleanBase}#${param}=${encodeShareLayout(layout)}`;
}

/**
 * Liest einen Freigabe-Link (Hash `#share=…` oder Query `?share=…`) und gibt
 * das enthaltene Layout zurück — oder `null`, wenn keiner vorhanden/gültig ist.
 * Ohne Argument wird `window.location.href` gelesen.
 */
export function parseShareLink(url?: string, param: string = DEFAULT_PARAM): DashboardLayout | null {
  let href = url;
  if (!href) {
    if (typeof window === "undefined") return null;
    href = window.location.href;
  }
  const hashIndex = href.indexOf("#");
  if (hashIndex !== -1) {
    const fromHash = new URLSearchParams(href.slice(hashIndex + 1)).get(param);
    if (fromHash) {
      const layout = decodeShareLayout(fromHash);
      if (layout) return layout;
    }
  }
  try {
    const queryStart = href.indexOf("?");
    if (queryStart !== -1) {
      const queryEnd = hashIndex === -1 ? href.length : hashIndex;
      const fromQuery = new URLSearchParams(href.slice(queryStart + 1, queryEnd)).get(param);
      if (fromQuery) return decodeShareLayout(fromQuery);
    }
  } catch {
    return null;
  }
  return null;
}
